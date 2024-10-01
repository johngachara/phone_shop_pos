import {
    Drawer,
    DrawerBody,
    DrawerFooter,
    DrawerHeader,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
    Button,
    VStack,
    Box,
    Text,
    Input,
    FormControl,
    FormErrorMessage
} from "@chakra-ui/react";
import { useState } from "react";

export function SellDrawer({
                               isOpen,
                               onClose,
                               selectedItem,
                               sellingPrice,
                               customer,
                               onSellingPriceChange,
                               onCustomerChange,
                               onSell,
                               onComplete,
                               buttonStates,
                           }) {
    const [errors, setErrors] = useState({
        sellingPrice: "",
        customer: ""
    });

    // Regular expression to check alphanumeric input
    const isAlphanumeric = (str) => /^[a-zA-Z0-9\s]+$/.test(str);

    const validate = () => {
        const newErrors = {};
        // Selling Price validation: ensure it's a positive number
        if (!sellingPrice || isNaN(sellingPrice) || Number(sellingPrice) <= 0) {
            newErrors.sellingPrice = "Selling price must be a positive number.";
        }

        // Customer validation: ensure it's alphanumeric and non-empty
        if (!customer.trim()) {
            newErrors.customer = "Customer name is required.";
        } else if (!isAlphanumeric(customer)) {
            newErrors.customer = "Customer name can only contain letters, numbers, and spaces.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSellClick = () => {
        if (validate()) {
            onSell();
        }
    };

    const handleCompleteClick = () => {
        if (validate()) {
            onComplete();
        }
    };

    return (
        <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
            <DrawerOverlay />
            <DrawerContent>
                <DrawerCloseButton />
                <DrawerHeader>Sell Item</DrawerHeader>

                <DrawerBody>
                    <VStack spacing={4} align="stretch">
                        {/* Product */}
                        <Box>
                            <Text mb={2}>Product</Text>
                            <Input value={selectedItem?.product_name || ""} isReadOnly />
                        </Box>

                        {/* Quantity */}
                        <Box>
                            <Text mb={2}>Quantity</Text>
                            <Input value={1} isReadOnly />
                        </Box>

                        {/* Selling Price */}
                        <FormControl isInvalid={!!errors.sellingPrice}>
                            <Text mb={2}>Selling Price</Text>
                            <Input
                                required={true}
                                value={sellingPrice}
                                type="number"
                                onChange={onSellingPriceChange}
                            />
                            <FormErrorMessage>{errors.sellingPrice}</FormErrorMessage>
                        </FormControl>

                        {/* Customer */}
                        <FormControl isInvalid={!!errors.customer}>
                            <Text mb={2}>Customer</Text>
                            <Input
                                required={true}
                                value={customer}
                                type="text"
                                onChange={onCustomerChange}
                            />
                            <FormErrorMessage>{errors.customer}</FormErrorMessage>
                        </FormControl>
                    </VStack>
                </DrawerBody>

                <DrawerFooter>
                    <Button variant="outline" mr={3} onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        colorScheme="blue"
                        mr={3}
                        isLoading={buttonStates.sell}
                        onClick={handleSellClick}
                    >
                        Save
                    </Button>
                    <Button
                        colorScheme="green"
                        isLoading={buttonStates.complete}
                        onClick={handleCompleteClick}
                    >
                        Complete
                    </Button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}
