import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Resets scroll position to top whenever the route changes.
 *
 * Prevents landing mid-page when navigating between views.
 */
export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [pathname])

  return null
}
