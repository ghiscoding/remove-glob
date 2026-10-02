import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { afterEach, describe, expect, test, vi } from 'vitest';

describe('remove-glob CLI', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    rmSync('test-cli', { recursive: true, force: true });
    process.exitCode = undefined;
  });

  test('removes files and directories matched by a glob', async () => {
    mkdirSync('test-cli', { recursive: true });
    writeFileSync('test-cli/a.txt', 'a');
    writeFileSync('test-cli/b.txt', 'b');

    vi.spyOn(process, 'argv', 'get').mockReturnValue(['node.exe', 'remove-glob/dist/cli.js', '--glob=test-cli/**']);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);

    await import('../cli.js');

    expect(errorSpy).not.toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledExactlyOnceWith(0);
    expect(existsSync('test-cli')).toBe(false);
  });
});
