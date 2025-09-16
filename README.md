[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/tested%20with-vitest-fcc72b.svg?logo=vitest)](https://vitest.dev/)
[![codecov](https://codecov.io/gh/ghiscoding/remove-glob/branch/main/graph/badge.svg)](https://codecov.io/gh/ghiscoding/remove-glob)
[![npm](https://img.shields.io/npm/v/remove-glob.svg)](https://www.npmjs.com/package/remove-glob)
[![npm](https://img.shields.io/npm/dy/remove-glob)](https://www.npmjs.com/package/remove-glob)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/remove-glob?color=success&label=gzip)](https://bundlephobia.com/result?p=remove-glob)
<a href="https://nodejs.org/en/about/previous-releases"><img src="https://img.shields.io/node/v/remove-glob.svg" alt="Node" /></a>

## remove-glob

A tiny cross-platform utility to remove items or directories recursively, it also accepts an optional glob pattern. There's also a CLI for easy, cross-platform usage. It uses 2 small dependencies [tinyglobby](https://www.npmjs.com/package/tinyglobby) for glob support and [cli-nano](https://www.npmjs.com/package/cli-nano) for the CLI.

Inspired by [rimraf](https://www.npmjs.com/package/rimraf) and [premove](https://www.npmjs.com/package/premove) but also supports glob pattern to remove multiple files or directories.

### Install
```sh
npm install remove-glob
```

### Command Line

A `remove` binary is available, it takes an optional path argument (zero or multiple file/directory paths) to be removed **or** a `--glob` pattern instead of path(s).

> [!NOTE]
> The `paths` and `glob` arguments are both optionals, but you **must** provide at least 1 of them.
> However, please note that providing both of them simultaneously is not supported and will throw an error (choose the option that is best suited to your use case).

```
Usage:
  remove [paths..] [options]  Remove all items recursively

Arguments:
  paths           directory or file paths to remove                                         [string..]

Options:
      --cwd       Directory to resolve from (default ".")                                   [string]
  -d, --dryRun    Show which files/dirs would be deleted but without actually removing them [boolean]
  -g, --glob      Glob pattern(s) to find which files/dirs to remove                        [array]
  -s, --stat      Show the stats of the items being removed                                 [boolean]
  -v, --verbose   If true, it will log each file or directory being removed                 [boolean]
  -h, --help      Show help                                                                 [boolean]
  -v, --version   Show version number                                                       [boolean]
```

Remove files or directories.  Note: on Windows globs must be **double quoted**, everybody else can quote however they please.

```sh
# remove "foo" and "bar" via `npx`
$ npx remove foo bar

# or remove using glob pattern(s)
$ npx remove --glob \"dist/**/*.js\"
$ npx remove --glob=\"dist/**/*.js\" --glob=\"packages/*/tsconfig.tsbuildinfo\"

# install globally, use whenever
$ npm install remove-glob -g
$ remove foo bar
$ remove --glob \"dist/**/*.{js,map}\"
```

> [!NOTE]
> When using the `--glob` option, it will by default skip `.git/` and `node_modules/` directories.

### Usage

```ts
import { resolve } from 'node:path';
import { removeSync } from 'remove-glob';

// remove via paths
removeSync({ paths: './foobar' });
removeSync({ paths: ['./foo/file1.txt', './foo/file2.txt'] });

// or remove via glob pattern
removeSync({ glob: 'foo/**/*.txt' });

// Using `cwd` option
const dir = resolve('./foo/bar');
await removeSync({ paths: ['hello.txt'], cwd: dir });
```

### JavaScript API

```js
import { removeSync } from 'remove-glob';

removeSync(opt, callback);
```

The first argument is an object holding any of the options shown below. The last argument is an optional callback function that will be executed after all files were removed.

```js
{
  cwd: string;              // directory to resolve your `filepath` from, defaults to `process.cwd()`
  dryRun: boolean;          // show what would be copied, without actually copying anything
  paths: string | string[]; // filepath(s) to remove – may be a file or a directory.
  glob: string;             // glob pattern to find which files/directories to remove
  stats: boolean;           // show some statistics after execution (time + file count)
  verbose: boolean;         // print more information to console when executing the removal
}
```

> [!NOTE]
> The first argument is required and it **must** include either a `paths` or a `glob`, but it cannot include both options simultaneously.

### Used by

I use it in most of my own open source projects as a Dev Dependency (feel free to modify this list and add your project(s) as well)

- [Lerna-Lite](https://github.com/lerna-lite/lerna-lite)
- [SlickGrid](https://github.com/6pac/SlickGrid)
- [Slickgrid-Universal](https://github.com/ghiscoding/slickgrid-universal)
