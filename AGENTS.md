# Contributor guidance for AI agents

## Project

`remove-glob` is a small, synchronous TypeScript utility and CLI for removing files and directories, with native Node.js glob support. Keep the implementation small and readable, and avoid adding runtime dependencies for functionality supported by Node.js.

- `src/index.ts`: public `removeSync` API and deletion logic.
- `src/utils.ts`: glob matching and error helpers.
- `src/interfaces.ts`: public options and their documentation.
- `src/cli.ts`: CLI configuration using `cli-nano`.
- `src/__tests__/`: Vitest API and CLI tests.
- `scripts/`: npm packaging hooks.
- `.github/pull_request_template.md`: required PR description format.

The package is ESM. Use `.js` extensions for relative imports in TypeScript. Supported Node versions are defined in `package.json`; avoid APIs that require a newer version than the minimum supported version.

## Working in the repository

- Inspect the working tree before editing and preserve unrelated user changes.
- Use `rg` for file and text searches. When RTK is installed, prefix shell commands with `rtk`; use `rtk proxy <command>` when unfiltered output is needed.
- Follow the existing Biome configuration: two spaces, single quotes, semicolons, and a 140-character line width.
- Edit source files rather than generated `dist/` or `coverage/` output.
- Keep optimizations focused. Preserve API signatures, options, callbacks, return values, and documented behavior; describe intentional behavior changes explicitly.

## Filesystem behavior and tests

- Run deletion experiments only in disposable fixtures. Never benchmark broad deletion patterns against the repository or other existing user directories.
- Check missing paths, `cwd` resolution, dry runs, exclusions, negations, overlapping patterns, and symlinks when changing matching or deletion.
- Distinguish symlinks from their targets. Removing a link must preserve its target; include dangling links and directory junctions in relevant regression coverage.
- Matching exclusions and recursive deletion are separate operations. A matched parent can contain excluded descendants; changes affecting this behavior need explicit regression coverage.
- Preserve Windows retry handling for recursive directory removal. Report which operating systems and Node versions were actually tested.
- Test observable behavior rather than implementation details or unreachable branches. Mock modules that the implementation actually imports.
- Await CLI imports and assert exit status, errors, and filesystem results directly. Promise error paths must reject, and synchronous deletion tests should not poll or sleep.
- Restore spies and clean up fixtures after tests. Skip privileged file-symlink creation on platforms where the test environment cannot support it.

## Validation

Use the checks appropriate to the change. With RTK installed:

```sh
rtk proxy npm test -- --run
rtk proxy npm run biome:check
rtk proxy node node_modules/typescript/bin/tsc --project tsconfig.build.json
rtk git diff --check
```

`npm run build` also runs Biome with `--write` before compiling. Use `npm run biome:check` for read-only lint and formatting validation. Documentation-only changes generally need a diff review rather than another full test run.

For performance claims, compare the original implementation with the final implementation using equivalent disposable fixtures. Exclude fixture setup from timings, use warmups and repeated measurements, check equivalent results, and report medians together with Node version, operating system, and fixture size. Distinguish measured results from expected improvements.

## Pull requests

Before drafting or updating a PR title or description, read `.github/pull_request_template.md`. Use every section in its order, including `Comments`, `AI / LLM assistance`, and `Checklist`; do not substitute a generic description.

- Use a Conventional Commit title shorter than 73 characters.
- Explain the concrete problem and resulting behavior in `Summary`, the motivation in `Why`, and the important implementation or documentation changes in `Changes`.
- List only checks actually run in `Validation`, and identify material limitations.
- Fill out AI assistance honestly using the tool/model information available; do not guess an unknown model.
- Mark checklist items accurately. Explain multiple scopes in `Comments` when applicable.
- Add `fixes #<number>` on its own line only when an actual related issue is known.
- Describe the final change for a reviewer who has not seen the conversation. Omit abandoned approaches and conversational history.
- Return PR titles and descriptions as raw Markdown inside a fenced markdown code block so they can be copied directly.