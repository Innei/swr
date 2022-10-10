export type SWRKey = (string | number) | (string | number | boolean)[]

export type FetcherFnParams<Key extends SWRKey = SWRKey> = {
  key: Key
}
export type FetchFn<Key extends SWRKey, T = unknown> = (
  options: FetcherFnParams<Key>,
) => Promise<T> | T
