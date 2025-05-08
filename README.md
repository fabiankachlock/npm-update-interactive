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

## Features

- automatic package.json location (in the current directory or any parent directory)
- automatic package manager detection (supports npm, yarn, pnpm)
- filter packages by name or version
- filter new versions


## Options

| Option                    | Description                           |
| ------------------------- | ------------------------------------- |
| `-h`, `--help`            | show help                             |
| `-c`, `--config`          | (optional) path to the package.json   |
| `-p`, `--package-manager` | (optional) the package manager to use |
