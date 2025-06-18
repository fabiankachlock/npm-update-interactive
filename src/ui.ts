import promps from 'prompts'
import { Dependency, PackageUpdate } from './types'
import { green, blue, cyan, yellow, gray, bold, red } from 'yoctocolors-cjs'
import { GenericFormatter, SingleBar } from 'cli-progress'
import semver from 'semver'

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
        title: `${formatDependencyName(dependency, '█')} ${dependency.name}@${dependency.version} ${currentVersion}`,
        value: dependency.name,
      }
    }),
  })
  return packages
}

export const getNewPackageVersion = async (
  packageName: string,
  availableVersions: string[],
  currentVersion?: string,
): Promise<string | undefined> => {
  const { version } = await promps({
    type: 'autocomplete',
    name: 'version',
    instructions: false,
    initial: currentVersion ?? availableVersions[0],
    hint: 'Select skip to skip updating this package.',
    message: `Select a new version for '${packageName}'`,
    choices: availableVersions
      .map(version => ({
        title:
          version === currentVersion
            ? bold(green(version))
            : version === availableVersions[0]
              ? bold(version)
              : version,
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

export const confirm = async (message: string): Promise<boolean> => {
  const { confirm } = await promps({
    type: 'confirm',
    name: 'confirm',
    message,
    initial: false,
  })
  return confirm
}

export const formatDependencyName = (dependency: Dependency, text?: string): string => {
  const textToFormat = text || dependency.name
  if (dependency.type === 'normal') {
    return green(textToFormat)
  } else if (dependency.type === 'dev') {
    return blue(textToFormat)
  } else if (dependency.type === 'peer') {
    return yellow(textToFormat)
  }
  return textToFormat
}

const formatVersionBump = (dependency: Dependency, newVersion: string): string => {
  const diff = semver.diff(dependency.installedVersion ?? dependency.version, newVersion)
  if (!diff) {
    return gray(newVersion)
  }
  if (diff.includes('major')) {
    return bold(red(newVersion))
  } else if (diff.includes('minor')) {
    return bold(yellow(newVersion))
  }
  return bold(newVersion)
}

export const printUpdates = (updates: PackageUpdate[]): void => {
  console.log(gray('Selected packages to update:'))
  const table = updates.map(({ dependency, newVersion }) => [
    formatDependencyName(dependency),
    gray(dependency.installedVersion ?? dependency.version),
    bold(gray('►')),
    formatVersionBump(dependency, newVersion),
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

export const createProgressBar = (message: string) => {
  return new SingleBar({
    format: createBarFormatter(message),
    hideCursor: true,
    barCompleteChar: '#',
    barIncompleteChar: '-',
    fps: 1,
    clearOnComplete: true,
  })
}

export type ComplexProgress = {
  done: number
  inProgress: number
}

const createBarFormatter =
  (message: string): GenericFormatter =>
  (options, params, payload?: ComplexProgress) => {
    const width = options.barsize ?? 60
    const doneWidth = Math.round(width * ((payload?.done ?? 0) / params.total))
    const inProgressWidth = Math.round(width * ((payload?.inProgress ?? 0) / params.total))
    const incompleteWidth = width - doneWidth - inProgressWidth

    const doneBar = (options.barCompleteChar ?? '#').repeat(doneWidth)
    const inProgressBar = (options.barCompleteChar ?? '#').repeat(inProgressWidth)
    const incompleteBar = (options.barIncompleteChar ?? '-').repeat(incompleteWidth)

    const progress = `${cyan(params.value.toString())}/${params.total}`

    return `${message} [${cyan(doneBar)}${gray(inProgressBar)}${gray(incompleteBar)}] ${progress}`
  }
