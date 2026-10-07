/// <reference types="w3c-web-usb" />
import { create } from 'zustand'

/** The counter's USB receipt printer, reached directly over WebUSB.
 *
 * WebUSB rather than window.print(): the print dialog cannot say whether a
 * printer is attached, and the POS only offers a receipt when one is. Chrome
 * remembers a printer once it has been chosen, so `getDevices()` finds it again
 * on every load and the `connect`/`disconnect` events track the cable from then
 * on -- picking it is a one-time step per browser.
 *
 * On Windows the Xprinter driver holds the device and the browser cannot open
 * it. It needs the generic WinUSB driver instead (installed once with Zadig);
 * see the PR that added this for the steps.
 */

export type PrinterStatus = 'unsupported' | 'disconnected' | 'connected' | 'printing'

// Matched by USB class (7 = printer) first, which covers any ESC/POS printer
// that reports itself honestly. The vendor ids are the USB controllers seen in
// Xprinter units that report a vendor-specific class instead.
const FILTERS: USBDeviceFilter[] = [
  { classCode: 0x07 },
  { vendorId: 0x0483 }, // STMicroelectronics
  { vendorId: 0x0416 }, // Winbond / Nuvoton
  { vendorId: 0x1fc9 }, // NXP
  { vendorId: 0x28e9 }, // GigaDevice
  { vendorId: 0x1504 }, // Xprinter OEM
]

function usb(): USB | null {
  return typeof navigator !== 'undefined' && 'usb' in navigator ? navigator.usb : null
}

function matches(device: USBDevice): boolean {
  if (FILTERS.some((f) => f.vendorId !== undefined && f.vendorId === device.vendorId)) return true
  return device.configurations.some((c) =>
    c.interfaces.some((i) => i.alternates.some((a) => a.interfaceClass === 0x07)))
}

function label(device: USBDevice): string {
  return device.productName || device.manufacturerName || 'Receipt printer'
}

/** The interface and bulk OUT endpoint that print data goes to. */
function findOutEndpoint(device: USBDevice) {
  const config = device.configuration ?? device.configurations[0]
  const candidates = [...config.interfaces].sort((a, b) =>
    // Prefer the printer-class interface when there are several.
    Number(b.alternate.interfaceClass === 0x07) - Number(a.alternate.interfaceClass === 0x07))
  for (const iface of candidates) {
    const endpoint = iface.alternate.endpoints.find((e) => e.direction === 'out' && e.type === 'bulk')
    if (endpoint) return { interfaceNumber: iface.interfaceNumber, endpointNumber: endpoint.endpointNumber }
  }
  throw new Error('This USB device has no print endpoint. Is it the receipt printer?')
}

function explain(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error)
  if (/access denied|unable to claim|security/i.test(message)) {
    return new Error(
      'The browser could not open the printer. On Windows its driver must be switched to WinUSB (Zadig) once.',
    )
  }
  return error instanceof Error ? error : new Error(message)
}

interface PrinterState {
  status: PrinterStatus
  deviceName: string | null
  device: USBDevice | null
  /** Find an already-chosen printer and start following plug/unplug events. */
  init: () => Promise<void>
  /** Ask the browser to pick a printer. Must run from a click. */
  pair: () => Promise<void>
  /** Stop using this printer; the browser forgets the permission too. */
  forget: () => Promise<void>
  print: (data: Uint8Array) => Promise<void>
}

let listening = false

export const usePrinter = create<PrinterState>((set, get) => ({
  status: usb() ? 'disconnected' : 'unsupported',
  deviceName: null,
  device: null,

  init: async () => {
    const api = usb()
    if (!api) return
    if (!listening) {
      listening = true
      api.addEventListener('connect', (event) => {
        const device = (event as USBConnectionEvent).device
        if (matches(device)) set({ status: 'connected', device, deviceName: label(device) })
      })
      api.addEventListener('disconnect', (event) => {
        if ((event as USBConnectionEvent).device === get().device) {
          set({ status: 'disconnected', device: null, deviceName: null })
        }
      })
    }
    // Only devices this site was already granted, and only while plugged in.
    const device = (await api.getDevices()).find(matches)
    if (device) set({ status: 'connected', device, deviceName: label(device) })
  },

  pair: async () => {
    const api = usb()
    if (!api) throw new Error('This browser cannot reach USB printers. Use Chrome or Edge.')
    let device: USBDevice
    try {
      device = await api.requestDevice({ filters: FILTERS })
    } catch (error) {
      // Closing the chooser without picking is not an error worth reporting.
      if (error instanceof DOMException && error.name === 'NotFoundError') return
      throw explain(error)
    }
    set({ status: 'connected', device, deviceName: label(device) })
  },

  forget: async () => {
    const device = get().device
    set({ status: usb() ? 'disconnected' : 'unsupported', device: null, deviceName: null })
    try { await device?.forget?.() } catch { /* already gone */ }
  },

  print: async (data) => {
    const device = get().device
    if (!device) throw new Error('No receipt printer is connected.')
    set({ status: 'printing' })
    try {
      if (!device.opened) await device.open()
      if (device.configuration === null) await device.selectConfiguration(1)
      const { interfaceNumber, endpointNumber } = findOutEndpoint(device)
      await device.claimInterface(interfaceNumber)
      try {
        // Chunked: some printers drop a single very large bulk transfer.
        for (let offset = 0; offset < data.length; offset += 4096) {
          const result = await device.transferOut(endpointNumber, data.slice(offset, offset + 4096))
          if (result.status !== 'ok') throw new Error(`The printer reported "${result.status}".`)
        }
      } finally {
        await device.releaseInterface(interfaceNumber).catch(() => {})
        await device.close().catch(() => {})
      }
    } catch (error) {
      throw explain(error)
    } finally {
      set({ status: get().device ? 'connected' : 'disconnected' })
    }
  },
}))
