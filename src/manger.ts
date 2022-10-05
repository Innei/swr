import type { XWROptions } from './interface.js'
import { defaultOptions } from './resolve-options.js'
import { sleep } from './utils.js'

export type FetcherKey = string | number
export class Fetcher {
  private fetchFn: FetchFn<FetcherKey, any> = () => void 0
  private options = defaultOptions
  private isFetching = false

  private polling: Promise<any> = Promise.resolve()
  constructor(private readonly key: FetcherKey) {}

  setFetchFn<T = any>(fetchFn: FetchFn<FetcherKey, T>) {
    this.fetchFn = fetchFn
  }

  setOptions = (options: Required<XWROptions>) => {
    this.options = options
  }

  async resolve() {
    if (this.isFetching) {
      console.log('fetching')

      return this.polling
    }
    if (!this.fetchFn) {
      throw new Error('fetchFn is not set')
    }

    this.polling = Promise.resolve()
    const fetchingPolling = async () => {
      const { retryInterval, retryMaxCount } = this.options
      let currentRetryCount = 0

      const asyncFunction = () =>
        Promise.resolve().then(() => this.fetchFn(this.key as any))

      this.isFetching = true
      while (currentRetryCount++ < retryMaxCount) {
        try {
          return await asyncFunction().then((result) => {
            this.isFetching = false
            return result
          })
        } catch (error) {
          if (currentRetryCount === retryMaxCount) {
            this.isFetching = false
            throw error
          }
          console.log(`retrying... ${currentRetryCount}`)

          await sleep(retryInterval)
        }
      }
    }

    this.polling = fetchingPolling()

    return this.polling
  }
}

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

const resolveKey = (key: FetcherKey): string => {
  if (typeof key === 'string') {
    return key
  }
  // FIXME
  return key.toString()
}
export type FetcherFnParams<Key extends FetcherKey = FetcherKey> = {
  key: Key
}
export type FetchFn<Key extends FetcherKey, T = unknown> = (
  options: FetcherFnParams<Key>,
) => Promise<T> | T

export const requestManger = new RequestMangerStatic()

export default requestManger
