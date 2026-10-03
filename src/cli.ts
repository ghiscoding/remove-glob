#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { parseArgs } from 'cli-nano';

import { removeSync } from './index.js';

const flag = (alias: string, describe: string) => ({ alias, type: 'boolean' as const, default: false, describe });

function handleError(err?: Error) {
  if (err) {
    console.error(err);
  }
  process.exit(err ? 1 : 0);
}

try {
  const options = {
    cwd: { type: 'string', describe: 'Directory to resolve from (default ".")' },
    dryRun: flag('d', 'Show which files/dirs would be deleted but without actually removing them'),
    glob: { alias: 'g', type: 'array', describe: 'Glob pattern(s) to find which files/dirs to remove' },
    all: flag('a', 'Include dotfiles (files starting with a dot) when matching glob patterns'),
    stat: flag('s', 'Show the stats of the items being removed'),
    verbose: flag('V', 'If true, it will log each file or directory being removed'),
    exclude: { alias: 'e', type: 'array', describe: 'Glob pattern(s) to exclude from deletion (overrides the default patterns)' },
  };

  const config = {
    command: {
      name: 'remove',
      describe: 'Remove all items recursively',
      examples: [
        { cmd: '$0 foo bar', describe: 'Remove "foo" and "bar" folders' },
        { cmd: '$0 --glob="dist/**/*.js"', describe: 'Remove all files from from "dist" folder with ".js" extension' },
        {
          cmd: '$0 --glob="dist/**/*.js" --glob="packages/*/tsconfig.tsbuildinfo"',
          describe:
            'Remove all files from from "dist" folder with ".js" extension and "tsconfig.tsbuildinfo" file from every "packages" folders',
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
    // Keep user-controlled option lookups away from Object.prototype.
    options: Object.assign(Object.create(null), options),
    version: JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version,
  } as const;

  removeSync(parseArgs(config), handleError);
} catch (err) {
  handleError(err as Error);
}
