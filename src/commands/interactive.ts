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
  let nextStep = 'select'

  const select = async (): Promise<Record<string, PackageUpdate>> => {
    const updates = await getPackageToUpdate(dependencies, batch)
    if ((!updates || updates.length === 0) && Object.keys(allUpdates).length === 0) {
      console.log(info('No packages selected'))
    }

    if (!updates) return {}
    const newVersions = {} as Record<string, PackageUpdate>

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
          newVersions[dependencyName] = {
            dependency,
            newVersion,
          }
        }
      } catch (err) {
        console.error(error(`Cant get new version for package: ${formatDependencyName(dependency)}`))
        console.error(err)
      }
    }

    // automatically print selected updates in batch mode
    if (batch) print()
    return newVersions
  }

  const print = () => {
    if (Object.keys(allUpdates).length === 0) {
      console.log(info('No updates selected'))
    } else {
      printUpdates(Object.values(allUpdates))
    }
  }

  const update = async () => {
    console.log(info('Updating packages...'))
    await writeUpdates(packageJsonPath, Object.values(allUpdates))

    console.log(info('Installing dependencies...'))
    await runInstall(packageManagerName, packageJsonPath)

    // automatically exit the application after updating packages
    process.exit(0)
  }

  while (nextStep !== 'abort') {
    if (nextStep === 'select') {
      const updates = await select()
      Object.assign(allUpdates, updates)
    } else if (nextStep === 'print') {
      print()
    } else if (nextStep === 'update') {
      await update()
    } else {
      break
    }
    nextStep = await getNextStep(batch)
  }

  console.log(info('Aborting...'))
  process.exit(0)
}
