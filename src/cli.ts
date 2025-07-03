#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'cli-nano';

import { removeSync } from './index.js';
import type { RemoveOptions } from './interfaces.js';

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
  const results = parseArgs({
    command: {
      name: 'remove',
      description: 'Remove all items recursively',
      positionals: [
        {
          name: 'files',
          description: 'directories or files to remove',
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
        type: 'boolean',
        default: false,
        description: 'Show which files would be deleted but without actually deleting them',
      },
      glob: {
        type: 'string',
        description: 'Glob pattern to find which files/directories to remove',
      },
      stat: {
        type: 'boolean',
        default: false,
        description: 'Show the stats of the removed items',
      },
      verbose: {
        type: 'boolean',
        default: false,
        description: 'If true, it will log each file or directory being removed',
      },
    },
    version: readPackage().version,
  });

  // execute remove function
  removeSync(results as RemoveOptions, err => handleError(err));
} catch (err) {
  handleError(err as Error);
}
