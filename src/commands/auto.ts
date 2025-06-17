import { Command } from 'commander'
import { prepare } from '../prepare'
import { error, fancy, info } from '../logging'
import { getDependencies, writeUpdates } from '../package'
import { PackageUpdate } from '../types'
import { getAvailableVersions, runInstall } from '../packageManager'
import { confirm, formatDependencyName, printUpdates } from '../ui'
import semver from 'semver'

export const runAuto = async (command: Command) => {
  const { packageJsonPath, packageManagerName } = await prepare(command)
  const { yes, filter, pre, save } = command.opts()

  const fancyOptions = [
    save ? 'non-breaking' : 'allow-breaking',
    pre ? `prerelease-${pre === true ? '*' : pre}` : 'latest-stable',
  ]
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

      let eligableVersions = versions.filter(version =>
        semver.gte(version, dependency.installedVersion ?? dependency.version),
      )

      if (pre === true) {
        // allow any prerelease version
        const preRegex = new RegExp(`\\-.*\\.\\d+$`)
        eligableVersions = eligableVersions.filter(version => preRegex.test(version))
      } else if (pre) {
        // allow only prerelease versions with specific pre-release id
        const preRegex = new RegExp(`\\-${pre}\\.\\d+$`)
        eligableVersions = eligableVersions.filter(version => preRegex.test(version))
      } else {
        // don't allow prerelease versions
        eligableVersions = eligableVersions.filter(version => !version.includes('-'))
      }

      if (save) {
        // allow only version of the same major version
        const currentMajor = dependency.installedVersion?.split('.')[0] ?? ''
        eligableVersions = eligableVersions.filter(version => version.startsWith(currentMajor))
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
