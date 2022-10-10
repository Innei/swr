import { resolveOptions } from './_internal/resolve-options.js'
import { subscription } from './_internal/subscription.js'
import { isDefined } from './_internal/utils/helper.js'
import { serializeKey } from './_internal/utils/serialize.js'
import { Fetcher } from './core/fetcher.js'
import requestManger from './core/manger.js'
import type { SWROptions } from './interface.js'
import type { FetcherFnParams, SWRKey } from './types.js'

type Disposer = () => void

export type SWRWrapper<T> = T & {
  refresh: (force?: boolean) => Promise<T>
  subscribe: (callback: (value: T) => void) => Disposer
}
// TODO
export function swr<
  Key extends SWRKey,
  RR = any,
  Result = Promise<RR>,
  ReuseablePromise = SWRWrapper<Result>,
>(
  key: Key,
  fetchFn: (options: FetcherFnParams<Key>) => RR | Promise<RR>,
  options?: Partial<SWROptions>,
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

    const { initialData } = nextOptions

    return isDefined(initialData)
      ? (Promise.resolve(initialData).then((res) => {
          fetcher.resolve({ force: true })
          return res
        }) as Result)
      : (fetcher.resolve() as Result)
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
    subscribe(fn: (value: any) => void) {
      return subscription.on(serializeKey(key), (res) => {
        fn(res)
      })
    },
  })
  return promise as any as ReuseablePromise
}
