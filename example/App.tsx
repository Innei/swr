import { FC, useRef } from 'react'
import React from 'react'
import { swr, useSWR } from '~'

import { SWRWrapper } from '~/swr'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

let fetchCount = 0
const fetcher = ({ key }) =>
  new Promise((resolve) => {
    sleep(1000).then(() => {
      resolve({
        data: {
          name: 'John Doe',
          key,
          fetchCount: fetchCount++,
        },
      })
    })
  })

const App: FC = () => {
  const { data } = useSWR(['/api'], fetcher, {
    initialData: { message: 'initial' },
  })
  const handleClick = () => {
    swr(['fetch-btn'], fetcher).then((res) => {
      console.log('fetch done', res)
    })
  }

  const handleClickCache = () => {
    swr(['fetch-btn'], fetcher, {
      maxAge: 3000,
    }).then((res) => {
      console.log('fetch done', res)
    })
  }

  return (
    <div>
      <h5>useSWR</h5>
      <div>{JSON.stringify(data)}</div>

      <h5>SWR</h5>
      <div className="flex">
        <button onClick={handleClick}>
          fetch data with 1s waiting and no cache
        </button>
        <button onClick={handleClickCache}>
          fetch data with 1s waiting and 3s cache
        </button>

        <Test1 />
      </div>
    </div>
  )
}

const Test1 = () => {
  const swrRef = useRef<SWRWrapper<any>>()
  const handleClick = () => {
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
      },
    )

    // fix: `then` should memoize the callback
    swrRef.current.then((res) => {
      console.log('1 done', res)
    })
  }
  return <button onClick={handleClick}>Test1</button>
}

const Test2 = () => {
  const handleClick = () => {}
  return <button onClick={handleClick}>Test2</button>
}

export default App
