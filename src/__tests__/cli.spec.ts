import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { afterAll, afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { removeSync } from '../index.ts';

function cleanupFolders() {
  try {
    rmSync('test-cli', { recursive: true, force: true });
  } catch (_) {}
}

describe('remove-glob', () => {
  afterEach(() => {
    vi.clearAllMocks();
    cleanupFolders();
    process.exitCode = undefined;
  });

  afterAll(() => cleanupFolders());

  beforeEach(() => {
    cleanupFolders();
    removeSync({ paths: 'test-cli/other' });
  });

  test(
    'CLI exclude',
    () =>
      new Promise((done: any) => {
        mkdirSync('test-cli', { recursive: true });
        writeFileSync('test-cli/a.txt', 'a');
        writeFileSync('test-cli/b.txt', 'b');

        vi.spyOn(process, 'argv', 'get').mockReturnValueOnce(['node.exe', 'remove-glob/dist/cli.js', '--glob="test-cli/**"']);

        // Mock process.exit so it doesn't kill the test runner
        // @ts-expect-error
        const exitSpy = vi.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
          if (code && code !== 0) {
            exitSpy.mockRestore();
            done(new Error(`process.exit called with code ${code}`));
          }
          // Do nothing for code 0
        });

        import('../cli.ts')
          .then(() => {
            // Wait until test-cli exists, then check files
            const start = Date.now();
            const check = () => {
              if (existsSync('test-cli')) {
                if (Date.now() - start > 55) {
                  exitSpy.mockRestore();
                  return done(new Error('Timeout: test-cli was not removed'));
                }
                setTimeout(check, 50);
                return;
              }
              try {
                setTimeout(() => {
                  const isFound = existsSync('test-cli');
                  expect(isFound).toBeFalsy();
                  exitSpy.mockRestore();
                  done();
                }, 75);
              } catch (e) {
                exitSpy.mockRestore();
                done(e);
              }
            };
            check();
          })
          .catch(e => {
            exitSpy.mockRestore();
            done(e);
          });
      }),
    300,
  );
});
