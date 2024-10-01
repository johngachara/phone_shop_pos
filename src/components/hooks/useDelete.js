import { useState } from 'react';
import {useDispatch, useSelector} from 'react-redux';
import { useToast } from '@chakra-ui/react';
import { setShopData} from 'components/redux/actions/shopActions';
import {apiService} from "../../apiService.js";

export const useDelete = (token, currentPage, setSearchParam, setIsDeleteDialogOpen) => {
    const dispatch = useDispatch();
    const toast = useToast();
    const [delStates, setDelStates] = useState({});
    const screens = useSelector(state => state.shop);
    const handleDelete = async (id) => {
        setDelStates((prev) => ({ ...prev, [id]: true }));
        try {
            const response = await apiService.deleteScreen(token,id)
            if (response.status === 200) {
                setSearchParam("");
                const updatedScreens = screens.shopData.filter(item => item.id !== id);
                dispatch(setShopData(updatedScreens));
                toast({
                    title: "Success",
                    description: "Successfully Deleted",
                    status: "success",
                    position: "top",
                    duration: 3000,
                    isClosable: true,
                });
            } else {
                throw new Error("Unable to delete");
            }
        } catch (error) {
            toast({
                title: "Error",
                description: error.message,
                status: "error",
                position: "top",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setDelStates((prev) => ({ ...prev, [id]: false }));
            setIsDeleteDialogOpen(false);
        }
    };

    return { handleDelete, delStates };
};