import type { SWRKey } from './types.js'

type JSONString = string

export interface ICache {
  get(key: string): any
  set(key: string, value: JSONString): any
  has(key: string): boolean
  remove(key: string): any
  clear(): any
}

export type PromiseLike<T> = Promise<T>

export interface SWROptions<
  IPromise extends PromiseConstructor = PromiseConstructor,
> {
  // cache
  cache: ICache
  /**
   * response cache time (ms)
   */
  maxAge: number

  retryInterval: number
  retryMaxCount: number
  loadingTimeout: number

  /**
   * if request data not fetched, return this value
   */
  initialData: any

  // events
  onLoadingSlow: (key: SWRKey, config: SWROptions) => void
  onSuccess: (newData: any, key: SWRKey, data: any, config: SWROptions) => void
  onError: (key: SWRKey, error: any, config: SWROptions) => void
  onErrorRetry: (key: SWRKey, error: any, config: SWROptions) => void
  /**
   * this event will be triggered when after refresh, should return a new Promise
   */
  onRefresh:
    | (<T, PromisePlugin = {}>(
        promise: SWRWrapper<T> & PromisePlugin,
        result: T,
        key: SWRKey,
        config: SWROptions,
      ) => Promise<T>)
    | undefined

  // providers
  // compare: (a: any, b: any) => boolean
  /**
   * use a custom Promise
   */
  Promise: IPromise
}

export type Disposer = () => void

export type SWRWrapper<T> = Promise<Awaited<T>> & {
  /**
   * refresh data, pass `force` to ignore cached data, force re-fetch
   */
  refresh: (force?: boolean) => Promise<T>
  /**
   * subscribe data change
   */
  subscribe: (callback: (value: T) => void) => Disposer
}

export type FetcherStatus = 'success' | 'error' | 'loading'

export interface ISubscriptionEmit {
  data: any
  lastUpdatedAt: number
  status: FetcherStatus
  error?: any
}
