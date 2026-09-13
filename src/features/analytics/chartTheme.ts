/** Chart colour and geometry.
 *
 * One categorical order, used for both themes. The palette was generated at a
 * fixed OKLCH lightness (L 0.62) so it sits inside the legal band for a dark
 * surface (0.48-0.67) and a light one (0.43-0.77) at the same time, and was
 * checked with a validator rather than by eye:
 *
 *   lightness band  PASS both modes
 *   chroma floor    PASS  all >= 0.1
 *   CVD separation  PASS  worst adjacent dE 10.7 (deutan)
 *   normal vision   PASS  worst adjacent dE 18.4
 *   contrast        PASS  all >= 3:1 against both surfaces
 *
 * Hues are assigned in this fixed order and never cycled: colour follows the
 * entity, so filtering a series out must not repaint the ones that remain.
 * The tritan separation on teal/rose is tight, which is why every chart here
 * also carries a legend or direct labels -- identity is never colour alone.
 */
export const SERIES = [
  '#00A159', // green   — revenue
  '#3986E4', // blue    — profit
  '#C17000', // amber
  '#A366CD', // violet
  '#D5565D', // rose
  '#00A2A4', // teal
] as const

export const REVENUE = SERIES[0]
export const PROFIT = SERIES[1]

/** Axis, grid and tooltip colours, read from the live theme tokens.
 *
 * Read at call time rather than captured once: the theme can change while the
 * page is open, and a chart holding the previous palette would be invisible. */
export function chartInk() {
  const style = getComputedStyle(document.documentElement)
  const token = (name: string) => style.getPropertyValue(name).trim()
  return {
    grid: token('--color-line-soft'),
    axis: token('--color-ink-3'),
    surface: token('--color-surface'),
    line: token('--color-line'),
    ink: token('--color-ink'),
  }
}

export const AXIS_TICK = { fontSize: 11, fontWeight: 500 }
/** Thin marks, per the mark spec. A 2px line reads as data; a 4px one reads as
 *  decoration and buries the shape it is meant to show. */
export const LINE_WIDTH = 2
export const DOT_SIZE = 8
