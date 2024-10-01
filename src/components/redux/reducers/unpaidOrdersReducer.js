import {SET_SAVED_DATA, SET_SAVED_LOADING} from "components/redux/actions/shopActions.js";


const initialState = {
    savedData:null,
    loading:false
}
const unpaidOrdersReducer = (state = initialState, action) => {
    switch (action.type) {
        case SET_SAVED_DATA:
            return { ...state, savedData: action.payload };
        case SET_SAVED_LOADING:
            return { ...state, loading: action.payload };
        default:
            return state
    }

}
export default unpaidOrdersReducer;