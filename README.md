[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/tested%20with-vitest-fcc72b.svg?logo=vitest)](https://vitest.dev/)
[![codecov](https://codecov.io/gh/ghiscoding/remove-glob/branch/main/graph/badge.svg)](https://codecov.io/gh/ghiscoding/remove-glob)
<a href="https://nodejs.org/en/about/previous-releases"><img src="https://img.shields.io/node/v/remove-glob.svg" alt="Node" /></a>

[![npm](https://img.shields.io/npm/v/remove-glob.svg)](https://www.npmjs.com/package/remove-glob)
[![npm](https://img.shields.io/npm/dy/remove-glob)](https://www.npmjs.com/package/remove-glob)
[![npm bundle size](https://img.shields.io/badge/gzip-1.05kB-success)](https://bundlejs.com/?q=remove-glob)


## remove-glob

A tiny cross-platform utility to remove items or directories recursively, it also accepts an optional glob pattern. There's also a CLI for easy, cross-platform usage using [cli-nano](https://www.npmjs.com/package/cli-nano) which is the only external dependency.

Inspired by [rimraf](https://www.npmjs.com/package/rimraf) and [premove](https://www.npmjs.com/package/premove) but also supports glob pattern to remove multiple files or directories.

> [!NOTE]
> This project now requires Node.JS >= 22.17.0 so that we can use the native `fs.glob`, however if you can't update your Node.JS just yet, then just stick with `remove-glob: ^0.4.10` since that is the only change in v1.0.0

### Install
```sh
npm install remove-glob
```

### Command Line

A `remove` binary is available, it takes an optional path argument (zero or multiple file/directory paths) to be removed **or** a `--glob` pattern instead of path(s).

> [!NOTE]
> The `paths` and `glob` arguments are both optionals, but you **must** provide at least 1 of them.
> However, please note that providing both of them simultaneously is not supported and will throw an error (choose the option that is best suited to your use case).

When using the `--glob` option, dotfiles and dot-directories (e.g. `.env`, `.gitignore`, `.config/`) are included by default. If you want to exclude them, you can adjust your glob pattern (e.g. use `**/[!.]*.js` or add an `!**/.*` pattern).

```
Usage:
  remove [paths..] [options] → Remove all items recursively

Arguments:
  paths           Directory or file paths to remove                                           [string..]

Options:
      --cwd       Directory to resolve from (default ".")                                     [string]
  -d, --dry-run   Show which files/dirs would be deleted but without actually removing them   [boolean]
  -g, --glob      Glob pattern(s) to find which files/dirs to remove                          [array]
  -a, --all       Include dotfiles (files starting with a dot) when matching glob patterns    [boolean]
  -s, --stat      Show the stats of the items being removed                                   [boolean]
  -V, --verbose   If true, it will log each file or directory being removed                   [boolean]
  -e, --exclude   Glob pattern(s) to exclude from deletion (overrides the default patterns)   [array]
  -h, --help      Show help                                                                   [boolean]
  -v, --version   Show version number                                                         [boolean]
```

When `exclude` glob pattern(s) are provided, it will override the default exclude of: [`"**/.git/**", "**/.git", "**/node_modules/**", "**/node_modules"`].


The `--all`/`-a` option includes dotfiles (files starting with a dot) in glob matches. By default, dotfiles are excluded unless explicitly matched or this option is used.

#### Negation Patterns
You can use negation patterns (starting with `!`) in glob arrays to exclude files from removal:

```sh
$ npx remove --glob "src/**/*.js" --glob "!src/**/*.test.js"
# This will remove all .js files except those ending with .test.js
```

#### Brace Expansion
Brace expansion is supported in glob patterns:

```sh
$ npx remove --glob "src/*.{js,ts}"
# This will match both .js and .ts files in src/
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

When using the `--glob` option, it will skip `.git/` and `node_modules/` directories by default (using the default `--exclude` patterns). If you want to allow deletion of these directories, you can override the default by providing your own `--exclude` option (including an empty array to disable exclusion):

```sh
# Remove everything, including .git and node_modules
$ npx remove --glob "**/*" --exclude ""
# Or exclude only .git, but allow node_modules to be deleted
$ npx remove --glob "**/*" --exclude "**/.git/**" --exclude "**/.git"
```

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
  dryRun: boolean;          // show what would be removed, without actually removing anything
  paths: string | string[]; // filepath(s) to remove – may be a file or a directory.
  glob: string | string[];  // glob pattern(s) to find which files/directories to remove
  exclude: string | string[]; // glob pattern(s) to exclude from deletion
  all: boolean;             // include dotfiles (files starting with a dot) in glob matches
  stat: boolean;            // show some statistics after execution (time + file count)
  verbose: boolean;         // print more information to console when executing the removal
}
```


> [!NOTE]
> The first argument is required and it **must** include either a `paths` or a `glob`, but it cannot include both options simultaneously. A

When an `exclude` glob pattern is provided, it will override the default exclusion of: [`"**/.git/**", "**/.git", "**/node_modules/**", "**/node_modules"`].

#### Advanced glob usage

- **Negation**: Use `!pattern` in a glob array to exclude files from removal.
- **Brace expansion**: Use `{a,b}` to match multiple alternatives in a single pattern.
- **Dotfiles**: Use `--all`/`-a` to include dotfiles in glob matches.

### Used by

I use it in most of my own open source projects as a Dev Dependency (feel free to modify this list and add your project(s) as well)

- [Lerna-Lite](https://github.com/lerna-lite/lerna-lite)
- [SlickGrid](https://github.com/6pac/SlickGrid)
- [Slickgrid-Universal](https://github.com/ghiscoding/slickgrid-universal)
