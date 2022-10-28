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
const weakMap = new WeakMap<object, number | string>()
const normalMap = new Map<string | number, string>()
export const serializeKey = (key: SWRKey): string => {
  const keyIsObject = key !== null && typeof key === 'object'

  if (keyIsObject) {
    const keyInWeakMap = weakMap.get(key)
    if (keyInWeakMap) {
      return keyInWeakMap as string
    }
  } else {
    const keyInNormalMap = normalMap.get(key)
    if (keyInNormalMap) {
      return keyInNormalMap
    }
  }

  const hashedKey = serialize(key)[0]

  if (keyIsObject) {
    weakMap.set(key, hashedKey)
  } else {
    normalMap.set(key, hashedKey)
  }

  return hashedKey
}
