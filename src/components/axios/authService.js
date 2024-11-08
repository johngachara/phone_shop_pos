import axios from 'axios';
import Cookies from 'js-cookie';
import { auth, firestore } from "components/firebase/firebase.js";
import { doc, getDoc } from 'firebase/firestore';
import { encrypt, decrypt } from './encryption';

const API_URL = import.meta.env.VITE_ALLTECH_URL;

class AuthService {
    constructor() {
        this.memoryTokens = new Map();
        this.axiosInstance = this.setupAxiosInstance();
    }

    setupAxiosInstance() {
        const axiosInstance = axios.create({
            baseURL: API_URL,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        axiosInstance.interceptors.request.use(
            async (config) => {
                const token = await this.getAccessToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        axiosInstance.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;

                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;

                    try {
                        await this.refreshAuth();
                        const newToken = await this.getAccessToken();
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        return axiosInstance(originalRequest);
                    } catch (refreshError) {
                        this.clearTokens();
                        return Promise.reject(refreshError);
                    }
                }
                return Promise.reject(error);
            }
        );

        return axiosInstance;
    }

    async getAccessToken() {
        const sessionId = Cookies.get('auth_session');
        if (!sessionId) return null;

        const tokenData = this.memoryTokens.get(sessionId);
        if (!tokenData) {
            await this.restoreTokens();
            return this.getAccessToken();
        }

        try {
            return await decrypt(tokenData.access);
        } catch (error) {
            console.error('Token decryption failed:', error);
            this.clearTokens();
            return null;
        }
    }

    async restoreTokens() {
        const sessionId = Cookies.get('auth_session');
        if (sessionId) {
            const storedTokens = localStorage.getItem(`auth_tokens_${sessionId}`);
            if (storedTokens) {
                this.memoryTokens.set(sessionId, JSON.parse(storedTokens));
            }
        }
    }

    async storeTokens(tokens) {
        const sessionId = crypto.randomUUID();

        const tokenData = {
            access: await encrypt(tokens.access),
            refresh: await encrypt(tokens.refresh),
            timestamp: Date.now()
        };

        this.memoryTokens.set(sessionId, tokenData);

        // Store encrypted tokens in localStorage
        localStorage.setItem(`auth_tokens_${sessionId}`, JSON.stringify(tokenData));

        Cookies.set('auth_session', sessionId, {
            secure: true,
            sameSite: 'Strict',
            expires: 1
        });
    }

    async refreshAuth() {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                this.clearTokens();
                throw new Error('No Firebase user found');
            }

            const userDocRef = doc(firestore, "users", currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (!userDocSnap.exists() || !userDocSnap.data().role) {
                this.clearTokens();
                throw new Error('User not authorized');
            }

            const firebaseToken = await currentUser.getIdToken(true);
            const response = await this.mainLogin(firebaseToken);

            if (response.status !== 200) {
                this.clearTokens();
                throw new Error(response.message || 'Main login failed');
            }

            await this.storeTokens({
                access: response.data.access,
                refresh: response.data.refresh
            });
        } catch (error) {
            console.error('Authentication refresh failed:', error);
            throw error;
        }
    }

    async mainLogin(firebaseToken) {
        try {
            const response = await axios.post(
                `${API_URL}/api/firebase-auth/`,
                { idToken: firebaseToken },
                { headers: { 'Content-Type': 'application/json' } }
            );

            return {
                data: response.data,
                status: response.status
            };
        } catch (error) {
            return {
                data: null,
                message: error.response?.data?.message || 'Authentication failed',
                status: error.response?.status || 500
            };
        }
    }

    clearTokens() {
        const sessionId = Cookies.get('auth_session');
        if (sessionId) {
            this.memoryTokens.delete(sessionId);
            localStorage.removeItem(`auth_tokens_${sessionId}`);
            Cookies.remove('auth_session');
        }
    }

    logout() {
        this.clearTokens();
        return auth.signOut()
            .catch(error => console.error('Firebase sign out error:', error))
            .finally(() => {
                window.location.href = '/login';
            });
    }

    getTokens() {
        return {
            access: this.getAccessToken(),
            // refresh: // this.getRefreshToken()
        };
    }
}

export default new AuthService();