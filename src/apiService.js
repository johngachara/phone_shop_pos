import axios from 'axios';
import authService from "components/axios/authService.js";
const API_URL = import.meta.env.VITE_ALLTECH_URL;
export const apiService = {
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
            console.log(response)
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