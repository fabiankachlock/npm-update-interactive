export type Dependency = {
  name: string
  type: 'normal' | 'dev' | 'peer'
  version: string
  installedVersion?: string
}

export type PackageUpdate = {
  dependency: Dependency
  newVersion: string
}
