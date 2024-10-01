import {useDispatch, useSelector} from 'react-redux';
import { useToast } from '@chakra-ui/react';
import { setShopData} from 'components/redux/actions/shopActions';
import {apiService} from "../../apiService.js";


export const useSellComplete = (token, setButtonStates,setCustomer,setSearchParam) => {
    const dispatch = useDispatch();
    const toast = useToast();
    const shopData = useSelector(state => state.shop.shopData);
    const handleComplete = async (selectedItem, sellingPrice, customer, onClose) => {
        if (!selectedItem || !sellingPrice || !customer) {
            toast({
                status: "error",
                description: "Fill in all the details correctly",
                position: "top",
            });
            return;
        }

        setButtonStates(prev => ({ ...prev, complete: true }));

        try {
            // Update search results and shop data immediately
            const completeData = {
                product_name: selectedItem.product_name,
                price: sellingPrice,
                quantity: 1,
                customer_name: customer,
            },updateItem = item => ({
                ...item,
                quantity: Math.max(0, item.quantity - 1)
            })


            const updatedShopData = shopData.map(item =>
                item.id === selectedItem.id ? updateItem(item) : item
            );
            dispatch(setShopData(updatedShopData));
            const {status,data} = await apiService.sellScreens(token,completeData,selectedItem.id)

            if (status !== 200) {
                throw new Error("Error while selling item");
            }
            const transaction_id = data.transaction_id;

            const completeResponse = await apiService.completeOrder(token,transaction_id)
            if (completeResponse.status === 200) {
                toast({
                    title: "Success",
                    description: "Transaction completed successfully",
                    status: "success",
                    position: "top",
                    duration: 3000,
                    isClosable: true,
                });
                onClose();
                setCustomer("") // Clear customer input
                setSearchParam("")
            } else {
                throw new Error("Unable to complete transaction");
            }
        } catch (error) {
            // If there's an error , revert both search results and shop data updates
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
                position: "top",
                isClosable: true,
            });
            console.error(error)
        } finally {
            setButtonStates(prev => ({ ...prev, complete: false }));
        }
    };

    return { handleComplete };
};