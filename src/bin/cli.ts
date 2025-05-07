import { getAvailableVersions } from '../npmjs'
import { getDependencies } from '../package'
import promps from 'prompts-ncu'
;(async () => {
  console.log('## npm-update-interactive ##')
  const { dependencies, packageJsonPath, packageManager } = getDependencies()!
  const updates = {} as Record<string, string>

  while (true) {
    const { value } = await promps({
      type: 'autocomplete',
      name: 'value',
      message: 'Select a package to update',
      choices: dependencies
        .map(dependency => ({
          title: `${dependency.name}@${dependency.version} (${dependency.installedVersion})`,
          value: dependency.name,
        }))
        .concat({
          title: 'Exit',
          value: 'exit',
        }),
    })

    if (value === 'exit') break

    if (!value) return
    const availableVersions = getAvailableVersions(value, packageManager)
    const { version } = await promps({
      type: 'autocomplete',
      name: 'version',
      message: `Select a version to update ${value}`,
      choices: availableVersions.map(version => ({
        title: version,
        value: version,
      })),
    })
    if (!version) return
    updates[value] = version
  }

  console.log('## Updates ##')
  console.log(updates)
})()
