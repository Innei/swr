import type { FC } from 'react'
import React from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

export const queryClient = new QueryClient({})
export const ReactQueryProvider: FC<{ children: any }> = (props) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen />
      {props.children}
    </QueryClientProvider>
  )
}

export const withQuery = (Component: any) => {
  return (props: any) => {
    return (
      <ReactQueryProvider>
        <Component {...props} />
      </ReactQueryProvider>
    )
  }
}
