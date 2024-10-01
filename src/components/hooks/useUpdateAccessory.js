import { useDispatch, useSelector } from "react-redux";
import { useToast } from "@chakra-ui/react";
import { useState } from "react";
import { setAccessoryData, setAccessorySearchResults } from "components/redux/actions/shopActions";
import {apiService} from "../../apiService.js";

export const useUpdateAccessory = (token) => {
    const dispatch = useDispatch();
    const toast = useToast();
    const [isUpdating, setIsUpdating] = useState(false);

    const accessories = useSelector(state => state.accessory.shopData);
    const searchResults = useSelector(state => state.searchAccessory.accessoryResults);

    const handleUpdate = async (selectedItem, sellingPrice, sellingQuantity, setIsDrawerOpen) => {
        // Default to 0 if sellingPrice or sellingQuantity is not provided
        sellingPrice = sellingPrice && !isNaN(sellingPrice) ? sellingPrice : 0;
        sellingQuantity = sellingQuantity && !isNaN(sellingQuantity) ? sellingQuantity : 0;
        setIsUpdating(true);
        const dataToSend = {
            product_name: selectedItem.product_name,
            price: sellingPrice,
            quantity: sellingQuantity,
        };

        try {
            const res = await apiService.updateAccessories(token, dataToSend,selectedItem.id);
            if (res.status !== 200) {
                throw new Error(res.message || "Failed to update the product");
            }

            toast({
                title: "Success",
                description: "Accessory updated successfully",
                status: "success",
                duration: 3000,
                position: 'top',
                isClosable: true,
            });

            setIsDrawerOpen(false);

            // Update the accessory locally in the Redux state
            const updatedAccessories = accessories.map(item =>
                item.id === selectedItem.id
                    ? { ...item, price: sellingPrice, quantity: sellingQuantity, product_name: selectedItem.product_name }
                    : item
            );

            // Update the search results in the Redux state
            const updatedSearchResults = searchResults.map(item =>
                item.id === selectedItem.id
                    ? { ...item, price: sellingPrice, quantity: sellingQuantity, product_name: selectedItem.product_name }
                    : item
            );

            // Dispatch the updated accessories list and search results
            dispatch(setAccessoryData(updatedAccessories));
            dispatch(setAccessorySearchResults(updatedSearchResults));

        } catch (error) {
            toast({
                title: "Error",
                description: error.message,
                status: "error",
                position: 'top',
                duration: 3000,
                isClosable: true,
            });
            console.error("Error:", error);
        } finally {
            setIsUpdating(false);
        }
    };

    return { isUpdating, handleUpdate };
};
