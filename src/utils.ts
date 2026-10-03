import { type Dirent, globSync, lstatSync, readdirSync } from 'node:fs';
import { dirname, join, matchesGlob, parse, relative, resolve, sep } from 'node:path';
import type { RemoveOptions } from './interfaces.js';

const defaultExclude = ['**/.git/**', '**/.git', '**/node_modules/**', '**/node_modules'];
type Matcher = (path: string, isDirectory: boolean, name?: string) => boolean;
type Removal = { path: string; isDirectory: boolean };

/** Expand comma braces before splitting paths; leave ranges and character classes to Node. */
function expandBraces(pattern: string): string[] {
  for (const match of pattern.matchAll(/\[[^\]]*\]|\{([^{}]*)\}/g)) {
    if (match[1] === undefined) {
      continue;
    }
    const alternatives = match[1].split(/,(?![^[]*\])/);
    if (alternatives.length > 1) {
      return alternatives.flatMap(value =>
        expandBraces(pattern.slice(0, match.index) + value + pattern.slice(match.index + match[0].length)),
      );
    }
  }
  return [pattern];
}

/** NUL prefixes exist only in matcher inputs, allowing native wildcards to match leading dots. */
function prefixSegments(path: string, pattern = false): string {
  return path
    .split(sep)
    .map(part => (!part || part === '.' || part === '..' || (pattern && part === '**') ? part : `\0${part}`))
    .join('/');
}

export function getExcludeMatcher(opts: RemoveOptions): Matcher | undefined {
  const cwd = opts.cwd || process.cwd();
  const nocase = process.platform === 'win32' || process.platform === 'darwin';
  const patterns = typeof opts.glob === 'string' ? [opts.glob] : opts.glob || [];
  const exclusions = typeof opts.exclude === 'string' ? [opts.exclude] : opts.exclude || [];
  const entries = [...exclusions, ...patterns.filter(p => p.startsWith('!')).map(p => p.slice(1))]
    .filter(Boolean)
    .flatMap(expandBraces)
    .map(p => {
      const pattern = prefixSegments(relative(cwd, resolve(cwd, p.replaceAll('\\', '/'))) || '.', true);
      return { pattern, directoryOnly: /[/\\]$/.test(p), suffix: nocase ? '' : pattern.match(/[^/*?[\]{}()]*$/)?.[0] || '' };
    });

  if (opts.exclude !== undefined && !entries.length) {
    return;
  }

  return (path, isDirectory, basename) => {
    // With only default exclusions, a checked parent's children need just their names checked.
    const local = !entries.length && basename !== undefined ? basename : relative(cwd, path) || '.';
    const name = nocase ? local.toLowerCase() : local;
    if (opts.exclude === undefined && name.split(sep).some(part => part === '.git' || part === 'node_modules')) {
      return true;
    }
    const candidate = entries.length ? prefixSegments(local) : '';
    // Descendant checks are only needed at a root; children have already had their parents checked.
    return entries.some(
      entry =>
        ((!entry.directoryOnly || isDirectory) && candidate.endsWith(entry.suffix) && matchesGlob(candidate, entry.pattern)) ||
        (basename === undefined && matchesGlob(candidate, entry.pattern === '.' ? '**' : `${entry.pattern}/**`)),
    );
  };
}

/** Scan for protected descendants, collapsing each unprotected subtree to one native recursive removal. */
export function getRemovalPlan(path: string, isDirectory: boolean, excluded: Matcher, name?: string): Removal[] {
  if (excluded(path, isDirectory, name)) {
    return [];
  }
  if (!isDirectory) {
    return [{ path, isDirectory }];
  }
  const plans = readdirSync(path, { withFileTypes: true }).map(entry => {
    const child = join(path, entry.name);
    return { child, plan: getRemovalPlan(child, entry.isDirectory(), excluded, entry.name) };
  });
  // Collapse only when every child's plan removes that child entirely.
  return plans.every(({ child, plan }) => plan.length === 1 && plan[0].path === child)
    ? [{ path, isDirectory }]
    : plans.flatMap(({ plan }) => plan);
}

/** Follow glob segments through real directories, including dots without following symlinks. */
function globWithDots(patterns: string[], cwd: string, excluded?: Matcher): string[] {
  const found = new Set<string>();
  const directories = new Map<string, Dirent[]>();
  const matches = new Map<string, boolean>();
  const cwdPath = resolve(cwd).replaceAll('\\', '/');
  const cwdPrefix = process.platform === 'win32' ? cwdPath.toLowerCase() : cwdPath;
  for (const pattern of patterns.flatMap(expandBraces)) {
    const absolute = pattern.replaceAll('\\', '/');
    const candidate = process.platform === 'win32' ? absolute.toLowerCase() : absolute;
    const normalized =
      candidate === cwdPrefix ? '.' : candidate.startsWith(`${cwdPrefix}/`) ? absolute.slice(cwdPrefix.length + 1) : absolute;
    const { root } = parse(normalized);
    const segments = normalized
      .slice(root.length)
      .split('/')
      .filter(part => part && part !== '.');
    // Native glob folds non-globstar segments followed by '..', including wildcard segments.
    for (let index = 1; index < segments.length; index++) {
      if (segments[index] === '..' && segments[index - 1] !== '..' && segments[index - 1] !== '**') {
        segments.splice(index - 1, 2);
        index = Math.max(0, index - 2);
      }
    }
    const magic = segments.findIndex(part => /[*?[\]{}()]/.test(part));
    const base = resolve(root || cwd, ...segments.slice(0, magic < 0 ? segments.length : magic));
    const visited = new Set<string>();

    function walk(path: string, index: number, isDirectory: boolean, name?: string) {
      const state = `${index}\0${path}`;
      if (visited.has(state) || excluded?.(path, isDirectory, name)) {
        return;
      }
      visited.add(state);

      if (index === segments.length || (!isDirectory && path === base && segments.slice(index).every(part => part === '**'))) {
        if (isDirectory || !/[/\\]$/.test(pattern)) {
          found.add(path);
        }
        return;
      }
      if (!isDirectory) {
        return;
      }

      const segment = segments[index];
      if (segment === '..') {
        walk(dirname(path), index + 1, true);
        return;
      }
      if (segment === '**') {
        walk(path, index + 1, true, name);
      }
      const entries = directories.get(path) || readdirSync(path, { withFileTypes: true });
      directories.set(path, entries);
      for (const entry of entries) {
        const key = `${segment}\0${entry.name}`;
        const matched = matches.get(key) ?? (segment === '**' || matchesGlob(`\0${entry.name}`, `\0${segment}`));
        matches.set(key, matched);
        if (matched) {
          walk(join(path, entry.name), segment === '**' && entry.isDirectory() ? index : index + 1, entry.isDirectory(), entry.name);
        }
      }
    }

    const metadata = lstatSync(base, { throwIfNoEntry: false });
    metadata && walk(base, magic < 0 ? segments.length : magic, metadata.isDirectory());
  }
  return [...found];
}

/** Helper to get all matched files from glob patterns, supporting dotfile logic via opts.all */
export function getMatchedFiles(glob: string | string[], opts: { cwd?: string; exclude?: string | string[]; all?: boolean }): string[] {
  const patterns = Array.isArray(glob) ? glob : [glob];
  const positive = patterns.filter(p => p && !p.startsWith('!'));
  const cwd = opts.cwd || process.cwd();
  const exclude = typeof opts.exclude === 'string' ? [opts.exclude] : opts.exclude || defaultExclude;
  const negated = patterns.filter(p => p.startsWith('!')).map(p => p.slice(1));
  const paths = opts.all
    ? globWithDots(positive, cwd, getExcludeMatcher({ ...opts, glob }))
    : [...new Set(globSync(positive, { cwd: opts.cwd, exclude: [...exclude, ...negated].filter(Boolean) }))];
  return opts.all
    ? opts.cwd
      ? paths
      : paths.map(path => relative(cwd, path) || '.')
    : opts.cwd
      ? paths.map(path => resolve(cwd, path))
      : paths;
}

/** Helper to throw or callback with error */
export function throwOrCallback(err?: Error, cb?: (e?: Error) => void) {
  if (typeof cb !== 'function') {
    throw err;
  }
  cb(err);
}
