import { useEffect, useRef, useState } from "react";
import {
    Box,
    Flex,
    SimpleGrid,
    useColorModeValue,
    useToast,
    Spinner,
    Center,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import RenderAccessoryItems from "components/accessories/RenderAccessoryItems.jsx";
import AccessoryBody from "components/accessories/AccessoryBody.jsx";
import AccessoryDeleteDialog from "components/dialogs/AccessoryDeleteDialog.jsx";
import useSearchAccessories from "components/hooks/useSearchAccessories.js";
import AccessoryDrawers from "components/drawers/AccessoryDrawers.jsx";
import useAccessoryStore from "components/zuhan/useAccessoryStore.js";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "components/firebase/firebase.js";

export default function Accessories() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const toast = useToast();

    // State management
    const [searchParam, setSearchParam] = useState("");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteItemId, setDeleteItemId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [drawerAction, setDrawerAction] = useState("");
    const [selectedItem, setSelectedItem] = useState(null);
    const [sellingPrice, setSellingPrice] = useState(0);
    const [sellingQuantity, setSellingQuantity] = useState("");
    const [customer, setCustomer] = useState("");
    const [authState, setAuthState] = useState({
        isAuthenticated: false,
        isLoading: true,
        user: null
    });

    const cancelRef = useRef();

    // Hooks
    const { searchResults, loading: searchLoading } = useSearchAccessories(searchParam);
    const {
        isUpdating,
        isSelling,
        updateAccessory,
        sellAccessory,
        accessories,
        loading: accessoryLoading,
        fetchAccessories,
        hasHydrated
    } = useAccessoryStore();

    // Theme
    const bgColor = useColorModeValue("white", "gray.800");
    const textColor = useColorModeValue("gray.600", "gray.300");
    const pageBgColor = useColorModeValue("gray.50", "gray.900");

    // Authentication effect
    useEffect(() => {
        let mounted = true;

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!mounted) return;

            if (user) {
                try {
                    // Get the ID token to verify authentication
                    const token = await user.getIdToken();
                    if (mounted) {
                        setAuthState({
                            isAuthenticated: true,
                            isLoading: false,
                            user
                        });
                    }
                } catch (error) {
                    console.error("Error getting user token:", error);
                    handleAuthError();
                }
            } else {
                handleAuthError();
            }
        });

        return () => {
            mounted = false;
            unsubscribe();
        };
    }, [navigate]);

    const handleAuthError = () => {
        setAuthState({
            isAuthenticated: false,
            isLoading: false,
            user: null
        });

        // Don't navigate if we're already on the login page
        if (window.location.pathname !== '/login') {
            navigate('/login', {
                replace: true,
                state: { from: window.location.pathname }
            });
        }
    };

    // Data fetching effect
    useEffect(() => {
        if (authState.isAuthenticated && hasHydrated && !accessoryLoading) {
            fetchAccessories(currentPage).catch((error) => {
                console.error("Error fetching accessories:", error);
                toast({
                    status: "error",
                    description: "Failed to fetch accessories",
                    position: "bottom-right",
                    isClosable: true,
                });
            });
        }
    }, [authState.isAuthenticated, hasHydrated, currentPage, fetchAccessories]);

    // Search effect
    useEffect(() => {
        if (searchParam) {
            setSearchParam('');
        }
    }, [currentPage]);

    const handleSellAccessory = async () => {
        if (!authState.isAuthenticated) {
            toast({
                status: "error",
                description: "You must be logged in to perform this action",
                position: "top",
            });
            return;
        }

        await sellAccessory(
            selectedItem.id,
            {
                selling_price: sellingPrice,
                quantity: parseInt(sellingQuantity),
                customer: customer,
                product_name: selectedItem.product_name,
            },
            toast,
            setIsDrawerOpen,
            setSearchParam
        );
    };

    const handleUpdateAccessory = async () => {
        if (!authState.isAuthenticated) {
            toast({
                status: "error",
                description: "You must be logged in to perform this action",
                position: "top",
            });
            return;
        }

        await updateAccessory(
            selectedItem,
            sellingPrice,
            sellingQuantity,
            setIsDrawerOpen,
            toast,
            setSearchParam
        );
    };

    const openDrawer = (action, item) => {
        setDrawerAction(action);
        setSelectedItem(item);
        setSellingPrice(item.price);
        setSellingQuantity(action === 'update' ? item.quantity : '');
        setCustomer("");
        setIsDrawerOpen(true);
    };

    const renderItems = (items) => (
        <SimpleGrid
            columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
            spacing={{ base: 4, md: 6 }}
            w="full"
        >
            {items.map((item, index) => (
                <RenderAccessoryItems
                    key={item.id}
                    item={item}
                    index={index}
                    bgColor={bgColor}
                    textColor={textColor}
                    openDrawer={openDrawer}
                    setDeleteItemId={setDeleteItemId}
                    setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                />
            ))}
        </SimpleGrid>
    );

    // Show loading state
    if (authState.isLoading) {
        return (
            <Center h="100vh">
                <Spinner size="xl" />
            </Center>
        );
    }

    // Show page content only if authenticated
    if (!authState.isAuthenticated) {
        return null; // The useEffect will handle navigation
    }

    return (
        <Flex direction="column" minH="100vh">
            <AccessoryBody
                pageBgColor={pageBgColor}
                searchParam={searchParam}
                setSearchParam={setSearchParam}
                loading={accessoryLoading || searchLoading}
                searchResults={searchResults}
                shopData={accessories}
                renderItems={renderItems}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
            />

            <AccessoryDeleteDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                cancelRef={cancelRef}
                deleteItemId={deleteItemId}
                setSearchParam={setSearchParam}
                loadingText="Deleting"
            />

            <AccessoryDrawers
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                drawerAction={drawerAction}
                selectedItem={selectedItem}
                setSelectedItem={setSelectedItem}
                sellingQuantity={sellingQuantity}
                setSellingQuantity={setSellingQuantity}
                sellingPrice={sellingPrice}
                setSellingPrice={setSellingPrice}
                customer={customer}
                setCustomer={setCustomer}
                handleSell={handleSellAccessory}
                handleUpdate={handleUpdateAccessory}
                isSelling={isSelling}
                isUpdating={isUpdating}
            />
        </Flex>
    );
}