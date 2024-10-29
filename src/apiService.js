import axios from 'axios';
import authService from "components/authService.js";
import {auth,firestore} from "components/firebase/firebase.js";
import {doc,getDoc} from "firebase/firestore";
const API_URL = import.meta.env.VITE_ALLTECH_URL;
export const apiService = {
    handleApiError: async (error, retryCallback, navigate, dispatch, setLoading, toast, nodeRetryCallback = null) => {
        let errorMessage = 'An error occurred';
        let statusCode = error.response?.status || 500;
        const isNodeAppRequest = error.config?.url?.includes('/nodeapp/');

        const logout = () => {
            localStorage.removeItem('access');
            localStorage.removeItem('refresh');
            localStorage.removeItem('accessories');
            navigate('/Login');

            toast({
                status: 'error',
                description: errorMessage,
                position: 'top',
                duration: 3000,
                isClosable: true,
            });
        };

        if (error.response) {
            switch (statusCode) {
                case 400:
                    errorMessage = 'Invalid authentication request';
                    logout();
                    break;

                case 401:
                    // Special handling for nodeapp routes
                    if (isNodeAppRequest && nodeRetryCallback) {
                        await this.checkFirebaseAndRefresh(dispatch,setLoading,navigate)
                        return await nodeRetryCallback();
                    }

                    // Regular flow for non-nodeapp routes
                    if (error.response.data.detail === 'Firebase token expired' ||
                        error.response.data.detail === 'Given token not valid for any token type') {
                        try {
                            // First try normal token refresh
                            try {
                                const newAccessToken = await this.refreshAccessToken();
                                return await retryCallback(newAccessToken);
                            } catch (refreshError) {
                                // If refresh token fails, try Firebase auth
                                try {
                                    await this.checkFirebaseAndRefresh(dispatch, setLoading, navigate);
                                    return await retryCallback();
                                } catch (firebaseError) {
                                    errorMessage = 'Your session has expired. Please sign in again.';
                                    logout();
                                }
                            }
                        } catch (finalError) {
                            errorMessage = 'Your session has expired. Please sign in again.';
                            logout();
                        }
                    } else {
                        errorMessage = 'Invalid authentication credentials';
                        logout();
                    }
                    break;

                case 403:
                    errorMessage = 'Your account is not authorized';
                    logout();
                    break;

                case 404:
                    errorMessage = 'Resource not found';
                    toast({
                        status: 'error',
                        description: errorMessage,
                        position: 'top',
                        duration: 3000,
                        isClosable: true,
                    });
                    break;

                case 500:
                    errorMessage = 'Server error occurred';
                    toast({
                        status: 'error',
                        description: errorMessage,
                        position: 'top',
                        duration: 3000,
                        isClosable: true,
                    });
                    break;

                default:
                    errorMessage = error.response.data.detail || errorMessage;
                    toast({
                        status: 'error',
                        description: errorMessage,
                        position: 'top',
                        duration: 3000,
                        isClosable: true,
                    });
            }
        }

        return {
            data: null,
            message: errorMessage,
            status: statusCode,
        };
    },
    checkFirebaseAndRefresh : async (dispatch, setLoading, navigate) => {
        const logout = () => {
            localStorage.removeItem('access');
            localStorage.removeItem('refresh');
            localStorage.removeItem('accessories');
            navigate('/Login');
        };

        try {
            dispatch(setLoading(true));
            const currentUser = auth.currentUser;

            if (!currentUser) {
                logout();
                throw new Error('No Firebase user found');
            }

            const userDocRef = doc(firestore, "users", currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (!userDocSnap.exists() || !userDocSnap.data().role) {
                logout();
                throw new Error('User not authorized');
            }

            const firebaseToken = await currentUser.getIdToken(true);
            const { data, status, message } = await this.main_login(firebaseToken);

            if (status === 403 || status !== 200) {
                logout();
                throw new Error("You are forbidden to sign in");
            }

            localStorage.setItem("access", data.access);
            localStorage.setItem("refresh", data.refresh);
            const { data: sequelizerData, status: sequelizerStatus } = await apiService.sequelizer_login({
                firebaseToken
            });

            if (sequelizerStatus !== 200) {
                logout()
                throw new Error("Incorrect Username or password sequelizer");
            }

            localStorage.setItem("accessories", sequelizerData.token); // Store sequelizer token
            return true;
        } catch (error) {
            console.error('Firebase auth check failed:', error);
            logout();
            throw error;
        } finally {
            dispatch(setLoading(false));
        }
    },

    refreshAccessToken: async () => {
        try {
            const refreshToken = localStorage.getItem('refresh');
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }

            const response = await authService.axiosInstance.post('/api/refresh-token/', {
                refresh: refreshToken
            });

            localStorage.setItem('access', response.data.access);
            return response.data.access;
        } catch (error) {
            console.error('Error refreshing token:', error);
            throw error;
        }
    },
    main_login: async (firebaseToken) => {
        try {
            const response = await axios.post(
                `${API_URL}/api/firebase-auth/`,
                { idToken: firebaseToken },
                { headers: { 'Content-Type': 'application/json' } }
            );
            return {
                data: response.data,
                status: response.status,
            };
        } catch (e) {
            console.error('Error during login:', e);
            return {
                data: null,
                message: e.response?.data?.message || 'An error occurred during sign in',
                status: e.response?.status || 500,
            };
        }
    },

    sequelizer_login: async (idToken) => {
        try {
            const response = await axios.post(
                `${API_URL}/nodeapp/authenticate`,
                { idToken },
                { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
            );
            return {
                data: response.data,
                status: response.status,
            };
        } catch (e) {
            return {
                message: e.response?.data?.message || 'An error occurred during sign in',
            };
        }
    },
    addAccessories: async (token, data) => {
        try {
            const response = await axios.post(`${API_URL}/nodeapp/Add`, data, { headers: {
                'Content-Type': 'application/json' ,
                    Authorization: `Bearer ${token}`

            } });
            return {
                status: response.status
            };
        } catch (e) {
            const errorData = e.response?.data;
            return {
                message: errorData || 'An error occurred while adding product',
            };
        }
    },


    updateAccessories: async (token, data, id) => {
        try {
            const response = await axios.put(`${API_URL}/nodeapp/Update/${id}`, data,{ headers: {
                    'Content-Type': 'application/json' ,
                    Authorization: `Bearer ${token}`

                } });
            return {
                status: response.status,
            };
        } catch (e) {
            return {
                status: e.response.status,
                message: e.message || 'An error occurred while updating product',
            };
        }
    },
    deleteAccessory: async (token, id) => {
        try {
            const response = await authService.axiosInstance.delete(`/nodeapp/Delete/${id}`,{ headers: {
                    'Content-Type': 'application/json' ,
                    Authorization: `Bearer ${token}`

                } });
            return {
                status: response.status,
            };
        } catch (e) {
            return {
                message: e.message
            };
        }
    },



    getAccessories : async (token, page, navigate, dispatch, toast ,setAccessoryLoading) => {
        try {
            const response = await axios.get(`${API_URL}/nodeapp/FindAll`, {
                params: { page },
                headers : {
                    Authorization: `Bearer ${token}`
                }
            });


            return {
                status: response.status,
                data: response.data
            };
        } catch (error) {
            return this.handleApiError(
                error,
                null,
                navigate,
                dispatch,
                setAccessoryLoading,
                toast,
                () => this.getAccessories(token,page,navigate,dispatch,toast,setAccessoryLoading)
            );
        }
    },


    sellAccessory: async (token, selectedItemId, dataToSend) => {
        try {
            const response = await axios.post(`${API_URL}/nodeapp/Save/${selectedItemId}`, dataToSend,{ headers: {
                    'Content-Type': 'application/json' ,
                    Authorization: `Bearer ${token}`

                } });
            if (response.status === 200) {
                return {
                    status: response.status,
                    message: "Product sold successfully",
                };
            }
            throw new Error("Failed to sell the product");
        } catch (e) {
            return {
                message: e.message,
            };
        }
    },

    dashboardData: async (dataType) => {
        let endpoint;
        let token;
        let axiosInstance;
        if (dataType === 'accessory_sales') {
            endpoint = `${API_URL}/nodeapp/Sales`;
            token = localStorage.getItem("accessories");
            axiosInstance = axios.get(endpoint,{
                headers:{
                    Authorization: `Bearer ${token}`
                }
            })
        } else {
            endpoint = `${API_URL}/api/detailed/${dataType}/`;
            axiosInstance = authService.axiosInstance.get(endpoint)
        }

        try {
            const response = await axiosInstance
            return {
                status: response.status,
                data: response.data.results,
                nextPage: response.data.next,
            };
        } catch (error) {
            console.error(`Error fetching ${dataType} data:`, error);
            return { status: 'error', message: error.message };
        }
    },

    fetchDashboardData: async (token) => {
        try {
            const response = await authService.axiosInstance.get('/api/dashboard');
            return { status: response.status, data: response.data };
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            return { status: 'error', message: error.message };
        }
    },

    fetchAccessoryDashboardData: async () => {
        try {
            const token = localStorage.getItem("accessories");
            const response = await axios.get(`${API_URL}/nodeapp/Admin`,{
                headers:{
                    Authorization: `Bearer ${token}`
                }

            });
            return { status: response.status, data: response.data };
        } catch (error) {
            console.error('Error fetching accessory data:', error);
            return { status: 'error', message: error.message };
        }
    }
};