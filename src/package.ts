import fs from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { Dependency, PackageUpdate } from './types'
import semver from 'semver'
import { get } from 'node:http'

export const findProjectPackageJson = (givenPath?: string): string | undefined => {
  let currentPath = givenPath ?? path.join(process.cwd(), 'package.json')
  while (currentPath) {
    if (fs.existsSync(currentPath)) {
      return currentPath
    }
    const newPath = path.normalize(path.join(path.dirname(currentPath), '..'))
    if (newPath === currentPath) {
      // reached the root directory
      return undefined
    }
    currentPath = newPath
  }
}

export const findDependencyPackageJson = (packageJsonPath: string, dependencyName: string): string | undefined => {
  const projectRoot = path.join(path.dirname(packageJsonPath), 'node_modules')
  const localPath = path.join(process.cwd(), 'node_modules')
  const requirePath = require.resolve.paths(dependencyName) ?? []
  const allPaths = [...requirePath, projectRoot, localPath]

  for (const basePath of allPaths) {
    const packageJsonPath = path.join(basePath, dependencyName, 'package.json')
    if (fs.existsSync(packageJsonPath)) {
      return packageJsonPath
    }
  }
  return undefined
}

export const findePackageManager = async (packageJsonPath: string): Promise<string> => {
  try {
    const packageJson = await readFile(packageJsonPath, 'utf-8')
    const { packageManager } = JSON.parse(packageJson)
    if (packageManager) {
      const [name] = packageManager.split('@')
      return name
    }
    const projectRoot = path.dirname(packageJsonPath)
    if (fs.existsSync(path.join(projectRoot, 'pnpm-lock.yaml'))) {
      return 'pnpm'
    } else if (fs.existsSync(path.join(projectRoot, 'yarn.lock'))) {
      return 'yarn'
    } else if (fs.existsSync(path.join(projectRoot, 'package-lock.json'))) {
      return 'npm'
    }
  } catch {}
  return 'npm'
}

const getVersionPrefix = (version: string): string => {
  let prefix = ''
  for (const char of version) {
    if (/[0-9]/.test(char)) {
      break
    }
    prefix += char
  }
  return prefix
}

export const getDependencies = async (packageJsonPath: string): Promise<Dependency[]> => {
  const packageJson = await readFile(packageJsonPath, 'utf-8')

  const { dependencies = {}, devDependencies = {}, peerDependencies = {} } = JSON.parse(packageJson)

  const dependenciesAndVersions = Object.entries(dependencies)
    .concat(Object.entries(devDependencies))
    .concat(Object.entries(peerDependencies))
    .map(([name, version]) => {
      const prefix = getVersionPrefix(version as string)
      const dependencyInfo: Dependency = {
        name,
        type: dependencies[name] ? 'normal' : devDependencies[name] ? 'dev' : 'peer',
        version: semver.clean((version as string).substring(prefix.length), { loose: true })!,
        prefix,
      }

      try {
        const dependencyPackageJsonPath = findDependencyPackageJson(packageJsonPath, name)
        if (!dependencyPackageJsonPath) return dependencyInfo

        return new Promise<Dependency>(async resolve => {
          const dependencyPackage = await readFile(dependencyPackageJsonPath, 'utf-8')
          resolve({
            ...dependencyInfo,
            installedVersion: semver.clean(JSON.parse(dependencyPackage ?? '').version)!,
          })
        })
      } catch {
        return dependencyInfo
      }
    })

  return Promise.all(dependenciesAndVersions.filter(Boolean) as Promise<Dependency>[])
}

export const writeUpdates = async (packageJsonPath: string, updates: PackageUpdate[]) => {
  let packageJson = await readFile(packageJsonPath, 'utf-8')

  for (const { dependency, newVersion } of updates) {
    const regex = new RegExp(`"${dependency.name}":\\s*".*"`, 'g')
    let versionToWrite = newVersion
    if (dependency.prefix) {
      versionToWrite = dependency.prefix + newVersion
    }
    const updatedDependency = `"${dependency.name}": "${versionToWrite}"`
    packageJson = packageJson.replace(regex, updatedDependency)
  }

  await writeFile(packageJsonPath, packageJson, 'utf-8')
}
