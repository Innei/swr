import { configureConfig } from '../configure.js'
import type { SWROptions } from '../interface.js'
import { defaultCache } from './cache.js'

const noop = () => void 0

export const defaultOptions: SWROptions = {
  cache: defaultCache,
  maxAge: 0,
  retryInterval: 1000,
  retryMaxCount: 3,
  loadingTimeout: 5000,

  onLoadingSlow: noop,
  onSuccess: noop,
  onError: noop,
  onErrorRetry: noop,
  onRefresh: undefined,

  initialData: null,

  // compare: (a, b) => stableHash(a) === stableHash(b),
  Promise,
}

export const resolveOptions = (
  options?: Partial<SWROptions>,
): Required<SWROptions> => {
  return { ...defaultOptions, ...configureConfig, ...options }
}
