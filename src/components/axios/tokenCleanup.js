export const tokenCleanup = {
    // Clear all tokens for a specific service
    clearAllServiceTokens(prefix) {
        try {
            // Get all keys from localStorage
            const keys = Object.keys(localStorage);

            // Filter keys that match our prefix pattern
            const tokenKeys = keys.filter(key => key.startsWith(prefix));

            // Remove each matching key
            tokenKeys.forEach(key => {
                localStorage.removeItem(key);
            });

            return true;
        } catch (error) {
            console.error(`Error clearing ${prefix} tokens:`, error);
            return false;
        }
    },

    // Clear expired tokens for a service
    clearExpiredTokens(prefix, maxAge = 24 * 60 * 60 * 1000) { // default 24 hours
        try {
            const keys = Object.keys(localStorage);
            const now = Date.now();

            keys.filter(key => key.startsWith(prefix)).forEach(key => {
                try {
                    const tokenData = JSON.parse(localStorage.getItem(key));
                    if (!tokenData || !tokenData.timestamp || (now - tokenData.timestamp > maxAge)) {
                        localStorage.removeItem(key);
                    }
                } catch (error) {
                    // If we can't parse the token data, remove it
                    localStorage.removeItem(key);
                }
            });

            return true;
        } catch (error) {
            console.error(`Error clearing expired ${prefix} tokens:`, error);
            return false;
        }
    },

    // Clear all auth related tokens
    clearAllAuthTokens() {
        this.clearAllServiceTokens('auth_tokens_');
        this.clearAllServiceTokens('sequal_tokens_');
    },

    // Perform complete cleanup
    performFullCleanup() {
        this.clearExpiredTokens('auth_tokens_');
        this.clearExpiredTokens('sequal_tokens_');
    }
};