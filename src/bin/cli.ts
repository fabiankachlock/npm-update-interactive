import { program } from 'commander'
import { findePackageManager, findProjectPackageJson, getDependencies } from '../package'
import { getNewPackageVersion, getNextStep, getPackageToUpdate } from '../ui'
import { Dependency, PackageUpdate } from '../types'
import { getAvailableVersions } from '../versions'
;(async () => {
  console.log('## npm-update-interactive ##')
  program
    .name('npm-update-interactive')
    .description('Update npm packages interactively')
    .version('1.0.0')
    .option('-c, --config <path>', 'Path to the package json file', undefined)
    .option('-p, --package-manager <name>', 'Package manager to use', undefined)

  program.parse(process.argv)
  const { config, packageManager } = program.opts()
  const packageJsonPath = findProjectPackageJson(config)
  if (!packageJsonPath) {
    console.error('No package.json found')
    process.exit(1)
  }
  console.log(`Using package.json: ${packageJsonPath}`)

  const packageManagerName = packageManager || (await findePackageManager(packageJsonPath))
  console.log(`Using package manager: ${packageManagerName}`)

  const dependencies = await getDependencies(packageJsonPath)
  const allUpdates = {} as Record<string, PackageUpdate>

  while (true) {
    const updates = await getPackageToUpdate(dependencies)
    for (const dependencyName of updates) {
      const dependency = dependencies.find(dependency => dependency.name === dependencyName)!
      const versions = await getAvailableVersions(dependencyName, packageManagerName)
      const newVersion = await getNewPackageVersion(dependencyName, versions)
      if (newVersion) {
        allUpdates[dependencyName] = {
          dependency,
          newVersion,
        }
      }
    }

    console.log('Selected packages to update:')
    for (const [name, { dependency, newVersion }] of Object.entries(allUpdates)) {
      console.log(`- ${name}: ${dependency.installedVersion ?? dependency.version} -> ${newVersion}`)
    }

    const nextStep = await getNextStep(Object.values(allUpdates))
    if (nextStep === 'abort') {
      console.log('Aborting...')
      process.exit(0)
    }

    if (nextStep === 'update') {
      break
    }
  }

  console.log('Updating packages...')
})()
