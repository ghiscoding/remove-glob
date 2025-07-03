[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/tested%20with-vitest-fcc72b.svg?logo=vitest)](https://vitest.dev/)
[![codecov](https://codecov.io/gh/ghiscoding/remove-glob/branch/main/graph/badge.svg)](https://codecov.io/gh/ghiscoding/remove-glob)
[![npm](https://img.shields.io/npm/v/remove-glob.svg)](https://www.npmjs.com/package/remove-glob)
[![npm](https://img.shields.io/npm/dy/remove-glob)](https://www.npmjs.com/package/remove-glob)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/remove-glob?color=success&label=gzip)](https://bundlephobia.com/result?p=remove-glob)

## remove-glob

A tiny cross-platform utility to remove items or directories recursively, also accepts optional glob support. There's also a CLI for easy, cross-platform usage. It uses 2 small dependencies [tinyglobby](https://www.npmjs.com/package/tinyglobby) for glob support and [cli-nano](https://www.npmjs.com/package/cli-nano) for the CLI.

Inspired by [rimraf](https://www.npmjs.com/package/rimraf) and [premove](https://www.npmjs.com/package/premove) but with glob support.

### Install
```sh
npm install remove-glob
```

### Command Line

A `remove` binary is available, it accepts an optional `--cwd` value and a list of paths to delete **or** a `--glob` pattern.

```
Usage:
  remove [files..] [options]  Remove all items recursively

Positionals:
  files               directories or files to remove                                   [string]

Options:
      --cwd           Directory to resolve from (default ".")                          [string]
      --glob          Glob patterns to find which files/directories to remove          [string]
      --dryRun        Show which files would be deleted but without actually deleting  [boolean]
      --verbose       If true, will log more information about the removal process     [boolean]
      --stat          Show the stats of the removed items                              [boolean]

Default options:
  -h, --help          Show help                                                        [boolean]
  -v, --version       Show version number                                              [boolean]
```

remove files or directories.  Note: on Windows globs must be **double quoted**, everybody else can quote however they please.

```sh
# remove "foo" and "bar" via `npx`
$ npx remove foo bar

# remove using glob pattern
$ npx remove --glob \"dist/**/*.js\"

# install globally, use whenever
$ npm install remove-glob -g
$ remove foo bar
$ remove --glob \"dist/**/*.{js,map}\"
```

### Usage

```ts
import { resolve } from 'node:path';
import { removeSync } from 'remove-glob';

try {
  removeSync({ files: './foobar' });
  removeSync({ files: ['./foo/file1.txt', './foo/file2.txt'] });
} catch (err) {
  //
}

// Using `cwd` option
const dir = resolve('./foo/bar');
await removeSync({ files: ['hello.txt'], cwd: dir });
```

### JavaScript API

```js
import { removeSync } from 'remove-glob';

removeSync(opt, callback);
```

The first argument is an object holding any of the options shown below.
The second and last argument is an optional callback function which is executed after all files are removed.

```js
{
    cwd: string,                // directory to resolve your `filepath` from, defaults to `process.cwd()`
    dryRun: bool,               // show what would be copied, without actually copying anything
    files: string | string[],   // filepath(s) to remove – may be a file or a directory.
    glob: string,               // glob pattern to find which files/directories to remove
    stats: bool                 // show some statistics after execution (time + file count)
    verbose: bool,              // print more information to console
}
```

> [!WARNING]
> The first argument is necessary and it must include either a `files` or the `glob` property (but it cannot be both).
