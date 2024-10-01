import { configureStore } from '@reduxjs/toolkit'
import shopReducer from 'components/redux/reducers/shopReducer.js';
import accessoryReducer from "components/redux/reducers/accessoryReducer.js";
import {searchReducer} from "components/redux/reducers/searchReducer.js";
import {searchAccessoryReducer} from "components/redux/reducers/searchAccessoryReducer.js";
import unpaidOrdersReducer from "components/redux/reducers/unpaidOrdersReducer.js";


const store = configureStore({
    reducer:{
        shop: shopReducer,
        accessory : accessoryReducer,
        search : searchReducer,
        searchAccessory : searchAccessoryReducer,
        savedOrders : unpaidOrdersReducer
    }});

export default store;
