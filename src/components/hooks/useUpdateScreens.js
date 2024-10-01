import { useDispatch, useSelector } from "react-redux";
import { useToast } from "@chakra-ui/react";
import {setSearchResults, setShopData} from "components/redux/actions/shopActions";
import {apiService} from "../../apiService.js";


export const useUpdateScreens = (token, setButtonStates) => {
    const dispatch = useDispatch();
    const toast = useToast();
    const screens = useSelector(state => state.shop.shopData);
    const searchResults = useSelector(state => state.search.results);
    const handleUpdate = async (selectedItem, updatedData, onClose) => {
        if (!selectedItem || !updatedData) {
            toast({
                status: "error",
                description: "Please fill in all the details correctly.",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setButtonStates(prev => ({ ...prev, update: true }));

        try {
            const updateResponse = await apiService.updateScreens(token,updatedData,selectedItem.id)
            if (updateResponse.status !== 200) {
                throw new Error(updateResponse.message||"Error while updating the item.");
            }

            const updatedItem = {
                ...selectedItem,
                price: updatedData.price,
                quantity: updatedData.quantity,
                product_name: updatedData.product_name
            };

            // Update Redux store for shop data
            const updatedScreens = screens.map(item =>
                item.id === selectedItem.id ? updatedItem : item
            );
            dispatch(setShopData(updatedScreens));

            // Update Redux store for search results
            const updatedSearchResults = searchResults.map(item =>
                item.id === selectedItem.id ? updatedItem : item
            );
            dispatch(setSearchResults(updatedSearchResults));

            onClose();

            toast({
                status: "success",
                description: "Item updated successfully",
                position: "top",
            });

        } catch (error) {
            toast({
                title: "Error",
                description: error.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setButtonStates(prev => ({ ...prev, update: false }));
        }
    };

    return { handleUpdate };
};