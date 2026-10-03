import { lstatSync, rmSync, unlinkSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { RemoveOptions } from './interfaces.js';
import { getExcludeMatcher, getMatchedFiles, getRemovalPlan, throwOrCallback } from './utils.js';

/** Remove paths or glob matches and call the callback on completion or failure. */
export function removeSync(opts: RemoveOptions = {}, callback?: (e?: Error) => void) {
  const { cwd, glob, dryRun, verbose, stat } = opts;
  const cb = callback || opts.callback;
  let paths = (Array.isArray(opts.paths) ? opts.paths : [opts.paths]).filter((p): p is string => typeof p === 'string' && p.length > 0);
  const errorMsg =
    !paths.length && !glob
      ? 'Please make sure to provide file paths via command arguments or via `--glob` pattern, i.e.: "remove dir" or "remove --glob dir/**/*.js"'
      : paths.length && glob
        ? 'Providing both `--paths` and `--glob` pattern at the same time is not supported, you must chose only one.'
        : '';

  if (errorMsg) {
    throwOrCallback(new Error(errorMsg), cb);
    return;
  }

  let removed = 0;
  const started = performance.now();
  try {
    const excluded = glob ? getExcludeMatcher(opts) : undefined;
    // Handle parents first so overlapping matches have the same plan during deletion and dry runs.
    const handled = glob || dryRun ? new Set<string>() : undefined;
    if (glob) {
      paths = getMatchedFiles(glob, opts)
        .map(path => (cwd ? path : resolve(path)))
        .sort((a, b) => a.length - b.length);
    }

    dryRun && console.log('-- dry-run --');
    for (let path of paths) {
      if ((!glob && cwd) || /[/\\]$/.test(path)) {
        path = resolve(cwd || '.', path);
      }
      if (handled?.size) {
        let parent = glob ? path : resolve(path);
        while (!handled.has(parent) && dirname(parent) !== parent) {
          parent = dirname(parent);
        }
        if (handled.has(parent)) {
          continue;
        }
      }

      const metadata = lstatSync(path, { throwIfNoEntry: false });
      if (!metadata) {
        continue;
      }

      const plan = excluded ? getRemovalPlan(path, metadata.isDirectory(), excluded) : [{ path, isDirectory: metadata.isDirectory() }];
      for (const item of plan) {
        if (dryRun || verbose) {
          console.log(`${dryRun ? 'would remove' : 'removing'} ${item.isDirectory ? 'directory recursively' : 'file'}: ${item.path}`);
        }
        if (!dryRun) {
          if (item.isDirectory) {
            rmSync(item.path, { recursive: true, force: true, maxRetries: process.platform === 'win32' ? 10 : 0 });
          } else {
            unlinkSync(item.path);
          }
        }
        removed++;
      }
      if (metadata.isDirectory() || dryRun) {
        handled?.add(glob ? path : resolve(path));
      }
    }

    if (stat || verbose) {
      console.log(`${dryRun ? 'Would remove' : 'Removed'}:  ${removed} items`);
      console.log(`Duration: ${(performance.now() - started).toFixed(3)}ms`);
    }
    dryRun && console.log('-- end --');
  } catch (error) {
    throwOrCallback(error as Error, cb);
    return;
  }
  typeof cb === 'function' && cb();
  return removed > 0;
}
