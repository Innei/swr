import type { XWROptions } from './interface.js'
import { defaultOptions } from './resolve-options.js'
import type { FetchFn, FetcherKey } from './types.js'
import { resolveKey, sleep } from './utils.js'

const CACHE_EXPIRED_KEY = '__cache_expired__'

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

  resolve(nextFetchFn?: FetchFn<FetcherKey, any>) {
    if (this.isFetching) {
      return this.polling
    }
    if (!this.fetchFn) {
      throw new Error('fetchFn is not set')
    }

    // because await will interrupt micro-task so we should set flag first.
    this.isFetching = true
    const memoizedFetchFn = nextFetchFn ?? this.fetchFn.bind(null)
    const fetchingPooling = async () => {
      // this `await` will interrupt microtask so we should set flag after it.
      const hasCache = await this.getCache()
      if (hasCache) {
        this.isFetching = false
        console.log('cache')

        // Promise.race([this.polling, sleep(0)])
        return hasCache
      }

      const { retryInterval, retryMaxCount } = this.options
      let currentRetryCount = 0

      const asyncFunction = () =>
        Promise.resolve().then(() => memoizedFetchFn(this.key as any))

      while (currentRetryCount++ < retryMaxCount) {
        try {
          return await asyncFunction().then(this.handleResponse)
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

    console.log('start fetch')

    this.polling = fetchingPooling()

    return this.polling
  }

  private handleResponse = async (response: any) => {
    await this.doCache(response)

    this.isFetching = false
    return response
  }

  private doCache = async (response: any) => {
    const { cache, maxAge } = this.options

    cache.set(
      resolveKey(this.key),
      JSON.stringify({
        data: response,
        [CACHE_EXPIRED_KEY]: Date.now() + maxAge,
      }),
    )
  }

  private getCache = async () => {
    const { cache } = this.options
    const cacheStr = await cache.get(resolveKey(this.key))
    if (!cacheStr) {
      return null
    }
    const cacheObj = JSON.parse(cacheStr)

    if (Date.now() > cacheObj[CACHE_EXPIRED_KEY]) {
      return null
    }

    // make sure is object
    if (typeof cacheObj.data === 'object' && cacheObj.data) {
      define(cacheObj.data, '$$cache', {
        expired: cacheObj[CACHE_EXPIRED_KEY],
        isCache: true,
      })
    }

    return cacheObj.data
  }
}

function define(target: object, propertyKey: PropertyKey, propertyValue: any) {
  return Reflect.defineProperty(target, propertyKey, {
    value: propertyValue,
    enumerable: false,
    configurable: false,
  })
}
