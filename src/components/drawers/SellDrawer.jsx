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
    FormErrorMessage,
    Spinner,
    Flex,
    List,
    ListItem, useToast
} from "@chakra-ui/react";
import { useEffect, useState, useCallback } from "react";
import debounce from "lodash.debounce";
import authService from "components/axios/authService.js"; // Install lodash for debouncing if not already

export function SellDrawer({
                               isOpen,
                               onClose,
                               selectedItem,
                               sellingPrice,
                               onSellingPriceChange,
                               customer,
                               onCustomerChange,
                               onSell,
                               onComplete,
                               buttonStates,
                           }) {
    const [errors, setErrors] = useState({
        sellingPrice: "",
        customer: ""
    });
    const [customers, setCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const toast = useToast()
    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            setIsLoading(true);
            const response = await authService.axiosInstance.get("/api/customers/");
            setCustomers(response.data);
            setIsLoading(false);
        } catch (error) {
            console.error("Error fetching customers:", error);
            setIsLoading(false);
        }
    };

    // Debounce to avoid re-rendering on every keystroke
    const debounceSearch = useCallback(
        debounce((value) => setSearchTerm(value), 300),
        []
    );

    const handleCustomerChange = (e) => {
        const value = e.target.value;
        debounceSearch(value); // Apply debounce
        onCustomerChange(e);
        setShowDropdown(true); // Show dropdown as user types

        // Clear errors while typing
        setErrors((prevErrors) => ({ ...prevErrors, customer: "" }));
    };

    // Filter customers based on search term
    const filteredCustomers = customers.filter((c) =>
        c.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelectCustomer = (customerName) => {
        onCustomerChange({ target: { value: customerName } }); // Create a synthetic event object
        setSearchTerm(""); // Clear the search term to hide dropdown
        setShowDropdown(false); // Hide dropdown
    };
    const handleBlur = () => {
        // If there are no matching customers and the input value is not empty
        if (filteredCustomers.length === 0 && customer.trim() !== "") {
            // Set the customer state to the input value
            onCustomerChange({ target: { value: customer.trim() } });
            toast({
                title: "Customer not found",
                description: "New customer will be created automatically.",
                status: "info",
                duration: 3000,
                isClosable: true,
                position: "bottom"
            });
        }
        setShowDropdown(false); // Hide dropdown on blur
    };
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
            onSell(selectedItem, sellingPrice, customer);
        }
    };

    const handleCompleteClick = () => {
        if (validate()) {
            onComplete(selectedItem, sellingPrice, customer);
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
                            <Text fontSize="sm" color="gray.500" mb={2}>
                                Start typing to search for an existing customer. If the customer is not found, a new one will be created automatically.
                            </Text>
                            <Flex direction="column">
                                <Input
                                    required={true}
                                    value={customer}
                                    type="text"
                                    onChange={handleCustomerChange}
                                    onBlur={handleBlur}
                                    placeholder="Search or create a customer"
                                />
                                {isLoading && <Spinner ml={2} />}
                                {/* Dropdown for customer search preview */}
                                {showDropdown && filteredCustomers.length > 0 && (
                                    <Box border="1px solid #ccc" borderRadius="md" mt={2} boxShadow="md" maxH="150px" overflowY="auto">
                                        <List spacing={1}>
                                            {filteredCustomers.map((c,index) => (
                                                <ListItem
                                                    key={index}
                                                    px={4}
                                                    py={2}
                                                    cursor="pointer"
                                                    _hover={{ background: "gray.100" }}
                                                    onMouseDown={() => handleSelectCustomer(c.customer_name)}
                                                >
                                                    {c.customer_name}
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Box>
                                )}
                            </Flex>
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
