# npm-update-interactive (nui)

A small command line tool to update specific npm packages interactively.

This tool is heavy inspired by [npm-check-updates](https://github.com/raineorshine/npm-check-updates).

> In contrast to npm-check-updates, nui focus on changing the version of specific packages and allows manually selecting the new version for a package.

## Installation

```bash
npm install -g @fabiankachlock/nui
```

## Usage

```bash
nui
```

This launches nui in interactive mode, where you can select which packages to update and which version to use.

## Features

- automatic package.json location (in the current directory or any parent directory)
- automatic package manager detection (supports npm, yarn, pnpm)
- filter packages by name or version
- filter new versions

## Global Options

| Option                    | Description                           |
| ------------------------- | ------------------------------------- |
| `-h`, `--help`            | show help                             |
| `-b`, `--batch`           | (optional) enable batch mode          |
| `-c`, `--config`          | (optional) path to the package.json   |
| `-p`, `--package-manager` | (optional) the package manager to use |

## Commands

### `auto`

```bash
nui auto [options]
```

The auto command automatically updates all packages based on the provided options.

#### Options

| Option           | Description                                                                                                 |
| ---------------- | ----------------------------------------------------------------------------------------------------------- |
| `-y`, `--yes`    | (optional) skips the confirmation                                                                           |
| `-f`, `--filter` | (optional) filter which pcakges to update                                                                   |
| `--pre`          | (optional) install a the latest version of a prerelease. Will only update to versions wuth that prerelease. |
| `-s`, `--save`   | (optional) dont install breaking changes. This will updte to the latest minor version of the current major  |
