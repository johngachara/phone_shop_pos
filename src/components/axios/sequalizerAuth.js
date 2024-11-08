import axios from 'axios';
import Cookies from 'js-cookie';
import { auth, firestore } from "components/firebase/firebase.js";
import { doc, getDoc } from 'firebase/firestore';
import { encrypt, decrypt } from './encryption';
import { apiService } from "../../apiService.js";

const API_URL = import.meta.env.VITE_ALLTECH_URL;

class SequalizerAuth {
    constructor() {
        this.memoryTokens = new Map();
        this.axiosInstance = null;
        // Initialize immediately when class is instantiated
        this.init();
    }

    async init() {
        await this.restoreTokens();
        this.setupAxiosInstance();
    }

    setupAxiosInstance() {
        this.axiosInstance = axios.create({
            baseURL: API_URL,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        this.axiosInstance.interceptors.request.use(
            async (config) => {
                const token = await this.getAccessToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            this.handleRequestError
        );

        this.axiosInstance.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;

                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;

                    try {
                        await this.refreshAuth();
                        const newToken = await this.getAccessToken();
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        return this.axiosInstance(originalRequest);
                    } catch (refreshError) {
                        await this.logout();
                        return Promise.reject(refreshError);
                    }
                }
                return Promise.reject(error);
            }
        );
    }

    async clearStoredTokens() {
        const sessionId = Cookies.get('sequal_session');
        if (sessionId) {
            this.memoryTokens.delete(sessionId);
            try {
                localStorage.removeItem(`sequal_tokens_${sessionId}`);
            } catch (error) {
                console.error('Error clearing localStorage:', error);
            }
            Cookies.remove('sequal_session');
        }
    }

    async restoreTokens() {
        try {
            const sessionId = Cookies.get('sequal_session');
            if (!sessionId) return;

            const storedTokens = localStorage.getItem(`sequal_tokens_${sessionId}`);
            if (!storedTokens) return;

            const parsedTokens = JSON.parse(storedTokens);

            // Verify token validity by attempting to decrypt
            try {
                await decrypt(parsedTokens.accessToken);
                this.memoryTokens.set(sessionId, parsedTokens);
            } catch (error) {
                console.error('Invalid stored token detected:', error);
                await this.clearStoredTokens();
            }
        } catch (error) {
            console.error('Error restoring tokens:', error);
            await this.clearStoredTokens();
        }
    }

    async storeAccessToken(token) {
        try {
            const sessionId = crypto.randomUUID();
            const encryptedToken = await encrypt(token);

            const tokenData = {
                accessToken: encryptedToken,
                timestamp: Date.now()
            };

            // Store in memory
            this.memoryTokens.set(sessionId, tokenData);

            // Store in localStorage
            localStorage.setItem(`sequal_tokens_${sessionId}`, JSON.stringify(tokenData));

            // Set secure cookie
            Cookies.set('sequal_session', sessionId, {
                secure: true,
                sameSite: 'strict',
                expires: 1, // 1 day
                path: '/'  // Ensure cookie is available across all paths
            });

            return true;
        } catch (error) {
            console.error('Error storing access token:', error);
            return false;
        }
    }

    async getAccessToken() {
        try {
            const sessionId = Cookies.get('sequal_session');
            if (!sessionId) return null;

            const tokenData = this.memoryTokens.get(sessionId);
            if (!tokenData) {
                // Try to restore from localStorage if not in memory
                await this.restoreTokens();
                const restoredTokenData = this.memoryTokens.get(sessionId);
                if (!restoredTokenData) return null;
                return await decrypt(restoredTokenData.accessToken);
            }

            // Check token age
            const tokenAge = Date.now() - tokenData.timestamp;
            if (tokenAge > 24 * 60 * 60 * 1000) { // 24 hours
                await this.clearStoredTokens();
                return null;
            }

            return await decrypt(tokenData.accessToken);
        } catch (error) {
            console.error('Error getting access token:', error);
            await this.clearStoredTokens();
            return null;
        }
    }

    async refreshAuth() {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                throw new Error('No Firebase user found');
            }

            const userDocRef = doc(firestore, "users", currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (!userDocSnap.exists() || !userDocSnap.data().role) {
                throw new Error('User not authorized');
            }

            const firebaseToken = await currentUser.getIdToken(true);
            const response = await apiService.sequelizer_login({
                firebaseToken
            });

            if (response.status !== 200 || !response.data.token) {
                throw new Error('Sequelizer authentication failed');
            }

            await this.storeAccessToken(response.data.token);
            return true;
        } catch (error) {
            console.error('Authentication refresh failed:', error);
            throw error;
        }
    }

    async logout() {
        try {
            await this.clearStoredTokens();
            await auth.signOut();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            window.location.href = '/login';
        }
    }

    handleRequestError = (error) => {
        return Promise.reject(error);
    };
}

// Create and export a singleton instance
export default new SequalizerAuth();