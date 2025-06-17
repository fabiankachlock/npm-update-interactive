import { Command } from 'commander'
import { findePackageManager, findProjectPackageJson, getDependencies, writeUpdates } from '../package'
import { error, fancy, info } from '../logging'
import { PackageUpdate } from '../types'
import { formatDependencyName, getNewPackageVersion, getNextStep, getPackageToUpdate, printUpdates } from '../ui'
import { getAvailableVersions, runInstall } from '../packageManager'

export const runInteractive = async (program: Command) => {
  const { config, packageManager } = program.opts()

  const packageJsonPath = findProjectPackageJson(config)
  if (!packageJsonPath) {
    console.error(error('No package.json found'))
    process.exit(1)
  }
  console.log(fancy(`pkg  ${packageJsonPath}`))

  const packageManagerName = packageManager || (await findePackageManager(packageJsonPath))
  console.log(fancy(`pkm  ${packageManagerName}`))

  const dependencies = await getDependencies(packageJsonPath)
  const allUpdates = {} as Record<string, PackageUpdate>

  while (true) {
    const updates = await getPackageToUpdate(dependencies)
    if ((!updates || updates.length === 0) && Object.keys(allUpdates).length === 0) {
      console.log(info('No packages selected'))
    }

    if (updates) {
      for (const dependencyName of updates) {
        const dependency = dependencies.find(dependency => dependency.name === dependencyName)!
        try {
          const versions = await getAvailableVersions(packageJsonPath, dependencyName, packageManagerName)
          if (!versions || versions.length === 0) {
            console.error(error(`No versions found for package: ${formatDependencyName(dependency)}`))
            continue
          }

          const newVersion = await getNewPackageVersion(dependencyName, versions, dependency.installedVersion)
          if (newVersion) {
            allUpdates[dependencyName] = {
              dependency,
              newVersion,
            }
          }
        } catch (err) {
          console.error(error(`Cant get new version for package: ${formatDependencyName(dependency)}`))
          console.error(err)
        }
      }
    }

    if (Object.keys(allUpdates).length === 0) {
      console.log(info('No updates selected'))
    } else {
      printUpdates(Object.values(allUpdates))
    }

    const nextStep = await getNextStep()
    if (nextStep === 'abort') {
      console.log(info('Aborting...'))
      process.exit(0)
    }

    if (nextStep === 'update') {
      console.log(info('Updating packages...'))
      await writeUpdates(packageJsonPath, Object.values(allUpdates))

      console.log(info('Installing dependencies...'))
      await runInstall(packageManagerName, packageJsonPath)

      process.exit(0)
    }
  }
}
