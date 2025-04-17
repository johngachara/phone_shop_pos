const IV_LENGTH = 12;
const KEY_ALGORITHM = {
    name: 'AES-GCM',
    length: 256
};

// Function to generate and securely store a CryptoKey
async function getOrCreateEncryptionKey() {
    // Try to retrieve existing key from IndexedDB
    try {
        // Open the key database
        const db = await new Promise((resolve, reject) => {
            const request = indexedDB.open('SecureKeyStore', 1);

            request.onupgradeneeded = function() {
                const db = request.result;
                // Create an object store for keys if it doesn't exist
                if (!db.objectStoreNames.contains('keys')) {
                    db.createObjectStore('keys', { keyPath: 'id' });
                }
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        // Try to get the existing key
        const key = await new Promise((resolve, reject) => {
            const transaction = db.transaction(['keys'], 'readonly');
            const store = transaction.objectStore('keys');
            const request = store.get('encryptionKey');

            request.onsuccess = () => resolve(request.result ? request.result.key : null);
            request.onerror = () => reject(request.error);
        });

        if (key) {
            return key;
        }
    } catch (error) {
        console.warn('Error accessing IndexedDB:', error);
        // Continue to key generation if IndexedDB fails
    }

    // If no key exists or retrieval failed, generate a new one
    const key = await crypto.subtle.generateKey(
        KEY_ALGORITHM,
        true, // extractable - set to true to be able to export/store it
        ['encrypt', 'decrypt']
    );

    // Store the newly generated key
    try {
        const db = await new Promise((resolve, reject) => {
            const request = indexedDB.open('SecureKeyStore', 1);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        await new Promise((resolve, reject) => {
            const transaction = db.transaction(['keys'], 'readwrite');
            const store = transaction.objectStore('keys');
            const request = store.put({ id: 'encryptionKey', key });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.warn('Failed to store key in IndexedDB:', error);
        // Key is still usable even if storage fails
    }

    return key;
}

export async function encrypt(text) {
    // Get the encryption key
    const key = await getOrCreateEncryptionKey();

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    // Encode text
    const encodedText = new TextEncoder().encode(text);

    // Encrypt data
    const encryptedData = await crypto.subtle.encrypt(
        { name: KEY_ALGORITHM.name, iv },
        key,
        encodedText
    );

    // Combine IV and encrypted data
    const encryptedArray = new Uint8Array(iv.length + encryptedData.byteLength);
    encryptedArray.set(iv);
    encryptedArray.set(new Uint8Array(encryptedData), iv.length);

    // Return as base64
    return btoa(String.fromCharCode(...encryptedArray));
}

export async function decrypt(encryptedText) {
    // Get the encryption key
    const key = await getOrCreateEncryptionKey();

    // Decode from base64
    const encryptedArray = new Uint8Array(
        atob(encryptedText).split('').map(char => char.charCodeAt(0))
    );

    // Extract IV and encrypted data
    const iv = encryptedArray.slice(0, IV_LENGTH);
    const encryptedData = encryptedArray.slice(IV_LENGTH);

    // Decrypt
    const decryptedData = await crypto.subtle.decrypt(
        { name: KEY_ALGORITHM.name, iv },
        key,
        encryptedData
    );

    // Return as text
    return new TextDecoder().decode(decryptedData);
}

