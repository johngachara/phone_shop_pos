import {useDispatch, useSelector} from "react-redux";
import {useToast} from "@chakra-ui/react";
import {useState} from "react";
import { setAccessoryData} from "components/redux/actions/shopActions.js";
import {apiService} from "../../apiService.js";

export const useDeleteAccessory = (token, currentPage, setSearchParam, setIsDeleteDialogOpen) => {
    const dispatch = useDispatch();
    const accessories = useSelector(state => state.accessory);
    const toast = useToast();
    const [delStates, setDelStates] = useState({});
    const handleDelete = async (id) => {
        setDelStates((prev) => ({ ...prev, [id]: true }));
        try {
            const response = await apiService.deleteAccessory(token,id)

            if (response.status === 200) {
                setSearchParam("");
                const updatedAccessories = accessories.shopData.filter(item => item.id !==id);
                dispatch(setAccessoryData(updatedAccessories));
                toast({
                    title: "Success",
                    description: "Successfully Deleted",
                    position:'top',
                    status: "success",
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
                position:'top',
                duration: 3000,
                isClosable: true,
            });
            console.error("Error deleting item:", error);
        } finally {
            setDelStates((prev) => ({ ...prev, [id]: false }));
            setIsDeleteDialogOpen(false);
        }
    };
    return { handleDelete, delStates };
}