import { existsSync, readdirSync, rmSync, statSync, unlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
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
export function removeSync(opts: RemoveOptions = {}, callback?: (e?: Error) => void) {
  const cb = callback || opts.callback;
  let paths = opts.paths || [];
  if (!paths.length && !opts.glob) {
    throwOrCallback(
      new Error(
        'Please make sure to provide file paths via command arguments or via `--glob` pattern, i.e.: "remove dir" or "remove --glob dir/**/*.js"',
      ),
      cb,
    );
    return;
  }
  if (paths.length && opts.glob) {
    throwOrCallback(
      new Error('Providing both `--paths` and `--glob` pattern are not supported, you must provide only one of these options.'),
      cb,
    );
    return;
  }
  let pathExists = false;
  if (!Array.isArray(paths)) {
    paths = paths.length ? [paths] : [];
  }
  const requiresCwdChange = !!(paths.length && opts.cwd);
  if (!paths.length && opts.glob) {
    paths = globSync(opts.glob, {
      cwd: opts.cwd,
      dot: true,
      onlyFiles: false,
      absolute: true,
      ignore: ['**/.git/**', '**/node_modules/**'],
    });
  }
  if (opts.stat || opts.verbose) {
    console.time('Duration');
  }
  opts.dryRun && console.log('=== dry-run ===');

  paths.forEach(path => {
    // do we need to resolve file/dir from a different cwd?
    if (requiresCwdChange) {
      path = resolve(opts.cwd || '.', path);
    }

    if (existsSync(path)) {
      if (statSync(path).isDirectory()) {
        // directories
        if (opts.dryRun) {
          console.log(`would remove directory: ${path}`);
        } else {
          opts.verbose && console.log(`removing directory: ${path}`);
          readdirSync(path).forEach(name => {
            removeSync({ paths: join(path, name) }); // recursively remove content
          });
          rmSync(path, { recursive: true, force: true, maxRetries: process.platform === 'win32' ? 10 : 0 });
        }
      } else {
        // files
        if (opts.dryRun) {
          console.log(`would remove file: ${path}`);
        } else {
          opts.verbose && console.log(`removing file: ${path}`);
          unlinkSync(path);
        }
      }
      pathExists = true;
    }
  });

  if (opts.stat || opts.verbose) {
    console.log(`Removed:  ${paths.length} items`);
    console.timeEnd('Duration');
  }
  opts.dryRun && console.log('=== dry-run ===');
  if (typeof cb === 'function') cb();
  return pathExists;
}
