import { useDispatch, useSelector } from "react-redux";
import { setShopData} from "components/redux/actions/shopActions";
import { useToast } from "@chakra-ui/react";
import {apiService} from "../../apiService.js";

export const useSellScreens = (token, setButtonStates,setCustomer,setSearchParam) => {
    const dispatch = useDispatch();
    const toast = useToast();
    const shopData = useSelector(state => state.shop.shopData);

    const handleSell = async (selectedItem, sellingPrice, customer, onClose) => {
        if (!selectedItem || !sellingPrice || !customer) {
            toast({
                status: "error",
                description: "Please fill in all the details correctly.",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setButtonStates(prev => ({ ...prev, sell: true }));

        try {
            // Update search results and shop data immediately
            const sellData = {
                product_name: selectedItem.product_name,
                price: sellingPrice,
                quantity: 1,
                customer_name: customer,
            }, updateItem = item => ({
                ...item,
                quantity: Math.max(0, item.quantity - 1)
            })

            const updatedShopData = shopData.map(item =>
                item.id === selectedItem.id ? updateItem(item) : item
            );
            dispatch(setShopData(updatedShopData));

            // Perform the API call
            const {status} = await apiService.sellScreens(token,sellData,selectedItem.id)
            if (status !== 200) {
                throw new Error("Error while selling the item.");
            }

            onClose();
            setCustomer("") // Clear the customer input
            setSearchParam("") //Clear search parameter
            toast({
                status: "success",
                description: "Item sold successfully",
                position: "top",
            });

        } catch (error) {
            // If there's an error, revert both search results and shop data updates
            const revertItem = item => ({
                ...item,
                quantity: item.quantity + 1
            });
            const revertedShopData = shopData.map(item =>
                item.id === selectedItem.id ? revertItem(item) : item
            );
            dispatch(setShopData(revertedShopData));

            toast({
                title: "Error",
                description: error.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setButtonStates(prev => ({ ...prev, sell: false }));
        }
    };

    return { handleSell };
};