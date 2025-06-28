import React, { useState, useEffect } from 'react';
import {
    Box,
    Heading,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Select,
    Input,
    VStack,
    HStack,
    Text,
    useToast,
    InputGroup,
    InputLeftElement,
    Skeleton,
    useColorModeValue,
    Container,
    Flex,
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
} from '@chakra-ui/react';
import { 
    MagnifyingGlassIcon, 
    ExclamationTriangleIcon,
    ChevronRightIcon 
} from '@heroicons/react/24/outline';
import { motion } from "framer-motion";
import Navbar from "./Navbar.jsx";
import { useNavigate } from "react-router-dom";
import { apiService } from "../../apiService.js";
import ModernCard from "../ui/ModernCard";
import ModernButton from "../ui/ModernButton";

const MotionBox = motion.create(Box);
const MotionContainer = motion.create(Container);

const LowStock = () => {
    const [data, setData] = useState([]);
    const [nextPage, setNextPage] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();
    const navigate = useNavigate();

    // Modern color scheme
    const bgColor = useColorModeValue('gray.50', 'gray.900');
    const cardBgColor = useColorModeValue('white', 'gray.800');
    const textColor = useColorModeValue('gray.800', 'white');
    const mutedTextColor = useColorModeValue('gray.600', 'gray.400');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const headerBg = useColorModeValue('gray.50', 'gray.700');

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const result = await apiService.dashboardData("low_stock");
            setData(prevData => [...prevData, ...result.data]);
            setNextPage(result.nextPage);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast({
                title: "Error fetching data",
                description: "There was an error loading the data. Please try again.",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "top-right"
            });
        }
        setIsLoading(false);
    };

    useEffect(() => {
        setData([]);
        fetchData();
    }, [navigate]);

    const loadMore = () => {
        if (nextPage) {
            fetchData(nextPage);
        }
    };

    const filteredData = data.filter(item =>
        Object.values(item).some(value =>
            value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
    );
    return (
        <Box bg={bgColor} minH="100vh">
            <Navbar />
            <Box ml={{ base: 0, md: "280px" }} transition="margin-left 0.3s">
                <MotionContainer
                    maxW="8xl"
                    py={8}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <VStack spacing={8} align="stretch">
                        {/* Header Section */}
                        <MotionBox
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <ModernCard variant="elevated">
                                <VStack spacing={6} align="stretch">
                                    {/* Breadcrumb */}
                                    <Breadcrumb
                                        spacing="8px"
                                        separator={<ChevronRightIcon size={16} color={mutedTextColor} />}
                                        fontSize="sm"
                                        color={mutedTextColor}
                                    >
                                        <BreadcrumbItem>
                                            <BreadcrumbLink color="primary.500" fontWeight="medium">
                                                Inventory
                                            </BreadcrumbLink>
                                        </BreadcrumbItem>
                                        <BreadcrumbItem isCurrentPage>
                                            <BreadcrumbLink color={textColor} fontWeight="medium">
                                                Low Stock
                                            </BreadcrumbLink>
                                        </BreadcrumbItem>
                                    </Breadcrumb>

                                    {/* Header Content */}
                                    <Flex
                                        direction={{ base: "column", lg: "row" }}
                                        justify="space-between"
                                        align={{ base: "stretch", lg: "center" }}
                                        gap={6}
                                    >
                                        <VStack align="start" spacing={2}>
                                            <HStack spacing={3}>
                                                <Box
                                                    p={2}
                                                    bg="warning.100"
                                                    borderRadius="lg"
                                                    color="warning.600"
                                                >
                                                    <ExclamationTriangleIcon size={24} />
                                                </Box>
                                                <Heading
                                                    fontSize={{ base: "2xl", md: "3xl" }}
                                                    fontWeight="bold"
                                                    color={textColor}
                                                    letterSpacing="tight"
                                                >
                                                    Low Stock Alert
                                                </Heading>
                                            </HStack>
                                            <Text color={mutedTextColor} fontSize="lg">
                                                Monitor products that need restocking
                                            </Text>
                                        </VStack>

                                        {/* Search and Filter */}
                                        <HStack spacing={4} w={{ base: "full", lg: "auto" }}>
                                            <InputGroup maxW={{ base: "full", md: "md" }}>
                                                <InputLeftElement>
                                                    <MagnifyingGlassIcon size={20} color={mutedTextColor} />
                                                </InputLeftElement>
                                                <Input
                                                    placeholder="Search products..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    borderRadius="lg"
                                                    bg={cardBgColor}
                                                    borderColor={borderColor}
                                                    _focus={{
                                                        borderColor: 'primary.400',
                                                        boxShadow: 'outline',
                                                    }}
                                                />
                                            </InputGroup>
                                            <Select
                                                isReadOnly={true}
                                                value="low_stock"
                                                maxW="200px"
                                                borderRadius="lg"
                                                bg={cardBgColor}
                                                borderColor={borderColor}
                                            >
                                                <option value="low_stock">LOW STOCK</option>
                                            </Select>
                                        </HStack>
                                    </Flex>
                                </VStack>
                            </ModernCard>
                        </MotionBox>

                        {/* Table Section */}
                        <MotionBox
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <ModernCard variant="elevated">
                                <Box overflowX="auto">
                                    <Table variant="simple" size="lg">
                                        <Thead bg={headerBg}>
                                            <Tr>
                                                <Th 
                                                    color={textColor} 
                                                    fontWeight="semibold" 
                                                    fontSize="sm"
                                                    py={4}
                                                >
                                                    Product Name
                                                </Th>
                                                <Th 
                                                    color={textColor} 
                                                    fontWeight="semibold" 
                                                    fontSize="sm"
                                                    py={4}
                                                >
                                                    Stock Status
                                                </Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {isLoading && data.length === 0 ? (
                                                [...Array(5)].map((_, idx) => (
                                                    <Tr key={`skeleton-${idx}`}>
                                                        <Td py={4}>
                                                            <Skeleton height="20px" borderRadius="md" />
                                                        </Td>
                                                        <Td py={4}>
                                                            <Skeleton height="24px" width="120px" borderRadius="full" />
                                                        </Td>
                                                    </Tr>
                                                ))
                                            ) : (
                                                filteredData.map((item, index) => (
                                                    <MotionBox
                                                        as={Tr}
                                                        key={index}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                                        _hover={{ bg: headerBg }}
                                                    >
                                                        <Td py={4}>
                                                            <Text fontWeight="medium" color={textColor}>
                                                                {item.product_name}
                                                            </Text>
                                                        </Td>
                                                        <Td py={4}>
                                                            <Text
                                                                size="md"
                                                            >
                                                                {item.quantity}
                                                            </Text>
                                                        </Td>
                                                    </MotionBox>
                                                ))
                                            )}
                                        </Tbody>
                                    </Table>

                                    {filteredData.length === 0 && !isLoading && (
                                        <Box p={12} textAlign="center">
                                            <VStack spacing={4}>
                                                <Box
                                                    p={4}
                                                    bg="gray.100"
                                                    borderRadius="full"
                                                    color="gray.400"
                                                >
                                                    <ExclamationTriangleIcon size={48} />
                                                </Box>
                                                <VStack spacing={2}>
                                                    <Heading size="md" color={textColor}>
                                                        No low stock items found
                                                    </Heading>
                                                    <Text color={mutedTextColor}>
                                                        All products are well stocked or no results match your search.
                                                    </Text>
                                                </VStack>
                                            </VStack>
                                        </Box>
                                    )}
                                </Box>
                            </ModernCard>
                        </MotionBox>

                        {/* Load More Button */}
                        {nextPage && (
                            <MotionBox
                                textAlign="center"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3, delay: 0.4 }}
                            >
                                <ModernButton
                                    onClick={loadMore}
                                    isLoading={isLoading}
                                    loadingText="Loading more items..."
                                    isDisabled={!nextPage || isLoading}
                                    size="lg"
                                    variant="elevated"
                                >
                                    Load More Items
                                </ModernButton>
                            </MotionBox>
                        )}
                    </VStack>
                </MotionContainer>
            </Box>
        </Box>
    );
};

export default LowStock;