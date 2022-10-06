import { Fetcher } from './fetcher.js'
import type { XWROptions } from './interface.js'
import requestManger from './manger.js'
import { resolveOptions } from './resolve-options.js'
import type { FetcherFnParams, FetcherKey } from './types.js'

// TODO
export function swr<Key extends FetcherKey, RR = any, Result = Promise<RR>>(
  key: Key,
  fetchFn: (options: FetcherFnParams<Key>) => RR | Promise<RR>,
  options?: Partial<XWROptions>,
) {
  const existFetcher = requestManger.getFetcher(key)

  if (existFetcher) {
    const nextOptions = resolveOptions(options)

    existFetcher.setOptions(nextOptions)
    existFetcher.setFetchFn(fetchFn as any)
    return existFetcher.resolve() as Result
  }

  const fetcher = new Fetcher(key)
  const nextOptions = resolveOptions(options)
  // @ts-ignore
  fetcher.setFetchFn(fetchFn)
  fetcher.setOptions(nextOptions)

  requestManger.addFetcher(key, fetcher)

  return fetcher.resolve() as Result
}
