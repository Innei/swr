import type { SWRKey } from '~/types.js'

import { stableHash } from './hash.js'
import { isFunction } from './helper.js'

export const serialize = (key: SWRKey): [string, SWRKey] => {
  if (isFunction(key)) {
    try {
      key = key()
    } catch (err) {
      // dependencies not ready
      key = ''
    }
  }

  // Use the original key as the argument of fetcher. This can be a string or an
  // array of values.
  const args = key

  // If key is not falsy, or not an empty array, hash it.
  key =
    typeof key == 'string'
      ? key
      : (Array.isArray(key) ? key.length : key)
      ? stableHash(key)
      : ''

  return [key, args]
}

export const serializeKey = (key: SWRKey): string => {
  return serialize(key)[0]
}
