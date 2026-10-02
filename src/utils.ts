import type { GlobOptions } from 'node:fs';
import { globSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Helper to get all matched files from glob patterns, supporting dotfile logic via opts.all
 */
export function getMatchedFiles(glob: string | string[], opts: { cwd?: string; exclude?: string | string[]; all?: boolean }): string[] {
  const defaultExclude = ['**/.git/**', '**/.git', '**/node_modules/**', '**/node_modules'];
  const globOptions = { cwd: opts.cwd, withFileTypes: false, exclude: defaultExclude } satisfies GlobOptions;
  if (Array.isArray(opts.exclude)) {
    globOptions.exclude = opts.exclude;
  } else if (typeof opts.exclude === 'string') {
    globOptions.exclude = [opts.exclude];
  }

  // Separate positive and negated patterns
  const patterns = Array.isArray(glob) ? glob : [glob];
  const positivePatterns: string[] = [];
  const negatedPatterns: string[] = [];
  for (const pat of patterns) {
    if (typeof pat === 'string' && pat.startsWith('!')) {
      negatedPatterns.push(pat.slice(1));
    } else {
      positivePatterns.push(pat);
      // Dotfile logic for positive patterns
      if (opts.all && typeof pat === 'string' && pat.includes('*') && !pat.startsWith('.')) {
        const dotPattern = pat.replace(/(\*)/g, '.*');
        if (dotPattern !== pat) {
          positivePatterns.push(dotPattern);
        }
      }
    }
  }

  if (!positivePatterns.length) {
    return [];
  }

  const matchedSet = new Set(globSync(positivePatterns, globOptions));

  // Remove files matching any negated pattern
  if (negatedPatterns.length) {
    for (const path of globSync(negatedPatterns, globOptions)) {
      matchedSet.delete(path);
    }
  }

  let paths = Array.from(matchedSet);
  if (opts.cwd) {
    paths = paths.map(p => resolve(opts.cwd as string, p));
  }
  return paths;
}

/** Helper to throw or callback with error */
export function throwOrCallback(err?: Error, cb?: (e?: Error) => void) {
  if (typeof cb === 'function') {
    cb(err);
  } else {
    throw err;
  }
}
