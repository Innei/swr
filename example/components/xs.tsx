import React from 'react'

import { xs } from '@xhs/xswr'

import { sleep } from '~/_internal/utils/helper'

export const XSTest1 = () => {
  const handleClick = () => {
    const date = Date.now()
    const task = xs('test-2', async () => {
      await sleep(500)
      console.log('call 2')

      return {
        data: 2,
      }
    })
    console.log(+new Date() - date, 'xs handle cost')
    task.then((res) => {
      console.log(+new Date() - date, 'done cost')

      console.log('xs 1 done', res)
    })
  }
  return <button onClick={handleClick}>Test2</button>
}
