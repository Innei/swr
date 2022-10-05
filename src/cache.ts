import type { ICache } from './interface.js'

class InMemoryCache implements ICache {
  private cache: { [key: string]: string } = {}

  get(key: string): any {
    return this.cache[key]
  }

  set(key: string, value: string): any {
    this.cache[key] = value
  }

  has(key: string): boolean {
    return !!this.cache[key]
  }

  remove(key: string): any {
    delete this.cache[key]
  }

  clear(): any {
    this.cache = {}
  }
}

export const defaultCache = new InMemoryCache()
