import fs from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { Dependency } from './types'

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

export const getDependencies = async (packageJsonPath: string): Promise<Dependency[]> => {
  const packageJson = await readFile(packageJsonPath, 'utf-8')

  const { dependencies = {}, devDependencies = {} } = JSON.parse(packageJson)
  const dependenciesAndVersions = Object.entries(dependencies)
    .concat(Object.entries(devDependencies))
    .map(([name, version]) => {
      try {
        const dependencyPackageJsonPath = findDependencyPackageJson(packageJsonPath, name)
        if (!dependencyPackageJsonPath) return undefined

        return new Promise<Dependency>(async (resolve, reject) => {
          const dependencyPackage = await readFile(dependencyPackageJsonPath, 'utf-8')
          resolve({
            name,
            version: version as string,
            installedVersion: JSON.parse(dependencyPackage ?? '').version,
          })
        })
      } catch {
        return {
          name,
          version: version as string,
        } as Dependency
      }
    })

  return Promise.all(dependenciesAndVersions.filter(Boolean) as Promise<Dependency>[])
}
