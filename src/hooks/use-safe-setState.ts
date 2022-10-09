import { useCallback } from 'react'

import { useIsUnmount } from './use-is-unmount.js'

export const useSafeSetState = <T>(
  setState: React.Dispatch<React.SetStateAction<T>>,
) => {
  const isUnmountRef = useIsUnmount()
  const safeSetState = useCallback(
    (changeState: Partial<T> | ((prevState: Readonly<T>) => Partial<T>)) => {
      if (isUnmountRef.current) return
      if (typeof changeState == 'function') {
        setState((prev) => {
          return { ...prev, ...changeState(prev) }
        })
      } else {
        setState((prev) => ({
          ...prev,
          ...changeState,
        }))
      }
    },
    [],
  )

  return safeSetState
}
