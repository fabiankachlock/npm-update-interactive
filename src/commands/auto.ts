import { Command } from 'commander'
import { prepare } from '../prepare'
import { error, fancy, info } from '../logging'
import { getDependencies, writeUpdates } from '../package'
import { PackageUpdate } from '../types'
import { getAvailableVersions, runInstall } from '../packageManager'
import { confirm, formatDependencyName, printUpdates } from '../ui'

export const runAuto = async (command: Command) => {
  const { packageJsonPath, packageManagerName } = await prepare(command)
  const { yes, filter, pre, save } = command.opts()
  const fancyOptions = [save ? 'non-breaking' : 'allow-breaking', pre ? `prerelease-${pre}` : 'latest-stable']
  console.log(fancy(`opt  ${fancyOptions.join(' | ')}`))

  const dependencies = await getDependencies(packageJsonPath)
  const allUpdates = {} as Record<string, PackageUpdate>

  for (const dependency of dependencies) {
    if (filter && !dependency.name.includes(filter)) {
      continue
    }

    try {
      const versions = await getAvailableVersions(packageJsonPath, dependency.name, packageManagerName)
      if (!versions || versions.length === 0) {
        console.error(error(`No versions found for package: ${formatDependencyName(dependency)}`))
        continue
      }
      let eligableVersions = versions

      if (pre) {
        const preRegex = new RegExp(`${pre}\\.\\d+$`)
        eligableVersions = versions.filter(version => preRegex.test(version))
      } else if (save) {
        const currentMajor = dependency.installedVersion?.split('.')[0] ?? ''
        eligableVersions = versions.filter(version => version.startsWith(currentMajor) && !version.includes('-'))
      }

      const newVersion = eligableVersions[0]
      if (newVersion && newVersion !== (dependency.installedVersion ?? dependency.version)) {
        allUpdates[dependency.name] = {
          dependency,
          newVersion,
        }
      }
    } catch (err) {
      console.error(`Cant get new version for package: ${dependency.name}`)
      console.error(err)
    }
  }

  if (Object.keys(allUpdates).length === 0) {
    console.log(info('No updates selected'))
    process.exit(0)
  } else {
    printUpdates(Object.values(allUpdates))
  }

  if (!yes) {
    const result = await confirm('Do you want to update these packages?')
    if (!result) {
      console.log(info('Aborting...'))
      process.exit(0)
    }
  }

  console.log(info('Updating packages...'))
  await writeUpdates(packageJsonPath, Object.values(allUpdates))

  console.log(info('Installing dependencies...'))
  await runInstall(packageManagerName, packageJsonPath)

  process.exit(0)
}
