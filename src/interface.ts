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
  maxAge: number

  retryInterval: number
  retryMaxCount: number
  loadingTimeout: number

  initialData: any

  // events
  onLoadingSlow: (key: SWRKey, config: SWROptions) => void
  onSuccess: (newData: any, key: SWRKey, data: any, config: SWROptions) => void
  onError: (key: SWRKey, error: any, config: SWROptions) => void
  onErrorRetry: (key: SWRKey, error: any, config: SWROptions) => void
  onRefresh: <T, PromisePlugin = {}>(
    promise: SWRWrapper<T> & PromisePlugin,
    result: T,
    key: SWRKey,
    config: SWROptions,
  ) => Promise<T>

  // providers
  // compare: (a: any, b: any) => boolean
  Promise: IPromise
}

type Disposer = () => void

export type SWRWrapper<T> = Promise<Awaited<T>> & {
  refresh: (force?: boolean) => Promise<T>
  subscribe: (callback: (value: T) => void) => Disposer
}

export type FetcherStatus = 'success' | 'error' | 'loading'

export interface ISubscriptionEmit {
  data: any
  lastUpdatedAt: number
  status: FetcherStatus
  error?: any
}
