import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import authService from "components/authService.js";
import useScreenStore from "components/zuhan/useScreenStore.js";

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
                    const currentProcessedRefunds = get().processedRefunds;
                    const currentProcessedCompletions = get().processedCompletions;

                    // Filter out processed orders
                    const filteredOrders = response.data.data.filter(
                        order => !currentProcessedRefunds.has(order.id) &&
                            !currentProcessedCompletions.has(order.id)
                    );

                    set(state => ({
                        unpaidOrders: filteredOrders,
                        isLoading: false,
                        lastUpdated: new Date().toISOString()
                    }), false, { type: 'FETCH_UNPAID_ORDERS' });

                    return { success: true, data: filteredOrders };
                } catch (error) {
                    const errorMessage = error.response?.data?.message || "Failed to fetch unpaid orders";
                    set({
                        isLoading: false,
                        error: errorMessage
                    });
                    return { success: false, error: errorMessage };
                }
            },

            // Refund an order
            refundOrder: async (id) => {
                if (get().isRefunding[id]) {
                    return { success: false, error: "Refund already in progress" };
                }

                set(state => ({
                    isRefunding: { ...state.isRefunding, [id]: true },
                    error: null
                }));

                try {
                    const response = await authService.axiosInstance.get(`/api/refund2/${id}`);

                    if (response.status === 200) {
                        set(state => ({
                            unpaidOrders: state.unpaidOrders.filter(item => item.id !== id),
                            processedRefunds: new Set([...state.processedRefunds, id]),
                            isRefunding: { ...state.isRefunding, [id]: false },
                            lastUpdated: new Date().toISOString()
                        }), false, { type: 'REFUND_ORDER' });

                        // Get fresh instance of screen store and reset + fetch new data
                        const screenStore = useScreenStore.getState();
                        await screenStore.resetStore();
                        await screenStore.fetchScreens();

                        return { success: true, message: "Refund successful" };
                    }

                    throw new Error(response.data?.message || "Refund failed");
                } catch (error) {
                    set(state => ({
                        isRefunding: { ...state.isRefunding, [id]: false },
                        error: error.message
                    }));
                    return { success: false, error: error.message };
                }
            },

            // Complete an order
            completeOrder: async (id) => {
                if (get().isCompleting[id]) {
                    return { success: false, error: "Completion already in progress" };
                }

                set(state => ({
                    isCompleting: { ...state.isCompleting, [id]: true },
                    error: null
                }));

                try {
                    const response = await authService.axiosInstance.post(`/api/complete2/${id}`);

                    if (response.status === 200) {
                        set(state => ({
                            unpaidOrders: state.unpaidOrders.filter(item => item.id !== id),
                            processedCompletions: new Set([...state.processedCompletions, id]),
                            isCompleting: { ...state.isCompleting, [id]: false },
                            lastUpdated: new Date().toISOString()
                        }), false, { type: 'COMPLETE_ORDER' });
                        return { success: true, message: "Order completed successfully" };
                    }

                    throw new Error(response.data?.message || "Order completion failed");
                } catch (error) {
                    const errorMessage = error.response?.data?.message || error.message || "Order completion failed";
                    set(state => ({
                        isCompleting: { ...state.isCompleting, [id]: false },
                        error: errorMessage
                    }));
                    return { success: false, error: errorMessage };
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
                processedRefunds: Array.from(state.processedRefunds),
                processedCompletions: Array.from(state.processedCompletions),
                lastUpdated: state.lastUpdated,
                hasHydrated: state.hasHydrated
            }),
            onRehydrateStorage: (state) => {
                return (state) => {
                    if (state) {
                        // Convert Arrays back to Sets after rehydration
                        state.processedRefunds = new Set(state.processedRefunds);
                        state.processedCompletions = new Set(state.processedCompletions);
                        state.setHasHydrated(true);
                    }
                };
            }
        }
    )
);

export default useUnpaidStore;