import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';

import { removeSync } from '../index.js';

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
    removeSync('tests');
  });

  test('exports', () => {
    expect(removeSync).toBeTypeOf('function');
  });

  describe('positional arguments', () => {
    test('remove single file using positional', () => {
      const foo = touch('./tests/foo.txt');
      const bar = touch('./tests/bar.txt');

      expect(existsSync(foo)).toBeTruthy();
      expect(existsSync(bar)).toBeTruthy();

      const out = removeSync(foo);
      expect(out).toBeTypeOf('boolean');
      expect(out).toBeTruthy();

      expect(existsSync(foo)).toBeFalsy();
      expect(existsSync(bar)).toBeTruthy();

      removeSync(bar); // cleanup
      expect(existsSync(bar)).toBeFalsy();
    });

    test('remove single directory using positional', async () => {
      const str = resolve('./tests/foo');
      mkdirSync(str, { recursive: true });
      expect(existsSync(str)).toBeTruthy();

      removeSync(str);
      expect(existsSync(str)).toBeFalsy();
    });

    test('remove file, leave directory using positional', async () => {
      const foo = touch('./tests/bar/foo.txt');
      const bar = dirname(foo);
      expect(existsSync(foo)).toBeTruthy();

      const output = removeSync(foo);
      expect(output).toBeTruthy();

      expect(existsSync(foo)).toBeFalsy();
      expect(existsSync(bar)).toBeTruthy();

      removeSync(bar); // cleanup
      expect(existsSync(bar)).toBeFalsy();
    });

    test('remove directory and its contents using positional', async () => {
      const file = touch('./tests/foo/bar.txt');
      const dir = dirname(file);

      expect(existsSync(dir)).toBeTruthy();
      expect(existsSync(file)).toBeTruthy();

      const output = removeSync(dir);
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

      const output = removeSync(dir);
      expect(output).toBeTruthy();

      expect(existsSync(dir)).toBeFalsy();
      expect(existsSync(file)).toBeFalsy();
      expect(existsSync(baz)).toBeTruthy();

      const foo = resolve('./foo');
      removeSync(foo);
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

      const output = removeSync(dir);
      expect(output).toBeTruthy();

      expect(existsSync(dir)).toBeFalsy();
      expect(existsSync(f1)).toBeFalsy();
      expect(existsSync(f2)).toBeFalsy();
      expect(existsSync(f3)).toBeFalsy();
      expect(existsSync(f4)).toBeFalsy();
    });

    test('file does not exist using positional', async () => {
      const file = removeSync('./tests/404.txt');
      expect(file).toBeFalsy();

      const dir = removeSync('./tests/foo');
      expect(dir).toBeFalsy();
    });

    test('options.cwd using positional', async () => {
      const file = touch('./tests/foo/hello.txt');
      const dir = dirname(file);

      expect(existsSync(file)).toBeTruthy();
      let output = removeSync('hello.txt', { cwd: dir });
      expect(output).toBeTruthy();
      expect(existsSync(file)).toBeFalsy();

      output = removeSync(dir);
      expect(output).toBeTruthy();
      expect(existsSync(dir)).toBeFalsy();
    });
  });

  describe('glob patterns', () => {
    test('remove single file using glob', () => {
      const foo = touch('./tests/foo.txt');
      const bar = touch('./tests/bar.txt');

      expect(existsSync(foo)).toBeTruthy();
      expect(existsSync(bar)).toBeTruthy();

      const out = removeSync([], { glob: '**/foo.txt' });
      expect(out).toBeTypeOf('boolean');
      expect(out).toBeTruthy();

      expect(existsSync(foo)).toBeFalsy();
      expect(existsSync(bar)).toBeTruthy();

      removeSync([], { glob: '**/bar.txt' }); // cleanup
      expect(existsSync(bar)).toBeFalsy();
    });

    test('remove single directory using glob', async () => {
      const str = resolve('./tests/foo');
      mkdirSync(str, { recursive: true });
      expect(existsSync(str)).toBeTruthy();

      removeSync([], { glob: './tests/foo' });
      expect(existsSync(str)).toBeFalsy();
    });

    test('remove file, leave directory using glob', async () => {
      const foo = touch('./tests/bar/foo.txt');
      const bar = dirname(foo);
      expect(existsSync(foo)).toBeTruthy();

      const output = removeSync([], { glob: './tests/bar/foo.txt' });
      expect(output).toBeTruthy();

      expect(existsSync(foo)).toBeFalsy();
      expect(existsSync(bar)).toBeTruthy();

      removeSync([], { glob: dirname('./tests/bar/foo.txt') }); // cleanup
      expect(existsSync(bar)).toBeFalsy();
    });

    test('remove directory and its contents using glob', async () => {
      const file = touch('./tests/foo/bar.txt');
      const dir = dirname(file);

      expect(existsSync(dir)).toBeTruthy();
      expect(existsSync(file)).toBeTruthy();

      const output = removeSync([], { glob: './tests/foo/**' });
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

      const output = removeSync([], { glob: './tests/foo/bar/baz/bat/**' });
      expect(output).toBeTruthy();

      expect(existsSync(dir)).toBeFalsy();
      expect(existsSync(file)).toBeFalsy();
      expect(existsSync(baz)).toBeTruthy();

      const foo = resolve('./foo');
      removeSync(foo);
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

      const output = removeSync([], { glob: './tests/foo' });
      expect(output).toBeTruthy();

      expect(existsSync(dir)).toBeFalsy();
      expect(existsSync(f1)).toBeFalsy();
      expect(existsSync(f2)).toBeFalsy();
      expect(existsSync(f3)).toBeFalsy();
      expect(existsSync(f4)).toBeFalsy();
    });

    test('file does not exist using glob', async () => {
      const file = removeSync([], { glob: './tests/404.txt' });
      expect(file).toBeFalsy();

      const dir = removeSync([], { glob: './tests/foo' });
      expect(dir).toBeFalsy();
    });

    test('options.cwd using glob', async () => {
      const file = touch('./tests/foo/hello.txt');
      const dir = dirname(file);

      expect(existsSync(file)).toBeTruthy();
      let output = removeSync([], { glob: 'hello.txt', cwd: dir });
      expect(output).toBeTruthy();
      expect(existsSync(file)).toBeFalsy();

      output = removeSync([], { glob: './tests/foo/**' });
      expect(output).toBeTruthy();
      expect(existsSync(dir)).toBeFalsy();
    });
  });
});
