import { api } from '@/lib/api'

/** base64url helpers.
 *
 * WebAuthn speaks ArrayBuffers, JSON does not. The server sends and expects
 * base64url (not standard base64), so the alphabet has to be converted in both
 * directions or every assertion fails verification for no visible reason. */
function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4))
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

function toBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  bytes.forEach((b) => { binary += String.fromCharCode(b) })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function passkeysSupported(): boolean {
  return typeof window !== 'undefined' && !!window.PublicKeyCredential
}

/** Thrown when a ceremony is aborted by our own timeout, so the caller can
 * show a specific "try again" message instead of a generic failure. */
export class PasskeyTimeoutError extends Error {
  constructor() {
    super('Passkey check timed out. Please try again.')
    this.name = 'PasskeyTimeoutError'
  }
}

// navigator.credentials.get()/.create() can hang indefinitely on mobile: the
// options' `timeout` field is only a hint the platform UI may ignore, and if
// the authenticator sheet never resolves (a stalled hybrid/QR handshake, a
// dismissed-but-not-rejected prompt in an installed PWA) the promise this
// awaits simply never settles, leaving the caller stuck on a spinner with no
// way out. Tying an AbortSignal to the call guarantees it always settles.
const CEREMONY_TIMEOUT_MS = 60_000

function ceremonyTimeoutSignal(): AbortSignal {
  return AbortSignal.timeout(CEREMONY_TIMEOUT_MS)
}

async function withTimeout<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new PasskeyTimeoutError()
    }
    throw err
  }
}

export async function hasPasskey(): Promise<boolean> {
  const result = await api<{ credentials: unknown[] }>('/api/passkeys/')
  return result.credentials.length > 0
}

export async function registerPasskey(label?: string): Promise<void> {
  const options = await api<PublicKeyCredentialCreationOptionsJSON>(
    '/api/passkeys/register/options/', { method: 'POST' },
  )

  const credential = (await withTimeout(navigator.credentials.create({
    publicKey: {
      ...options,
      challenge: fromBase64Url(options.challenge),
      user: { ...options.user, id: fromBase64Url(options.user.id) },
      excludeCredentials: options.excludeCredentials?.map((c) => ({
        ...c, id: fromBase64Url(c.id),
      })),
    } as unknown as PublicKeyCredentialCreationOptions,
    signal: ceremonyTimeoutSignal(),
  }))) as PublicKeyCredential | null

  if (!credential) throw new Error('Passkey setup was cancelled')

  const response = credential.response as AuthenticatorAttestationResponse
  await api('/api/passkeys/register/verify/', {
    method: 'POST',
    json: {
      id: credential.id,
      rawId: toBase64Url(credential.rawId),
      type: credential.type,
      label,
      response: {
        clientDataJSON: toBase64Url(response.clientDataJSON),
        attestationObject: toBase64Url(response.attestationObject),
        // The authenticator reports which transports it supports (e.g.
        // "internal" for an on-device platform authenticator). Stored so the
        // server can hand it back on every future auth-options call -- see
        // verifyPasskey for why an absent transports hint is a mobile hang risk.
        transports: response.getTransports?.() ?? [],
      },
    },
  })
}

export async function verifyPasskey(): Promise<void> {
  const options = await api<PublicKeyCredentialRequestOptionsJSON>(
    '/api/passkeys/auth/options/', { method: 'POST' },
  )

  // No `mediation` is set here deliberately: this is a plain, explicitly
  // triggered "Unlock" button press, not a conditional/autofill request, so
  // there is no browser-dependent autofill-mediation resolution behaviour to
  // worry about. What *is* missing without the signal below is any bound on
  // how long the call can take -- see the comment on CEREMONY_TIMEOUT_MS.
  const assertion = (await withTimeout(navigator.credentials.get({
    publicKey: {
      ...options,
      challenge: fromBase64Url(options.challenge),
      allowCredentials: options.allowCredentials?.map((c) => ({
        ...c, id: fromBase64Url(c.id),
      })),
    } as unknown as PublicKeyCredentialRequestOptions,
    signal: ceremonyTimeoutSignal(),
  }))) as PublicKeyCredential | null

  if (!assertion) throw new Error('Passkey check was cancelled')

  const response = assertion.response as AuthenticatorAssertionResponse
  await api('/api/passkeys/auth/verify/', {
    method: 'POST',
    json: {
      id: assertion.id,
      rawId: toBase64Url(assertion.rawId),
      type: assertion.type,
      response: {
        clientDataJSON: toBase64Url(response.clientDataJSON),
        authenticatorData: toBase64Url(response.authenticatorData),
        signature: toBase64Url(response.signature),
        userHandle: response.userHandle ? toBase64Url(response.userHandle) : null,
      },
    },
  })
}

interface PublicKeyCredentialCreationOptionsJSON {
  challenge: string
  rp: { id: string; name: string }
  user: { id: string; name: string; displayName: string }
  pubKeyCredParams: PublicKeyCredentialParameters[]
  excludeCredentials?: { id: string; type: string; transports?: string[] }[]
  authenticatorSelection?: AuthenticatorSelectionCriteria
  timeout?: number
  attestation?: string
}

interface PublicKeyCredentialRequestOptionsJSON {
  challenge: string
  rpId?: string
  allowCredentials?: { id: string; type: string; transports?: string[] }[]
  timeout?: number
  userVerification?: string
}
