import { ACTIONS } from '../actions/shopActions.js';

// Utility function to handle state updates
export const updateState = (state, updates) => ({
    ...state,
    ...updates,
    lastUpdated: Date.now()
});

// Constants
export const STALE_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds
// Unpaid Orders Reducer
const unpaidOrdersInitialState = {
    savedData: [],
    loading: false,
    error: null,
    lastUpdated: null,
    staleTime: STALE_TIME,
    lastSuccessfulSync: null,
};

export const unpaidOrdersReducer = (state = unpaidOrdersInitialState, action) => {
    switch (action.type) {
        case ACTIONS.SET_SAVED.DATA:
            return updateState(state, {
                savedData: action.payload,
                error: null,
            });
        case 'SYNC_SUCCESS':
            return updateState(state, {
                lastSuccessfulSync: action.payload
            });
        case ACTIONS.SET_SAVED.LOADING:
            return updateState(state, {
                loading: action.payload
            });

        case ACTIONS.SET_SAVED.REMOVE_ITEM:
            return updateState(state, {
                savedData: state.savedData.filter(item => item.id !== action.payload)
            });

        case ACTIONS.SET_ERROR:
            return updateState(state, {
                error: action.payload,
                loading: false
            });

        default:
            return state;
    }
};
export default unpaidOrdersReducer;