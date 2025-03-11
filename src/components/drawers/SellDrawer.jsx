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
    ListItem,
    useToast,
    useColorModeValue,
} from "@chakra-ui/react";
import { useEffect, useState, useCallback, useRef } from "react";
import debounce from "lodash.debounce";
import authService from "components/axios/authService.js";
import { Search2Icon, CheckIcon } from "@chakra-ui/icons";

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
    const [showDropdown, setShowDropdown] = useState(true); // Show dropdown by default
    const [highlightedSuggestion, setHighlightedSuggestion] = useState("");
    const [cursorPosition, setCursorPosition] = useState(0);
    const [autocompleteSuggestion, setAutocompleteSuggestion] = useState("");
    const bgColor = useColorModeValue("gray.50", "gray.900");
    const toast = useToast();
    const searchInputRef = useRef(null);

    // Handle drawer close
    const handleClose = () => {
        // Clear customer field
        onCustomerChange({ target: { value: "" } });

        // Close the drawer
        onClose();
    };

    // Detect if using a mobile device
    const isMobileDevice = () => {
        if (typeof window !== 'undefined') {
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        }
        return false;
    };

    useEffect(() => {
        if (isOpen) {
            fetchCustomers();
            setShowDropdown(true); // Ensure dropdown is shown when drawer opens
        }
    }, [isOpen]);

    const fetchCustomers = async () => {
        try {
            setIsLoading(true);
            const response = await authService.axiosInstance.get("/api/customers/");
            setCustomers(response.data);
            setIsLoading(false);
        } catch (error) {
            console.error("Error fetching customers:", error);
            setIsLoading(false);
            toast({
                title: "Error",
                description: "Failed to load customers. Please try again.",
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "bottom"
            });
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
        setCursorPosition(e.target.selectionStart || value.length);

        // Find potential autocomplete suggestion
        if (value) {
            const matchingCustomer = filteredCustomers.find(c =>
                c.customer_name.toLowerCase().startsWith(value.toLowerCase()) &&
                c.customer_name.toLowerCase() !== value.toLowerCase()
            );

            if (matchingCustomer) {
                setAutocompleteSuggestion(matchingCustomer.customer_name);
                setHighlightedSuggestion(matchingCustomer.customer_name);
            } else {
                setAutocompleteSuggestion("");
                setHighlightedSuggestion("");
            }
        } else {
            setAutocompleteSuggestion("");
            setHighlightedSuggestion("");
        }

        // Clear errors while typing
        setErrors((prevErrors) => ({ ...prevErrors, customer: "" }));
    };

    // Filter customers based on search term
    const filteredCustomers = customers.filter((c) =>
        c.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelectCustomer = (customerName) => {
        onCustomerChange({ target: { value: customerName } }); // Create a synthetic event object
        setSearchTerm(customerName); // Set search term to selected customer
        setAutocompleteSuggestion(""); // Clear autocomplete
        setShowDropdown(false); // Close dropdown after selection
    };

    const handleKeyDown = (e) => {
        // Complete with Tab or Right arrow if there's a suggestion
        if ((e.key === 'Tab' || e.key === 'ArrowRight') && autocompleteSuggestion &&
            cursorPosition === customer.length) {
            e.preventDefault(); // Prevent default tab behavior
            onCustomerChange({ target: { value: autocompleteSuggestion } });
            setAutocompleteSuggestion("");
            setShowDropdown(false); // Close dropdown after selection
        } else if (e.key === 'ArrowDown' && filteredCustomers.length > 0) {
            e.preventDefault();
            // Find current index or start at -1
            const currentIndex = filteredCustomers.findIndex(c => c.customer_name === highlightedSuggestion);
            const nextIndex = (currentIndex + 1) % filteredCustomers.length;
            setHighlightedSuggestion(filteredCustomers[nextIndex].customer_name);
        } else if (e.key === 'ArrowUp' && filteredCustomers.length > 0) {
            e.preventDefault();
            const currentIndex = filteredCustomers.findIndex(c => c.customer_name === highlightedSuggestion);
            const prevIndex = currentIndex === -1 || currentIndex === 0
                ? filteredCustomers.length - 1
                : currentIndex - 1;
            setHighlightedSuggestion(filteredCustomers[prevIndex].customer_name);
        } else if (e.key === 'Enter' && highlightedSuggestion) {
            e.preventDefault();
            onCustomerChange({ target: { value: highlightedSuggestion } });
            setAutocompleteSuggestion("");
            setShowDropdown(false); // Close dropdown after selection
        }
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

        // Don't hide dropdown on blur anymore
        // setShowDropdown(false);
    };

    const handleFocus = () => {
        setShowDropdown(true);
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
        <Drawer isOpen={isOpen} placement="right" onClose={handleClose} size="md">
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
                                value={parseFloat(sellingPrice).toFixed(0)}
                                type="number"
                                onChange={onSellingPriceChange}
                            />
                            <FormErrorMessage>{errors.sellingPrice}</FormErrorMessage>
                        </FormControl>

                        {/* Customer */}
                        <FormControl isInvalid={!!errors.customer}>
                            <Text mb={2}>Customer</Text>
                            <Text fontSize="sm" color="gray.500" mb={2}>
                                Select a customer or type to search. {!isMobileDevice() && "Use Tab/→ to autocomplete, ↑/↓ to navigate."} New customers will be created if not found.
                            </Text>
                            <Flex direction="column" position="relative">
                                <Flex position="relative" alignItems="center" flexDirection="column" width="100%">
                                    <Box position="relative" w="100%">
                                        <Input
                                            ref={searchInputRef}
                                            required={true}
                                            value={customer}
                                            type="text"
                                            onChange={handleCustomerChange}
                                            onBlur={handleBlur}
                                            onFocus={handleFocus}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Search or create a customer"
                                            paddingRight="35px"
                                        />
                                        {autocompleteSuggestion && (
                                            <Box
                                                position="absolute"
                                                left={0}
                                                top={0}
                                                height="100%"
                                                width="100%"
                                                pointerEvents="none"
                                                paddingLeft="1rem"
                                                paddingRight="2.5rem"
                                                display="flex"
                                                alignItems="center"
                                                color="gray.500"
                                            >
                                                <Text as="span" visibility="hidden">{customer}</Text>
                                                <Text as="span">{autocompleteSuggestion.slice(customer.length)}</Text>
                                            </Box>
                                        )}
                                        <Flex
                                            position="absolute"
                                            right="10px"
                                            top="50%"
                                            transform="translateY(-50%)"
                                            alignItems="center"
                                        >
                                            {autocompleteSuggestion && (
                                                <Text fontSize="xs" color="gray.500" mr={1} display={["none", "block"]}>
                                                    Tab to complete
                                                </Text>
                                            )}
                                            <Search2Icon color="gray.400" />
                                        </Flex>
                                    </Box>
                                    {isLoading && <Spinner position="absolute" right="40px" size="sm" />}
                                </Flex>

                                {/* Always show customer dropdown (initially shows all customers) */}
                                <Box
                                    position="relative"
                                    w="100%"
                                    zIndex="1"
                                    display={showDropdown ? "block" : "none"}
                                >
                                    <Box
                                        bg={bgColor}
                                        border="1px solid #ccc"
                                        borderRadius="md"
                                        mt={2}
                                        boxShadow="md"
                                        maxH="150px"
                                        overflowY="auto"
                                    >
                                        {filteredCustomers.length > 0 ? (
                                            <List spacing={0}>
                                                {filteredCustomers.map((c, index) => (
                                                    <ListItem
                                                        key={index}
                                                        px={4}
                                                        py={2}
                                                        cursor="pointer"
                                                        _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}
                                                        bg={c.customer_name === customer || c.customer_name === highlightedSuggestion
                                                            ? useColorModeValue("blue.50", "blue.900")
                                                            : "transparent"}
                                                        onMouseDown={() => handleSelectCustomer(c.customer_name)}
                                                        display="flex"
                                                        justifyContent="space-between"
                                                        alignItems="center"
                                                    >
                                                        {c.customer_name}
                                                        {c.customer_name === customer && (
                                                            <CheckIcon color="green.500" />
                                                        )}
                                                    </ListItem>
                                                ))}
                                            </List>
                                        ) : (
                                            <Box px={4} py={2} textAlign="center" color="gray.500">
                                                {searchTerm ? "No matching customers found" : "No customers available"}
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            </Flex>
                            <FormErrorMessage>{errors.customer}</FormErrorMessage>
                        </FormControl>
                    </VStack>
                </DrawerBody>

                <DrawerFooter>
                    <Button variant="outline" mr={3} onClick={handleClose}>
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