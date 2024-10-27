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

export default function SavedOrders() {
    const toast = useToast();
    const dispatch = useDispatch();
    const { savedData, lastUpdated, staleTime } = useSelector(state => state.savedOrders);
    const isStale = lastUpdated && (Date.now() - lastUpdated > staleTime);
    const [sending, setSending] = useState({});
    const [loadState, setLoadState] = useState({});
    const token = localStorage.getItem("access");
    const navigate = useNavigate();
    const cancelRef = useRef();
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [refundId, setRefundId] = useState(null);
    const [cancelButton, setCancelButton] = useState(false);

    // Only fetch on mount and when data is stale
    useEffect(() => {
        if (!token) {
            navigate('/Login');
            return;
        }
            dispatch(fetchUnpaidOrders(token, navigate,dispatch ,toast,setSavedLoading));
    }, [dispatch, isStale]);

    const complete = useCallback(async (id) => {
        setLoadState((prevState) => ({ ...prevState, [id]: true }));
        try {
            await dispatch(handleItemRemoval(id, token, navigate, toast, 'complete'));
        } catch (error) {
            toast({
                status: 'error',
                description: error.message,
                position: 'bottom-right'
            });
        } finally {
            setLoadState((prevState) => ({ ...prevState, [id]: false }));
        }
    }, [token, dispatch]);

    const refund = async (id) => {
        setSending((prevState) => ({ ...prevState, [id]: true }));
        try {
            await dispatch(handleItemRemoval(id, token, navigate, toast, 'refund'));
        } catch (error) {
            toast({
                status: 'error',
                description: error.message,
                position: 'bottom-right'
            });
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