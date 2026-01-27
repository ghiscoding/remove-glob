import type { GlobOptions } from 'node:fs';
import { existsSync, globSync, rmSync, statSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import type { RemoveOptions } from './interfaces.js';
import { throwOrCallback } from './utils.js';

/**
 * Remove the files or directories, the item(s) can be provided via positional arguments or via a `--glob` pattern.
 * @param {RemoveOptions} options - CLI options
 * @param {(e?: Error) => void} callback - optional callback that will be executed after remove is finished or when an error occurs
 */
export function removeSync(opts: RemoveOptions = {}, callback?: (e?: Error) => void) {
  const cb = callback || opts.callback;
  let paths: string[] = [];
  if (typeof opts.paths === 'string' && opts.paths.length > 0) {
    paths = [opts.paths];
  } else if (Array.isArray(opts.paths)) {
    paths = opts.paths.filter(p => typeof p === 'string' && p.length > 0);
  }

  let errorMsg = '';
  if (!paths.length && !opts.glob) {
    errorMsg =
      'Please make sure to provide file paths via command arguments or via `--glob` pattern, i.e.: "remove dir" or "remove --glob dir/**/*.js"';
  } else if (paths.length > 0 && opts.glob) {
    errorMsg = 'Providing both `--paths` and `--glob` pattern at the same time is not supported, you must chose only one.';
  }

  if (errorMsg) {
    throwOrCallback(new Error(errorMsg), cb);
    return;
  }

  let pathExists = false;
  // paths is always an array now
  const requiresCwdChange = !!(paths.length && opts.cwd);
  if (!paths.length && opts.glob) {
    // Use fs.globSync to match files. Dotfiles and dot-directories are always included.
    const defaultExclude = ['**/.git/**', '**/.git', '**/node_modules/**', '**/node_modules'];
    const globOptions: GlobOptions = { cwd: opts.cwd, withFileTypes: false };
    globOptions.exclude = Array.isArray(opts.exclude) ? opts.exclude : defaultExclude;

    const globResult = globSync(opts.glob, globOptions);
    // We reassign 'paths' here to hold the final list of files matched by glob,
    // after filtering for strings and resolving to absolute paths if needed.
    paths =
      Array.isArray(globResult) && globResult.length > 0 ? (globResult as unknown[]).filter((v): v is string => typeof v === 'string') : [];
    if (opts.cwd) {
      paths = paths.map(p => resolve(opts.cwd as string, p));
    }
  }

  if (opts.stat || opts.verbose) {
    console.time('Duration');
  }
  // start dry-run print
  opts.dryRun && console.log('-- dry-run --');

  paths.forEach(path => {
    // do we need to resolve file/dir from a different cwd?
    if (requiresCwdChange) {
      path = resolve(opts.cwd || '.', path);
    }

    if (existsSync(path)) {
      const isDir = statSync(path).isDirectory();
      const pathLog = `${isDir ? 'directory' : 'file'}: ${path}`;

      if (opts.dryRun) {
        console.log(`would remove ${pathLog}`);
      } else {
        opts.verbose && console.log(`removing ${pathLog}`);
        if (isDir) {
          rmSync(path, { recursive: true, force: true, maxRetries: process.platform === 'win32' ? 10 : 0 }); // delete folder recursively
        } else {
          unlinkSync(path); // delete file
        }
      }
      pathExists = true;
    }
  });

  if (opts.stat || opts.verbose) {
    console.log(`Removed:  ${paths.length} items`);
    console.timeEnd('Duration');
  }

  // end dry-run print & execute callback when defined
  opts.dryRun && console.log('-- end --');
  typeof cb === 'function' && cb();
  return pathExists;
}
