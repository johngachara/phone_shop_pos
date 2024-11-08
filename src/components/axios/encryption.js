// encryption.js
const STORAGE_KEY = 'sequal_encryption_key';

async function getOrCreateEncryptionKey() {
    let storedKey = localStorage.getItem(STORAGE_KEY);

    if (!storedKey) {
        // Generate new key if none exists
        const newKey = crypto.getRandomValues(new Uint8Array(32));
        storedKey = btoa(String.fromCharCode(...newKey));
        localStorage.setItem(STORAGE_KEY, storedKey);
    }

    return new Uint8Array(
        atob(storedKey).split('').map(char => char.charCodeAt(0))
    );
}

const encryptionKey = await getOrCreateEncryptionKey();
const ivLength = 12;

export async function encrypt(text) {
    const iv = crypto.getRandomValues(new Uint8Array(ivLength));
    const encodedText = new TextEncoder().encode(text);

    const key = await crypto.subtle.importKey(
        'raw',
        encryptionKey,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
    );

    const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encodedText
    );

    const encryptedArray = new Uint8Array(iv.length + encryptedData.byteLength);
    encryptedArray.set(iv);
    encryptedArray.set(new Uint8Array(encryptedData), iv.length);

    return btoa(String.fromCharCode(...encryptedArray));
}

export async function decrypt(encryptedText) {
    const encryptedArray = new Uint8Array(
        atob(encryptedText).split('').map(char => char.charCodeAt(0))
    );

    const iv = encryptedArray.slice(0, ivLength);
    const encryptedData = encryptedArray.slice(ivLength);

    const key = await crypto.subtle.importKey(
        'raw',
        encryptionKey,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
    );

    const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encryptedData
    );

    return new TextDecoder().decode(decryptedData);
}
