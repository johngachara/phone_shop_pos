import {useState, useEffect, useCallback} from "react";
import {
    Box,
    useColorModeValue,
    useDisclosure, useToast,
} from "@chakra-ui/react";
import Navbar from "../Navbar.jsx";
import ChatbotWidget from "../ChatBotWidget.jsx";
import LcdBody from "components/screens/LcdBody.jsx";
import {DeleteAlertDialog} from "components/dialogs/DeleteAlertDialog.jsx";
import {UpdateDrawer} from "components/drawers/UpdateDrawer.jsx";
import {SellDrawer} from "components/drawers/SellDrawer.jsx";
import {useNavigate} from "react-router-dom";
import useScreenStore from "components/zuhan/useScreenStore.js";
export default function Shopstock() {

    const [searchParam, setSearchParam] = useState("");

    const { data : shopData ,isLoading : isLoadingData,fetchScreens,fetchNextPage,updateScreen,isUpdateLoading,isDeletingLoading
        ,isSellingLoading,sellScreen,deleteScreen ,completeScreen,isCompleting} = useScreenStore()

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteItemId, setDeleteItemId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedItem, setSelectedItem] = useState(null);
    const [sellingPrice, setSellingPrice] = useState(0);
    const [customer, setCustomer] = useState("");
    const [buttonStates, setButtonStates] = useState({});
  //  const { handleComplete } = useSellComplete(token, setButtonStates,setCustomer,setSearchParam);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [selectedItemForUpdate, setSelectedItemForUpdate] = useState(null);
    const { isOpen: isUpdateDrawerOpen, onOpen: onUpdateDrawerOpen, onClose: onUpdateDrawerClose } = useDisclosure();
    const navigate = useNavigate()
    const toast  = useToast()
    const handleUpdateSubmit = async (itemData) => {
        try {
            const result = await updateScreen(itemData, setSearchParam,onUpdateDrawerClose);
            toast({
                status: "success",
                description: "Item updated successfully",
                position: "top"
            });


        } catch (error) {
            toast({
                status: "error",
                description: error.message,
                position: "top",
            });
        }
    };

    const handleDelete = async (id) => {
        try {
            const result = await deleteScreen(id, setSearchParam,setIsDeleteDialogOpen);
            toast({
                status: "success",
                description: "Item deleted successfully",
                position: "top"
            });


        } catch (error) {
            toast({
                status: "error",
                description: error.message,
                position: "top",
            });
        }
    };

    const handleSell = async (item, price, customer) => {
        try{
            const result = await sellScreen(item.id,{...item,price:price,customer_name:customer,quantity:1},setSearchParam,onClose)
            toast({
                status : "success",
                description : "Item sold successfully",
                position: "top"
            })
            setCustomer("")
        }
        catch (err){
            toast({
                status : "error",
                description : err.message,
                position: "top"
            })
        }
    };
    useEffect(()=>{
        fetchScreens()
    },[fetchScreens])
    const handleComplete = async (item, price, customer) => {
        try{
            const result = await completeScreen(item.id,{...item,price:price,customer_name:customer,quantity:1},setSearchParam,onClose)
            toast({
                status : "success",
                description : "Item sold successfully",
                position: "top"
            })
            setCustomer("")
        }
        catch (err){
            toast({
                status : "error",
                description : err.message,
                position: "top"
            })
        }
    }
    const handleLoadMore = () => {
        if (!isLoadingData ) {
            fetchNextPage();
        }
    };

    const handleUpdateClick = (item) => {
        setSelectedItemForUpdate(item);
        onUpdateDrawerOpen();
    };

    const handleItemChange = (updatedItem) => {
        setSelectedItemForUpdate(updatedItem);
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
                loading={isLoadingData}
                shopData={shopData}
                handleSellClick={handleSellClick}
                handleUpdateClick={handleUpdateClick}
                handleCompleteClick={handleCompleteClick}
                setDeleteItemId={setDeleteItemId}
                setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                onLoadMore={handleLoadMore}
                //hasMore={hasMore}
            />

            <ChatbotWidget />
            <DeleteAlertDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onDelete={() => handleDelete(deleteItemId)}
                isLoading={isDeletingLoading}
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
                buttonStates={{
                    sell: isSellingLoading,
                   complete: isCompleting
                }}
            />
            <UpdateDrawer
                isOpen={isUpdateDrawerOpen}
                onClose={onUpdateDrawerClose}
                selectedItem={selectedItemForUpdate}
                onItemChange={handleItemChange}
                onUpdate={handleUpdateSubmit}
                isLoading={isUpdateLoading}
            />
        </Box>
    );
}