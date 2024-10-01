import {apiService} from "../../../apiService.js";

export const SET_SEARCH_RESULTS = 'SET_SEARCH_RESULTS';
export const setSearchResults = (results) => ({
    type: SET_SEARCH_RESULTS,
    payload: results
});
export const SET_ACCESSORY_SEARCH_RESULTS = 'SET_ACCESSORY_SEARCH_RESULTS';
export const setAccessorySearchResults = (results) => ({
    type: SET_ACCESSORY_SEARCH_RESULTS,
    payload: results
});
export const  SET_SAVED_DATA = "SET_SAVED_DATA";
export const setSavedData = (data) => ({
    type: SET_SAVED_DATA,
    payload: data
})
export const SET_SAVED_LOADING = "SET_SAVED_LOADING";
export const setSavedLoading = (loading) => ({
    type: SET_SAVED_LOADING,
    payload: loading
})
export const SET_SHOP_DATA = 'SET_SHOP_DATA';
export const SET_LOADING = 'SET_LOADING';
export const SET_ERROR = 'SET_ERROR';
export const SET_ACCESSORY_DATA = 'SET_ACCESSORY_DATA';
export const SET_ACCESSORY_LOADING = 'SET_ACCESSORY_LOADING';
export const setAccessoryData = (accessoryData) => ({type: SET_ACCESSORY_DATA,payload:accessoryData});
export const setAccessoryLoading = (accessoryLoading) => ({type: SET_ACCESSORY_LOADING,payload:accessoryLoading});
export const setShopData = (data) => ({ type: SET_SHOP_DATA, payload: data });
export const setLoading = (isLoading) => ({ type: SET_LOADING, payload: isLoading });
export const setError = (error) => ({ type: SET_ERROR, payload: error });
export const fetchShopData = (token, page,navigate,toast) => async (dispatch) => {
    dispatch(setLoading(true));
    try {
        const {data} = await apiService.getShop2Screens(token,page)
        dispatch(setShopData(data.results));
    } catch (error) {
        toast({
            status: 'error',
            description: error.message,
            position: 'top',
        })
    } finally {
        dispatch(setLoading(false));
    }
};
export const  fetchAccessories =  (token,page,navigate,toast) => async (dispatch)=> {
    dispatch(setAccessoryLoading(true))
    try {

        const {data} = await apiService.getAccessories(token,page)
        dispatch(setAccessoryData(data.items))
    } catch (err) {
        toast({
            title: "Error",
            position:'top',
            description: err.message,
            status: "error",
            duration: 3000,
            isClosable: true,
        });
        console.error("Error fetching shop data:", err);
    } finally {
        dispatch(setAccessoryLoading(false))
    }
};
export const fetchUnpaidOrders =  (token,navigate,toast) => async (dispatch)=>{
    try {
        dispatch(setSavedLoading(true))
        const {status,data} = await apiService.getSavedItems(token)
        if (status !== 200) {
            throw new Error("Unable to fetch data");
        }
       dispatch(setSavedData(data.data || []))
    } catch (error) {
        toast({
            status: 'error',
            description: error.message,
        })
        console.error("Error fetching shop data:", error);
    }
    finally {
        dispatch(setSavedLoading(false))
    }
}