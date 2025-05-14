import { exec } from 'node:child_process'
import path from 'node:path'
import semver from 'semver'

export const getAvailableVersions = (
  packageJsonPath: string,
  packageName: string,
  packageManager: string,
): Promise<string[]> => {
  // yarn uses the `info`, while npm and pnpm use `view` command to get package information.
  const action = packageManager === 'yarn' ? 'info' : 'view'
  // explicitly ask the package manager to return the versions in JSON format
  const command = `${packageManager} ${action} ${packageName} versions --json`
  const { promise, resolve, reject } = Promise.withResolvers<string[]>()

  exec(
    command,
    {
      cwd: path.dirname(packageJsonPath),
      encoding: 'utf-8',
    },
    (error, stdout) => {
      if (error) {
        reject(error)
      }

      const versions: string[] = JSON.parse(stdout)
      const sortedVersions = semver.rsort(Array.isArray(versions) ? versions : [])
      resolve(sortedVersions)
    },
  )

  return promise
}

export const runInstall = (packageManager: string, packageJsonPath: string): Promise<void> => {
  let command = `${packageManager} install --prefer-offline --no-audit --no-progress`
  if (packageManager === 'pnpm') {
    command = `${packageManager} install --prefer-offline `
  }

  const { promise, resolve, reject } = Promise.withResolvers<void>()

  exec(
    command,
    {
      cwd: path.dirname(packageJsonPath),
      encoding: 'utf-8',
    },
    (error, stdout, stderr) => {
      if (error) {
        reject(error)
      }
      resolve()
    },
  )

  return promise
}
