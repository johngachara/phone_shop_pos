import {useState, useEffect, useRef} from "react";
import {
    Box,
    useColorModeValue,
    useDisclosure,
    useToast,
} from "@chakra-ui/react";
import Navbar from "../Navbar.jsx";
import ChatbotWidget from "../ChatBotWidget.jsx";
import LcdBody from "components/screens/LcdBody.jsx";
import { DeleteAlertDialog } from "components/dialogs/DeleteAlertDialog.jsx";
import { UpdateDrawer } from "components/drawers/UpdateDrawer.jsx";
import { SellDrawer } from "components/drawers/SellDrawer.jsx";
import useScreenStore from "components/zuhan/useScreenStore.js";
import {onAuthStateChanged} from "firebase/auth";
import {useNavigate} from "react-router-dom";
import {auth} from "components/firebase/firebase.js";

export default function Shopstock() {
    const [searchParam, setSearchParam] = useState("");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteItemId, setDeleteItemId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedItem, setSelectedItem] = useState(null);
    const [sellingPrice, setSellingPrice] = useState(0);
    const [customer, setCustomer] = useState("");
    const [authLoading, setAuthLoading] = useState(true);
    const navigate = useNavigate()
    // Properly destructure the store
    const {
        data: shopData,
        isLoading: isLoadingData,
        fetchScreens,
        fetchNextPage,
        updateScreen,
        isUpdateLoading,
        isDeletingLoading,
        isSellingLoading,
        sellScreen,
        deleteScreen,
        completeScreen,
        isCompleting,
        hasHydrated
    } = useScreenStore();

    const { isOpen, onOpen, onClose } = useDisclosure();
    const [selectedItemForUpdate, setSelectedItemForUpdate] = useState(null);
    const {
        isOpen: isUpdateDrawerOpen,
        onOpen: onUpdateDrawerOpen,
        onClose: onUpdateDrawerClose
    } = useDisclosure();

    const toast = useToast();

    const handleUpdateSubmit = async (itemData) => {
        try {
            await updateScreen(itemData, setSearchParam, onUpdateDrawerClose);
            toast({
                status: "success",
                description: "Item updated successfully",
                position: "top"
            });
        } catch (error) {
            toast({
                status: "error",
                description: error.message || "Update failed",
                position: "top",
            });
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteScreen(id, setSearchParam, setIsDeleteDialogOpen);
            toast({
                status: "success",
                description: "Item deleted successfully",
                position: "top"
            });
        } catch (error) {
            toast({
                status: "error",
                description: error.message || "Delete failed",
                position: "top",
            });
        }
    };

    const handleSell = async (item, price, customer) => {
        try {
            await sellScreen(
                item.id,
                { ...item, price: price, customer_name: customer, quantity: 1 },
                setSearchParam,
                onClose
            );
            toast({
                status: "success",
                description: "Item sold successfully",
                position: "top"
            });
            setCustomer("");
        } catch (error) {
            toast({
                status: "error",
                description: error.message || "Sale failed",
                position: "top"
            });
        }
    };

    const handleComplete = async (item, price, customer) => {
        try {
            await completeScreen(
                item.id,
                { ...item, price: price, customer_name: customer, quantity: 1 },
                setSearchParam,
                onClose
            );
            toast({
                status: "success",
                description: "Item completed successfully",
                position: "top"
            });
            setCustomer("");
        } catch (error) {
            toast({
                status: "error",
                description: error.message || "Completion failed",
                position: "top"
            });
        }
    };

    const handleLoadMore = () => {
        if (!isLoadingData) {
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

    const handleCompleteClick = (item) => {
        setSelectedItem(item);
        setSellingPrice(item.price);
        onOpen();
    };

    const handleDecimalsOnValue = (value) => {
        const regex = /([0-9]*[\.|\,]{0,1}[0-9]{0,2})/s;
        return value.match(regex)[0];
    };

    const checkValue = (event) => {
        setSellingPrice(handleDecimalsOnValue(event.target.value));
    };


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setAuthLoading(false); // Auth confirmed, continue loading data
            } else {
                console.warn("No Firebase user found, redirecting to login.");
                toast({
                    status: "warning",
                    description: "You must be logged in to access this page.",
                    position: "top",
                });
            }
        });

        return () => unsubscribe(); // Cleanup on unmount
    }, [navigate, toast]);

    // Initial data load based on Firebase auth state
    useEffect(() => {
        if (!authLoading && hasHydrated) {
            fetchScreens().catch((error) => {
                console.error('Error fetching shop stock:', error);
                toast({
                    status: 'error',
                    description: 'Failed to fetch stock',
                    position: 'bottom-right',
                    isClosable: true,
                });
            });
        }
    }, [authLoading, hasHydrated, fetchScreens, toast]);


    return (
        <Box bg={useColorModeValue("gray.50", "gray.900")} minH="100vh" ml={{ base: 0, md: '250px' }}>
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
                onSell={() => handleSell(selectedItem, sellingPrice, customer)}
                onComplete={() => handleComplete(selectedItem, sellingPrice, customer)}
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