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
    FormErrorMessage,
    useToast,
} from "@chakra-ui/react";
import { useState } from "react";

const AddScreenModal = ({
                            isOpen,
                            onClose,
                            onSubmit,
                            isLoading,
                            fieldConfig = [],  // Array of field configurations
                            primaryButtonConfig = { label: "Save", onClick: () => {} },
                            secondaryButtonConfig = { label: "Cancel", onClick: () => onClose() }
                        }) => {
    const [formValues, setFormValues] = useState({});
    const [errors, setErrors] = useState({});
    const toast = useToast();

    // Handle field value changes
    const handleChange = (name, value) => {
        setFormValues(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: "" })); // Clear errors on change
    };

    // Validation logic for all fields based on fieldConfig
    const validateFields = () => {
        const newErrors = {};
        fieldConfig.forEach(({ name, validate }) => {
            if (validate) {
                const error = validate(formValues[name]);
                if (error) newErrors[name] = error;
            }
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle submission with validation
    const handleSave = () => {
        if (validateFields()) {
            onSubmit(formValues);
            setFormValues({}); // Reset form after submission
        } else {
            toast({
                status: "error",
                description: "Please fix errors before submitting.",
                position: "top",
            });
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Add Item</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    {fieldConfig.map(({ label, name, type = "text", placeholder }) => (
                        <FormControl key={name} isInvalid={!!errors[name]} mb={4}>
                            <FormLabel>{label}</FormLabel>
                            <Input
                                type={type}
                                value={formValues[name] || ""}
                                onChange={(e) => handleChange(name, e.target.value)}
                                placeholder={placeholder}
                            />
                            <FormErrorMessage>{errors[name]}</FormErrorMessage>
                        </FormControl>
                    ))}
                </ModalBody>

                <ModalFooter>
                    <Button
                        colorScheme="blue"
                        isLoading={isLoading}
                        onClick={handleSave}
                        mr={3}
                    >
                        {primaryButtonConfig.label}
                    </Button>
                    <Button variant="ghost" onClick={secondaryButtonConfig.onClick}>
                        {secondaryButtonConfig.label}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default AddScreenModal;
