import { defaultCache } from './cache.js'
import type { ICache } from './interface.js'

class SWRContextStatic {
  private _cache: ICache = defaultCache

  get cache() {
    return this._cache
  }

  set cache(cache: ICache) {
    this._cache = cache
  }
}

export const context = new SWRContextStatic()
