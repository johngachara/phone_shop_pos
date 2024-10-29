import { ACTIONS } from '../actions/shopActions.js';
import { REHYDRATE } from 'redux-persist';

const STALE_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

const shopInitialState = {
    shopData: [],
    loading: false,
    error: null,
    lastUpdated: null,
    staleTime: STALE_TIME,
    lastFetch : null,
    currentPage: 1,
    hasMore: true
};

export const updateState = (state, updates) => ({
    ...state,
    ...updates,
    lastUpdated: Date.now()
});

export const shopReducer = (state = shopInitialState, action) => {
    switch (action.type) {
        case REHYDRATE: {
            const incoming = action.payload?.shop;
            if (incoming) {
                return {
                    ...incoming,
                    loading: false,
                    error: null
                };
            }
            return state;
        }

        case ACTIONS.SET_SHOP.UPDATE_ITEM:
            return {
                ...state,
                shopData: state.shopData.map(item =>
                    item.id === action.payload.id
                        ? {
                            ...item,
                            ...action.payload,
                            lastUpdated: Date.now()
                        }
                        : item
                ),
                lastUpdated: Date.now()
            };

        case ACTIONS.SET_SHOP.DATA:
            return {
                ...state,
                shopData: state.currentPage === 1
                    ? action.payload.results
                    : [...state.shopData, ...action.payload.results],
                hasMore: action.payload.next !== null,
                currentPage: state.currentPage,
                total: action.payload.count || state.total,
                lastFetch: Date.now()  // Track when we last fetched
            };


        case ACTIONS.SET_SHOP.LOADING:
            return updateState(state, {
                loading: action.payload
            });

        case ACTIONS.SET_SHOP.ERROR:
            return updateState(state, {
                error: action.payload,
                loading: false
            });

        // Add a new case for handling item updates
        case 'shop/updateItem': {
            const updatedShopData = state.shopData.map(item =>
                item.id === action.payload.id ? { ...item, ...action.payload } : item
            );

            return updateState(state, {
                shopData: updatedShopData
            });
        }

        default:
            return state;
    }
};

export default shopReducer;
