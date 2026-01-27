import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { removeSync } from '../index.js';
import { getMatchedFiles, throwOrCallback } from '../utils.js';

function touch(str: string): string {
  const dir = dirname((str = resolve(str)));
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(str, 'hello');
  return str;
}

describe('test remove-glob CLI', () => {
  afterEach(() => {
    rmSync('tests', { recursive: true, force: true });
  });

  test('exports', () => {
    expect(removeSync).toBeTypeOf('function');
  });

  test('throws when both `paths` and `glob` are missing', () => {
    const foo = touch('./tests/foo.txt');
    const bar = touch('./tests/bar.txt');

    expect(existsSync(foo)).toBeTruthy();
    expect(existsSync(bar)).toBeTruthy();
    expect(existsSync('./tests')).toBeTruthy();

    expect(() => removeSync({ paths: undefined, dryRun: true })).toThrow(
      'Please make sure to provide file paths via command arguments or via `--glob` pattern',
    );
  });

  test('throws when both `paths` and `glob` are provided', () => {
    const foo = touch('./tests/foo.txt');
    const bar = touch('./tests/bar.txt');

    expect(existsSync(foo)).toBeTruthy();
    expect(existsSync(bar)).toBeTruthy();
    expect(existsSync('./tests')).toBeTruthy();

    expect(() => removeSync({ paths: 'file1.txt', glob: 'dist/**' })).toThrow(
      'Providing both `--paths` and `--glob` pattern at the same time is not supported, you must chose only one.',
    );
  });

  describe('positional arguments', () => {
    afterEach(() => {
      rmSync('tests', { recursive: true, force: true });
    });

    test('remove single file using positional', () => {
      const foo = touch('./tests/foo.txt');
      const bar = touch('./tests/bar.txt');

      expect(existsSync(foo)).toBeTruthy();
      expect(existsSync(bar)).toBeTruthy();

      const out = removeSync({ paths: foo });
      expect(out).toBeTypeOf('boolean');
      expect(out).toBeTruthy();

      expect(existsSync(foo)).toBeFalsy();
      expect(existsSync(bar)).toBeTruthy();

      removeSync({ paths: bar }); // cleanup
      expect(existsSync(bar)).toBeFalsy();
    });

    test('remove single directory using positional', async () => {
      const str = resolve('./tests/foo');
      mkdirSync(str, { recursive: true });
      expect(existsSync(str)).toBeTruthy();

      removeSync({ paths: str });
      expect(existsSync(str)).toBeFalsy();
    });

    test('remove file, leave directory using positional', async () => {
      const foo = touch('./tests/bar/foo.txt');
      const bar = dirname(foo);
      expect(existsSync(foo)).toBeTruthy();

      const output = removeSync({ paths: foo });
      expect(output).toBeTruthy();

      expect(existsSync(foo)).toBeFalsy();
      expect(existsSync(bar)).toBeTruthy();

      removeSync({ glob: dirname('./tests/bar/foo.txt') }); // cleanup
      expect(existsSync(bar)).toBeFalsy();
    });

    test('remove directory and its contents using positional', async () => {
      const file = touch('./tests/foo/bar.txt');
      const dir = dirname(file);

      expect(existsSync(dir)).toBeTruthy();
      expect(existsSync(file)).toBeTruthy();

      const output = removeSync({ paths: dir });
      expect(output).toBeTruthy();

      expect(existsSync(dir)).toBeFalsy();
      expect(existsSync(file)).toBeFalsy();
    });

    test('remove directory using positional, leave parent', async () => {
      const file = touch('./tests/foo/bar/baz/bat/hello.txt');
      const baz = resolve('./tests/foo/bar/baz');
      const dir = dirname(file);

      expect(existsSync(dir)).toBeTruthy();
      expect(existsSync(file)).toBeTruthy();
      expect(existsSync(baz)).toBeTruthy();

      const output = removeSync({ paths: dir });
      expect(output).toBeTruthy();

      expect(existsSync(dir)).toBeFalsy();
      expect(existsSync(file)).toBeFalsy();
      expect(existsSync(baz)).toBeTruthy();

      const foo = resolve('./foo');
      removeSync({ paths: foo });
      expect(existsSync(foo)).toBeFalsy();
    });

    test('remove directory recursively using positional', async () => {
      const f1 = touch('./tests/foo/bar/baz/bat/hello.txt');
      const f2 = touch('./tests/foo/bar/baz/bat/world.txt');
      const f3 = touch('./tests/foo/bar/baz/hello.txt');
      const f4 = touch('./tests/foo/hello.txt');

      const dir = resolve('./tests/foo');

      expect(existsSync(dir)).toBeTruthy();
      expect(existsSync(f1)).toBeTruthy();
      expect(existsSync(f2)).toBeTruthy();
      expect(existsSync(f3)).toBeTruthy();
      expect(existsSync(f4)).toBeTruthy();

      const output = removeSync({ paths: dir });
      expect(output).toBeTruthy();

      expect(existsSync(dir)).toBeFalsy();
      expect(existsSync(f1)).toBeFalsy();
      expect(existsSync(f2)).toBeFalsy();
      expect(existsSync(f3)).toBeFalsy();
      expect(existsSync(f4)).toBeFalsy();
    });

    test('file does not exist using positional', async () => {
      const file = removeSync({ paths: './tests/404.txt' });
      expect(file).toBeFalsy();

      const dir = removeSync({ paths: './tests/foo' });
      expect(dir).toBeFalsy();
    });

    test('options.cwd using positional', async () => {
      const file = touch('./tests/foo/hello.txt');
      const dir = dirname(file);

      expect(existsSync(file)).toBeTruthy();
      let output = removeSync({ paths: 'hello.txt', cwd: dir });
      expect(output).toBeTruthy();
      expect(existsSync(file)).toBeFalsy();

      output = removeSync({ paths: dir });
      expect(output).toBeTruthy();
      expect(existsSync(dir)).toBeFalsy();
    });

    test('dry-run option should log directories to be removed without actually removing them using positional args', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const str = resolve('./tests/foo');
      mkdirSync(str, { recursive: true });
      expect(existsSync(str)).toBeTruthy();

      const output = removeSync({ paths: str, dryRun: true });

      expect(existsSync(str)).toBeTruthy();
      expect(output).toBeTruthy();
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('-- dry-run --'));
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('would remove directory recursively: '));
      expect(logSpy).toHaveBeenCalled();
    });

    test('dry-run option should log files to be removed without actually removing them using positional args', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const foo = touch('./tests/foo.txt');
      const bar = touch('./tests/bar.txt');

      expect(existsSync(foo)).toBeTruthy();
      expect(existsSync(bar)).toBeTruthy();
      expect(existsSync('./tests')).toBeTruthy();

      const output = removeSync({ paths: ['./tests/foo.txt', './tests/bar.txt'], dryRun: true });

      expect(existsSync('./tests')).toBeTruthy();
      expect(output).toBeTruthy();
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('-- dry-run --'));
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('would remove file: '));
      expect(logSpy).toHaveBeenCalled();
    });

    test('verbose option should remove file and also log which are being removed using positional args', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const foo = touch('./tests/foo.txt');
      const bar = touch('./tests/bar.txt');

      expect(existsSync(foo)).toBeTruthy();
      expect(existsSync(bar)).toBeTruthy();
      expect(existsSync('./tests')).toBeTruthy();

      const output = removeSync({ paths: ['./tests/foo.txt', './tests/bar.txt'], verbose: true });

      expect(existsSync('./tests')).toBeTruthy();
      expect(output).toBeTruthy();
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('removing file: ./tests/foo.txt'));
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('removing file: ./tests/bar.txt'));
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Removed:  2 items'));
      expect(logSpy).toHaveBeenCalled();
    });

    test('callback is executed when provided as last argument', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const foo = touch('./tests/foo.txt');
      const bar = touch('./tests/bar.txt');
      const callbackMock = vi.fn();

      expect(existsSync(foo)).toBeTruthy();
      expect(existsSync(bar)).toBeTruthy();
      expect(existsSync('./tests')).toBeTruthy();

      const output = removeSync({ paths: ['./tests/foo.txt', './tests/bar.txt'], dryRun: true }, callbackMock);

      expect(existsSync('./tests')).toBeTruthy();
      expect(output).toBeTruthy();
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('-- dry-run --'));
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('would remove file: '));
      expect(logSpy).toHaveBeenCalled();
      expect(callbackMock).toHaveBeenCalled();
    });

    test('callback is executed after throwing when provided as last argument', () => {
      const foo = touch('./tests/foo.txt');
      const bar = touch('./tests/bar.txt');
      const callbackMock = vi.fn();

      expect(existsSync(foo)).toBeTruthy();
      expect(existsSync(bar)).toBeTruthy();
      expect(existsSync('./tests')).toBeTruthy();

      removeSync({ paths: undefined, dryRun: true }, callbackMock);

      expect(callbackMock).toHaveBeenCalled();
    });
  });

  describe('glob patterns', () => {
    afterEach(() => {
      rmSync('tests', { recursive: true, force: true });
    });

    test('remove single file using glob', () => {
      const foo = touch('./tests/foo.txt');
      const bar = touch('./tests/bar.txt');

      expect(existsSync(foo)).toBeTruthy();
      expect(existsSync(bar)).toBeTruthy();

      const out = removeSync({ paths: [], glob: '**/foo.txt' });
      expect(out).toBeTypeOf('boolean');
      expect(out).toBeTruthy();

      expect(existsSync(foo)).toBeFalsy();
      expect(existsSync(bar)).toBeTruthy();

      removeSync({ paths: '', glob: '**/bar.txt' }); // cleanup
      expect(existsSync(bar)).toBeFalsy();
    });

    test('remove single directory using glob', async () => {
      const str = resolve('./tests/foo');
      mkdirSync(str, { recursive: true });
      expect(existsSync(str)).toBeTruthy();

      removeSync({ glob: './tests/foo' });
      expect(existsSync(str)).toBeFalsy();
    });

    test('remove file, leave directory using glob', async () => {
      const foo = touch('./tests/bar/foo.txt');
      const bar = dirname(foo);
      expect(existsSync(foo)).toBeTruthy();

      const output = removeSync({ glob: './tests/bar/foo.txt' });
      expect(output).toBeTruthy();

      expect(existsSync(foo)).toBeFalsy();
      expect(existsSync(bar)).toBeTruthy();

      removeSync({ glob: dirname('./tests/bar/foo.txt') }); // cleanup
      expect(existsSync(bar)).toBeFalsy();
    });

    test('remove directory and its contents using glob', async () => {
      const file = touch('./tests/foo/bar.txt');
      const dir = dirname(file);

      expect(existsSync(dir)).toBeTruthy();
      expect(existsSync(file)).toBeTruthy();

      const output = removeSync({ glob: './tests/foo/**' });
      expect(output).toBeTruthy();

      expect(existsSync(dir)).toBeFalsy();
      expect(existsSync(file)).toBeFalsy();
    });

    test('remove directory using glob, leave parent', async () => {
      const file = touch('./tests/foo/bar/baz/bat/hello.txt');
      const baz = resolve('./tests/foo/bar/baz');
      const dir = dirname(file);

      expect(existsSync(dir)).toBeTruthy();
      expect(existsSync(file)).toBeTruthy();
      expect(existsSync(baz)).toBeTruthy();

      const output = removeSync({ glob: './tests/foo/bar/baz/bat/**' });
      expect(output).toBeTruthy();

      expect(existsSync(dir)).toBeFalsy();
      expect(existsSync(file)).toBeFalsy();
      expect(existsSync(baz)).toBeTruthy();

      const foo = resolve('./foo');
      removeSync({ paths: foo });
      expect(existsSync(foo)).toBeFalsy();
    });

    test('remove directory recursively using glob', async () => {
      const f1 = touch('./tests/foo/bar/baz/bat/hello.txt');
      const f2 = touch('./tests/foo/bar/baz/bat/world.txt');
      const f3 = touch('./tests/foo/bar/baz/hello.txt');
      const f4 = touch('./tests/foo/hello.txt');

      const dir = resolve('./tests/foo');

      expect(existsSync(dir)).toBeTruthy();
      expect(existsSync(f1)).toBeTruthy();
      expect(existsSync(f2)).toBeTruthy();
      expect(existsSync(f3)).toBeTruthy();
      expect(existsSync(f4)).toBeTruthy();

      const output = removeSync({ glob: './tests/foo' });
      expect(output).toBeTruthy();

      expect(existsSync(dir)).toBeFalsy();
      expect(existsSync(f1)).toBeFalsy();
      expect(existsSync(f2)).toBeFalsy();
      expect(existsSync(f3)).toBeFalsy();
      expect(existsSync(f4)).toBeFalsy();
    });

    test('remove multiple files using multiple glob patterns', async () => {
      const f1 = touch('./tests/foo/bar/baz/bat/hello.txt');
      const f2 = touch('./tests/foo/bar/baz/bat/world.txt');
      const f3 = touch('./tests/foo/bar/baz/hello.doc');
      const f4 = touch('./tests/foo/hello.md');

      const dir = resolve('./tests/foo');

      expect(existsSync(dir)).toBeTruthy();
      expect(existsSync(f1)).toBeTruthy();
      expect(existsSync(f2)).toBeTruthy();
      expect(existsSync(f3)).toBeTruthy();
      expect(existsSync(f4)).toBeTruthy();

      const output = removeSync({ glob: ['./tests/**/*.txt', './tests/**/*.{doc,md}'] });
      expect(output).toBeTruthy();

      expect(existsSync(dir)).toBeTruthy();
      expect(existsSync(f1)).toBeFalsy();
      expect(existsSync(f2)).toBeFalsy();
      expect(existsSync(f3)).toBeFalsy();
      expect(existsSync(f4)).toBeFalsy();
    });

    test('file does not exist using glob', async () => {
      const file = removeSync({ glob: './tests/404.txt' });
      expect(file).toBeFalsy();

      const dir = removeSync({ glob: './tests/foo' });
      expect(dir).toBeFalsy();
    });

    test('options.cwd using glob', async () => {
      const file = touch('./tests/foo/hello.txt');
      const dir = dirname(file);

      expect(existsSync(file)).toBeTruthy();
      let output = removeSync({ glob: 'hello.txt', cwd: dir });
      expect(output).toBeTruthy();
      expect(existsSync(file)).toBeFalsy();

      output = removeSync({ glob: './tests/foo/**' });
      expect(output).toBeTruthy();
      expect(existsSync(dir)).toBeFalsy();
    });

    test('dry-run option should log directories to be removed without actually removing them using glob', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const str = resolve('./tests/foo');
      mkdirSync(str, { recursive: true });
      expect(existsSync(str)).toBeTruthy();

      const output = removeSync({ glob: './tests/foo', dryRun: true });

      expect(existsSync(str)).toBeTruthy();
      expect(output).toBeTruthy();
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('-- dry-run --'));
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('would remove directory recursively: '));
      expect(logSpy).toHaveBeenCalled();
    });

    test('dry-run option should log files to be removed without actually removing them using glob', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const foo = touch('./tests/foo.txt');
      const bar = touch('./tests/bar.txt');

      expect(existsSync(foo)).toBeTruthy();
      expect(existsSync(bar)).toBeTruthy();
      expect(existsSync('./tests')).toBeTruthy();

      const output = removeSync({ glob: './tests/*.txt', dryRun: true });

      expect(existsSync('./tests')).toBeTruthy();
      expect(output).toBeTruthy();
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('-- dry-run --'));
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('would remove file: '));
      expect(logSpy).toHaveBeenCalled();
    });

    test('verbose option should remove file and also log which are being removed using glob', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const foo = touch('./tests/foo.txt');
      const bar = touch('./tests/bar.txt');

      expect(existsSync(foo)).toBeTruthy();
      expect(existsSync(bar)).toBeTruthy();
      expect(existsSync('./tests')).toBeTruthy();

      const output = removeSync({ glob: './tests/*.txt', verbose: true });

      expect(existsSync('./tests')).toBeTruthy();
      expect(output).toBeTruthy();
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('removing file: '));
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Removed:  2 items'));
      expect(logSpy).toHaveBeenCalled();
    });

    test('should ignore .git and node_modules when using glob', () => {
      // Setup test structure
      mkdirSync('tests', { recursive: true });
      mkdirSync('tests/.git', { recursive: true });
      mkdirSync('tests/node_modules', { recursive: true });
      const foo = touch('tests/foo.txt');
      const gitFile = touch('tests/.git/hidden.txt');
      const nodeFile = touch('tests/node_modules/dep.txt');

      expect(existsSync(foo)).toBeTruthy();
      expect(existsSync(gitFile)).toBeTruthy();
      expect(existsSync(nodeFile)).toBeTruthy();

      removeSync({ glob: 'tests/**/*' });

      // .git and node_modules should still exist
      expect(existsSync('tests/.git/hidden.txt')).toBe(true);
      expect(existsSync('tests/node_modules/dep.txt')).toBe(true);
      // foo.txt should be removed
      expect(existsSync('tests/foo.txt')).toBe(false);
    });

    test('handles unexpected glob result type for coverage', async () => {
      vi.doMock('../glob-wrapper.js', () => ({
        globSyncWrapper: () => [123, 456],
      }));
      const { removeSync } = await import('../index.js');
      const result = removeSync({ glob: 'tests/should-not-match-anything' });
      expect(result).toBe(false);
      vi.resetModules();
    });

    test('handles glob result with non-string, non-object type for full branch coverage', async () => {
      vi.doMock('../glob-wrapper.js', () => ({
        globSyncWrapper: () => [true],
      }));
      const { removeSync } = await import('../index.js');
      const result = removeSync({ glob: 'tests/should-not-match-anything' });
      expect(result).toBe(false);
      vi.resetModules();
    });

    test('should not remove files matching the exclude option', () => {
      // Setup test files
      const keep = touch('./tests/keep.txt');
      const remove = touch('./tests/remove.txt');

      expect(existsSync(keep)).toBeTruthy();
      expect(existsSync(remove)).toBeTruthy();

      // Act: remove with exclude option (exclude must match the actual file path)
      const out = removeSync({ glob: './tests/*.txt', exclude: ['./tests/keep.txt'] });
      expect(out).toBeTruthy();

      // Assert: 'keep.txt' should remain, 'remove.txt' should be deleted
      expect(existsSync(keep)).toBeTruthy();
      expect(existsSync(remove)).toBeFalsy();
    });

    test('brace expansion: {foo,bar}*.txt matches both foo1.txt and bar2.txt for removal', () => {
      const dir = './tests/input';
      const foo1 = resolve(dir, 'foo1.txt');
      const bar2 = resolve(dir, 'bar2.txt');
      const baz3 = resolve(dir, 'baz3.txt');
      touch(foo1);
      touch(bar2);
      touch(baz3);
      expect(existsSync(foo1)).toBeTruthy();
      expect(existsSync(bar2)).toBeTruthy();
      expect(existsSync(baz3)).toBeTruthy();
      // Remove files matching brace expansion
      removeSync({ glob: 'tests/input/{foo,bar}*.txt' });
      expect(existsSync(foo1)).toBeFalsy();
      expect(existsSync(bar2)).toBeFalsy();
      expect(existsSync(baz3)).toBeTruthy();
    });

    test('negation: ["tests/input/*.js", "!tests/input/*.spec.js", "!tests/input/*.test.js"] matches only non-test js files for removal', () => {
      const dir = './tests/input';
      const ajs = resolve(dir, 'a.js');
      const bspec = resolve(dir, 'b.spec.js');
      const ctest = resolve(dir, 'c.test.js');
      const djs = resolve(dir, 'd.js');
      touch(ajs);
      touch(bspec);
      touch(ctest);
      touch(djs);
      expect(existsSync(ajs)).toBeTruthy();
      expect(existsSync(bspec)).toBeTruthy();
      expect(existsSync(ctest)).toBeTruthy();
      expect(existsSync(djs)).toBeTruthy();
      // Remove only non-test js files
      removeSync({ glob: ['tests/input/*.js', '!tests/input/*.spec.js', '!tests/input/*.test.js'] });
      expect(existsSync(ajs)).toBeFalsy();
      expect(existsSync(djs)).toBeFalsy();
      expect(existsSync(bspec)).toBeTruthy();
      expect(existsSync(ctest)).toBeTruthy();
    });

    test('throwOrCallback: throws error when no callback', () => {
      expect(() => {
        // Should throw
        throwOrCallback(new Error('Test error'));
      }).toThrow('Test error');
    });

    test('throwOrCallback: calls callback with error', () => {
      let called = false;
      throwOrCallback(new Error('Test error'), () => {
        called = true;
      });
      expect(called).toBeTruthy();
    });

    test('getMatchedFiles: returns empty array for empty pattern', () => {
      const result = getMatchedFiles('', {});
      expect(Array.isArray(result)).toBeTruthy();
      expect(result.length).toBe(0);
    });

    test('getMatchedFiles: returns empty array for only negation pattern', () => {
      const result = getMatchedFiles(['!tests/input/*.js'], {});
      expect(Array.isArray(result)).toBeTruthy();
      expect(result.length).toBe(0);
    });

    test('getMatchedFiles: dotfile pattern with all option', () => {
      const dir = './tests/input';
      const dotfile = resolve(dir, '.hidden.txt');
      touch(dotfile);
      expect(existsSync(dotfile)).toBeTruthy();
      const result = getMatchedFiles('tests/input/*.txt', { all: true });
      expect(result.some(f => f.endsWith('.hidden.txt'))).toBeTruthy();
      removeSync({ paths: dotfile });
    });

    test('getMatchedFiles: opts.exclude as string', () => {
      const dir = './tests/input';
      const file = resolve(dir, 'foo.txt');
      touch(file);
      expect(existsSync(file)).toBeTruthy();
      // Exclude the file using a string
      const result = getMatchedFiles('tests/input/*.txt', { exclude: 'tests/input/*.txt' });
      expect(result.length).toBe(0);
      removeSync({ paths: file });
    });

    test('removeSync: throws when both paths and glob provided', () => {
      expect(() => removeSync({ paths: 'foo.txt', glob: 'bar/*.js' })).toThrow(
        'Providing both `--paths` and `--glob` pattern at the same time is not supported, you must chose only one.',
      );
    });

    test('removeSync: throws when neither paths nor glob provided', () => {
      expect(() => removeSync({})).toThrow('Please make sure to provide file paths via command arguments or via `--glob` pattern');
    });
  });
});
