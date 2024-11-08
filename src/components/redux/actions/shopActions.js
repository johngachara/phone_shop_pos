import { apiService } from "../../../apiService.js";
import { useNavigate } from "react-router-dom";
import authService from "components/axios/authService.js";
import sequalizerAuth from "components/axios/sequalizerAuth.js";

// Action Types
export const ACTIONS = {
    SET_SHOP: {
        DATA: 'shop/setData',
        LOADING: 'shop/setLoading',
        ERROR: 'shop/setError',
        UPDATE_ITEM: 'shop/updateItem'
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

// Add a new action creator for updates
export const updateShopItem = (itemData) => ({
    type: ACTIONS.SET_SHOP.UPDATE_ITEM,
    payload: itemData
});

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


export const updateShopItemThunk = (token, itemData, id) => async (dispatch) => {
    try {
        const response = await authService.axiosInstance.put(`/api/update_stock2/${id}`, itemData);

        if (response.status === 200) {
            // Update with the server response data
            dispatch(updateShopItem({
                ...itemData,  // Use the updated data
                id: id
            }));

            // Don't fetch the entire shop data after update
            return { status: response.status };
        } else {
            throw new Error('Update failed');
        }
    } catch (error) {
        // Only refresh on error
        await dispatch(fetchShopData(token, 1));
        throw error;
    }
};

// Modify fetchShopData to preserve updates
export const fetchShopData = (token, page, navigate, toast) => async (dispatch, getState) => {
    dispatch(setLoading(true));
    try {
        const response = await authService.axiosInstance.get('/api/get_shop2_stock', {
            params: { page }
        });

        if (response.status === 200) {
            const currentState = getState().shop;
            const newData = response.data.results;

            // Merge existing updated items with new data
            const mergedResults = newData.map(newItem => {
                const existingItem = currentState.shopData.find(item => item.id === newItem.id);
                if (existingItem && existingItem.lastUpdated > currentState.lastFetch) {
                    return existingItem;
                }
                return newItem;
            });

            dispatch({
                type: ACTIONS.SET_SHOP.DATA,
                payload: {
                    ...response.data,
                    results: mergedResults
                }
            });
        }

        return response;
    } catch (error) {
        dispatch({
            type: ACTIONS.SET_SHOP.ERROR,
            payload: error.message
        });
        throw error;
    } finally {
        dispatch(setLoading(false));
    }
};

// Add a new action to handle server-side updates
export const syncShopData = (token) => async (dispatch) => {
    try {
        const response = await authService.axiosInstance.get('/api/get_shop2_stock', {
            params: { page: 1 }
        });

        if (response.status === 200) {
            dispatch({
                type: ACTIONS.SET_SHOP.DATA,
                payload: response.data
            });
        }
    } catch (error) {
        console.error('Failed to sync shop data:', error);
    }
};

export const fetchAccessories = (token, page, navigate, toast) => async (dispatch) => {
    dispatch(setAccessoryLoading(true));
    try {
        const { data } = await sequalizerAuth.axiosInstance('/nodeapp/Findall',{
            params: { page }
        })
        console.log(data)
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