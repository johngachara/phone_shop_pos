import axios from 'axios';
import { auth, firestore } from './firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';

const API_URL = import.meta.env.VITE_ALLTECH_URL;

class AuthService {
    constructor() {
        this.axiosInstance = axios.create({
            baseURL: API_URL,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Add request interceptor
        this.axiosInstance.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('access');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Add response interceptor
        this.axiosInstance.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;

                // If the error is 401 and we haven't tried to refresh yet
                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;

                    try {
                        // First try refreshing with the refresh token
                        await this.handleTokenRefresh();

                        // Update the token in the failed request
                        const token = localStorage.getItem('access');
                        originalRequest.headers.Authorization = `Bearer ${token}`;

                        // Retry the original request
                        return this.axiosInstance(originalRequest);
                    } catch (refreshError) {
                        // If refresh fails, try Firebase refresh
                        try {
                            await this.checkFirebaseAndRefresh();

                            // Update the token in the failed request
                            const newToken = localStorage.getItem('access');
                            originalRequest.headers.Authorization = `Bearer ${newToken}`;

                            // Retry the original request
                            return this.axiosInstance(originalRequest);
                        } catch (firebaseError) {
                            // If both refresh attempts fail, logout
                            this.logout();
                            return Promise.reject(firebaseError);
                        }
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    async handleTokenRefresh() {
        const refreshToken = localStorage.getItem('refresh');
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        try {
            const response = await axios.post(`${API_URL}/api/refresh-token/`, {
                refresh: refreshToken
            });

            localStorage.setItem('access', response.data.access);
            return response.data.access;
        } catch (error) {
            console.error('Token refresh failed:', error);
            throw error;
        }
    }

    async checkFirebaseAndRefresh() {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                this.logout();
                throw new Error('No Firebase user found');
            }

            // Check user's role in Firestore
            const userDocRef = doc(firestore, "users", currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (!userDocSnap.exists() || !userDocSnap.data().role) {
                this.logout();
                throw new Error('User not authorized');
            }

            // Get fresh Firebase token
            const firebaseToken = await currentUser.getIdToken(true);

            // Authenticate with main service
            const mainLoginResponse = await this.mainLogin(firebaseToken);
            if (mainLoginResponse.status !== 200) {
                this.logout();
                throw new Error(mainLoginResponse.message || 'Main login failed');
            }

            // Store main service tokens
            localStorage.setItem("access", mainLoginResponse.data.access);
            localStorage.setItem("refresh", mainLoginResponse.data.refresh);

            // Authenticate with sequelizer service
            const sequelizerResponse = await this.sequelizerLogin(firebaseToken);
            if (sequelizerResponse.status !== 200) {
                this.logout();
                throw new Error('Sequelizer authentication failed');
            }

            // Store sequelizer token
            localStorage.setItem("accessories", sequelizerResponse.data.token);

            return true;
        } catch (error) {
            console.error('Firebase auth check failed:', error);
            this.logout();
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

    async sequelizerLogin(firebaseToken) {
        try {
            const response = await axios.post(
                `${API_URL}/nodeapp/authenticate`,
                {  firebaseToken },
                { headers: { 'Content-Type': 'application/json' },withCredentials : true }
            );

            return {
                data: response.data,
                status: response.status
            };
        } catch (error) {
            return {
                data: null,
                message: error.response?.data?.message || 'Sequelizer authentication failed',
                status: error.response?.status || 500
            };
        }
    }

    logout() {
        // Clear all auth tokens
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        localStorage.removeItem('accessories');

        // Sign out from Firebase
        auth.signOut()
            .catch(error => console.error('Firebase sign out error:', error));

        // Redirect to login page
        window.location.href = '/Login';
    }

    // Helper method to get current tokens
    getTokens() {
        return {
            access: localStorage.getItem('access'),
            refresh: localStorage.getItem('refresh'),
            accessories: localStorage.getItem('accessories')
        };
    }
}

export default new AuthService();