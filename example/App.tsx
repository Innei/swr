import type { FC } from 'react'
import React from 'react'
import { useSWR } from '~'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const fetcher = ({ key }) =>
  new Promise((resolve) => {
    sleep(1000).then(() => {
      resolve({
        data: {
          name: 'John Doe',
          key,
        },
      })
    })
  })

const App: FC = () => {
  const { data } = useSWR(['/api'], fetcher, {
    initialData: { message: 'initial' },
  })
  return <div>{JSON.stringify(data)}</div>
}
export default App
