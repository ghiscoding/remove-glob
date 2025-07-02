import { existsSync, rmSync, statSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import { globSync } from 'tinyglobby';

import type { RemoveOptions } from './interfaces.js';

/** Helper to throw or callback with error */
function throwOrCallback(err?: Error, cb?: (e?: Error) => void) {
  if (typeof cb === 'function') {
    cb(err);
  } else {
    throw err;
  }
}

/**
 * Remove the files or directories, the item(s) can be provided via positional arguments or via a `--glob` pattern.
 * @param {RemoveOptions} options - CLI options
 * @param {(e?: Error) => void} callback - optional callback that will be executed after remove is finished or when an error occurs
 */
export function removeSync(files: string | string[], opts: RemoveOptions = {}, callback?: (e?: Error) => void) {
  const cb = callback || opts.callback;
  if (!files.length && !opts.glob) {
    throwOrCallback(
      new Error(
        'Please make sure to provide file paths via command arguments or via `--glob` pattern, i.e.: "remove dir" or "remove --glob dir/**/*.js"',
      ),
      cb,
    );
    return;
  }
  let pathExists = false;
  let paths = Array.isArray(files) ? files : typeof files === 'string' ? [files] : [];

  // when providing paths input with custom `cwd`, we need to remap all input paths
  // however, when provided as `--glob` then we will use tinyglobby option
  if (paths.length && opts.cwd) {
    paths.forEach((path, idx) => (paths[idx] = resolve(opts.cwd || '.', path)));
  } else if (opts.glob) {
    paths = globSync([opts.glob!], { cwd: opts.cwd || '.', dot: true, onlyFiles: false, absolute: true });
  }
  opts.stat && console.time('Duration');
  opts.dryRun && console.log('=== dry-run ===');

  try {
    paths.forEach(path => {
      if (existsSync(path)) {
        if (statSync(path).isDirectory()) {
          // directories
          if (opts.dryRun) {
            console.log('would remove directory:', path);
          } else {
            opts.verbose && console.log('removing directory:', path);
            rmSync(path, { recursive: true, force: true });
          }
        } else {
          // files
          if (opts.dryRun) {
            console.log('would remove file:', path);
          } else {
            opts.verbose && console.log('removing file:', path);
            unlinkSync(path);
          }
        }
        pathExists = true;
      }
    });
  } catch {
    // an error might occur if a directory was deleted before any of its files were processed
  }

  if (opts.stat || opts.verbose) {
    console.log(`Removed:  ${paths.length} items`);
    console.timeEnd('Duration');
  }
  opts.dryRun && console.log('=== dry-run ===');
  if (typeof cb === 'function') cb();
  return pathExists;
}
