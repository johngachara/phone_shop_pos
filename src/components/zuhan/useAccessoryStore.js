import { create } from 'zustand';
import sequalizerAuth from "components/axios/sequalizerAuth.js";
import {createJSONStorage, persist} from "zustand/middleware";
import authService from "components/axios/authService.js";

// Helper function to handle rollback
const createRollbackState = (state) => ({
    accessories: [...state.accessories],
    pagination: { ...state.pagination }
});
const useAccessoryStore = create(persist((set, get) => ({
        // State
        accessories: [],
        loading: false,
        error: null,
        pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0
        },
        dashboardData: null,
        rollbackState: null,

        // Operation states
        isAdding: false,
        isUpdating: false,
        isDeleting: false,
        isSelling: false,
        hasHydrated: false,

        // Hydration handler
        setHasHydrated: (state) => set({ hasHydrated: state }),

        // Basic state setters
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),

        // Fetch accessories
        fetchAccessories: async (page = 1, toast) => {
            set({ loading: true, error: null });
            try {
                const { data } = await sequalizerAuth.axiosInstance.get('/nodeapp/FindAll', {
                    params: { page }
                });

                set({
                    accessories: data.items,
                    pagination: {
                        currentPage: page,
                        totalPages: Math.ceil(data.total / data.perPage),
                        totalItems: data.total
                    },
                    loading: false
                });
            } catch (error) {
                set({ loading: false });
                if (toast) {
                    toast({
                        status: 'error',
                        description: error.message || 'Failed to fetch accessories',
                        position: 'bottom-right',
                        isClosable: true
                    });
                }
            }
        },

        // Add accessory with optimistic update
        addAccessory: async (data, toast) => {
            set({ isAdding: true, error: null });

            // Store rollback state
            const rollbackState = createRollbackState(get());
            // Optimistically update state
            set(state => ({
                pagination: {
                    ...state.pagination,
                    totalItems: state.pagination.totalItems + 1,
                    totalPages: Math.ceil((state.pagination.totalItems + 1) / 10)
                },
                rollbackState
            }));

            try {
                const response = await sequalizerAuth.axiosInstance.post('/nodeapp/Add', data);

                // Update with real data from server
                set(state => ({
                    isAdding: false,
                    rollbackState: null
                }));

                toast?.({
                    title: "Success",
                    description: "Accessory added successfully",
                    status: "success",
                    duration: 3000,
                    position: 'top',
                    isClosable: true,
                });

                return { success: true, data: response.data };
            } catch (error) {
                // Rollback on error
                set(state => ({
                    ...state.rollbackState,
                    isAdding: false,
                    rollbackState: null
                }));

                toast?.({
                    status: 'error',
                    description: error.message || 'Failed to add accessory,check whether the product exists',
                    position: 'bottom-right',
                    isClosable: true
                });

                return { success: false, error: error.response?.data?.message };
            }
        },

        // Update accessory with optimistic update
        updateAccessory: async (selectedItem, sellingPrice, sellingQuantity, setIsDrawerOpen, toast, setSearchParam) => {
            set({ isUpdating: true, error: null });

            // Store rollback state
            const rollbackState = createRollbackState(get());

            // Create updated item
            const updatedItem = {
                ...selectedItem,
                price: sellingPrice || 0,
                quantity: sellingQuantity || 0,
                updated_at: new Date().toISOString()
            };

            // Optimistically update state
            set(state => ({
                accessories: state.accessories.map(item =>
                    item.id === selectedItem.id ? updatedItem : item
                ),
                rollbackState
            }));

            const dataToSend = {
                product_name: selectedItem.product_name,
                price: sellingPrice,
                quantity: sellingQuantity,
            };

            try {
                const response = await sequalizerAuth.axiosInstance.put(
                    `/nodeapp/Update/${selectedItem.id}`,
                    dataToSend
                );

                set(state => ({
                    isUpdating: false,
                    rollbackState: null
                }));

                setSearchParam("");
                setIsDrawerOpen(false);

                toast({
                    title: "Success",
                    description: "Accessory updated successfully",
                    status: "success",
                    duration: 3000,
                    position: 'top',
                    isClosable: true,
                });

                return { success: true, data: response.data };
            } catch (error) {
                // Rollback on error
                set(state => ({
                    ...state.rollbackState,
                    isUpdating: false,
                    rollbackState: null
                }));

                toast({
                    status: 'error',
                    description: error.message || 'Failed to update accessory',
                    position: 'bottom-right',
                    isClosable: true
                });

                return { success: false, error: error.response?.data?.message };
            }
        },

        deleteAccessory: async (id, setSearchParam, setIsDeleteDialogOpen, toast) => {
            set({ isDeleting: true, error: null });

            try {
                const result = await sequalizerAuth.axiosInstance.delete(`/nodeapp/Delete/${id}`);

                if (result.status === 200) {
                    // Remove item from state
                    set(state => ({
                        accessories: state.accessories.filter(item => item.id !== id),
                        isDeleting: false
                    }));

                    setSearchParam('');
                    setIsDeleteDialogOpen(false);

                    toast({
                        title: "Success",
                        description: "Item deleted successfully",
                        status: "success",
                        position: 'top',
                        isClosable: true
                    });
                    return { success: true };
                }
            } catch (error) {
                set({ isDeleting: false });
                toast({
                    status: 'error',
                    description: error.message || 'Failed to delete item',
                    position: 'bottom-right',
                    isClosable: true
                });
                return { success: false, error: error.message };
            }
        },
        sellAccessory: async (id, data, toast, setIsDrawerOpen) => {
            set({ isSelling: true, error: null });

            try {
                const response = await sequalizerAuth.axiosInstance.post(`/nodeapp/Save/${id}`, data);



                set(state => ({
                    isSelling: false,
                    accessories: state.accessories.filter(item => item.id !== id),
                }));

                // Close drawer after successful sale
                setIsDrawerOpen(false);

                toast?.({
                    title: "Success",
                    description: "Sale completed successfully",
                    status: "success",
                    duration: 3000,
                    position: 'top',
                    isClosable: true,
                });

                return { success: true, data: response.data };
            } catch (error) {
                set({ isSelling: false });
                toast?.({
                    status: 'error',
                    description: error.message || 'Failed to complete sale',
                    position: 'bottom-right',
                    isClosable: true
                });
                return { success: false, error: error.response?.data?.message };
            }
        },

    // Fetch dashboard data - handles both types of endpoints
    fetchDashboardData: async (dataType) => {
        set({ loading: true, error: null });
        try {
            let response;

            if (dataType?.startsWith('nodeapp')) {
                // Use sequalizerAuth for /nodeapp endpoints
                response = await sequalizerAuth.axiosInstance.get(`/${dataType}`);
            } else {
                // Use authService for other endpoints
                response = await authService.axiosInstance.get(`/api/${dataType || 'dashboard'}`);
            }

            set({
                dashboardData: response.data,
                loading: false
            });
            return { success: true, data: response.data };
        } catch (error) {
            set({
                error: error.response?.data?.message || 'Failed to fetch dashboard data',
                loading: false
            });
            return { success: false, error: error.response?.data?.message };
        }
    },

    // Fetch accessory sales data
    fetchAccessorySales: async () => {
        set({ loading: true, error: null });
        try {
            const { data } = await sequalizerAuth.axiosInstance.get('/nodeapp/Sales');
            set({ loading: false });
            return { success: true, data };
        } catch (error) {
            set({
                error: error.response?.data?.message || 'Failed to fetch sales data',
                loading: false
            });
            return { success: false, error: error.response?.data?.message };
        }
    }
}),{
    name: 'accessory-storage',
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({
        accessories: state.accessories,
        hasHydrated: state.hasHydrated,
        pagination: state.pagination,
    }),
    onRehydrateStorage: (state) => {
        console.log('hydration starts');
        return (state, error) => {
            if (state) {
                state.setHasHydrated(true);
            }
            if (error) {
                console.log('hydration error:', error);
            }
        };
    },
    }
))

export default useAccessoryStore;