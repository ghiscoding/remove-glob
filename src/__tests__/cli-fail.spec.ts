import { afterEach, describe, expect, test, vi } from 'vitest';

describe('remove-glob CLI', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    process.exitCode = undefined;
  });

  test('reports an unknown argument and exits with failure', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    vi.spyOn(process, 'argv', 'get').mockReturnValue(['node.exe', 'remove-glob/dist/cli.js', '--unknown-option']);

    await import('../cli.js');

    expect(errorSpy).toHaveBeenCalledExactlyOnceWith(new Error('Unknown argument: unknown-option'));
    expect(exitSpy).toHaveBeenCalledExactlyOnceWith(1);
  });
});
