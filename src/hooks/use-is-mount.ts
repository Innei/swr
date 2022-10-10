import React from 'react'

export const useIsMount = () => {
  const isMount = React.useRef(false)
  React.useLayoutEffect(() => {
    isMount.current = true
    return () => {
      isMount.current = false
    }
  }, [])
  return isMount
}
