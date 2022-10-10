import { SWRError } from '~/_internal/utils/error.js'
import { cloneDeep, sleep } from '~/_internal/utils/helper.js'
import { serializeKey } from '~/_internal/utils/serialize.js'

import { Logger } from '../_internal/logger.js'
import { defaultOptions } from '../_internal/resolve-options.js'
import { subscription } from '../_internal/subscription.js'
import type {
  FetcherStatus,
  ISubscriptionEmit,
  SWROptions,
} from '../interface.js'
import type { FetchFn, SWRKey } from '../types.js'

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
  private fetchFn: FetchFn<SWRKey, any> = () => void 0
  private options = defaultOptions
  private isFetching = false

  private polling: Promise<any> = Promise.resolve()

  private state: FetcherState = defaultFetcherState

  constructor(private readonly key: SWRKey) {}

  setFetchFn<T = any>(fetchFn: FetchFn<SWRKey, T>) {
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
      Logger.warn(
        'previous request still in fetching, this fetching will skip..',
      )
      return this.polling
    }
    if (!this.fetchFn) {
      throw new SWRError('missing fetch function')
    }

    this.isFetching = true

    const memoizedKeys = Array.isArray(this.key) ? [...this.key] : this.key

    const memoizedFetchFn = this.fetchFn.bind(this, {
      key: memoizedKeys,
    })
    const fetchingPooling = async () => {
      const hasCache = await this.getCache()
      if (hasCache && !force) {
        this.isFetching = false
        Logger.debug('cache hit, this request will fetch from cache.')

        this.emitResponse('success', hasCache)
        return hasCache
      }

      // FIXME

      const { retryInterval, retryMaxCount, initialData } = this.options
      this.emitResponse('loading', this.state.data ?? initialData)

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
          Logger.warn(`retrying... ${currentRetryCount}`)

          await sleep(retryInterval)
        }
      }
    }

    Logger.debug('start fetch')

    this.polling = fetchingPooling()

    return this.polling
  }

  private emitResponse(status: FetcherStatus, data: any, error?: any) {
    subscription.emit(serializeKey(this.key), {
      data,
      status,
      error,
      lastUpdatedAt: this.state.lastUpdatedAt,
    } as ISubscriptionEmit)
  }

  private handleResponse = async (response: any) => {
    await this.doCache(response)

    const clonedResponse = cloneDeep(response)
    this.isFetching = false
    this.state.data = clonedResponse
    this.state.lastUpdatedAt = +Date.now()

    this.emitResponse('success', clonedResponse)
    return clonedResponse
  }

  private doCache = async (response: any) => {
    const { cache, maxAge } = this.options

    return cache.set(
      serializeKey(this.key),
      JSON.stringify({
        data: response,
        [CACHE_EXPIRED_KEY]: Date.now() + maxAge,
      }),
    )
  }

  private getCache = async () => {
    const { cache } = this.options
    const cacheStr = await cache.get(serializeKey(this.key))
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
