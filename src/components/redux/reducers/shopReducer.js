import { ACTIONS } from '../actions/shopActions.js';
import {STALE_TIME, updateState} from "components/redux/reducers/unpaidOrdersReducer.js";
// Shop Reducer
const shopInitialState = {
    shopData: [],
    loading: false,
    error: null,
    lastUpdated: null,
    staleTime: STALE_TIME,
    currentPage: 1,
    hasMore: true
};

export const shopReducer = (state = shopInitialState, action) => {
    switch (action.type) {
        case ACTIONS.SET_SHOP.DATA:
            return updateState(state, {
                shopData: action.payload,
                error: null,
                hasMore: action.payload.length > 0
            });

        case ACTIONS.SET_SHOP.LOADING:
            return updateState(state, {
                loading: action.payload
            });

        case ACTIONS.SET_SHOP.ERROR:
            return updateState(state, {
                error: action.payload,
                loading: false
            });

        default:
            return state;
    }
};


export default shopReducer;