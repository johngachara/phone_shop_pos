import {SET_SEARCH_RESULTS} from "components/redux/actions/shopActions.js";

const initialState = {
    results: []
};

export const searchReducer = (state = initialState, action) => {
    switch (action.type) {
        case SET_SEARCH_RESULTS:
            return {
                ...state,
                results: action.payload
            };
        default:
            return state;
    }
};