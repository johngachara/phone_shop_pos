/** ESC/POS receipt encoding for the counter's 80mm thermal printer.
 *
 * The Xprinter XP-Q838L speaks ESC/POS over USB. Sending it raw bytes, rather
 * than going through the browser's print dialog, is what lets a receipt print
 * with one tap and the paper cut afterwards. Pure functions, no I/O: the bytes
 * for a receipt can be checked without a printer attached.
 */

/** Characters per line in the printer's default font (Font A) on 80mm paper. */
export const LINE_WIDTH = 48

export const SHOP_NAME = 'ALLTECH'
export const SHOP_TAGLINE = 'Phone screens & accessories'

export interface ReceiptLine {
  name: string
  quantity: number
  unitPrice: number
  /** In-house repair labour, charged once for the line. */
  repairCharge?: number
}

export interface Receipt {
  saleId: number | string
  lines: ReceiptLine[]
  customer: string
  /** 'REPAIR' prints as an in-house repair; anything else as a sale. */
  saleType: 'CUSTOMER' | 'REPAIR'
  servedBy?: string | null
  at: Date
}

const ESC = 0x1b
const GS = 0x1d
const LF = 0x0a

const INIT = [ESC, 0x40]
const ALIGN_LEFT = [ESC, 0x61, 0]
const ALIGN_CENTER = [ESC, 0x61, 1]
const BOLD_ON = [ESC, 0x45, 1]
const BOLD_OFF = [ESC, 0x45, 0]
const SIZE_DOUBLE = [GS, 0x21, 0x11]
const SIZE_NORMAL = [GS, 0x21, 0x00]
// Feed 4 lines so the last printed line clears the cutter, then partial cut.
const FEED_AND_CUT = [ESC, 0x64, 4, GS, 0x56, 0x42, 0x00]

/** The printer's default code page is not UTF-8; anything outside printable
 * ASCII prints as garbage, so it is replaced rather than sent. */
export function toAscii(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[–—]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^\x20-\x7e]/g, '?')
}

export function money(value: number): string {
  return value.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

/** Left text and right text on one line, the left truncated if they collide. */
export function columns(left: string, right: string, width = LINE_WIDTH): string {
  const r = toAscii(right)
  const room = Math.max(0, width - r.length - 1)
  let l = toAscii(left)
  if (l.length > room) l = room > 1 ? l.slice(0, room - 1) + '.' : ''
  return l + ' '.repeat(width - l.length - r.length) + r
}

/** Word-wrap to the paper width, so long product names are not cut off. */
export function wrap(text: string, width = LINE_WIDTH): string[] {
  const words = toAscii(text).split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    if (!current) current = word.slice(0, width)
    else if (current.length + 1 + word.length <= width) current += ' ' + word
    else { lines.push(current); current = word.slice(0, width) }
  }
  if (current) lines.push(current)
  return lines.length ? lines : ['']
}

export function receiptTotal(receipt: Receipt): number {
  return receipt.lines.reduce(
    (sum, l) => sum + l.unitPrice * l.quantity + (l.repairCharge ?? 0), 0,
  )
}

/** The receipt as plain text lines, exactly as they will print. Separate from
 * the byte encoding so the layout can be tested and previewed on screen. */
export function receiptText(receipt: Receipt): { header: string[]; body: string[] } {
  const rule = '-'.repeat(LINE_WIDTH)
  const when = receipt.at.toLocaleString('en-KE', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
  const body: string[] = [
    columns(`Receipt #${receipt.saleId}`, when),
    columns('Customer', receipt.customer),
  ]
  if (receipt.servedBy) body.push(columns('Served by', receipt.servedBy))
  body.push(receipt.saleType === 'REPAIR' ? 'IN-HOUSE REPAIR' : 'SALE', rule)

  for (const line of receipt.lines) {
    body.push(...wrap(line.name))
    body.push(columns(
      `  ${line.quantity} x ${money(line.unitPrice)}`,
      money(line.unitPrice * line.quantity),
    ))
    if (line.repairCharge) body.push(columns('  Repair charge', money(line.repairCharge)))
  }

  body.push(rule)
  return { header: [SHOP_NAME, SHOP_TAGLINE], body }
}

/** Encode a receipt as ESC/POS bytes, ending with a paper cut. */
export function encodeReceipt(receipt: Receipt): Uint8Array {
  const bytes: number[] = []
  const text = (s: string) => {
    for (const ch of toAscii(s)) bytes.push(ch.charCodeAt(0))
    bytes.push(LF)
  }
  const cmd = (c: number[]) => bytes.push(...c)
  const { header, body } = receiptText(receipt)

  cmd(INIT)
  cmd(ALIGN_CENTER); cmd(BOLD_ON); cmd(SIZE_DOUBLE)
  text(header[0])
  cmd(SIZE_NORMAL); cmd(BOLD_OFF)
  text(header[1])
  bytes.push(LF)

  cmd(ALIGN_LEFT)
  for (const line of body) text(line)

  cmd(BOLD_ON); cmd(SIZE_DOUBLE)
  // Double width halves the characters per line.
  text(columns('TOTAL', `KSh ${money(receiptTotal(receipt))}`, LINE_WIDTH / 2))
  cmd(SIZE_NORMAL); cmd(BOLD_OFF)
  bytes.push(LF)

  cmd(ALIGN_CENTER)
  text('Thank you for your business')
  cmd(FEED_AND_CUT)
  return new Uint8Array(bytes)
}
