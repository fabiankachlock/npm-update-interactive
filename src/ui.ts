import promps from 'prompts-ncu'
import { Dependency, PackageUpdate } from './types'

export const getPackageToUpdate = async (dependencies: Dependency[]): Promise<string[]> => {
  const { packages } = await promps({
    type: 'autocompleteMultiselect',
    name: 'packages',
    message: 'Select packages to update',
    choices: dependencies.map(dependency => ({
      title: `${dependency.name}@${dependency.version} (${dependency.installedVersion})`,
      value: dependency.name,
    })),
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
    hint: 'Select skip to skip updating this package.',
    message: `Select a new version for '${packageName}'`,
    choices: availableVersions
      .map(version => ({
        title: version,
        value: version,
      }))
      .concat({
        title: 'Skip',
        value: '##skip',
      }),
  })

  if (version === '##skip') {
    return undefined
  }
  return version
}

export const getNextStep = async (updates: PackageUpdate[]): Promise<'update' | 'select' | 'abort'> => {
  const { nextStep } = await promps({
    type: 'select',
    name: 'nextStep',
    message: 'What do you want to do next?',
    choices: [
      { title: 'Update packages', value: 'update' },
      { title: 'Select more packages', value: 'select' },
      { title: 'Abort', value: 'abort' },
    ],
  })
  return nextStep
}
