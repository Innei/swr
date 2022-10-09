import { useRef, useState } from 'react'

import { Fetcher } from './fetcher.js'
import type {
  FetcherStatus,
  ISubscriptionEmit,
  SWROptions,
} from './interface.js'
import requestManager from './manger.js'
import { resolveOptions } from './resolve-options.js'
import { subscription } from './subscription.js'
import type { FetcherFnParams, FetcherKey } from './types.js'
import { resolveKey } from './utils.js'

// TODO:
// - if key changed
// - if options changed
// - if fetcher changed
//
// How to handle the above cases?

// TODO:
// - [ ] error handle
export function useSWR<Key extends FetcherKey, RR = any, Result = Promise<RR>>(
  key: Key,
  fetchFn: (options: FetcherFnParams<Key>) => RR | Promise<RR>,
  options?: Partial<SWROptions>,
) {
  const nextOptions = resolveOptions(options)
  const [data, setData] = useState(nextOptions.initialData ?? null)
  const [status, setStatus] = useState<FetcherStatus>('loading')
  const promiseRef = useRef<Promise<any>>()

  const isInitialRef = useRef(false)
  const fetcherRef = useRef<Fetcher>()

  const lastUpdateAtRef = useRef(0)

  if (!promiseRef.current && !isInitialRef.current) {
    let fetcher = requestManager.getFetcher(key)

    if (fetcher) {
      fetcher.setOptions(nextOptions)
      fetcher.setFetchFn(fetchFn as any)
      promiseRef.current = fetcher.resolve()
    } else {
      const newFetcher = new Fetcher(key)

      // @ts-ignore
      newFetcher.setFetchFn(fetchFn)
      newFetcher.setOptions(nextOptions)

      requestManager.addFetcher(key, newFetcher)
      fetcher = newFetcher
      promiseRef.current = fetcher.resolve()
    }
    fetcherRef.current = fetcher
  }

  if (!isInitialRef.current) {
    promiseRef.current?.then((re) => {
      setData(re)
    })

    subscription.on(resolveKey(key), (event: ISubscriptionEmit) => {
      const { data, status, lastUpdatedAt } = event

      setData(data)
      setStatus(status)
      lastUpdateAtRef.current = lastUpdatedAt
    })
  }

  isInitialRef.current = true

  return {
    data,
    isSuccess: status === 'success',
    isError: status === 'error',
    isLoading: status === 'loading',
    lastUpdateAt: lastUpdateAtRef.current,
  }
}
