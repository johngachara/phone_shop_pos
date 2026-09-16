import { useEffect } from 'react'

/** Scroll a form field into view smoothly with a delay to account for the
 * virtual keyboard opening animation.
 */
export function scrollInputIntoView(element: HTMLElement, delay = 300) {
  if (!element || typeof element.scrollIntoView !== 'function') return

  window.setTimeout(() => {
    if (document.activeElement === element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      })
    }
  }, delay)
}

/** Global hook to ensure focused inputs stay visible above the virtual keyboard.
 *
 * Listens for focusin events site-wide across all forms, dialogs, sheets, and inputs,
 * and tracks visualViewport resizes when the on-screen keyboard appears.
 */
export function useMobileKeyboardScroll() {
  useEffect(() => {
    const isTextInput = (el: Element | null): el is HTMLElement => {
      if (!el) return false
      if (el instanceof HTMLTextAreaElement) return true
      if (el instanceof HTMLInputElement) {
        const type = el.type.toLowerCase()
        return !['hidden', 'checkbox', 'radio', 'button', 'submit', 'reset', 'file'].includes(type)
      }
      return el.getAttribute('contenteditable') === 'true'
    }

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null
      if (isTextInput(target)) {
        scrollInputIntoView(target, 300)
      }
    }

    // Capture phase ensures we hear the event even if propagation is stopped
    document.addEventListener('focusin', handleFocusIn, true)

    // Also handle visualViewport resize on modern mobile browsers
    let prevHeight = window.visualViewport?.height ?? window.innerHeight
    const handleViewportResize = () => {
      const currentHeight = window.visualViewport?.height ?? window.innerHeight
      if (currentHeight < prevHeight - 100) {
        // Viewport shrank significantly -> keyboard opened
        const active = document.activeElement as HTMLElement | null
        if (isTextInput(active)) {
          scrollInputIntoView(active, 100)
        }
      }
      prevHeight = currentHeight
    }

    window.visualViewport?.addEventListener('resize', handleViewportResize)

    return () => {
      document.removeEventListener('focusin', handleFocusIn, true)
      window.visualViewport?.removeEventListener('resize', handleViewportResize)
    }
  }, [])
}
