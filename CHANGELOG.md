# Change Log 
All notable changes to this project will be documented in this file. See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.1.1](https://github.com/ghiscoding/remove-glob/compare/v1.1.0...v1.1.1) (2026-01-27)

### Bug Fixes

* add missing `-e` short CLI alias for exclude option ([180c34f](https://github.com/ghiscoding/remove-glob/commit/180c34f381a73fc9ebb5244127fa636d9f277fc1))

## [1.1.0](https://github.com/ghiscoding/remove-glob/compare/v1.0.0...v1.1.0) (2026-01-27)

### Features

* add `exclude`  option and default to `.git`,`node_modules` folders ([aef792f](https://github.com/ghiscoding/remove-glob/commit/aef792f861b6569c2e7903d96b0a5336ca2d4f49))

## [1.0.0](https://github.com/ghiscoding/remove-glob/compare/v0.4.10...v1.0.0) (2026-01-26)

> [!NOTE]
> Please visit the [v1.0.0](https://github.com/ghiscoding/remove-glob/releases/tag/v1.0.0) release for more details about the migration.

### ⚠ BREAKING CHANGES

* drop `tinyglobby` and use native `fs.glob`

### Features

* drop `tinyglobby` and use native `fs.glob` ([60e5228](https://github.com/ghiscoding/remove-glob/commit/60e522887b0975ef23340c61a2d509f4a9e2c6ac))

## [0.4.10](https://github.com/ghiscoding/remove-glob/compare/v0.4.9...v0.4.10) (2025-12-19)

### Bug Fixes

* reapply force .js extension in imports ([dda6bc9](https://github.com/ghiscoding/remove-glob/commit/dda6bc92fe5328a7d8f9c705307d1cee8adf51ba))

## [0.4.9](https://github.com/ghiscoding/remove-glob/compare/v0.4.8...v0.4.9) (2025-12-18)

## [0.4.8](https://github.com/ghiscoding/remove-glob/compare/v0.4.7...v0.4.8) (2025-12-18)

## [0.4.7](https://github.com/ghiscoding/remove-glob/compare/v0.4.6...v0.4.7) (2025-12-18)

## [0.4.6](https://github.com/ghiscoding/remove-glob/compare/v0.4.4...v0.4.6) (2025-12-18)

### Bug Fixes

* **deps:** update all non-major dependencies ([7c841e1](https://github.com/ghiscoding/remove-glob/commit/7c841e13ebd2ed43f95a52313bcffa20a5236207))
* use -V for verbose flag to avoid duplicate flag usage ([3ac70c3](https://github.com/ghiscoding/remove-glob/commit/3ac70c3153c4a67cebb7080eae0d017b348eaada))

## [0.4.4](https://github.com/ghiscoding/remove-glob/compare/v0.4.3...v0.4.4) (2025-09-25)

## [0.4.3](https://github.com/ghiscoding/remove-glob/compare/v0.4.2...v0.4.3) (2025-09-25)

### Bug Fixes

* always publish release on github ([203cf31](https://github.com/ghiscoding/remove-glob/commit/203cf3149149266f10c3e5ca71964268c9aab568))

## [0.4.2](https://github.com/ghiscoding/remove-glob/compare/v0.4.0...v0.4.2) (2025-09-25)

### Bug Fixes

* publish release with OIDC ([826561c](https://github.com/ghiscoding/remove-glob/commit/826561caded6511d15056dd49b20e7d8ecfa5c23))
* publish release with OIDC ([f4d82bb](https://github.com/ghiscoding/remove-glob/commit/f4d82bbaff9df362a90ddc32ff66ad8a0400da9e))

## [0.4.0](https://github.com/ghiscoding/remove-glob/compare/v0.3.7...v0.4.0) (2025-09-17)

### Features

* refactor and simplify code ([cbc089a](https://github.com/ghiscoding/remove-glob/commit/cbc089a4d02c70601f47b2b420e934dd08ea3e5c))

### Bug Fixes

* **deps:** update all dependencies ([fac06bf](https://github.com/ghiscoding/remove-glob/commit/fac06bf9a8e87aa83d0f0b9928d4acf612e5e9c1))

## [0.3.7](https://github.com/ghiscoding/remove-glob/compare/v0.3.6...v0.3.7) (2025-09-14)

### Bug Fixes

* duration time log should show in verbose ([99bc87e](https://github.com/ghiscoding/remove-glob/commit/99bc87e334bb4a7610371da399f151a885a2dbf7))
* use rmSync only for sub-dir with resursive flag & not fall outside ([aa876e3](https://github.com/ghiscoding/remove-glob/commit/aa876e3bb96ee4824d9adbe7d454ec4f6d8423bd))

## [0.3.6](https://github.com/ghiscoding/remove-glob/compare/v0.3.5...v0.3.6) (2025-08-26)

### Bug Fixes

* publish with OIDC ([f27afc1](https://github.com/ghiscoding/remove-glob/commit/f27afc141f9f6d1edd8db8c1fe9b1cc19c6de376))

## [0.3.5](https://github.com/ghiscoding/remove-glob/compare/v0.3.4...v0.3.5) (2025-07-19)

### Bug Fixes

* add maxRetries to rmSync on Windows OS ([67527a0](https://github.com/ghiscoding/remove-glob/commit/67527a0e60303883b0f6ef87fadd8c5259d730f1))

## [0.3.4](https://github.com/ghiscoding/remove-glob/compare/v0.3.3...v0.3.4) (2025-07-12)

### Bug Fixes

* glob pattern should skip `node_modules` and `.git` folders ([02c2f8b](https://github.com/ghiscoding/remove-glob/commit/02c2f8b86bcdeec60e3e29f160c7845fab9408e7))

## [0.3.3](https://github.com/ghiscoding/remove-glob/compare/v0.3.2...v0.3.3) (2025-07-09)

### Bug Fixes

* decrease CLI width to lowest possible ([45a41c9](https://github.com/ghiscoding/remove-glob/commit/45a41c9cbc8431dfc5c8788c0e65da6c252c596d))
* **deps:** update `cli-nano` to latest and add CLI examples ([21ddd11](https://github.com/ghiscoding/remove-glob/commit/21ddd11c4ed2a19a1cc19f0ffa357ae0caee50c1))

## [0.3.2](https://github.com/ghiscoding/remove-glob/compare/v0.3.1...v0.3.2) (2025-07-05)

### Bug Fixes

* increase CLI description width to show all docs ([a3467cc](https://github.com/ghiscoding/remove-glob/commit/a3467cc0ab5962f77fa06637109138b9848a6ab2))

## [0.3.1](https://github.com/ghiscoding/remove-glob/compare/v0.3.0...v0.3.1) (2025-07-05)

### Bug Fixes

* **deps:** update cli-nano to latest ([6317346](https://github.com/ghiscoding/remove-glob/commit/63173464c48a02fd60f13c35c21b7ed0f1cb2d7e))
* use only declaration maps ([c3153da](https://github.com/ghiscoding/remove-glob/commit/c3153daf4537fc77d9c22d8021d81d6fe568eb66))

## [0.3.0](https://github.com/ghiscoding/remove-glob/compare/v0.2.0...v0.3.0) (2025-07-03)

### Features

* support one or more `--glob` patterns ([0612452](https://github.com/ghiscoding/remove-glob/commit/06124528e7e308aabbbb8ff998d870610f27629b))

## 0.2.0 (2025-07-03)

### Features

* drop file arg & pass via option instead & increase test coverage ([611e925](https://github.com/ghiscoding/remove-glob/commit/611e9256b5996ad6275ab06b59e23a9f67db518e))
* use `paths` instead of `files` to represent either files or dirs ([4723b5b](https://github.com/ghiscoding/remove-glob/commit/4723b5b8fc085af9d7dd53a3805a4ed6157e56a0))
