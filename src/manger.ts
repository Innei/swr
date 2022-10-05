import type { XWROptions } from './interface.js'

export type FetcherKey = string | number
class Fetcher {
  private fetchFn: FetchFn<FetcherKey, any> = () => void 0

  constructor(private readonly key: FetcherKey) {}

  setFetchFn<T = any>(fetchFn: FetchFn<FetcherKey, T>) {
    this.fetchFn = fetchFn
  }

  async resolve() {
    if (!this.fetchFn) {
      throw new Error('fetchFn is not set')
    }
    try {
      const task = this.fetchFn(this.key as any)

      const isPromiseTask = task instanceof Promise
      if (isPromiseTask) {
        task.catch()
      }
    } catch (e) {}

    return this
  }
}

class RequestMangerStatic {
  private fetchers: { [key: string]: Fetcher } = {}

  getFetcher(key: FetcherKey): Fetcher {
    const nextKey = resolveKey(key)
    const fetcher = this.fetchers[nextKey]
    return fetcher
  }

  addFetcher(key: FetcherKey, fetcher: Fetcher) {}
}

const resolveKey = (key: FetcherKey): string => {
  if (typeof key === 'string') {
    return key
  }
  // FIXME
  return key.toString()
}
type FetchFn<Key extends FetcherKey, T = unknown> = (options: {
  key: Key
}) => Promise<T> | T

export function swr<Key extends FetcherKey>(
  key: Key,
  fetchFn: FetchFn<Key>,
  options?: XWROptions,
) {
  const existFetcher = requestManger.getFetcher(key)
  if (existFetcher) {
    return existFetcher
  }

  const fetcher = new Fetcher(key)
  // @ts-ignore
  fetcher.setFetchFn(fetchFn)
  requestManger.addFetcher(key, fetcher)
}

export const requestManger = new RequestMangerStatic()

export default requestManger
