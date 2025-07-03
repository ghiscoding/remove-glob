import { beforeEach, describe, expect, test, vi } from 'vitest';

describe('remove-glob', () => {
  beforeEach(() => {
    vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
  });

  test('CLI entry failure (no valid process.argv)', () =>
    new Promise((done: any) => {
      const errorSpy = vi.spyOn(global.console, 'error').mockReturnValue();
      const exitSpy = vi.spyOn(process, 'exit');

      vi.spyOn(process, 'argv', 'get').mockReturnValue(['node.exe', 'remove-glob/dist/cli.js', '--unknown-option']);

      import('../cli.js')
        .then((cli: any) => {
          cli();
        })
        .catch(_ => {
          expect(errorSpy).toHaveBeenCalledWith(new Error('Unknown CLI option: unknown-option'));
          expect(exitSpy).toHaveBeenCalledWith(1);
          process.exitCode = undefined;
          done();
          process.exit(0);
        });
    }));
});
