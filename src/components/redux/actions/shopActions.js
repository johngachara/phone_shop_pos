import { apiService } from "../../../apiService.js";
import { useNavigate } from "react-router-dom";

// Action Types
export const ACTIONS = {
    SET_SHOP: {
        DATA: 'shop/setData',
        LOADING: 'shop/setLoading',
        ERROR: 'shop/setError'
    },
    SET_ACCESSORY: {
        DATA: 'accessory/setData',
        LOADING: 'accessory/setLoading'
    },
    SET_SAVED: {
        DATA: 'saved/setData',
        LOADING: 'saved/setLoading',
        REMOVE_ITEM: 'saved/removeItem'
    },
    SET_SEARCH: {
        RESULTS: 'search/setResults',
        ACCESSORY_RESULTS: 'search/setAccessoryResults'
    }
};

// Action Creators
const createAction = (type) => (payload) => ({ type, payload });

// Basic Actions
export const setShopData = createAction(ACTIONS.SET_SHOP.DATA);
export const setLoading = createAction(ACTIONS.SET_SHOP.LOADING);
export const setError = createAction(ACTIONS.SET_SHOP.ERROR);
export const setAccessoryData = createAction(ACTIONS.SET_ACCESSORY.DATA);
export const setAccessoryLoading = createAction(ACTIONS.SET_ACCESSORY.LOADING);
export const setSavedData = createAction(ACTIONS.SET_SAVED.DATA);
export const setSavedLoading = createAction(ACTIONS.SET_SAVED.LOADING);
export const removeSavedItem = createAction(ACTIONS.SET_SAVED.REMOVE_ITEM);
export const setSearchResults = createAction(ACTIONS.SET_SEARCH.RESULTS);
export const setAccessorySearchResults = createAction(ACTIONS.SET_SEARCH.ACCESSORY_RESULTS);

// Thunk for handling API errors
const handleApiError = (error, toast, customMessage = null) => {
    console.error(error);
    toast({
        status: 'error',
        description: customMessage || error.message,
        position: 'top',
        duration: 3000,
        isClosable: true,
    });
};

// Thunks with optimistic updates and proper error handling
export const fetchShopData = (token, page, navigate, toast) => async (dispatch) => {
    dispatch(setLoading(true));
    try {
        const { data } = await apiService.getShop2Screens(token, page, navigate,dispatch,toast,setLoading);
        dispatch(setShopData(data.results));
    } catch (error) {
         console.error(error)
    } finally {
        dispatch(setLoading(false));
    }
};

export const fetchAccessories = (token, page, navigate, toast) => async (dispatch) => {
    dispatch(setAccessoryLoading(true));
    try {
        const { data } = await apiService.getAccessories(token, page, navigate,dispatch,toast,setAccessoryLoading);
        dispatch(setAccessoryData(data.items));
    } catch (error) {
        console.error(error)
    } finally {
        dispatch(setAccessoryLoading(false));
    }
};

export const handleItemRemoval = (id, token, navigate, toast, type = 'refund') => async (dispatch) => {
    // Optimistic update
    dispatch(removeSavedItem(id));
    try {
        const action = type === 'refund' ?
            () => apiService.refundItem(token, id) :
            () => apiService.completeOrder(token, id);

        const response = await action();

        if (response.status === 200) {
            toast({
                status: 'success',
                description: `Item ${type === 'refund' ? 'refunded' : 'completed'} successfully`,
                position: 'bottom-right',
            });
        } else {
            throw new Error('Operation failed');
        }
    } catch (error) {
        // Revert optimistic update on failure
        dispatch(fetchUnpaidOrders(token, navigate, toast));
        console.error(error)
    }
};

export const fetchUnpaidOrders = (token, navigate, toast) => async (dispatch) => {
    dispatch(setSavedLoading(true));
    try {
        const { status, data } = await apiService.getSavedItems(token, navigate);

        if (status !== 200) {
            throw new Error("Unable to fetch data");
        }

        const transformedData = data.data || [];
        dispatch(setSavedData(transformedData));
    } catch (error) {
        console.error(error)
    } finally {
        dispatch(setSavedLoading(false));
    }
};