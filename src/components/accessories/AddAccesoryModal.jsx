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
import useAccessoryStore from "components/zustand/useAccessoryStore.js";


const AddAccessoryModal = ({ isOpen, onClose }) => {
    const [data, setData] = useState({
        product_name: "",
        quantity: "",
        price: "",
    });

    const [errors, setErrors] = useState({});
    const toast = useToast();
    const { addAccessory, isAdding } = useAccessoryStore();
    const textColor = useColorModeValue("gray.700", "gray.200");

    const handleChange = (event) => {
        const { name, value } = event.target;
        setData((prevState) => ({
            ...prevState,
            [name]: value,
        }));
        setErrors((prevErrors) => ({
            ...prevErrors,
            [name]: "",
        }));
    };

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
            return;
        }

        const result = await addAccessory(data, toast);

        if (result.success) {
            onClose();
            setData({
                product_name: "",
                quantity: "",
                price: "",
            });
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
                            isLoading={isAdding}
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