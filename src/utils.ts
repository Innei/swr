import type { FetcherKey } from './types.js'

export const getAndOverride = () => {}

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const separator = '_$_swr_$_'
export const resolveKey = (key: FetcherKey): string => {
  if (typeof key === 'string' || typeof key === 'number') {
    return key.toString()
  }
  return key.reduce((pre: string, cur) => {
    return `${pre}${separator}${cur}`
  }, '')
}
