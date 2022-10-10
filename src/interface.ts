import { SWRKey } from './types.js'

type JSONString = string

export interface ICache {
  get(key: string): any
  set(key: string, value: JSONString): any
  has(key: string): boolean
  remove(key: string): any
  clear(): any
}

export interface SWROptions {
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

  // providers
  // compare: (a: any, b: any) => boolean
}

export type FetcherStatus = 'success' | 'error' | 'loading'

export interface ISubscriptionEmit {
  data: any
  lastUpdatedAt: number
  status: FetcherStatus
  error?: any
}
