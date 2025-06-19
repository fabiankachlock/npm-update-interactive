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
    .option('-c, --config <path>', 'path to the package json file')
    .option('-p, --package-manager <name>', 'package manager to use')
    .enablePositionalOptions()

  program
    .command('interactive', { isDefault: true })
    .description('Start updating packages in interactive mode')
    .option('-b, --batch', 'enable batch mode', false)
    .configureHelp({ showGlobalOptions: true })
    .passThroughOptions()
    .action(async (_, command) => {
      console.log(fancy(`mod  interactive`))
      await runInteractive(command)
    })

  program
    .command('auto')
    .description('Automatically update packages without interaction')
    .configureHelp({ showGlobalOptions: true })
    .option('-y, --yes', 'skip confirmation prompts', false)
    .option('-f, --filter <filter>', 'filter packages to update')
    .option('--pre [pre]', 'install a the latest version of a prerelease, use "*" to install any prerelease')
    .option('-s, --save', 'dont install breaking changes')
    .passThroughOptions()
    .action(async (_, command) => {
      console.log(fancy(`mod  auto`))
      await runAuto(command)
    })

  await program.parseAsync(process.argv)
})()
