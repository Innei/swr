type JSONString = string
export interface ICache {
  get(key: string): any
  set(key: string, value: JSONString): any
  has(key: string): boolean
  remove(key: string): any
  clear(): any
}

export interface XWROptions {
  // cache
  cache: ICache
  maxAge: number

  retryInterval: number
  retryMaxCount: number
}
