import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import authService from "components/axios/authService.js";
import useScreenStore from "components/zustand/useScreenStore.js";

const useUnpaidStore = create(
    persist(
        (set, get) => ({
            // State
            unpaidOrders: [],
            processedRefunds: new Set(),
            processedCompletions: new Set(),
            isLoading: false,
            isRefunding: {},
            isCompleting: {},
            error: null,
            lastUpdated: null,
            hasHydrated: false,

            // Hydration handler
            setHasHydrated: (state) => {
                set({
                    hasHydrated: state
                });
            },


            resetStore: async () => {
                try {
                    // First reset the store state
                     set({
                        unpaidOrders: [],
                        processedRefunds: new Set(),
                        processedCompletions: new Set(),
                        isLoading: false,
                        isRefunding: {},
                        isCompleting: {},
                        error: null,
                        lastUpdated: null,
                        hasHydrated: false,
                    });


                } catch (error) {
                    console.error('Reset store failed:', error);
                    return false;
                }
            },
            // Fetch unpaid orders
            fetchUnpaidOrders: async () => {
                set({ isLoading: true, error: null });
                try {
                    const response = await authService.axiosInstance.get('/api/saved2');

                    set({
                        unpaidOrders: response.data.data,
                        isLoading: false,
                        lastUpdated: new Date().toISOString()
                    });

                    return { success: true, data: response.data.data };
                } catch (error) {
                    set({
                        isLoading: false,
                        error: error.message
                    });
                    throw error;
                }
            },

            addNewOrder: (newOrder) => {
                set(state => ({
                    unpaidOrders: [{
                        ...newOrder,
                        addedAt: new Date().toISOString() // Add timestamp
                    }, ...state.unpaidOrders],
                    lastUpdated: new Date().toISOString()
                }));
            },

            // Refund an order
            refundOrder: async (id) => {
                if (get().isRefunding[id]) return;

                set(state => ({
                    isRefunding: { ...state.isRefunding, [id]: true },
                    error: null
                }));

                try {
                    const response = await authService.axiosInstance.get(`/api/refund2/${id}`);

                    if (response.status === 200) {
                        // Immediately remove from unpaid orders and add to processed
                        set(state => ({
                            unpaidOrders: state.unpaidOrders.filter(item => item.id !== id),
                            isRefunding: { ...state.isRefunding, [id]: false },
                            lastUpdated: new Date().toISOString()
                        }));
                        return { success: true, message: "Refund successful" };
                    }
                    throw new Error(response.data?.message || "Refund failed");
                } catch (error) {
                    set(state => ({
                        isRefunding: { ...state.isRefunding, [id]: false },
                        error: error.message
                    }));
                    throw error;
                }
            },

            completeOrder: async (id) => {
                if (get().isCompleting[id]) return;

                set(state => ({
                    isCompleting: { ...state.isCompleting, [id]: true },
                    error: null
                }));

                try {
                    const response = await authService.axiosInstance.post(`/api/complete2/${id}`);

                    if (response.status === 200) {
                        // Immediately remove from unpaid orders and add to processed
                        set(state => ({
                            unpaidOrders: state.unpaidOrders.filter(item => item.id !== id),
                            isCompleting: { ...state.isCompleting, [id]: false },
                            lastUpdated: new Date().toISOString()
                        }));

                        return { success: true, message: "Order completed successfully" };
                    }
                    throw new Error(response.data?.message || "Completion failed");
                } catch (error) {
                    set(state => ({
                        isCompleting: { ...state.isCompleting, [id]: false },
                        error: error.message
                    }));
                    throw error;
                }
            },

            // Other methods remain the same but add action types to set calls
            clearProcessedHistory: () => {
                set({
                    processedRefunds: new Set(),
                    processedCompletions: new Set(),
                    lastUpdated: new Date().toISOString()
                }, false, { type: 'CLEAR_HISTORY' });
            },

            updateOrder: (id, updates) => {
                set(state => ({
                    unpaidOrders: state.unpaidOrders.map(order =>
                        order.id === id ? { ...order, ...updates } : order
                    ),
                    lastUpdated: new Date().toISOString()
                }), false, { type: 'UPDATE_ORDER' });
            },

            // Existing utility methods
            getOrderById: (id) => {
                const order = get().unpaidOrders.find(order => order.id === id);
                return order || null;
            },

            isOrderProcessing: (id) => {
                const state = get();
                return state.isRefunding[id] || state.isCompleting[id];
            }
        }),
        {
            name: 'unpaid-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                unpaidOrders: state.unpaidOrders,
                lastUpdated: state.lastUpdated,
                hasHydrated: state.hasHydrated
            }),
            onRehydrateStorage: (state) => {
                return (state) => {
                    if (state) {
                        state.setHasHydrated(true);
                    }
                };
            }
        }
    )
);

export default useUnpaidStore;