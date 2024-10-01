import { useState } from "react";
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    FormControl,
    FormLabel,
    Input,
    Button,
    useColorModeValue,
    useToast,
    FormErrorMessage,
} from "@chakra-ui/react";
import { apiService } from "../../apiService.js";

const AddAccessoryModal = ({ isOpen, onClose }) => {
    const [saving, setSaving] = useState(false);
    const [data, setData] = useState({
        product_name: "",
        quantity: "",
        price: "",
    });

    const [errors, setErrors] = useState({});
    const toast = useToast();
    const token = localStorage.getItem("accessories");

    const handleChange = (event) => {
        const { name, value } = event.target;
        setData((prevState) => ({
            ...prevState,
            [name]: value,
        }));
        setErrors((prevErrors) => ({
            ...prevErrors,
            [name]: "", // Clear error for the field being edited
        }));
    };

    const textColor = useColorModeValue("gray.700", "gray.200");

    const validate = () => {
        const newErrors = {};
        if (!data.product_name.trim()) {
            newErrors.product_name = "Product name is required.";
        }
        if (data.quantity === "" || isNaN(data.quantity) || Number(data.quantity) < 0) {
            newErrors.quantity = "Quantity must be a positive number.";
        }
        if (data.price === "" || isNaN(data.price) || Number(data.price) < 0) {
            newErrors.price = "Price must be a positive number.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validate()) {
            return; // Prevent submission if validation fails
        }

        setSaving(true);
        try {
            const { status, message } = await apiService.addAccessories(token, data);
            if (status === 201) {
                toast({
                    status: "success",
                    description: "Item added successfully",
                    position: "top",
                });
                onClose();
                setData({
                    product_name: "",
                    quantity: "",
                    price: "",
                });
            } else {
                throw new Error(
                    message || "Unable to add product. Check if product already exists."
                );
            }
        } catch (err) {
            toast({
                title: "Error",
                status: "error",
                description: err.message,
                position: "top",
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader color={textColor}>Add Shop 2 Accessory</ModalHeader>
                <ModalCloseButton />
                <form onSubmit={handleSubmit}>
                    <ModalBody>
                        {/* Product Name */}
                        <FormControl isInvalid={!!errors.product_name} mb={4}>
                            <FormLabel>Product Name</FormLabel>
                            <Input
                                type="text"
                                required={true}
                                value={data.product_name}
                                onChange={handleChange}
                                name="product_name"
                            />
                            <FormErrorMessage>{errors.product_name}</FormErrorMessage>
                        </FormControl>

                        {/* Quantity */}
                        <FormControl isInvalid={!!errors.quantity} mb={4}>
                            <FormLabel>Quantity</FormLabel>
                            <Input
                                type="number"
                                required={true}
                                value={data.quantity}
                                onChange={handleChange}
                                name="quantity"
                            />
                            <FormErrorMessage>{errors.quantity}</FormErrorMessage>
                        </FormControl>

                        {/* Price */}
                        <FormControl isInvalid={!!errors.price} mb={6}>
                            <FormLabel>Selling Price</FormLabel>
                            <Input
                                type="number"
                                required={true}
                                value={data.price}
                                onChange={handleChange}
                                name="price"
                            />
                            <FormErrorMessage>{errors.price}</FormErrorMessage>
                        </FormControl>
                    </ModalBody>

                    <ModalFooter>
                        <Button
                            type="submit"
                            colorScheme="blue"
                            isLoading={saving}
                            loadingText="Saving"
                            mr={3}
                        >
                            Save
                        </Button>
                        <Button variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
};

export default AddAccessoryModal;
