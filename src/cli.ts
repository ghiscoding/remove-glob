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
      description: 'Remove all items recursively',
      positionals: [
        {
          name: 'paths',
          description: 'directory or file paths to remove',
          type: 'string',
          variadic: true,
          required: false,
        },
      ],
    },
    options: {
      cwd: {
        type: 'string',
        description: 'Directory to resolve from (default ".")',
      },
      dryRun: {
        alias: 'd',
        type: 'boolean',
        default: false,
        description: 'Show which files/dirs would be deleted but without actually removing them',
      },
      glob: {
        alias: 'g',
        type: 'array',
        description: 'Glob pattern(s) to find which files/dirs to remove',
      },
      stat: {
        alias: 's',
        default: false,
        description: 'Show the stats of the items being removed',
        type: 'boolean',
      },
      verbose: {
        alias: 'v',
        type: 'boolean',
        default: false,
        description: 'If true, it will log each file or directory being removed',
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
