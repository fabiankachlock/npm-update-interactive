import { Command } from 'commander'
import { prepare } from '../prepare'
import { fancy } from '../logging'

export const runAuto = async (command: Command) => {
  const { packageJsonPath, packageManagerName } = await prepare(command)
  const { yes, filter, pre, save } = command.opts()
  const fancyOptions = [save ? 'non-breaking' : 'allow-breaking', pre ? `prerelease-${pre}` : 'latest-stable']
  console.log(fancy(`opt  ${fancyOptions.join(' | ')}`))
}
