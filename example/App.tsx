import { QueryTest1 } from 'components/query'
import { Test1, Test2 } from 'components/swr'
import { withQuery } from 'query'
import type { FC } from 'react'
import React from 'react'
import { swr, useSWR } from '~'

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
    <div className="m-4">
      <h5>useSWR</h5>
      <div>{JSON.stringify(data)}</div>

      <h5 className="text-xl mt-4">SWR</h5>
      <div className="flex gap-4">
        <button className="btn" onClick={handleClick}>
          fetch data with 1s waiting and no cache
        </button>
        <button className="btn" onClick={handleClickCache}>
          fetch data with 1s waiting and 3s cache
        </button>
      </div>
      <div className="flex gap-4 my-4">
        <Test1 />
        <Test2 />
      </div>

      <div className="mt-4">
        <h5 className="text-xl">React Query</h5>
        <div className="flex">
          <QueryTest1 />
        </div>
      </div>
    </div>
  )
}

export default withQuery(App)
