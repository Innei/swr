import { defaultCache } from './cache.js'
import type { XWROptions } from './interface.js'

export const defaultOptions: XWROptions = {
  cache: defaultCache,
  maxAge: 0,
  retryInterval: 1000,
  retryMaxCount: 3,
}

export const resolveOptions = (options?: Partial<XWROptions>) => {
  return { ...defaultOptions, ...options }
}
