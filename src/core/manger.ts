import { serializeKey } from '~/_internal/utils/serialize.js'

import type { SWRKey } from '../types.js'
import type { Fetcher } from './fetcher.js'

class RequestMangerStatic {
  private fetchers: { [key: string]: Fetcher } = {}

  getFetcher(key: SWRKey): Fetcher {
    const nextKey = serializeKey(key)
    const fetcher = this.fetchers[nextKey]
    return fetcher
  }

  addFetcher(key: SWRKey, fetcher: Fetcher) {
    const nextKey = serializeKey(key)
    this.fetchers[nextKey] = fetcher
  }
}

export const requestManger = new RequestMangerStatic()

export default requestManger
