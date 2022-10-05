import type { Fetcher } from './fetcher.js'
import type { FetcherKey } from './types.js'
import { resolveKey } from './utils.js'

class RequestMangerStatic {
  private fetchers: { [key: string]: Fetcher } = {}

  getFetcher(key: FetcherKey): Fetcher {
    const nextKey = resolveKey(key)
    const fetcher = this.fetchers[nextKey]
    return fetcher
  }

  addFetcher(key: FetcherKey, fetcher: Fetcher) {
    const nextKey = resolveKey(key)
    this.fetchers[nextKey] = fetcher
  }
}

export const requestManger = new RequestMangerStatic()

export default requestManger
