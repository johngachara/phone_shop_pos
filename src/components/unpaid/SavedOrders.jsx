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
import { fetchUnpaidOrders, setSavedData } from "components/redux/actions/shopActions.js";
import { useDispatch, useSelector } from "react-redux";
import {apiService} from "../../apiService.js";

export default function SavedOrders() {
    const toast = useToast()
    const dispatch = useDispatch()
    const { savedData } = useSelector(state => state.savedOrders);
    const [sending, setSending] = useState({});
    const [loadState, setLoadState] = useState({});
    const token = localStorage.getItem("access");
    const navigate = useNavigate();
    const cancelRef = useRef();
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [refundId, setRefundId] = useState(null);
    const [cancelButton, setCancelButton] = useState(false);

    useEffect(() => {
        if (!token) {
            navigate('/Login');
        }
        dispatch(fetchUnpaidOrders(token, navigate, toast))
    }, [token, navigate, dispatch, toast]);

    const complete = useCallback(async (id) => {
        setLoadState((prevState) => ({ ...prevState, [id]: true }));
        try {
            const response = await apiService.completeOrder(token,id)
            if (response.status === 200) {
                dispatch(setSavedData(savedData.filter((item) => item.id !== id)));
                toast({
                    status: 'success',
                    description: "Order completed successfully",
                    position: "bottom-right"
                })
            } else {
                throw new Error("Unable to complete transaction");
            }
        } catch (error) {
            toast({
                status: 'error',
                description: error.message,
                position: 'bottom-right'
            })
            console.error(error);
        } finally {
            setLoadState((prevState) => ({ ...prevState, [id]: false }));
        }
    }, [token, dispatch, savedData, toast]);

    const refund = async (id) => {
        setSending((prevState) => ({ ...prevState, [id]: true }));
        try {
            await apiService.refundItem(token,id,setCancelButton)
            dispatch(setSavedData(savedData.filter((order) => order.id !== id)));
            toast({
                status: 'success',
                description: "Returned successfully",
                position: "bottom-right"
            });
        } catch (error) {
            toast({
                status: 'error',
                description: error.message,
                position: 'bottom-right'
            });
            console.error(error);
        } finally {
            setSending((prevState) => ({ ...prevState, [id]: false }));
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
                    savedData={savedData}
                    cardBgColor={cardBgColor}
                    sending={sending}
                    loadState={loadState}
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
                sending={sending}
                refundId={refundId}
                handleRefund={handleRefund}
            />
        </Box>
    );
}