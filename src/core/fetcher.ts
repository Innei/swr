import { defineConfigurableField } from '~/_internal/define.js'
import { SWRError } from '~/_internal/utils/error.js'
import {
  cloneDeep,
  isAsyncFunction,
  isPromise,
  sleep,
} from '~/_internal/utils/helper.js'
import { serializeKey } from '~/_internal/utils/serialize.js'

import { Logger } from '../_internal/logger.js'
import { defaultOptions } from '../_internal/resolve-options.js'
import { subscription } from '../_internal/subscription.js'
import type {
  FetcherStatus,
  ICachedData,
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

  setOptions = (options: Partial<SWROptions>) => {
    this.options = { ...this.options, ...options }
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

    const memoizedKeys = this.key
    const PromiseConstructor = this.options.Promise || globalThis.Promise

    const memoizedFetchFn = this.fetchFn.bind(this, {
      key: memoizedKeys,
    })
    const fetchingPooling = () => {
      return new PromiseConstructor(async (resolve, reject) => {
        if (!force) {
          const hasCache = this.getCache()
          let nextCache = hasCache

          if (hasCache) {
            const isCacheIsPromise = isPromise(hasCache)
            if (isCacheIsPromise) {
              nextCache = await hasCache
            }
            this.isFetching = false
            Logger.debug('cache hit, this request will fetch from cache.')

            this.emitResponse('success', nextCache)
            return resolve(nextCache)
          }
        }

        // FIXME

        const {
          retryInterval,
          retryMaxCount,
          initialData,
          onError,
          onErrorRetry,
          onSuccess,
          onLoadingSlow,
          loadingTimeout,
        } = this.options
        this.emitResponse('loading', this.state.data ?? initialData)

        let currentRetryCount = 0

        const asyncFunction = () =>
          Promise.resolve().then(() => memoizedFetchFn())

        // const asyncFunction = () =>
        //   new TrunkPromise(async (resolve, reject) => {
        //     try {
        //       const res = await memoizedFetchFn()
        //       resolve(res)
        //     } catch (er) {
        //       reject(er)
        //     }
        //   })
        //
        let loadingTimer: ReturnType<typeof setTimeout> | null = null

        while (currentRetryCount++ < retryMaxCount) {
          try {
            if (onLoadingSlow) {
              loadingTimer = setTimeout(() => {
                onLoadingSlow(this.key, this.options)
              }, loadingTimeout)
            }

            return resolve(
              await asyncFunction()
                .then(this.handleResponse)
                .then((data) => {
                  this.isFetching = false
                  onSuccess(data, this.key, data, this.options)
                  // console.log(data)

                  // @ts-ignore
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  loadingTimer = clearTimeout(loadingTimer!)
                  return data
                }),
            )
          } catch (error) {
            if (currentRetryCount === retryMaxCount) {
              this.isFetching = false
              this.emitResponse('error', null, error)
              onErrorRetry(this.key, error, this.options)
              reject(error)
              throw error
            }
            Logger.warn(`retrying... ${currentRetryCount}`)

            onError(this.key, error, this.options)
            await sleep(retryInterval)
          }
        }
      })
    }

    Logger.debug('start fetch')

    this.polling = fetchingPooling()

    // function memoizedThenable() {}

    // this.polling.then = (onfulfilled, onrejected) => {
    //   onfulfilled = onfulfilled || ((data) => data)
    //   onrejected = onrejected || ((error) => error)
    //   return Promise.prototype.then.call(
    //     this.polling,
    //     onfulfilled,
    //     onrejected,
    //   ) as any
    // }

    // console.log(this.polling)

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
    // if response if empty
    if (typeof response === 'undefined') {
      return
    }
    this.doCache(response)

    // TODO it is necessary ???
    const clonedResponse = cloneDeep(response)

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

  private getCache = () => {
    const { cache } = this.options

    const getIsAsync = isAsyncFunction(cache.get)

    return getIsAsync ? this.getCacheAsync() : this.getCacheSync()
  }
  private getCacheAsync = async () => {
    const { cache } = this.options

    // avoid context interrupt
    const cacheStr = await cache.get(serializeKey(this.key))

    return this.getCacheDataFromString(cacheStr) as ICachedData | null
  }

  private getCacheSync = () => {
    const { cache } = this.options

    const cacheStr = cache.get(serializeKey(this.key))

    return this.getCacheDataFromString(cacheStr) as ICachedData | null
  }

  private getCacheDataFromString = (cacheStr: string) => {
    if (!cacheStr) {
      return null
    }
    /**
     * cached object structure:
     * {
     *  data: any,
     *  __cache_expired__: number
     * }
     */
    const cacheObj = JSON.parse(cacheStr)

    if (Date.now() > cacheObj[CACHE_EXPIRED_KEY]) {
      return null
    }

    // make sure is object
    if (typeof cacheObj.data === 'object' && cacheObj.data) {
      defineConfigurableField(cacheObj.data, '$$cache', {
        expired: cacheObj[CACHE_EXPIRED_KEY],
        isCache: true,
      })
    }

    return cacheObj.data
  }
}
