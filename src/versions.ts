import { exec } from 'child_process'
import semver from 'semver'

export const getAvailableVersions = (packageName: string, packageManager: string): Promise<string[]> => {
  // yarn uses the `info`, while npm and pnpm use `view` command to get package information.
  const action = packageManager === 'yarn' ? 'info' : 'view'
  // explicitly ask the package manager to return the versions in JSON format
  const command = `${packageManager} ${action} ${packageName} versions --json`
  const { promise, resolve, reject } = Promise.withResolvers<string[]>()

  exec(
    command,
    {
      encoding: 'utf-8',
    },
    (error, stdout, stderr) => {
      if (error) {
        reject(error)
      }

      const version: string[] = JSON.parse(stdout)
      const sortedVersions = semver.rsort(version)
      resolve(sortedVersions)
    },
  )

  return promise
}
