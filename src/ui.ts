import promps from 'prompts'
import { Dependency, PackageUpdate } from './types'
import { green, blue, yellow, gray, bold } from 'yoctocolors-cjs'

export const getPackageToUpdate = async (dependencies: Dependency[]): Promise<string[]> => {
  const { packages } = await promps({
    type: 'autocompleteMultiselect',
    name: 'packages',
    hint: '',
    instructions: false,
    message: 'Select packages to update',
    choices: dependencies.map(dependency => {
      const hasSameInstalledVersion = dependency.version.endsWith(dependency.installedVersion ?? '#')
      const currentVersion = hasSameInstalledVersion
        ? gray(`(${dependency.installedVersion})`)
        : dependency.installedVersion
          ? bold(dependency.installedVersion)
          : ''

      return {
        title: `${formatDependencyName(dependency)}@${dependency.version} ${currentVersion}`,
        value: dependency.name,
      }
    }),
  })
  return packages
}

export const getNewPackageVersion = async (
  packageName: string,
  availableVersions: string[],
): Promise<string | undefined> => {
  const { version } = await promps({
    type: 'autocomplete',
    name: 'version',
    instructions: false,
    hint: 'Select skip to skip updating this package.',
    message: `Select a new version for '${packageName}'`,
    choices: availableVersions
      .map(version => ({
        title: version,
        value: version,
      }))
      .concat({
        title: gray('Skip'),
        value: '##skip',
      }),
  })

  if (version === '##skip') {
    return undefined
  }
  return version
}

export const getNextStep = async (): Promise<'update' | 'select' | 'abort'> => {
  const { nextStep } = await promps({
    type: 'select',
    name: 'nextStep',
    message: 'What do you want to do next?',
    choices: [
      { title: green('Update packages'), value: 'update' },
      { title: yellow('Select more packages'), value: 'select' },
      { title: gray('Abort'), value: 'abort' },
    ],
  })
  return nextStep
}

export const formatDependencyName = (dependency: Dependency): string => {
  if (dependency.type === 'normal') {
    return green(dependency.name)
  } else if (dependency.type === 'dev') {
    return blue(dependency.name)
  } else if (dependency.type === 'peer') {
    return yellow(dependency.name)
  }
  return dependency.name
}

export const printUpdates = (updates: PackageUpdate[]): void => {
  console.log(gray('Selected packages to update:'))
  const table = updates.map(({ dependency, newVersion }) => [
    formatDependencyName(dependency),
    gray(dependency.installedVersion ?? dependency.version),
    bold(gray('►')),
    bold(newVersion),
  ])

  const maxLengths = table.reduce(
    (acc, cell) => {
      cell.forEach((value, index) => {
        acc[index] = Math.max(acc[index], value.length)
      })
      return acc
    },
    [0, 0, 0, 0],
  )

  for (const row of table) {
    console.log('- ' + row.map((value, index) => value.padEnd(maxLengths[index], ' ')).join(' '))
  }
}
