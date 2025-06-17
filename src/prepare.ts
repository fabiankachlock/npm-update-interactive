import { Command } from 'commander'
import { findePackageManager, findProjectPackageJson } from './package'
import { error } from 'console'
import { fancy } from './logging'

export const prepare = async (command: Command) => {
  const { config, packageManager } = command.opts()

  const packageJsonPath = findProjectPackageJson(config)
  if (!packageJsonPath) {
    console.error(error('No package.json found'))
    process.exit(1)
  }
  console.log(fancy(`pkg  ${packageJsonPath}`))

  const packageManagerName = packageManager || (await findePackageManager(packageJsonPath))
  console.log(fancy(`pkm  ${packageManagerName}`))
  return {
    packageJsonPath,
    packageManagerName,
  }
}
