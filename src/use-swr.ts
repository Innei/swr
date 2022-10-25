import { useEffect, useRef, useState } from 'react'

import { resolveOptions } from './_internal/resolve-options.js'
import { subscription } from './_internal/subscription.js'
import { serializeKey } from './_internal/utils/serialize.js'
import { Fetcher } from './core/fetcher.js'
import requestManager from './core/manager.js'
import { useSafeSetState } from './hooks/use-safe-setState.js'
import type {
  FetcherStatus,
  ISubscriptionEmit,
  SWROptions,
} from './interface.js'
import type { FetcherFnParams, SWRKey } from './types.js'

// TODO:
// - if key changed
// - if options changed
// - if fetcher changed
//
// How to handle the above cases?

// TODO:
// - [ ] error handle
export function useSWR<Key extends SWRKey, RR = any>(
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
  const subscriptionDisposerRef = useRef<Function>()

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

    subscriptionDisposerRef.current = subscription.on(
      serializeKey(key),
      (event: ISubscriptionEmit) => {
        const { data, status, lastUpdatedAt } = event

        setSafeState((state) => ({
          ...state,
          data,
          status,
        }))

        lastUpdateAtRef.current = lastUpdatedAt
      },
    )
  }

  isInitialRef.current = true

  useEffect(() => {
    return () => {
      subscriptionDisposerRef.current?.()
    }
  }, [])

  const { data, status } = state
  return {
    data,
    isSuccess: status === 'success',
    isError: status === 'error',
    isLoading: status === 'loading',
    lastUpdateAt: lastUpdateAtRef.current,
  }
}
