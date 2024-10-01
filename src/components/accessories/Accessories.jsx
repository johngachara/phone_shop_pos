import { useEffect, useRef, useState } from "react";
import {
    Flex,
    SimpleGrid,
    useColorModeValue,
    useToast,
} from "@chakra-ui/react";
import {  useNavigate } from "react-router-dom";
import {useSelector,useDispatch} from "react-redux";
import {fetchAccessories} from "components/redux/actions/shopActions.js";
import RenderAccessoryItems from "components/accessories/RenderAccessoryItems.jsx";
import AccessoryBody from "components/accessories/AccessoryBody.jsx";
import AccessoryDeleteDialog from "components/dialogs/AccessoryDeleteDialog.jsx";
import useSearchAccessories from "components/hooks/useSearchAccessories.js";
import {useDeleteAccessory} from "components/hooks/useDeleteAccessory.js";
import AccessoryDrawers from "components/drawers/AccessoryDrawers.jsx";
import {useUpdateAccessory} from "components/hooks/useUpdateAccessory.js";
import {useSellAccessory} from "components/hooks/useSellAccessory.js";


export default function Accessories() {
    const { shopData, loading } = useSelector(state => state.accessory);
    const dispatch = useDispatch();
    const [searchParam, setSearchParam] = useState("");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteItemId, setDeleteItemId] = useState(null);
    const navigate = useNavigate();
    const token = localStorage.getItem("accessories");
    const cancelRef = useRef();
    const [currentPage, setCurrentPage] = useState(1);
    const {searchResults,loading:searchLoading} = useSearchAccessories(searchParam)
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [drawerAction, setDrawerAction] = useState("");
    const [selectedItem, setSelectedItem] = useState(null);
    const [sellingPrice, setSellingPrice] = useState(0);
    const [sellingQuantity, setSellingQuantity] = useState("");
    const [customer, setCustomer] = useState("");
    const {isSelling,handleSell} = useSellAccessory(token)
    const {isUpdating,handleUpdate} = useUpdateAccessory(token)
    const {handleDelete,delStates} = useDeleteAccessory(token,currentPage,setSearchParam,setIsDeleteDialogOpen)
    const toast = useToast();

    const bgColor = useColorModeValue("white", "gray.800");
    const textColor = useColorModeValue("gray.600", "gray.300");
    const pageBgColor = useColorModeValue("gray.50", "gray.900");

    useEffect(() => {
        if (token) {
            dispatch(fetchAccessories(token, currentPage,navigate,toast));
        }
        else {
            navigate("/Login");
        }
    }, [token, navigate, currentPage, toast]);





    const openDrawer = (action, item) => {
        setDrawerAction(action);
        setSelectedItem(item);
        setSellingPrice(item.price);
        if (action === 'update') {
            setSellingQuantity(item.quantity); // Prefill sellingQuantity with the item's quantity
        } else {
            setSellingQuantity(''); // Clear sellingQuantity for other actions (like sell)
        }
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
                    setIsDeleteDialogOpen={setIsDeleteDialogOpen}/>
            ))}
        </SimpleGrid>
    );
    return (
        <Flex direction="column" minH="100vh">
            <AccessoryBody
                pageBgColor={pageBgColor}
                searchParam={searchParam}
                setSearchParam={setSearchParam}
                loading={loading || searchLoading}
                searchResults={searchResults}
                shopData={shopData}
                renderItems={renderItems}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
            />

            <AccessoryDeleteDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                cancelRef={cancelRef}
                deleteItemId={deleteItemId}
                handleDelete={handleDelete}
                isLoading={delStates[deleteItemId]}
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
                handleSell={() => handleSell(selectedItem,sellingPrice,sellingQuantity,customer,setIsDrawerOpen)}
                handleUpdate={() => handleUpdate(selectedItem, sellingPrice, sellingQuantity, setIsDrawerOpen)}
                isSelling={isSelling}
                isUpdating={isUpdating}
            />
        </Flex>
    )}