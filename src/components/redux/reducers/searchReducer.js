import {ACTIONS} from "components/redux/actions/shopActions.js";
import {STALE_TIME, updateState} from "components/redux/reducers/unpaidOrdersReducer.js";

// Search Related States
const searchInitialState = {
    results: [],
    loading: false,
    error: null,
    lastUpdated: null,
    staleTime: STALE_TIME,
    searchTerm: '',
    currentPage: 1,
    hasMore: true
};

// Main Search Reducer
export const searchReducer = (state = searchInitialState, action) => {
    switch (action.type) {
        case ACTIONS.SET_SEARCH.RESULTS:
            return updateState(state, {
                results: action.payload,
                error: null,
                hasMore: action.payload.length > 0
            });

        case ACTIONS.SET_SEARCH.LOADING:
            return updateState(state, {
                loading: action.payload
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