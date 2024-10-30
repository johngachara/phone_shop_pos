import { useState, useEffect, useRef, useCallback } from "react";
import {
    Box,
    Heading,
    useColorModeValue,
    Container, useToast
} from "@chakra-ui/react";
import Navbar from "../Navbar.jsx";
import { useNavigate } from "react-router-dom";
import UnpaidOrdersBody from "components/unpaid/UnpaidOrdersBody.jsx";
import UnpaidOrdersDialog from "components/dialogs/UnpaidOrdersDialog.jsx";
import {fetchUnpaidOrders, handleItemRemoval, setSavedLoading} from "components/redux/actions/shopActions.js";
import { useDispatch, useSelector } from "react-redux";
import useUnpaidStore from "components/zuhan/useUnpaidStore.js";

export default function SavedOrders() {
    const toast = useToast();
    const {
        unpaidOrders,
        fetchUnpaidOrders,
        refundOrder,
        isRefunding,
        isCompleting,
        completeOrder,
        hasHydrated,
        isLoading
    } = useUnpaidStore();
    const [sending, setSending] = useState({});
    const [loadState, setLoadState] = useState({});
    const token = localStorage.getItem("access");
    const navigate = useNavigate();
    const cancelRef = useRef();
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [refundId, setRefundId] = useState(null);
    const [mounted, setMounted] = useState(false);
    const [cancelButton, setCancelButton] = useState(false);
    useEffect(() => {
        setMounted(true);

        const loadData = async () => {
            try {
                // Force fetch on mount
                const result = await fetchUnpaidOrders();
                if (!result.success) {
                    toast({
                        status: 'error',
                        description: result.error || 'Failed to fetch unpaid orders',
                        position: 'bottom-right'
                    });
                }
            } catch (error) {
                console.error('Error fetching unpaid orders:', error);
                toast({
                    status: 'error',
                    description: 'Failed to fetch unpaid orders',
                    position: 'bottom-right'
                });
            }
        };

        loadData();

        // Set up refresh interval
        const refreshInterval = setInterval(loadData, 30000);

        return () => {
            setMounted(false);
            clearInterval(refreshInterval);
        };
    }, []);

    // Show loading state while fetching
    useEffect(() => {
        if (mounted && isLoading) {
            toast({
                status: 'loading',
                description: 'Fetching unpaid orders...',
                position: 'bottom-right',
                duration: 1000
            });
        }
    }, [isLoading, mounted]);


    const complete = async (id) => {
        try {
            const result = await completeOrder(id)
            if(result.success){
                toast({
                    status: 'success',
                    description: 'Order Completed Successfully',
                    position: 'bottom-right'
                });
            }
        } catch (error) {
            toast({
                status: 'error',
                description: error.message,
                position: 'bottom-right'
            });
        }
    };

    const refund = async (id) => {
        try {
            const result = await refundOrder(id)
            if(result.success){
                toast({
                    status: 'success',
                    description: 'Order Refunded Successfully',
                    position: 'bottom-right'
                });
            }
        } catch (error) {
            toast({
                status: 'error',
                description: error.message,
                position: 'bottom-right'
            });
        }
    };

    const handleRefund = () => {
        setCancelButton(true);
        refund(refundId);
        setDialogOpen(false);
        setCancelButton(false);
    };

    const textColor = useColorModeValue("gray.800", "white");
    const bgColor = useColorModeValue("white", "gray.800");
    const cardBgColor = useColorModeValue("white", "gray.800");
    const headingColor = useColorModeValue("gray.800", "white");
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <Box bg={bgColor} minH="100vh" ml={{ base: 0, md: 64 }} transition="margin-left 0.2s ease">
            <Navbar />
            <Container maxW="container.xl" py={{ base: 6, md: 12 }}>
                <Heading as="h2" size={{ base: "xl", md: "2xl" }} textAlign="center" color={headingColor} mb={8}>
                    SHOP 2 UNPAID ORDERS
                </Heading>
                <UnpaidOrdersBody
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    savedData={unpaidOrders}
                    cardBgColor={cardBgColor}
                    sending={isRefunding}
                    loadState={isCompleting}
                    setDialogOpen={setDialogOpen}
                    textColor={textColor}
                    complete={complete}
                    setRefundId={setRefundId}
                />
            </Container>
            <UnpaidOrdersDialog
                isDialogOpen={isDialogOpen}
                cancelRef={cancelRef}
                cancelButton={cancelButton}
                setDialogOpen={setDialogOpen}
                sending={isRefunding}
                refundId={refundId}
                handleRefund={handleRefund}
            />
        </Box>
    );
}