import  { useState } from 'react';
import {
    Drawer,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
    DrawerHeader,
    DrawerBody,
    DrawerFooter,
    FormControl,
    FormLabel,
    Input,
    Button,
    FormErrorMessage,
} from '@chakra-ui/react';

const AccessoryDrawers = ({
                              isOpen,
                              onClose,
                              drawerAction,
                              selectedItem,
                              setSelectedItem,
                              sellingQuantity,
                              setSellingQuantity,
                              sellingPrice,
                              setSellingPrice,
                              customer,
                              setCustomer,
                              handleSell,
                              handleUpdate,
                              isSelling,
                              isUpdating,
                          }) => {
    const [errors, setErrors] = useState({});

    // Validation function
    const validateInputs = () => {
        let newErrors = {};
        let isValid = true;

        if (!sellingQuantity || isNaN(sellingQuantity) || sellingQuantity < 0) {
            newErrors.sellingQuantity = 'Quantity must be a positive number';
            isValid = false;
        }
        if (!selectedItem.product_name.trim()) {
            newErrors.product_name = 'Product name is required.';
            isValid = false;
        }
        if (!sellingPrice || isNaN(sellingPrice) || sellingPrice <= 0) {
            newErrors.sellingPrice = 'Price must be a positive number';
            isValid = false;
        }
// Alphanumeric validation regex function
        const isAlphanumeric = (str) => /^[a-zA-Z0-9\s]+$/.test(str);

        if (drawerAction === 'sell') {
            if (!customer.trim()) {
                newErrors.customer = 'Customer is required for selling';
                isValid = false;
            } else if (!isAlphanumeric(customer.trim())) {
                newErrors.customer = 'Customer name can only contain letters, numbers, and spaces';
                isValid = false;
            }
        }

        setErrors(newErrors);
        return isValid;
    };

    // Function to clear errors
    const clearErrors = () => {
        setErrors({});
    };

    // Update Click handler with validation
    const handleUpdateClick = () => {
        const isValid = validateInputs();
        if (isValid) {
            handleUpdate(); // Call the update handler if the input is valid
        }
    };

    // Sell Click handler with validation
    const handleSellClick = () => {
        const isValid = validateInputs();
        if (isValid) {
            handleSell(); // Call the sell handler if the input is valid
        }
    };

    // Wrap the onClose handler to clear errors when the drawer closes
    const handleClose = () => {
        clearErrors();  // Clear any validation errors
        onClose();      // Trigger the parent component's onClose to close the drawer
    };

    return (
        <Drawer isOpen={isOpen} placement="right" onClose={handleClose} size="md">
            <DrawerOverlay />
            <DrawerContent>
                <DrawerCloseButton />
                <DrawerHeader>
                    {drawerAction === 'sell' ? 'Sell Accessory' : 'Update Accessory'}
                </DrawerHeader>

                <DrawerBody>
                    <FormControl mb={4} isInvalid={!!errors.product_name}>
                        <FormLabel>Product</FormLabel>
                        <Input
                            type="text"
                            value={selectedItem?.product_name || ''}
                            onChange={(e) =>
                                setSelectedItem({ ...selectedItem, product_name: e.target.value })
                            }
                            isReadOnly={drawerAction === 'sell'}
                        />
                        {errors.product_name && (
                            <FormErrorMessage>{errors.product_name}</FormErrorMessage>
                        )}
                    </FormControl>

                    <FormControl mb={4} isInvalid={!!errors.sellingQuantity}>
                        <FormLabel>Quantity</FormLabel>
                        <Input
                            type="number"
                            value={sellingQuantity}
                            onChange={(e) => setSellingQuantity(e.target.value)}
                            required={true}
                        />
                        {errors.sellingQuantity && (
                            <FormErrorMessage>{errors.sellingQuantity}</FormErrorMessage>
                        )}
                    </FormControl>

                    <FormControl mb={4} isInvalid={!!errors.sellingPrice}>
                        <FormLabel>{drawerAction === 'sell' ? 'Selling Price' : 'Price'}</FormLabel>
                        <Input
                            type="number"
                            value={sellingPrice}
                            onChange={(e) => setSellingPrice(e.target.value)}
                            required={true}
                        />
                        {errors.sellingPrice && (
                            <FormErrorMessage>{errors.sellingPrice}</FormErrorMessage>
                        )}
                    </FormControl>

                    {drawerAction === 'sell' && (
                        <FormControl mb={4} isInvalid={!!errors.customer}>
                            <FormLabel>Customer</FormLabel>
                            <Input
                                value={customer}
                                onChange={(e) => setCustomer(e.target.value.toLowerCase())}
                                required={true}
                            />
                            {errors.customer && (
                                <FormErrorMessage>{errors.customer}</FormErrorMessage>
                            )}
                        </FormControl>
                    )}
                </DrawerBody>

                <DrawerFooter>
                    <Button variant="outline" mr={3} onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        colorScheme="blue"
                        onClick={drawerAction === 'sell' ? handleSellClick : handleUpdateClick}
                        isLoading={drawerAction === 'sell' ? isSelling : isUpdating}
                        loadingText={drawerAction === 'sell' ? 'Selling' : 'Updating'}
                    >
                        {drawerAction === 'sell' ? 'Sell' : 'Update'}
                    </Button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
};

export default AccessoryDrawers;
