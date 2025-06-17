import { bgBlack, red, blue, magenta, bold, italic } from 'yoctocolors-cjs'

export const width = process.stdout.columns || 80

export const fancy = (text: string, renderBold?: boolean): string => {
  const padding = width - text.length - 2 - 2
  const textToRender = renderBold ? bold(text) : text
  return `${bgBlack(red('⥏'))}${bgBlack(blue('  ' + textToRender + ''.padEnd(padding, ' ')))}${bgBlack(red('⥑'))}`
}

export const info = (text: string): string =>
  `${bgBlack(` ${italic(blue(text))}${''.padEnd(width - text.length - 1)}`)}`

export const error = (text: string): string => bgBlack(` ${magenta(bold('ERROR'))} ${text} `)
