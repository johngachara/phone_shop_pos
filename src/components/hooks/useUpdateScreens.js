import { useDispatch, useSelector } from "react-redux";
import { useToast } from "@chakra-ui/react";
import {setSearchResults, setShopData, updateShopItemThunk} from "components/redux/actions/shopActions";
import {apiService} from "../../apiService.js";
export const useUpdateScreens = (token, setButtonStates) => {
    const dispatch = useDispatch();
    const toast = useToast();

    const handleUpdate = async (item, updatedData, onClose, currentPage) => {
        try {
            setButtonStates(prev => ({ ...prev, update: true }));

            await dispatch(updateShopItemThunk(token, updatedData, item.id));

            toast({
                title: "Success",
                description: "Item updated successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom-right"
            });

            onClose();
        } catch (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to update item",
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "bottom-right"
            });
        } finally {
            setButtonStates(prev => ({ ...prev, update: false }));
        }
    };

    return { handleUpdate };
};