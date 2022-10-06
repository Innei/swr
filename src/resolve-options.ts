import { defaultCache } from './cache.js'
import { context } from './context.js'
import type { XWROptions } from './interface.js'

export const defaultOptions: XWROptions = {
  cache: defaultCache,
  maxAge: 0,
  retryInterval: 1000,
  retryMaxCount: 3,
}

export const resolveOptions = (
  options?: Partial<XWROptions>,
): Required<XWROptions> => {
  const { cache } = context
  return { ...defaultOptions, cache, ...options }
}
