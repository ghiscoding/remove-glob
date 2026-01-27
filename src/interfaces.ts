export interface RemoveOptions {
  /** Callback to run when the execution finished or an error occured */
  callback?: (e?: Error) => void;

  /**
   * The directory to resolve your `filepath` from.
   * Defaults to the `process.cwd()` – aka, the directory that your command is run within.
   */
  cwd?: string;

  /** Show which files would be deleted but without actually deleting them */
  dryRun?: boolean;

  /** Glob pattern to find which files/directories to remove */
  glob?: string | string[];

  /**
   * The filepath(s) to remove – may be a file or a directory.
   * An initial existence check is made for this filepath.
   * Important: This value is resolved to a full path.
   * Please be aware of how and from where the Node.js file system is resolving your path!
   */
  paths?: string | string[];

  /** Show the stats of the removed items */
  stat?: boolean;

  /** Print more information to console */
  verbose?: boolean;

  /**
   * Glob pattern(s) to exclude from deletion. If not provided, defaults to `["**\/.git/**", "**\/.git", "**\/node_modules/**", "**\/node_modules"]`
   * To disable exclusion and allow deleting everything, pass an empty array ([]).
   */
  exclude?: string | string[];

  /**
   * If true, include dotfiles (files starting with a dot) when matching glob patterns.
   */
  all?: boolean;
}
