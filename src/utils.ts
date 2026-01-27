import type { GlobOptions } from 'node:fs';
import { globSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Helper to get all matched files from glob patterns, supporting dotfile logic via opts.all
 */
export function getMatchedFiles(glob: string | string[], opts: { cwd?: string; exclude?: string | string[]; all?: boolean }): string[] {
  const defaultExclude = ['**/.git/**', '**/.git', '**/node_modules/**', '**/node_modules'];
  const globOptions: GlobOptions = { cwd: opts.cwd, withFileTypes: false, exclude: defaultExclude };
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

  // Collect all files matching positive patterns
  const matchedSet = new Set<string>();
  for (const pattern of positivePatterns) {
    const globResult = globSync(pattern, globOptions);
    if (Array.isArray(globResult) && globResult.length > 0) {
      for (const v of globResult) {
        if (typeof v === 'string') {
          matchedSet.add(v);
        }
      }
    }
  }

  // Remove files matching any negated pattern
  for (const pattern of negatedPatterns) {
    const globResult = globSync(pattern, globOptions);
    if (Array.isArray(globResult) && globResult.length > 0) {
      for (const v of globResult) {
        if (typeof v === 'string') {
          matchedSet.delete(v);
        }
      }
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
