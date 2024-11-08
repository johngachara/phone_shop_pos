import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import authService from "components/axios/authService.js";
import useUnpaidStore from "components/zuhan/useUnpaidStore.js";

const useScreenStore = create(
    persist(
        (set, get) => ({
            data: [],
            isLoading: false,
            page: 1,
            isAddLoading: false,
            isUpdateLoading: false,
            isDeletingLoading: false,
            isSellingLoading: false,
            isCompleting: false,
            hasHydrated: true,

            setHasHydrated: (state) => {
                set({
                    hasHydrated: state
                });
            },

            resetStore: async () => {
                try {
                     set({
                        data: [],
                        isLoading: false,
                        page: 1,
                        isAddLoading: false,
                        isUpdateLoading: false,
                        isDeletingLoading: false,
                        isSellingLoading: false,
                        isCompleting: false,
                        hasHydrated: true, // Keep hydration state
                    });
                    return true;
                } catch (error) {
                    console.error('Reset store failed:', error);
                    return false;
                }
            },
            _resetStore: async () => {
                try {
                    // First reset the store state
                    await set({
                        data: [],
                        isLoading: false,
                        page: 1,
                        isAddLoading: false,
                        isUpdateLoading: false,
                        isDeletingLoading: false,
                        isSellingLoading: false,
                        isCompleting: false,
                        hasHydrated: false,
                    });
                    return true;
                } catch (error) {
                    console.error('Reset store failed:', error);
                    return false;
                }
            },

            fetchNextPage: async () => {
                const nextPage = get().page + 1;
                set({ page: nextPage });
                return get().fetchScreens();
            },

            fetchScreens: async () => {
                const currentPage = get().page;
                set({ isLoading: true });
                try {
                    const { data } = await authService.axiosInstance.get('/api/get_shop2_stock', {
                        params: { page: currentPage }
                    });
                    // Always set fresh data regardless of page
                    set({
                        data: data.results,
                        isLoading: false
                    });

                    return data;
                } catch (error) {
                    set({ isLoading: false });
                    console.error('Failed to fetch screens:', error);
                    throw error;
                }
            },

            updateScreen: async (updateData, setSearchParam, closeDrawer) => {
                set({ isUpdateLoading: true });
                try {
                    const response = await authService.axiosInstance.put(
                        `/api/update_stock2/${updateData.id}`,
                        updateData
                    );

                    if (response.status === 200) {
                        set(state => ({
                            data: state.data.map(item =>
                                item.id === updateData.id ? { ...item, ...updateData } : item
                            ),
                            isUpdateLoading: false
                        }), false, { type: 'UPDATE_SCREEN' });
                        setSearchParam('');
                        closeDrawer();
                    }
                    return { status: response.status };
                } catch (e) {
                    set({ isUpdateLoading: false });
                    throw e;
                }
            },

            deleteScreen: async (id, setSearchParam, setDialogOpen) => {
                set({ isDeletingLoading: true });
                try {
                    const response = await authService.axiosInstance.delete(`/api/delete_stock2_api/${id}`);
                    if (response.status === 200) {
                        set(state => ({
                           data: state.data.filter(item => item.id !== id),
                            isDeletingLoading: false
                        }), false, { type: 'DELETE_SCREEN' });
                        setSearchParam('');
                        setDialogOpen(false);
                    }
                    return { status: response.status };
                } catch (e) {
                    set({ isDeletingLoading: false });
                    throw e;
                }
            },

            sellScreen: async (id, sellData, setSearchParam, closeDrawer) => {
                set({ isSellingLoading: true });
                try {
                    const response = await authService.axiosInstance.post(`/api/sell2/${id}`, sellData);
                    if (response.status === 200) {
                        // Update local state
                        set(state => ({
                            data: state.data.map(item =>
                                item.id === id
                                    ? { ...item, status: 'sold', quantity: item.quantity - 1 }
                                    : item
                            ),
                            isSellingLoading: false
                        }));

                        setSearchParam('');
                        closeDrawer();

                        // Important: Get fresh unpaid store instance and add the new order immediately
                        const unpaidStore = useUnpaidStore.getState();
                        const newOrder = {
                            id: response.data.transaction_id, // Assuming API returns this
                            price: sellData.price,
                            quantity : sellData.quantity,
                            customer_name : sellData.customer_name,
                            product_name : sellData.product_name,
                            status: 'unpaid'
                        };
                        // Update unpaid orders immediately
                        unpaidStore.addNewOrder(newOrder);

                        return { status: response.status, data: response.data };
                    }
                    throw new Error('Sale failed');
                } catch (e) {
                    set({ isSellingLoading: false });
                    throw e;
                }
            },
            completeScreen: async (id, sellData, setSearchParam, closeDrawer) => {
                set({ isCompleting: true });
                try {
                    const response = await authService.axiosInstance.post(`/api/sell2/${id}`, sellData);
                    console.log(response)
                    const transaction_id = response.data.transaction_id;
                    const finalResponse = await authService.axiosInstance.post(`/api/complete2/${transaction_id}`, {});

                    if (finalResponse.status === 200) {
                        set(state => ({
                            data: state.data.map(item =>
                                item.id === id
                                    ? { ...item, status: 'completed', quantity : item.quantity - 1 }
                                    : item
                            ),
                            isCompleting: false
                        }), false, { type: 'COMPLETE_SCREEN' });
                        setSearchParam('');
                        closeDrawer();
                    }
                    return { status: response.status };
                } catch (e) {
                    set({ isCompleting: false });
                    throw e;
                }
            },
            addScreen: async (item) => {
                set({ isAddLoading: true });
                try {
                    const response = await authService.axiosInstance.post('/api/add_stock2', item);
                    // Update local state after successful addition
                    if (response.status === 200) {
                        set(state => ({
                            isAddLoading: false
                        }));
                    }

                    return { status: response.status };
                } catch (e) {
                    set({ isAddLoading: false });
                    return { message:  'An error occurred while adding product check whether the product exists' };
                }
            },

        }),
        {
            name: 'screen-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                data: state.data,
                hasHydrated: state.hasHydrated,
            }),
            onRehydrateStorage: (state) => {
                return (state) => {
                    if (state) {
                        state.setHasHydrated(true);
                    }
                };
            },
        }
    )
);

export default useScreenStore;