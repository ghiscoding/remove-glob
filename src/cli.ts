#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'cli-nano';

import { removeSync } from './index.js';

function readPackage() {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const pkgPath = resolve(__dirname, '../package.json');
  const pkg = readFileSync(pkgPath, 'utf8');
  return JSON.parse(pkg);
}

function handleError(err?: Error) {
  if (err) {
    console.error(err);
    process.exit(1);
  } else {
    process.exit(0);
  }
}

try {
  const config = {
    command: {
      name: 'remove',
      describe: 'Remove all items recursively',
      examples: [
        { cmd: '$0 foo bar', describe: '→ Remove "foo" and "bar" folders' },
        { cmd: '$0 --glob="dist/**/*.js"', describe: '→ Remove all files from from "dist" folder with ".js" extension' },
        {
          cmd: '$0 --glob="dist/**/*.js" --glob="packages/*/tsconfig.tsbuildinfo"',
          describe:
            '→ Remove all files from from "dist" folder with ".js" extension and "tsconfig.tsbuildinfo" file from every "packages" folders',
        },
      ],
      positionals: [
        {
          name: 'paths',
          describe: 'Directory or file paths to remove',
          type: 'string',
          variadic: true,
          required: false,
        },
      ],
    },
    options: {
      cwd: {
        type: 'string',
        describe: 'Directory to resolve from (default ".")',
      },
      dryRun: {
        alias: 'd',
        type: 'boolean',
        default: false,
        describe: 'Show which files/dirs would be deleted but without actually removing them',
      },
      glob: {
        alias: 'g',
        type: 'array',
        describe: 'Glob pattern(s) to find which files/dirs to remove',
      },
      stat: {
        alias: 's',
        default: false,
        describe: 'Show the stats of the items being removed',
        type: 'boolean',
      },
      verbose: {
        alias: 'V',
        type: 'boolean',
        default: false,
        describe: 'If true, it will log each file or directory being removed',
      },
      exclude: {
        alias: 'e',
        type: 'array',
        describe: 'Glob pattern(s) to exclude from deletion (overrides the default patterns)',
      },
    },
    version: readPackage().version,
  } as const;

  const results = parseArgs(config);

  // execute remove function
  removeSync(results, err => handleError(err));
} catch (err) {
  handleError(err as Error);
}
