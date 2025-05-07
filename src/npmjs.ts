import { execSync } from 'child_process'
import semver from 'semver'

export const getAvailableVersions = (packageName: string, packageManager: string): string[] => {
  const action = packageManager === 'yarn' ? 'info' : 'view'
  const command = `${packageManager} ${action} ${packageName} versions --json`

  const result = execSync(command, {
    encoding: 'utf-8',
  })
  // strip everything before [ and after ]
  const version = JSON.parse(result)
  return semver.rsort(version)
}
