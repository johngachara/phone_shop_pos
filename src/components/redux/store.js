import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from 'redux';
import { createLogger } from 'redux-logger';
import shopReducer from './reducers/shopReducer';
import accessoryReducer from "./reducers/accessoryReducer";
import { searchReducer } from "./reducers/searchReducer";
import { searchAccessoryReducer } from "./reducers/searchAccessoryReducer";
import unpaidOrdersReducer from "./reducers/unpaidOrdersReducer";

const logger = createLogger({
    collapsed: true,
    predicate: (getState, action) => {
        return action.type.includes('persist') ||
            action.type.includes('shop/') ||
            action.type.includes('accessory/') ||
            action.type.includes('saved/');
    }
});

// Persist configuration for the shop reducer
const shopPersistConfig = {
    key: 'shop',
    storage,
    debug: true,
    blacklist: ['loading', 'error'] // Don't persist these fields
};

const rootReducer = combineReducers({
    shop: persistReducer(shopPersistConfig, shopReducer),
    accessory: accessoryReducer,
    search: searchReducer,
    searchAccessory: searchAccessoryReducer,
    savedOrders: unpaidOrdersReducer
});

const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        }).concat(logger),
    devTools: process.env.NODE_ENV !== 'production'
});

// Add persistence status listener
export const persistor = persistStore(store, null, () => {
    console.log('Rehydration completed');
});

// Add subscription to log state changes
store.subscribe(() => {
    const state = store.getState();
    console.log('Current State:', state);
});

export default store;