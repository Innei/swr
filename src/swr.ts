import type { XWROptions } from './interface.js'
import type { FetcherFnParams, FetcherKey } from './manger.js'
import requestManger, { Fetcher } from './manger.js'
import { resolveOptions } from './resolve-options.js'

export function swr<Key extends FetcherKey, RR = any, Result = Promise<RR>>(
  key: Key,
  fetchFn: (options: FetcherFnParams<Key>) => RR | Promise<RR>,
  options?: XWROptions,
) {
  const existFetcher = requestManger.getFetcher(key)

  if (existFetcher) {
    return existFetcher.resolve() as Result
  }

  const nextOptions = resolveOptions(options)
  const fetcher = new Fetcher(key)
  // @ts-ignore
  fetcher.setFetchFn(fetchFn)
  fetcher.setOptions(nextOptions)

  requestManger.addFetcher(key, fetcher)

  return fetcher.resolve() as Result
}
