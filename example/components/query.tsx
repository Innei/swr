import { queryClient } from 'query'
import React from 'react'

import { useQuery } from '@tanstack/react-query'

const queryFn = async () => {
  return {
    data: 'OK',
  }
}
export const QueryTest1 = () => {
  useQuery(['core-1'], queryFn)
  const handleClick = async () => {
    queryClient.prefetchQuery(['core-2'], {
      queryFn,
    })
  }

  return (
    <button className="btn" onClick={handleClick}>
      Prefetch
    </button>
  )
}
