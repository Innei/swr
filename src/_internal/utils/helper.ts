export const noop = () => {}

// Using noop() as the undefined value as undefined can be replaced
// by something else. Prettier ignore and extra parentheses are necessary here
// to ensure that tsc doesn't remove the __NOINLINE__ comment.
// prettier-ignore
export const UNDEFINED = (/* #__NOINLINE__ */ noop()) as undefined

export const cloneDeep = (obj: any) => {
  return JSON.parse(JSON.stringify(obj))
}

export const isDefined = (obj: any) => {
  return obj !== null && obj !== undefined
}

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const isUndefined = (v: any): v is undefined => v === UNDEFINED
export const isFunction = <
  T extends (...args: any[]) => any = (...args: any[]) => any,
>(
  v: unknown,
): v is T => typeof v == 'function'

export const isAsyncFunction = (func: any) => {
  return func instanceof Function && func.constructor.name === 'AsyncFunction'
}

export const isPromise = (promise: any): promise is Promise<any> => {
  return (
    typeof promise === 'function' &&
    promise.then instanceof Function &&
    promise.catch instanceof Function
  )
}
