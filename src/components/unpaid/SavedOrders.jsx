import { useState, useEffect, useRef } from "react";
import {
    Box,
    Heading,
    useColorModeValue,
    Container,
    useToast
} from "@chakra-ui/react";
import Navbar from "../Navbar.jsx";
import UnpaidOrdersBody from "components/unpaid/UnpaidOrdersBody.jsx";
import UnpaidOrdersDialog from "components/dialogs/UnpaidOrdersDialog.jsx";
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
        hasHydrated
    } = useUnpaidStore();

    const [isDialogOpen, setDialogOpen] = useState(false);
    const [refundId, setRefundId] = useState(null);
    const [cancelButton, setCancelButton] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    // Initialize component
    useEffect(() => {
        let isMounted = true;
        const loadData = async () => {
            try {
                const result = await fetchUnpaidOrders();
                if (!result.success && isMounted) {
                    toast({
                        status: 'error',
                        description: result.error || 'Failed to fetch unpaid orders',
                        position: 'bottom-right',
                        isClosable: true
                    });
                }
            } catch (error) {
                if (isMounted) {
                    console.error('Error fetching unpaid orders:', error);
                    toast({
                        status: 'error',
                        description: 'Failed to fetch unpaid orders',
                        position: 'bottom-right',
                        isClosable: true
                    });
                }
            }
        };

        // Initial load
        if (hasHydrated) {
            loadData();
        }
        return () => {
            isMounted = false;

        };
    }, [hasHydrated]);


    const complete = async (id) => {
        try {
            const result = await completeOrder(id);
            if (result.success) {
                toast({
                    status: 'success',
                    description: 'Order Completed Successfully',
                    position: 'bottom-right',
                    isClosable: true
                });
            }
        } catch (error) {
            toast({
                status: 'error',
                description: error.message,
                position: 'bottom-right',
                isClosable: true
            });
        }
    };

    const refund = async (id) => {
        try {
            const result = await refundOrder(id);
            if (result.success) {
                toast({
                    status: 'success',
                    description: 'Order Refunded Successfully',
                    position: 'bottom-right',
                    isClosable: true
                });
            }
        } catch (error) {
            toast({
                status: 'error',
                description: error.message,
                position: 'bottom-right',
                isClosable: true
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
                cancelRef={useRef()}
                cancelButton={cancelButton}
                setDialogOpen={setDialogOpen}
                sending={isRefunding}
                refundId={refundId}
                handleRefund={handleRefund}
            />
        </Box>
    );
}