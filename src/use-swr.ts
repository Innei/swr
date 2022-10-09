import { useRef, useState } from 'react'

import { Fetcher } from './fetcher.js'
import { useSafeSetState } from './hooks/use-safe-setState.js'
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
export function useSWR<Key extends FetcherKey, RR = any>(
  key: Key,
  fetchFn: (options: FetcherFnParams<Key>) => RR | Promise<RR>,
  options?: Partial<SWROptions>,
) {
  const nextOptions = resolveOptions(options)

  const [state, setState] = useState({
    data: nextOptions.initialData ?? (null as RR | null),
    error: null as any,
    status: 'loading' as FetcherStatus,
  })

  const setSafeState = useSafeSetState(setState)

  const promiseRef = useRef<Promise<any>>()
  const fetcherRef = useRef<Fetcher>()
  const lastUpdateAtRef = useRef(0)
  const isInitialRef = useRef(false)

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
      setSafeState((state) => ({
        ...state,
        data: re,
      }))
    })

    subscription.on(resolveKey(key), (event: ISubscriptionEmit) => {
      const { data, status, lastUpdatedAt } = event

      setSafeState((state) => ({
        ...state,
        data,
        status,
      }))

      lastUpdateAtRef.current = lastUpdatedAt
    })
  }

  isInitialRef.current = true

  const { data, status } = state
  return {
    data,
    isSuccess: status === 'success',
    isError: status === 'error',
    isLoading: status === 'loading',
    lastUpdateAt: lastUpdateAtRef.current,
  }
}
