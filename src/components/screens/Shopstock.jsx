import  { useState, useEffect } from "react";
import {
    Box,
    useColorModeValue,
    useDisclosure, useToast,
} from "@chakra-ui/react";
import Navbar from "../Navbar.jsx";
import ChatbotWidget from "../ChatBotWidget.jsx";
import {useDispatch, useSelector} from "react-redux";
import {fetchShopData, setLoading} from "components/redux/actions/shopActions.js";
import LcdBody from "components/screens/LcdBody.jsx";
import {DeleteAlertDialog} from "components/dialogs/DeleteAlertDialog.jsx";
import {UpdateDrawer} from "components/drawers/UpdateDrawer.jsx";
import {SellDrawer} from "components/drawers/SellDrawer.jsx";
import {useSellScreens} from "components/hooks/useSellScreens.js";
import {useUpdateScreens} from "components/hooks/useUpdateScreens.js";
import {useSellComplete} from "components/hooks/useSellComplete.js";
import {useDelete} from "components/hooks/useDelete.js";
import {useNavigate} from "react-router-dom";
export default function Shopstock() {
    const dispatch = useDispatch();
    const { shopData, loading, lastUpdated, staleTime } = useSelector(state => state.shop);
    const isStale = lastUpdated && (Date.now() - lastUpdated > staleTime);
    const [searchParam, setSearchParam] = useState("");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteItemId, setDeleteItemId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedItem, setSelectedItem] = useState(null);
    const [sellingPrice, setSellingPrice] = useState(0);
    const [customer, setCustomer] = useState("");
    const [buttonStates, setButtonStates] = useState({});
    const token = localStorage.getItem("access");
    const { handleSell } = useSellScreens(token, setButtonStates,setCustomer,setSearchParam);
    const {handleUpdate} = useUpdateScreens(token,setButtonStates)
    const { handleComplete } = useSellComplete(token, setButtonStates,setCustomer,setSearchParam);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [selectedItemForUpdate, setSelectedItemForUpdate] = useState(null);
    const { isOpen: isUpdateDrawerOpen, onOpen: onUpdateDrawerOpen, onClose: onUpdateDrawerClose } = useDisclosure();
    const navigate = useNavigate()
    const toast  = useToast()
    const { handleDelete, delStates } = useDelete(token, currentPage, setSearchParam, setIsDeleteDialogOpen);
    useEffect(() => {
        if(token || isStale){
            dispatch(fetchShopData(token, currentPage,navigate,toast));
        }
        else {
            navigate('/Login')
        }

    }, [currentPage, isStale]);

    const handleUpdateClick = (item) => {
        setSelectedItemForUpdate(item);
        onUpdateDrawerOpen();
    };

    const handleItemChange = (updatedItem) => {
        setSelectedItemForUpdate(updatedItem);
    };

    const handleUpdateSubmit = () => {
        if (selectedItemForUpdate) {
            handleUpdate(selectedItemForUpdate, selectedItemForUpdate, onUpdateDrawerClose, currentPage);
        }
    };


    const handleSellClick = (item) => {
        setSelectedItem(item);
        setSellingPrice(item.price);
        onOpen();
    };

    const handleCompleteClick = (item)=>{
        setSelectedItem(item)
        setSellingPrice(item.price)
        onOpen()
    }


    function handleDecimalsOnValue(value) {
        const regex = /([0-9]*[\.|\,]{0,1}[0-9]{0,2})/s;
        return value.match(regex)[0];
    }

    function checkValue(event) {
        setSellingPrice(handleDecimalsOnValue(event.target.value));
    }



    return (
        <Box  bg={useColorModeValue("gray.50", "gray.900")} minH="100vh" ml={{ base: 0, md: '250px' }}>
            <Navbar />
            <LcdBody
                searchParam={searchParam}
                setSearchParam={setSearchParam}
                loading={loading}
                shopData={shopData}
                handleSellClick={handleSellClick}
                handleUpdateClick={handleUpdateClick}
                handleCompleteClick={handleCompleteClick}
                setDeleteItemId={setDeleteItemId}
                setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
            />

            <ChatbotWidget />
            <DeleteAlertDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onDelete={() => handleDelete(deleteItemId)}
                isLoading={delStates[deleteItemId]}
            />
            <SellDrawer
                isOpen={isOpen}
                onClose={onClose}
                selectedItem={selectedItem}
                sellingPrice={sellingPrice}
                customer={customer}
                onSellingPriceChange={checkValue}
                onCustomerChange={(e) => setCustomer(e.target.value.toLowerCase())}
                onSell={() => handleSell(selectedItem, sellingPrice, customer, onClose)}
                onComplete={() => handleComplete(selectedItem, sellingPrice, customer, onClose)}
                buttonStates={buttonStates}
            />
            <UpdateDrawer
                isOpen={isUpdateDrawerOpen}
                onClose={onUpdateDrawerClose}
                selectedItem={selectedItemForUpdate}
                onItemChange={handleItemChange}
                onUpdate={handleUpdateSubmit}
                isLoading={buttonStates.update}
            />
        </Box>
    );
}