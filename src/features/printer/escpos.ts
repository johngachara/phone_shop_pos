/** ESC/POS receipt layout and encoding for the counter's 80mm thermal printer.
 *
 * The Xprinter XP-Q838L speaks ESC/POS over USB. Sending it raw bytes, rather
 * than going through the browser's print dialog, is what lets a receipt print
 * with one tap and the paper cut afterwards.
 *
 * The receipt is laid out once, as a list of blocks, and both the printer
 * bytes and the on-screen preview are produced from that list -- so what the
 * dialog shows is what comes out of the printer. Pure functions, no I/O.
 */

/** Characters per line on 80mm paper (576 dots): Font A is 12 dots wide,
 * Font B 9. Font B is the smaller type used for details. */
export const LINE_WIDTH = 48
export const SMALL_WIDTH = 64

export const SHOP = {
  name: 'ALLTECH',
  trade: 'PHONE REPAIR SERVICES',
  address: 'Mudavadi Street, Nyeri Town',
  phone: '0712 539 139',
  strapline: 'Screens · Repairs · Accessories',
}

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

export type Block =
  | {
      kind: 'text'
      text: string
      align?: 'left' | 'center'
      bold?: boolean
      /** small = Font B; large = double width and height; tall = double height. */
      size?: 'small' | 'normal' | 'tall' | 'large'
      /** Extra dots between characters, for the spaced-out wordmark. */
      spacing?: number
      /** White on black, full width. */
      invert?: boolean
    }
  | { kind: 'rule' }
  | { kind: 'feed'; lines: number }

const ESC = 0x1b
const GS = 0x1d
const LF = 0x0a

// The printer's character table is PC437, selected explicitly so the box
// rule and middle dot print as drawn rather than as whatever the firmware
// defaulted to. Anything else outside ASCII is folded to a plain letter.
const CP437: Record<string, number> = { '─': 0xc4, '·': 0xfa }
const RULE_CHAR = '─'

export function toPrintable(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[–—]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/×/g, 'x')
    .replace(/[^\x20-\x7e─·]/g, '?')
}

export function money(value: number): string {
  return value.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

/** Left text and right text on one line, the left truncated if they collide. */
export function columns(left: string, right: string, width = LINE_WIDTH): string {
  const r = toPrintable(right)
  const room = Math.max(0, width - r.length - 1)
  let l = toPrintable(left)
  if (l.length > room) l = room > 1 ? l.slice(0, room - 1) + '.' : ''
  return l + ' '.repeat(width - l.length - r.length) + r
}

/** Word-wrap to the paper width, so long product names are not cut off. */
export function wrap(text: string, width = LINE_WIDTH): string[] {
  const words = toPrintable(text).split(/\s+/).filter(Boolean)
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

function titleCase(name: string) {
  return name.replace(/\b\w/g, (c) => c.toUpperCase())
}

/** The receipt, top to bottom. The one place its design lives. */
export function receiptLayout(receipt: Receipt): Block[] {
  const date = receipt.at.toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })
  const time = receipt.at.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: false })
  const small = (left: string, right: string): Block =>
    ({ kind: 'text', size: 'small', text: columns(left, right, SMALL_WIDTH) })

  const blocks: Block[] = [
    { kind: 'text', text: SHOP.name, align: 'center', bold: true, size: 'large', spacing: 6 },
    { kind: 'text', text: SHOP.trade, align: 'center', bold: true, spacing: 2 },
    { kind: 'feed', lines: 1 },
    { kind: 'text', text: SHOP.address, align: 'center', size: 'small' },
    { kind: 'text', text: `Tel ${SHOP.phone}`, align: 'center', size: 'small' },
    { kind: 'feed', lines: 1 },
    { kind: 'rule' },
    small(`RECEIPT #${receipt.saleId}`, `${date}  ${time}`),
    small('Customer', titleCase(receipt.customer)),
  ]
  if (receipt.servedBy) blocks.push(small('Served by', titleCase(receipt.servedBy)))
  blocks.push(
    small('Type', receipt.saleType === 'REPAIR' ? 'In-house repair' : 'Sale'),
    { kind: 'rule' },
  )

  for (const line of receipt.lines) {
    for (const part of wrap(line.name)) blocks.push({ kind: 'text', text: part, bold: true })
    blocks.push({
      kind: 'text',
      text: columns(`  ${line.quantity} x ${money(line.unitPrice)}`, money(line.unitPrice * line.quantity)),
    })
    if (line.repairCharge) {
      blocks.push({ kind: 'text', text: columns('  Repair & fitting', money(line.repairCharge)) })
    }
  }

  blocks.push(
    { kind: 'feed', lines: 1 },
    // Full-width black bar with the amount in tall type: the one thing a
    // customer looks for, so it is the one thing that stands out.
    {
      kind: 'text', invert: true, bold: true, size: 'tall',
      text: columns(' TOTAL', `KSh ${money(receiptTotal(receipt))} `),
    },
    { kind: 'feed', lines: 1 },
    { kind: 'text', text: 'Thank you for choosing Alltech', align: 'center', bold: true },
    { kind: 'text', text: SHOP.strapline, align: 'center', size: 'small' },
  )
  return blocks
}

/** Encode a receipt as ESC/POS bytes, ending with a paper cut. */
export function encodeReceipt(receipt: Receipt): Uint8Array {
  const bytes: number[] = [ESC, 0x40, ESC, 0x74, 0] // init; code page PC437
  const write = (s: string) => {
    for (const ch of toPrintable(s)) bytes.push(CP437[ch] ?? ch.charCodeAt(0))
    bytes.push(LF)
  }

  for (const block of receiptLayout(receipt)) {
    if (block.kind === 'feed') {
      for (let i = 0; i < block.lines; i++) bytes.push(LF)
      continue
    }
    if (block.kind === 'rule') {
      bytes.push(ESC, 0x61, 0, ESC, 0x4d, 0)
      write(RULE_CHAR.repeat(LINE_WIDTH))
      continue
    }
    const size = block.size ?? 'normal'
    bytes.push(
      ESC, 0x61, block.align === 'center' ? 1 : 0,
      ESC, 0x4d, size === 'small' ? 1 : 0,
      ESC, 0x45, block.bold ? 1 : 0,
      GS, 0x21, size === 'large' ? 0x11 : size === 'tall' ? 0x01 : 0x00,
      ESC, 0x20, block.spacing ?? 0,
      GS, 0x42, block.invert ? 1 : 0,
    )
    write(block.text)
  }

  // Reset styling, feed past the cutter, partial cut.
  bytes.push(GS, 0x42, 0, GS, 0x21, 0, ESC, 0x45, 0, ESC, 0x20, 0, ESC, 0x4d, 0)
  bytes.push(ESC, 0x64, 4, GS, 0x56, 0x42, 0x00)
  return new Uint8Array(bytes)
}
