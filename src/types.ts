export type FetcherKey = (string | number) | (string | number | boolean)[]

export type FetcherFnParams<Key extends FetcherKey = FetcherKey> = {
  key: Key
}
export type FetchFn<Key extends FetcherKey, T = unknown> = (
  options: FetcherFnParams<Key>,
) => Promise<T> | T
