import { useDispatch, useSelector } from "react-redux";
import { useToast } from "@chakra-ui/react";
import { useState } from "react";
import {setAccessoryData, setAccessorySearchResults} from "components/redux/actions/shopActions.js";
import {apiService} from "../../apiService.js";

export const useSellAccessory = (token) => {
    const dispatch = useDispatch();
    const toast = useToast();
    const [isSelling, setIsSelling] = useState(false);
    const accessories = useSelector(state => state.accessory.shopData);
    const searchResults = useSelector(state => state.searchAccessory.accessoryResults);
    const handleSell = async (selectedItem, sellingPrice, sellingQuantity, customer, setIsDrawerOpen) => {
        if (!selectedItem.product_name || !sellingPrice || !sellingQuantity || !customer) {
            toast({
                status: "error",
                position: 'top',
                description: "Fill in all the details"
            });
            return;
        }

        setIsSelling(true);

        const dataToSend = {
            product_name: selectedItem.product_name,
            selling_price: sellingPrice * sellingQuantity,
            quantity: sellingQuantity,
            customer: customer,
        };

        // Ensure quantities are numbers
        const availableQuantity = Number(selectedItem.quantity);
        const sellQuantity = Number(sellingQuantity);

        //console.log('Selling Quantity:', sellQuantity, 'Available Quantity:', availableQuantity);

        if (sellQuantity > availableQuantity) {
            toast({
                title: "Error",
                position: "top",
                description: "Quantity is insufficient",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            setIsSelling(false);
            return;
        }

        try {
           await apiService.sellAccessory(token,selectedItem.id,dataToSend)

            toast({
                title: "Success",
                description: "Accessory sold successfully",
                status: "success",
                position: 'top',
                duration: 3000,
                isClosable: true,
            });

            setIsDrawerOpen(false);

            // Update the accessory locally in the Redux state
            const updatedAccessories = accessories.map(item =>
                item.id === selectedItem.id
                    ? { ...item, quantity: item.quantity - sellingQuantity }
                    : item
            );

            // Update the search results in the Redux state
            const updatedSearchResults = searchResults.map(item =>
                item.id === selectedItem.id
                    ? { ...item, quantity: item.quantity - sellingQuantity}
                    : item
            );

            // Dispatch the updated accessories list and search results
            dispatch(setAccessoryData(updatedAccessories));
            dispatch(setAccessorySearchResults(updatedSearchResults));

        } catch (error) {
            toast({
                title: "Error",
                description: error.message,
                position: 'top',
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            console.error("Error:", error);
        } finally {
            setIsSelling(false);
        }
    };

    return {
        isSelling,
        handleSell
    };
};
