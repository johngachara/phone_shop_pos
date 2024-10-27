import {STALE_TIME, updateState} from "components/redux/reducers/unpaidOrdersReducer.js";
import {ACTIONS} from "components/redux/actions/shopActions.js";


// Accessory Reducer
const accessoryInitialState = {
    accessoryData: [],
    loading: false,
    error: null,
    lastUpdated: null,
    staleTime: STALE_TIME,
    currentPage: 1,
    hasMore: true
};

export const accessoryReducer = (state = accessoryInitialState, action) => {
    switch (action.type) {
        case ACTIONS.SET_ACCESSORY.DATA:
            return updateState(state, {
                accessoryData: action.payload,
                error: null,
                hasMore: action.payload.length > 0
            });

        case ACTIONS.SET_ACCESSORY.LOADING:
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


export default accessoryReducer;