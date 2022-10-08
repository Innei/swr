import type { SWROptions } from './interface.js'

export const configureConfig: Partial<SWROptions> = {}

export function configure(options: Partial<SWROptions>) {
  Object.assign(configureConfig, options)
}
