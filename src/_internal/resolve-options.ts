import { configureConfig } from '../configure.js'
import type { SWROptions } from '../interface.js'
import { defaultCache } from './cache.js'

export const defaultOptions: SWROptions = {
  cache: defaultCache,
  maxAge: 0,
  retryInterval: 1000,
  retryMaxCount: 3,

  initialData: null,
}

export const resolveOptions = (
  options?: Partial<SWROptions>,
): Required<SWROptions> => {
  return { ...defaultOptions, ...configureConfig, ...options }
}
