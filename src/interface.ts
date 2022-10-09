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

  initialData: any
}

export type FetcherStatus = 'success' | 'error' | 'loading'

export interface ISubscriptionEmit {
  data: any
  lastUpdatedAt: number
  status: FetcherStatus
  error?: any
}
