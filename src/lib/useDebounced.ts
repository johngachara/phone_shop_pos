import { useEffect, useState } from 'react'

/** Delay a rapidly-changing value.
 *
 * Search now happens on the server, so without this every keystroke is a
 * request. 250ms is below the point where typing feels laggy and above the
 * gap between keystrokes, so a word produces one request rather than six.
 */
export function useDebounced<T>(value: T, delay = 250): T {
  const [settled, setSettled] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return settled
}
