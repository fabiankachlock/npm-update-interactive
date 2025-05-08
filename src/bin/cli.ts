#!/usr/bin/env node
import { program } from 'commander'
import { findePackageManager, findProjectPackageJson, getDependencies, writeUpdates } from '../package'
import { getNewPackageVersion, getNextStep, getPackageToUpdate, printUpdates } from '../ui'
import { PackageUpdate } from '../types'
import { getAvailableVersions, runInstall } from '../packageManager'
import { bgBlack, red, blue, magenta, bold, italic } from 'yoctocolors-cjs'
import pkg from '../../package.json'

const width = process.stdout.columns || 80

const fancy = (text: string, renderBold?: boolean): string => {
  const padding = width - text.length - 2 - 2
  const textToRender = renderBold ? bold(text) : text
  return `${bgBlack(red('⥏'))}${bgBlack(blue('  ' + textToRender + ''.padEnd(padding, ' ')))}${bgBlack(red('⥑'))}`
}

const info = (text: string): string => `${bgBlack(` ${italic(blue(text))}${''.padEnd(width - text.length - 1)}`)}`

const error = (text: string): string => `${magenta(bold('ERROR'))} ${text}`

;(async () => {
  console.log(fancy('nui  npm-update-interactive', true))
  console.log(fancy(`ver  ${pkg.version}`))

  program
    .name('npm-update-interactive')
    .description('Update npm packages interactively')
    .version(pkg.version)
    .option('-c, --config <path>', 'Path to the package json file', undefined)
    .option('-p, --package-manager <name>', 'Package manager to use', undefined)

  program.parse(process.argv)
  const { config, packageManager } = program.opts()

  const packageJsonPath = findProjectPackageJson(config)
  if (!packageJsonPath) {
    console.error(error('No package.json found'))
    process.exit(1)
  }
  console.log(fancy(`pkg  ${packageJsonPath}`))

  const packageManagerName = packageManager || (await findePackageManager(packageJsonPath))
  console.log(fancy(`pkm  ${packageManagerName}`))
  console.log()

  const dependencies = await getDependencies(packageJsonPath)
  const allUpdates = {} as Record<string, PackageUpdate>

  while (true) {
    const updates = await getPackageToUpdate(dependencies)
    if ((!updates || updates.length === 0) && Object.keys(allUpdates).length === 0) {
      console.log(info('No packages selected'))
      process.exit(0)
    }

    if (updates) {
      for (const dependencyName of updates) {
        const dependency = dependencies.find(dependency => dependency.name === dependencyName)!
        const versions = await getAvailableVersions(packageJsonPath, dependencyName, packageManagerName)
        const newVersion = await getNewPackageVersion(dependencyName, versions)
        if (newVersion) {
          allUpdates[dependencyName] = {
            dependency,
            newVersion,
          }
        }
      }
    }

    printUpdates(Object.values(allUpdates))

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
})()
