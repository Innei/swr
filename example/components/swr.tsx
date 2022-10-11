import React, { useRef } from 'react'

import { TrunkPromise } from '@xhs/trunk-promise'

import { sleep } from '~/_internal/utils/helper'
import type { SWRWrapper } from '~/interface'
import { swr } from '~/swr'

export const Test1 = () => {
  const swrRef = useRef<SWRWrapper<number>>()
  const handleClick = () => {
    // const date = Date.now()
    if (swrRef.current) {
      swrRef.current.refresh()

      return
    }
    swrRef.current = swr(
      ['test'],
      async () => {
        await sleep(500)
        console.log('call 1')

        return 1
      },
      {
        maxAge: 50,
        // @ts-ignore
        Promise: TrunkPromise,
        onRefresh(promise: any, result) {
          return promise.doResolve(result)
        },
      },
    )
    // 1ms
    // console.log(+new Date() - date, 'swr handle cost')

    // fix: `then` should memoize the callback
    swrRef.current.then((res) => {
      // console.log(+new Date() - date, 'done cost')

      console.log('1 done', res)
    })
  }
  return (
    <button className="btn" onClick={handleClick}>
      Test1: TrunkPromise
    </button>
  )
}

export const Test2 = () => {
  const swrRef = useRef<SWRWrapper<number>>()
  const countRef = useRef(0)
  const handleClick = () => {
    if (swrRef.current) {
      swrRef.current.refresh(true).then((res) => {
        console.log('swr refresh done', res)
      })
      return
    }
    swrRef.current = swr('test-2', async () => {
      console.log('fetching 2', countRef.current)

      return {
        count: countRef.current++,
      }
    })
    swrRef.current.then((res) => {
      console.log('2 done', res)
    })
  }

  return (
    <button className="btn" onClick={handleClick}>
      Test2: refresh
    </button>
  )
}
