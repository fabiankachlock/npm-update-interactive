import { Command } from 'commander'
import { getDependencies, writeUpdates } from '../package'
import { error, info } from '../logging'
import { PackageUpdate } from '../types'
import { formatDependencyName, getNewPackageVersion, getNextStep, getPackageToUpdate, printUpdates } from '../ui'
import { getAvailableVersions, runInstall } from '../packageManager'
import { prepare } from '../prepare'

export const runInteractive = async (command: Command) => {
  const { packageJsonPath, packageManagerName } = await prepare(command)
  const { batch } = command.opts()
  const dependencies = await getDependencies(packageJsonPath)
  const allUpdates = {} as Record<string, PackageUpdate>

  while (true) {
    const updates = await getPackageToUpdate(dependencies, batch)
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

    if (batch && Object.keys(allUpdates).length === 0) {
      console.log(info('No updates selected'))
    } else if (batch) {
      printUpdates(Object.values(allUpdates))
    }

    while (true) {
      const nextStep = await getNextStep(batch)
      if (nextStep === 'abort') {
        console.log(info('Aborting...'))
        process.exit(0)
      } else if (nextStep === 'print') {
        printUpdates(Object.values(allUpdates))
      } else if (nextStep === 'update') {
        console.log(info('Updating packages...'))
        await writeUpdates(packageJsonPath, Object.values(allUpdates))

        console.log(info('Installing dependencies...'))
        await runInstall(packageManagerName, packageJsonPath)

        process.exit(0)
      } else {
        break
      }
    }
  }
}
