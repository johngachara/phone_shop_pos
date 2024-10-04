import axios from 'axios'
const API_URL = import.meta.env.VITE_SERVER_URL
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
                data: null, // Return null or default data when an error occurs
                message: e.response?.data?.message || 'An error occurred during sign in',
                status: e.response?.status || 500,
            };
        }
    },

    sequelizer_login : async (idToken) => {
        try{
            const response = await axios.post(
                `${API_URL}/nodeapp/authenticate`,
                { idToken },
                { headers: { 'Content-Type': 'application/json' },withCredentials:true }
            );
            return{
                data : response.data,
                status : response.status,
            }
        }catch (e) {
            return {
                message : e.response?.data?.message || 'An error occurred during sign in',
            }
        }
    },
    addScreens : async (token,data) => {
        try{
          const response = await axios.post(`${API_URL}/api/add_stock2`, data,{
              headers:
                  {'Content-Type': 'application/json',Authorization:`Bearer ${token}`},
          })
          return{
             status : response.status
          }
        }catch (e) {
            const errorData = e.response.data;
            // Loop over each field in the error response
            const errorMessages = Object.entries(errorData).map(([field, messages]) => {
                // Assuming the messages array contains one or more error messages
                return `${field}: ${messages[0].replace("sho p2_stoc k_fix", "This product")}`;
            });
            return {
                message : errorMessages || 'An error occurred while adding product',
            }
        }
    },
    addAccessories : async (token,data) => {
        try{
            const response = await axios.post(`${API_URL}/nodeapp/Add`, data,{
                headers:
                    {'Content-Type': 'application/json',Authorization:`Bearer ${token}`},
            })
            return{
                status : response.status
            }
        }catch (e) {
            const errorData = e.response?.data;
            return {
                message : errorData || 'An error occurred while adding product',
            }
        }
    },
    updateScreens: async (token, data, id) => {
        try {
            const response = await axios.put(`${API_URL}/api/update_stock2/${id}`, data, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            return {
                status: response.status,
            };
        } catch (e) {
            const errorData = e.response?.data; // Safely check if data exists

            if (errorData) {
                const fieldErrors = {};  // To store field-specific error messages

                // Loop over the fields in the error response
                for (const field in errorData) {
                    if (errorData.hasOwnProperty(field)) {
                        const errorArray = errorData[field];  // e.g., [{"string": "A valid integer is required.", "code": "invalid"}]

                        if (Array.isArray(errorArray) && errorArray.length > 0) {
                            fieldErrors[field] = errorArray[0].string || 'Invalid value';  // Extract the message from the first error object
                        }
                    }
                }

                // Return the field-specific errors for further handling
                return {
                    status: e.response.status,
                    message: 'Validation failed',
                    errors: fieldErrors,
                };
            }

            // Return a generic error message if no specific errors are available
            return {
                status: e.response?.status || 500,
                message: 'An error occurred while updating product',
            };
        }
    },
    updateAccessories: async (token, data, id) => {
        try {
            const response = await axios.put(`${API_URL}/nodeapp/Update/${id}`, data, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            return {
                status: response.status,
            };
        } catch (e) {
                return {
                    status: e.response.status,
                    message: e.message || 'An error occurred while updating product',
            }
        }
    },
    sellScreens : async (token,data,id) => {
        try{
            const response = await axios.post(`${API_URL}/api/sell2/${id}`,data , {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            })
            return {
                status : response.status,
                data : response.data
            }
        }catch (e) {
            return{
                message:e.message
            }
        }
    },
    completeOrder : async (token,id) => {
        try{
            const response = await axios.post(`${API_URL}/api/complete2/${id}` ,{}, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            })
            return {
                status : response.status,
            }
        }catch (e) {
            return{
                message:e.message
            }
        }
    },
    deleteScreen : async (token,id) => {
        try{
            const response = await axios.delete(`${API_URL}/api/delete_stock2_api/${id}` , {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            })
            return {
                status : response.status,
            }
        }catch (e) {
            return{
                message:e.message
            }
        }
    },
    deleteAccessory : async (token,id) => {
        try{
            const response = await axios.delete(`${API_URL}/nodeapp/Delete/${id}` , {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            })
            return {
                status : response.status,
            }
        }catch (e) {
            return{
                message:e.message
            }
        }
    },
    getShop2Screens: async (token, page,navigate) => {
        try {
            const response = await axios.get(`${API_URL}/api/get_shop2_stock`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                params: { page },
            });
            return {
                status: response.status,
                data: response.data
            };
        } catch (e) {
            if (e.response?.status === 401) {
                navigate("/Login")
                return { message: 'Unauthorized, please login again' };
            }
            return {
                message: e.message
            };
        }
    },
    getAccessories: async (token, page,navigate) => {
        try {
            const response = await axios.get(`${API_URL}/nodeapp/FindAll`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                params: { page },
            });
            return {
                status: response.status,
                data: response.data
            };
        } catch (e) {
            if (e.response?.status === 401) {
                navigate("/Login")
                return { message: 'Unauthorized, please login again' };
            }
            return {
                message: e.message
            };
        }
    },
    getSavedItems: async (token) => {
        try {
            const response = await axios.get(`${API_URL}/api/saved2`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            return {
                status: response.status,
                data: response.data,
            };
        } catch (e) {
            if (e.response?.status === 401) {
                return { message: 'Unauthorized, please login again' };
            }
            return {
                message: e.message,
            };
        }
    },
    refundItem: async (token, id, setCancelButton) => {
        try {
            const response = await axios.get(`${API_URL}/api/refund2/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 200) {
                return {
                    status: response.status,
                    message: "Refund successful",
                };
            }
            setCancelButton(false);
            throw new Error("Error while refunding occurred");
        } catch (e) {
            return {
                message: e.message,
            };
        }
    },
    sellAccessory: async (token, selectedItemId, dataToSend) => {
        try {
            const response = await axios.post(`${API_URL}/nodeapp/Save/${selectedItemId}`, dataToSend, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 200) {
                return {
                    status: response.status,
                    message: "Product sold successfully",
                };
            } else {
                throw new Error("Failed to sell the product");
            }
        } catch (e) {
            return {
                message: e.message,
            };
        }
    },
    dashboardData: async (dataType) => {
        let endpoint;
        let token;
        // Construct the endpoint based on the dataType
        if (dataType === 'accessory_sales') {
            endpoint = `${API_URL}/nodeapp/Sales`;
            token = localStorage.getItem("accessories")
        } else {
            endpoint = `${API_URL}/api/detailed/${dataType}/`;
            token = localStorage.getItem("access")
        }

        try {
            const response = await fetch(endpoint, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                }
            });

            if (response.status === 401) {
                return { status: 401, message: 'Unauthorized' };
            }

            if (!response.ok) {
                throw new Error(`Failed to fetch ${dataType} data`);
            }

            const jsonData = await response.json();
            return {
                status: response.status,
                data: jsonData.results,
                nextPage: jsonData.next,
            };

        } catch (error) {
            console.error(`Error fetching ${dataType} data:`, error);
            return { status: 'error', message: error.message };
        }
    },
    fetchDashboardData: async (token) => {
        try {
            const response = await fetch(`${API_URL}/api/dashboard`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 401) {
                return { status: 401, message: 'Unauthorized' };
            }

            if (!response.ok) {
                throw new Error('Failed to fetch dashboard data');
            }

            const data = await response.json();
            return { status: response.status, data };
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            return { status: 'error', message: error.message };
        }
    },

    fetchAccessoryDashboardData: async () => {
        try {
            const token = localStorage.getItem("accessories")
            const response = await fetch(`${API_URL}/nodeapp/Admin`, {
                headers: {
                    'Content-Type': 'application/json',
                     Authorization : `Bearer ${token}`
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch accessory data');
            }

            const data = await response.json();
            return { status: response.status, data };
        } catch (error) {
            console.error('Error fetching accessory data:', error);
            return { status: 'error', message: error.message };
        }
    }
};

