import { SET_ACCESSORY_DATA, SET_ACCESSORY_LOADING } from 'components/redux/actions/shopActions.js';

const initialState = {
    accessoryData: null,
    accessoryLoading: false
};

const accessoryReducer = (state = initialState, action) => {
    switch (action.type) {
        case SET_ACCESSORY_DATA:
            return { ...state, shopData: action.payload }; // misuse of shopData here.should have used accessory data but anyway it works.
        case SET_ACCESSORY_LOADING:
            return { ...state, loading: action.payload };
        default:
            return state;
    }
};

export default accessoryReducer;