export type Dependency = {
  name: string
  version: string
  installedVersion?: string
}

export type PackageUpdate = {
  dependency: Dependency
  newVersion: string
}

export type DependenciesResult = {
  dependencies: Dependency[]
  packageJsonPath: string
  packageManager: string
}
