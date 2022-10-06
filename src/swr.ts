import { Fetcher } from './fetcher.js'
import type { XWROptions } from './interface.js'
import requestManger from './manger.js'
import { resolveOptions } from './resolve-options.js'
import type { FetcherFnParams, FetcherKey } from './types.js'

type Wrapper<T> = T & {
  refresh: (force?: boolean) => Promise<T>
}
// TODO
export function swr<
  Key extends FetcherKey,
  RR = any,
  Result = Promise<RR>,
  ReuseablePromise = Wrapper<Result>,
>(
  key: Key,
  fetchFn: (options: FetcherFnParams<Key>) => RR | Promise<RR>,
  options?: Partial<XWROptions>,
): ReuseablePromise {
  const promise: Result = (() => {
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
  })()

  Object.assign(promise as any, {
    refresh(force?: boolean) {
      const fetcher = requestManger.getFetcher(key)
      if (fetcher) {
        return fetcher.resolve({
          force,
        }) as Result
      }

      return promise
    },
  })
  return promise as any as ReuseablePromise
}
