import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from "components/authService.js";
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
            isCompleting : false ,

            resetStore : () => set({
                data: [],
                isLoading: false,
                page: 1,
                isAddLoading: false,
                isUpdateLoading: false,
                isDeletingLoading: false,
                isSellingLoading: false,
                isCompleting : false ,
            }),

            fetchNextPage: async () => {
                const nextPage = get().page + 1;
                set({ page: nextPage });
                await get().fetchScreens();
            },

            fetchScreens: async () => {
                const currentPage = get().page;
                set({ isLoading: true });
                try {
                    const { data } = await authService.axiosInstance.get('/api/get_shop2_stock', {
                        params: { page: currentPage }
                    });
                    // Merge new data instead of replacing
                    set(state => ({
                        data: currentPage === 1 ? data.results : [...state.data, ...data.results],
                        isLoading: false
                    }));
                } catch (error) {
                    set({ isLoading: false });
                    console.error('Failed to fetch screens:', error);
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
                    const errorData = e.response.data;
                    const errorMessages = Object.entries(errorData).map(([field, messages]) => {
                        return `${field}: ${messages[0].replace("sho p2_stoc k_fix", "This product")}`;
                    });
                    return { message: errorMessages || 'An error occurred while adding product' };
                }
            },

            updateScreen: async (updateData, setSearchParam,closeDrawer) => {
                set({ isUpdateLoading: true });
                try {
                    const response = await authService.axiosInstance.put(
                        `/api/update_stock2/${updateData.id}`,
                        updateData
                    );
                    if (response.status === 200) {
                        setSearchParam('');
                        await get().resetStore()
                        closeDrawer()
                        await get().fetchScreens();
                        set(() => ({
                            isUpdateLoading: false,
                        }));

                    }
                    return { status: response.status };
                } catch (e) {
                    set({ isUpdateLoading: false });
                    const errorData = e.response?.data;
                    if (errorData) {
                        const fieldErrors = {};
                        Object.entries(errorData).forEach(([field, errors]) => {
                            if (Array.isArray(errors) && errors.length > 0) {
                                fieldErrors[field] = errors[0].string || 'Invalid value';
                            }
                        });
                        return {
                            status: e.response.status,
                            message: 'Validation failed',
                            errors: fieldErrors,
                        };
                    }
                    return {
                        status: e.response?.status || 500,
                        message: 'An error occurred while updating product',
                    };
                }
            },
            deleteScreen : async (id,setSearchParam,setDialogOpen) => {
                try {
                    set({isDeletingLoading: true});
                    const response = await authService.axiosInstance.delete(`/api/delete_stock2_api/${id}`);
                    if(response.status === 200) {
                        setSearchParam('');
                        await get().resetStore()
                        setDialogOpen(false)
                        await get().fetchScreens();
                        set(() => ({
                            isDeletingLoading: false,
                        }))
                    }
                    return {
                        status: response.status,
                    };
                } catch (e) {
                    set({ isDeletingLoading: false });
                    return {
                        message: e.message
                    };
                }
            },
            sellScreen: async (id, sellData,setSearchParam,closeDrawer) => {
                try {
                    set({isSellingLoading: true});
                    const response = await authService.axiosInstance.post(`/api/sell2/${id}`, sellData);
                    if(response.status === 200) {
                        setSearchParam('');
                        await get().resetStore()
                        closeDrawer()
                        await get().fetchScreens();
                        set(() => ({
                            isSellingLoading : false,
                        }))
                        await useUnpaidStore.getState().resetStore()
                    }
                    return {
                        status: response.status,
                        data: response.data
                    };
                } catch (e) {
                    set({ isSellingLoading: false });
                    return {
                        message: e.message
                    };
                }
            },
            completeScreen : async (id,sellData ,setSearchParam,closeDrawer) => {
                try {
                    set({isCompleting:true})
                    const response = await authService.axiosInstance.post(`/api/sell2/${id}`, sellData);
                    const transaction_id = response.data.transaction_id;
                    const finalResponse = await authService.axiosInstance.post(`/api/complete2/${transaction_id}`, {});
                    if (finalResponse.status === 200) {
                        setSearchParam('');
                        await get().resetStore()
                        closeDrawer()
                        await get().fetchScreens();
                        set(() => ({
                            isCompleting : false,
                        }))
                    }
                    return {
                        status: response.status,
                    };
                } catch (e) {
                    set({isCompleting:false})
                    return {
                        message: e.message
                    };
                }
            }
        }),
        {
            name: 'screen-storage', // Name for the persisted store
            partialize: (state) => ({
                data: state.data
            })
        }
    )
);

export default useScreenStore;