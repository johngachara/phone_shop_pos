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
    Button,
    Select,
    Input,
    VStack,
    HStack,
    Text,
    useToast,
    Card,
    CardHeader,
    CardBody,
    InputGroup,
    InputLeftElement,
    Badge,
    Skeleton,
    useColorModeValue,
    Icon,
    Container,
    Flex
} from '@chakra-ui/react';
import { SearchIcon, WarningIcon } from '@chakra-ui/icons';
import Navbar from "./Navbar.jsx";
import { useNavigate } from "react-router-dom";
import { apiService } from "../../apiService.js";

const LowStock = () => {
    const [data, setData] = useState([]);
    const [nextPage, setNextPage] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();
    const navigate = useNavigate();

    // Color mode values
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const headerBg = useColorModeValue('gray.50', 'gray.900');

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const result = await apiService.dashboardData("low_stock", localStorage.getItem("access"));
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

    const getQuantityColor = () => {
        return 'white';
    };

    return (
        <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
            <Navbar />
            <Box ml={{ base: 0, md: "250px" }} transition="margin-left 0.3s">
                <Container maxW="container.xl" py={8}>
                    <VStack spacing={6} align="stretch">
                        <Flex align="center" gap={2}>
                            <Icon as={WarningIcon} w={6} h={6} color="orange.500" />
                            <Heading size="lg">Low Stock Items</Heading>
                        </Flex>

                        <Card boxShadow="sm" borderRadius="lg" overflow="hidden">
                            <CardHeader bg={headerBg} borderBottom="1px" borderColor={borderColor} py={4}>
                                <HStack spacing={4}>
                                    <InputGroup maxW={{ base: "full", md: "md" }}>
                                        <InputLeftElement>
                                            <SearchIcon color="gray.400" />
                                        </InputLeftElement>
                                        <Input
                                            placeholder="Search products..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            borderRadius="md"
                                            _focus={{ borderColor: 'blue.400', boxShadow: 'outline' }}
                                        />
                                    </InputGroup>
                                    <Select
                                        isReadOnly={true}
                                        value="low_stock"
                                        maxW="200px"
                                        borderRadius="md"
                                    >
                                        <option value="low_stock">LOW STOCK</option>
                                    </Select>
                                </HStack>
                            </CardHeader>

                            <CardBody p={0}>
                                <Box overflowX="auto">
                                    <Table variant="simple">
                                        <Thead>
                                            <Tr bg={headerBg}>
                                                <Th>Product Name</Th>
                                                <Th>Stock Status</Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {isLoading && data.length === 0 ? (
                                                [...Array(5)].map((_, idx) => (
                                                    <Tr key={`skeleton-${idx}`}>
                                                        <Td><Skeleton height="20px" /></Td>
                                                        <Td><Skeleton height="20px" width="100px" /></Td>
                                                    </Tr>
                                                ))
                                            ) : (
                                                filteredData.map((item, index) => (
                                                    <Tr key={index} _hover={{ bg: headerBg }}>
                                                        <Td fontWeight="medium">{item.product_name}</Td>
                                                        <Td>
                                                            <Badge
                                                                colorScheme={getQuantityColor()}
                                                                borderRadius="full"
                                                                px={3}
                                                                py={1}
                                                            >
                                                                {item.quantity} units left
                                                            </Badge>
                                                        </Td>
                                                    </Tr>
                                                ))
                                            )}
                                        </Tbody>
                                    </Table>

                                    {filteredData.length === 0 && !isLoading && (
                                        <Box p={8} textAlign="center">
                                            <Text color="gray.500">No results found. Try adjusting your search.</Text>
                                        </Box>
                                    )}
                                </Box>
                            </CardBody>
                        </Card>

                        {nextPage && (
                            <Button
                                onClick={loadMore}
                                isLoading={isLoading}
                                loadingText="Loading more items..."
                                isDisabled={!nextPage || isLoading}
                                colorScheme="blue"
                                size="lg"
                                width="full"
                                maxW="md"
                                mx="auto"
                            >
                                Load More Items
                            </Button>
                        )}
                    </VStack>
                </Container>
            </Box>
        </Box>
    );
};

export default LowStock;