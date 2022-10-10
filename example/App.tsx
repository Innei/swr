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
    <div>
      <h5>useSWR</h5>
      <div>{JSON.stringify(data)}</div>

      <h5>SWR</h5>
      <div>
        <button onClick={handleClick}>
          fetch data with 1s waiting and no cache
        </button>
      </div>
      <div>
        <button onClick={handleClickCache}>
          fetch data with 1s waiting and 3s cache
        </button>
      </div>
    </div>
  )
}
export default App
