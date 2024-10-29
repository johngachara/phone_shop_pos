import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from "components/authService.js";

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

            // Setters
            setError: (error) => set({ error }),
            clearError: () => set({ error: null }),

            // Reset store
            resetStore: () => set({
                unpaidOrders: [],
                processedRefunds: new Set(),
                processedCompletions: new Set(),
                isLoading: false,
                isRefunding: {},
                isCompleting: {},
                error: null,
                lastUpdated: null
            }),

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

                    set({
                        unpaidOrders: filteredOrders,
                        isLoading: false,
                        lastUpdated: new Date().toISOString()
                    });

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
                        }));
                        return { success: true, message: "Refund successful" };
                    }

                    throw new Error(response.data?.message || "Refund failed");
                } catch (error) {
                    const errorMessage = error.response?.data?.message || error.message || "Refund failed";
                    set(state => ({
                        isRefunding: { ...state.isRefunding, [id]: false },
                        error: errorMessage
                    }));
                    return { success: false, error: errorMessage };
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
                        }));
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

            // Get order by ID
            getOrderById: (id) => {
                const order = get().unpaidOrders.find(order => order.id === id);
                return order || null;
            },

            // Clear processed history
            clearProcessedHistory: () => {
                set({
                    processedRefunds: new Set(),
                    processedCompletions: new Set(),
                    lastUpdated: new Date().toISOString()
                });
            },

            // Update single order
            updateOrder: (id, updates) => {
                set(state => ({
                    unpaidOrders: state.unpaidOrders.map(order =>
                        order.id === id ? { ...order, ...updates } : order
                    ),
                    lastUpdated: new Date().toISOString()
                }));
            },

            // Check if order is being processed
            isOrderProcessing: (id) => {
                const state = get();
                return state.isRefunding[id] || state.isCompleting[id];
            }
        }),
        {
            name: 'unpaid-storage',
            partialize: (state) => ({
                unpaidOrders: state.unpaidOrders,
                processedRefunds: Array.from(state.processedRefunds),
                processedCompletions: Array.from(state.processedCompletions),
                lastUpdated: state.lastUpdated
            }),
            merge: (persistedState, currentState) => ({
                ...currentState,
                ...persistedState,
                processedRefunds: new Set(persistedState.processedRefunds),
                processedCompletions: new Set(persistedState.processedCompletions)
            })
        }
    )
);

export default useUnpaidStore;