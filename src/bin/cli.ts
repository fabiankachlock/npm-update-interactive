#!/usr/bin/env node
import { program } from 'commander'
import { fancy, info } from '../logging'
import pkg from '../../package.json'
import { runInteractive } from '../commands/interactive'
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
    .action((_, command) => {
      console.log(fancy(`mod  interactive`))
      runInteractive(command)
    })

  program
    .command('auto')
    .description('Automatically update packages without interaction')
    .action(() => {
      console.log(info('Starting automatic update mode...'))
    })

  program.parse(process.argv)
})()
