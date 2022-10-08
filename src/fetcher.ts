import type { SWROptions } from './interface.js'
import { defaultOptions } from './resolve-options.js'
import { subscription } from './subscription.js'
import type { FetchFn, FetcherKey } from './types.js'
import { cloneDeep, resolveKey, sleep } from './utils.js'

const CACHE_EXPIRED_KEY = '__cache_expired__'

interface FetcherState {
  data: any | null
  error: any | null
  isValidating: boolean
  lastUpdatedAt: number
}

const defaultFetcherState: FetcherState = {
  data: null,
  error: null,
  isValidating: false,
  lastUpdatedAt: 0,
}

export class Fetcher {
  private fetchFn: FetchFn<FetcherKey, any> = () => void 0
  private options = defaultOptions
  private isFetching = false

  private polling: Promise<any> = Promise.resolve()

  private state: FetcherState = defaultFetcherState

  constructor(private readonly key: FetcherKey) {}

  setFetchFn<T = any>(fetchFn: FetchFn<FetcherKey, T>) {
    this.fetchFn = fetchFn
  }

  setOptions = (options: Required<SWROptions>) => {
    this.options = options
  }

  resolve(
    options?: Partial<{
      force: boolean
    }>,
  ) {
    const { force = false } = options || {}
    if (this.isFetching && !force) {
      return this.polling
    }
    if (!this.fetchFn) {
      throw new Error('fetchFn is not set')
    }

    // because await will interrupt micro-task so we should set flag first.
    this.isFetching = true

    const memoizedKeys = Array.isArray(this.key) ? [...this.key] : this.key

    const memoizedFetchFn = this.fetchFn.bind(this, {
      key: memoizedKeys,
    })
    const fetchingPooling = async () => {
      // this `await` will interrupt microtask so we should set flag after it.
      const hasCache = await this.getCache()
      if (hasCache && !force) {
        this.isFetching = false
        console.log('cache')

        this.emitResponse('success', hasCache)
        return hasCache
      }

      // FIXME
      this.emitResponse('loading', this.state.data)

      const { retryInterval, retryMaxCount } = this.options
      let currentRetryCount = 0

      const asyncFunction = () =>
        Promise.resolve().then(() => memoizedFetchFn())

      while (currentRetryCount++ < retryMaxCount) {
        try {
          return await asyncFunction().then(this.handleResponse)
        } catch (error) {
          if (currentRetryCount === retryMaxCount) {
            this.isFetching = false
            this.emitResponse('error', null, error)
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

  private emitResponse(
    status: 'success' | 'error' | 'loading',
    data: any,
    error?: any,
  ) {
    subscription.emit(resolveKey(this.key), {
      data,
      status,
      error,
    })
  }

  private handleResponse = async (response: any) => {
    await this.doCache(response)

    const clonedResponse = cloneDeep(response)
    this.emitResponse('success', clonedResponse)
    this.isFetching = false
    this.state.data = clonedResponse
    this.state.lastUpdatedAt = +Date.now()

    return clonedResponse
  }

  private doCache = async (response: any) => {
    const { cache, maxAge } = this.options

    return cache.set(
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
