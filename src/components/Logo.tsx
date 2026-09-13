/** The Alltech mark.
 *
 * A phone body with a chevron through it: the shop's trade is screens, and the
 * chevron doubles as the "A". Geometry rather than a letterform, so it stays
 * legible at 20px in the navigation and at 512px as an installed app icon.
 *
 * currentColor throughout, so one component serves the accent-on-dark badge,
 * the sign-in mark and anywhere else it appears without a second copy.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className}
         role="img" aria-label="Alltech">
      <rect x="16" y="6" width="32" height="52" rx="9"
            stroke="currentColor" strokeWidth="4" />
      <path d="M24 40 L32 24 L40 40" stroke="currentColor" strokeWidth="4.5"
            strokeLinecap="round" strokeLinejoin="round" />
      <path d="M27.5 34.5 H36.5" stroke="currentColor" strokeWidth="4.5"
            strokeLinecap="round" />
    </svg>
  )
}
