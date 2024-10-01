import {SET_ACCESSORY_SEARCH_RESULTS} from "components/redux/actions/shopActions.js";

const initialState = {
    accessoryResults: []
};

export const searchAccessoryReducer = (state = initialState, action) => {
    switch (action.type) {
        case SET_ACCESSORY_SEARCH_RESULTS:
            return {
                ...state,
                accessoryResults: action.payload
            };
        default:
            return state;
    }
};