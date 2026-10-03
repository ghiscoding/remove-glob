import { chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { removeSync } from '../index.js';
import type { RemoveOptions } from '../interfaces.js';
import { getMatchedFiles } from '../utils.js';

describe('removal edge cases', () => {
  let cwd: string;
  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), 'remove-glob-regressions-'));
  });
  afterEach(() => {
    vi.restoreAllMocks();
    rmSync(cwd, { recursive: true, force: true });
  });
  function touch(path: string) {
    const file = join(cwd, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, 'fixture');
    return file;
  }

  test.each<{ options: RemoveOptions; keep: string; remove?: string }>([
    { options: { glob: '**/*' }, keep: 'parent/.git/keep.txt' },
    { options: { glob: 'parent' }, keep: 'parent/node_modules/keep.txt' },
    { options: { glob: 'parent/**', all: true }, keep: 'parent/.git/keep.txt' },
    { options: { glob: ['**/*', '!**/keep.txt'] }, keep: 'parent/deep/keep.txt' },
    { options: { glob: ['**/*.txt', '!parent'] }, keep: 'parent/deep/keep.txt', remove: 'other/remove.txt' },
    {
      options: { glob: ['parent/deep/keep.txt', 'other/remove.txt'], exclude: 'parent/deep/' },
      keep: 'parent/deep/keep.txt',
      remove: 'other/remove.txt',
    },
    {
      options: { glob: ['parent/deep/keep.txt', 'other/remove.txt'], exclude: 'parent/deep/', all: true },
      keep: 'parent/deep/keep.txt',
      remove: 'other/remove.txt',
    },
    { options: { glob: 'parent', exclude: '**/keep.txt' }, keep: 'parent/.hidden/.deep/keep.txt' },
    { options: { glob: 'parent', exclude: '**/[ks]eep.txt' }, keep: 'parent/.hidden/keep.txt' },
    { options: { glob: 'parent', exclude: '**/file{1..3}.txt' }, keep: 'parent/deep/file2.txt' },
    { options: { glob: 'parent', exclude: '**/!(remove).txt' }, keep: 'parent/deep/keep.txt' },
    { options: { glob: 'parent', exclude: '**/{keep,save}.txt' }, keep: 'parent/deep/keep.txt', remove: 'parent/node_modules/remove.txt' },
    { options: { glob: 'parent', exclude: '**/cache/' }, keep: 'parent/directory/cache/keep.txt', remove: 'parent/file/cache' },
  ])('protects $keep when a parent matches $options.glob', ({ options, keep, remove }) => {
    const kept = touch(keep);
    const removed = touch(remove || 'parent/remove.txt');
    expect(removeSync({ ...options, cwd })).toBe(true);
    expect(existsSync(kept)).toBe(true);
    expect(existsSync(removed)).toBe(false);
  });

  test.each(['**/*.txt', './**/*.txt', '*/*.txt', '.hidden/*.txt', '{**,visible}/*.txt'])('all matches nested dotfiles with %s', glob => {
    const files = ['.top.txt', 'visible/.nested.txt', '.hidden/normal.txt', '.hidden/.deeper/normal.txt'].map(touch);
    const expected = glob === '*/*.txt' ? files.slice(1, 3) : glob === '.hidden/*.txt' ? [files[2]] : files;
    expect(getMatchedFiles(glob, { cwd, all: true }).sort()).toEqual(expected.sort());
  });

  test.each([
    ['{[a,b],c}.txt', ['a.txt', 'b.txt', ',.txt', 'c.txt']],
    ['.hidden/**/[.]keep.txt', ['.hidden/.keep.txt', '.hidden/.deep/.keep.txt']],
    ['{.one/{deep,shallow},.two}/?.txt', ['.one/deep/a.txt', '.one/shallow/b.txt', '.two/c.txt']],
    ['.hidden/file{1..3}.txt', ['.hidden/file1.txt', '.hidden/file2.txt', '.hidden/file3.txt']],
    ['**/!(skip).txt', ['.file.txt', '.hidden/file.txt']],
  ] as const)('all preserves native syntax in %s', (glob, files) => {
    const expected = files.map(touch);
    touch('skip.txt');
    expect(getMatchedFiles(glob, { cwd, all: true }).sort()).toEqual(expected.sort());
  });

  test.each(['*.txt', './*.txt'])('all preserves nonrecursive depth and negation with %s', glob => {
    const hidden = touch('.remove.txt');
    const keep = touch('.keep.txt');
    const nested = touch('.dir/.nested.txt');
    expect(removeSync({ glob: [glob, '!*.keep.txt', '!.keep.txt'], cwd, all: true })).toBe(true);
    expect(existsSync(hidden)).toBe(false);
    expect(existsSync(keep) && existsSync(nested)).toBe(true);
  });

  test('all handles absolute patterns, literal cwd metacharacters and directory-only patterns', () => {
    const file = touch('[literal]/.file.txt');
    const child = touch('[literal]/.directory.txt/child');
    const root = dirname(file);
    expect(getMatchedFiles(root, { cwd: root, all: true })).toEqual([root]);
    expect(getMatchedFiles('*.txt/', { cwd: root, all: true })).toEqual([dirname(child)]);
    expect(getMatchedFiles(join(root, '*.txt'), { cwd: root, all: true }).sort()).toEqual([file, dirname(child)].sort());
  });

  test.each(['**/a.txt/**', '**/a.txt/**/'])('all respects directory boundaries in %s', glob => {
    const files = ['a.txt', 'dir/a.txt', '.hidden/a.txt'].map(touch);
    const child = touch('valid/a.txt/child');
    expect(removeSync({ glob, cwd, all: true, exclude: [] })).toBe(true);
    expect(files.every(file => existsSync(file))).toBe(true);
    expect(existsSync(child)).toBe(false);
  });

  test.each(['**/../a.txt', '*/*/../a.txt', 'missing/*/../../a.txt', '**/**/../a.txt', 'a.txt/**', 'a.txt/**/**', '**', '**/**/**/**'])(
    'all preserves native traversal in %s',
    glob => {
      ['a.txt', 'dir/a.txt', 'dir/sub/b.txt'].forEach(touch);
      expect(getMatchedFiles(glob, { cwd, exclude: [], all: true }).sort()).toEqual(getMatchedFiles(glob, { cwd, exclude: [] }).sort());
    },
  );

  test('empty patterns never select cwd; empty exclusions override defaults', () => {
    const file = touch('parent/.git/file.txt');
    expect(removeSync({ glob: ['', '!**/*'], cwd, all: true })).toBe(false);
    expect(existsSync(file)).toBe(true);
    expect(removeSync({ glob: 'parent', cwd, exclude: [] })).toBe(true);
  });

  test('a parent containing only excluded files produces no removals', () => {
    const keep = touch('parent/keep.txt');
    expect(removeSync({ glob: ['parent', '!**/keep.txt'], cwd })).toBe(false);
    expect(existsSync(keep)).toBe(true);
  });

  test.each(['**/keep.txt', '.'])('all protects an excluded literal root file with %s', exclude => {
    const keep = touch('keep.txt');
    expect(removeSync({ glob: 'keep.txt', cwd, all: true, exclude })).toBe(false);
    expect(existsSync(keep)).toBe(true);
  });

  test('dry runs preserve exclusions and count overlapping matches once', () => {
    const keep = touch('parent/keep.txt');
    const remove = touch('parent/remove.txt');
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    expect(removeSync({ glob: ['parent/remove.txt', 'parent', '!**/keep.txt'], cwd, dryRun: true, stat: true })).toBe(true);
    expect(log).toHaveBeenCalledWith('Would remove:  1 items');
    expect(log.mock.calls.flat().join('\n')).not.toMatch(/keep\.txt|directory recursively:/);
    expect(existsSync(keep) && existsSync(remove)).toBe(true);
  });

  test.each([false, true])('stats omit missing and duplicate paths (dryRun=%s)', dryRun => {
    const file = touch('file.txt');
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    expect(removeSync({ paths: [file, file, join(cwd, 'missing.txt')], stat: true, dryRun })).toBe(true);
    expect(log).toHaveBeenCalledWith(`${dryRun ? 'Would remove' : 'Removed'}:  1 items`);
    expect(existsSync(file)).toBe(dryRun);
  });

  test.skipIf(process.platform === 'win32' || process.getuid?.() === 0).each(['matching', 'deletion'])(
    '%s errors reach the callback once or throw without one',
    phase => {
      const file = touch('locked/file.txt');
      const callback = vi.fn();
      const options = phase === 'matching' ? { glob: '*', cwd: dirname(file), all: true } : { paths: file };
      chmodSync(dirname(file), phase === 'matching' ? 0o000 : 0o555);
      try {
        expect(removeSync({ ...options, callback })).toBeUndefined();
        expect(callback).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ code: 'EACCES' }));
        expect(() => removeSync(options)).toThrow();
      } finally {
        chmodSync(dirname(file), 0o755);
      }
      expect(existsSync(file)).toBe(true);
    },
  );

  test('success callback exceptions propagate without invoking it twice', () => {
    const callback = vi.fn(() => {
      throw new Error('callback failure');
    });
    expect(() => removeSync({ paths: touch('file.txt') }, callback)).toThrow('callback failure');
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('all removes a directory symlink without traversing its target', () => {
    const file = touch('target/keep.txt');
    const link = join(cwd, '.link');
    symlinkSync(dirname(file), link, 'junction');
    expect(removeSync({ glob: '*', cwd, exclude: 'target', all: true })).toBe(true);
    expect(lstatSync(link, { throwIfNoEntry: false })).toBeUndefined();
    expect(existsSync(file)).toBe(true);
  });

  test.each([false, true])('positional directory symlinks with trailing slashes preserve targets (cwd=%s)', useCwd => {
    const file = touch('target/keep.txt');
    const link = join(cwd, 'link');
    symlinkSync(dirname(file), link, 'junction');
    expect(removeSync({ paths: `${useCwd ? 'link' : link}/`, cwd: useCwd ? cwd : undefined })).toBe(true);
    expect(lstatSync(link, { throwIfNoEntry: false })).toBeUndefined();
    expect(existsSync(file)).toBe(true);
  });
});
