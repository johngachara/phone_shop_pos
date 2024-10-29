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
    Input,
    FormControl,
    FormLabel,
    FormErrorMessage,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";

export function UpdateDrawer({
                                 isOpen,
                                 onClose,
                                 selectedItem,
                                 onItemChange,
                                 onUpdate,
                                 isLoading,
                             }) {
    const [formValues, setFormValues] = useState({
        product_name: '',
        price: '',
        quantity: '',
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (selectedItem) {
            setFormValues({
                product_name: selectedItem.product_name || '',
                price: selectedItem.price !== undefined ? selectedItem.price.toString() : '',
                quantity: selectedItem.quantity !== undefined ? selectedItem.quantity.toString() : '',
            });
        }
    }, [selectedItem]);

    const handleChange = (field, value) => {
        // Allow clearing the input and validate numbers properly
        if ((field === 'price' || field === 'quantity') && (value === '' || isNaN(value) || Number(value) < 0)) {
            value = value === '' ? '' : 0;
        }

        setFormValues(prev => ({ ...prev, [field]: value }));
        onItemChange({ ...selectedItem, [field]: value });

        // Clear the specific error when user starts typing
        setErrors(prev => ({ ...prev, [field]: '' }));
    };

    const validateForm = () => {
        let hasError = false;
        const errors = {};

        // Validate product name
        if (!formValues.product_name.trim()) {
            errors.product_name = "Product name is required.";
            hasError = true;
        }

        // Validate price - must be a positive number
        if (formValues.price === '' || isNaN(formValues.price) || Number(formValues.price) < 0) {
            errors.price = "Price must be a positive number.";
            hasError = true;
        }

        // Validate quantity - must be a positive number
        if (formValues.quantity === '' || isNaN(formValues.quantity) || Number(formValues.quantity) < 0) {
            errors.quantity = "Quantity must be a positive number.";
            hasError = true;
        }

        setErrors(errors);
        return !hasError;
    };

    const handleUpdate = () => {
        if (validateForm()) {
            // Convert empty strings to 0 for updating the fields
            const updatedValues = {
                product_name: formValues.product_name,
                price: formValues.price === '' ? 0 : Number(formValues.price),
                quantity: formValues.quantity === '' ? 0 : Number(formValues.quantity),
                id : selectedItem.id
            };
            onUpdate(updatedValues);
        }
    };

    const handleClose = () => {
        setErrors({}); // Clear errors
        onClose(); // Call the onClose prop to close the drawer
    };

    return (
        <Drawer isOpen={isOpen} placement="right" onClose={handleClose} size="md">
            <DrawerOverlay />
            <DrawerContent>
                <DrawerCloseButton />
                <DrawerHeader>Update Item</DrawerHeader>

                <DrawerBody>
                    <VStack spacing={4} align="stretch">
                        {/* Product Name */}
                        <FormControl isInvalid={!!errors.product_name}>
                            <FormLabel>Product Name</FormLabel>
                            <Input
                                required
                                value={formValues.product_name}
                                onChange={(e) => handleChange('product_name', e.target.value)}
                                aria-label="Product Name"
                            />
                            <FormErrorMessage>{errors.product_name}</FormErrorMessage>
                        </FormControl>

                        {/* Price */}
                        <FormControl isInvalid={!!errors.price}>
                            <FormLabel>Price</FormLabel>
                            <Input
                                value={formValues.price}
                                type="number"
                                onChange={(e) => handleChange('price', e.target.value)}
                                aria-label="Price"
                                required
                            />
                            <FormErrorMessage>{errors.price}</FormErrorMessage>
                        </FormControl>

                        {/* Quantity */}
                        <FormControl isInvalid={!!errors.quantity}>
                            <FormLabel>Quantity</FormLabel>
                            <Input
                                value={formValues.quantity}
                                type="number"
                                onChange={(e) => handleChange('quantity', e.target.value)}
                                aria-label="Quantity"
                                required
                            />
                            <FormErrorMessage>{errors.quantity}</FormErrorMessage>
                        </FormControl>
                    </VStack>
                </DrawerBody>

                <DrawerFooter>
                    <Button variant="outline" mr={3} onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button colorScheme="blue" isLoading={isLoading} onClick={handleUpdate}>
                        Update
                    </Button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}
