#!/usr/bin/env node
import { program } from 'commander'
import { fancy } from '../logging'
import pkg from '../../package.json'
import { runInteractive } from '../commands/interactive'
import { runAuto } from '../commands/auto'
;(async () => {
  console.log(fancy('nui  npm-update-interactive', true))
  console.log(fancy(`ver  ${pkg.version}`))

  program
    .name('npm-update-interactive')
    .description('Update npm packages interactively')
    .version(pkg.version)
    .option('-c, --config <path>', 'Path to the package json file', undefined)
    .option('-p, --package-manager <name>', 'Package manager to use', undefined)

  program
    .command('interactive', { isDefault: true })
    .description('Start updating packages in interactive mode')
    .action(async (_, command) => {
      console.log(fancy(`mod  interactive`))
      await runInteractive(command)
    })

  program
    .command('auto')
    .description('Automatically update packages without interaction')
    .option('-y, --yes', 'Skip confirmation prompts', false)
    .option('-f, --filter <filter>', 'Filter packages to update', undefined)
    .option('--pre <pre>', 'Install a the latest version of a prerelease', undefined)
    .option('-s, --save', 'Dont install breaking changes', false)
    .action(async (_, command) => {
      console.log(fancy(`mod  auto`))
      await runAuto(command)
    })

  await program.parseAsync(process.argv)
})()
