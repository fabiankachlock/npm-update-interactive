import { readFileSync, existsSync } from 'node:fs'
import { join, normalize, dirname } from 'node:path'

export type Dependency = {
  name: string
  version: string
  installedVersion?: string
}

export type DependenciesResult = {
  dependencies: Dependency[]
  packageJsonPath: string
  packageManager: string
}

const findProjectPackageJson = (path?: string): string | undefined => {
  let currentPath = path ?? join(process.cwd(), 'package.json')
  while (currentPath) {
    if (existsSync(currentPath)) {
      return currentPath
    }
    const newPath = normalize(join(dirname(currentPath), '..'))
    if (newPath === path) {
      // reached the root directory
      return undefined
    }
    path = newPath
  }
}

const findDependencyPackageJson = (packageJsonPath: string, dependencyName: string): string | undefined => {
  const projectRoot = join(dirname(packageJsonPath), 'node_modules')
  const requirePath = require.resolve.paths(dependencyName) ?? []
  const allPaths = [...requirePath, projectRoot]

  for (const basePath of allPaths) {
    const packageJsonPath = join(basePath, dependencyName, 'package.json')
    if (existsSync(packageJsonPath)) {
      return packageJsonPath
    }
  }
  return undefined
}

const findePackageManager = (packageJsonPath: string): string => {
  try {
    const packageJson = readFileSync(packageJsonPath, 'utf-8')
    const { packageManager } = JSON.parse(packageJson)
    if (packageManager) {
      const [name] = packageManager.split('@')
      return name
    }
    const projectRoot = dirname(packageJsonPath)
    if (existsSync(join(projectRoot, 'pnpm-lock.yaml'))) {
      return 'pnpm'
    } else if (existsSync(join(projectRoot, 'yarn.lock'))) {
      return 'yarn'
    } else if (existsSync(join(projectRoot, 'package-lock.json'))) {
      return 'npm'
    }
  } catch {}
  return 'npm'
}

export const getDependencies = (path?: string): DependenciesResult | undefined => {
  const packageJsonPath = findProjectPackageJson(path)
  if (!packageJsonPath) {
    return undefined
  }
  const packageJson = readFileSync(packageJsonPath, 'utf-8')

  const { dependencies = {}, devDependencies = {} } = JSON.parse(packageJson)
  const dependenciesAndVersions = Object.entries(dependencies)
    .concat(Object.entries(devDependencies))
    .map(([name, version]) => {
      try {
        const dependencyPackageJsonPath = findDependencyPackageJson(packageJsonPath, name)
        const dependencyPackageJson = dependencyPackageJsonPath && readFileSync(dependencyPackageJsonPath, 'utf-8')
        return {
          name,
          version: version as string,
          installedVersion: JSON.parse(dependencyPackageJson ?? '').version,
        }
      } catch {
        return {
          name,
          version: version as string,
        }
      }
    })

  return {
    dependencies: dependenciesAndVersions,
    packageJsonPath,
    packageManager: findePackageManager(packageJsonPath),
  }
}
