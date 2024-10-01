import { SET_SHOP_DATA, SET_LOADING, SET_ERROR } from 'components/redux/actions/shopActions.js';

const initialState = {
    shopData: null,
    loading: false,
    error: null,
};

const shopReducer = (state = initialState, action) => {
    switch (action.type) {
        case SET_SHOP_DATA:
            return { ...state, shopData: action.payload };
        case SET_LOADING:
            return { ...state, loading: action.payload };
        case SET_ERROR:
            return { ...state, error: action.payload };
        default:
            return state;
    }
};

export default shopReducer;