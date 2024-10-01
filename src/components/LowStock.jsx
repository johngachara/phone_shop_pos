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
    useToast
} from '@chakra-ui/react';
import Navbar from "./Navbar.jsx";
import { useNavigate } from "react-router-dom";
import {apiService} from "../apiService.js";

const LowStock = () => {
    const [data, setData] = useState([]);
    const [nextPage, setNextPage] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();
    const navigate = useNavigate();

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const result = await apiService.dashboardData("low_stock", localStorage.getItem("access"));

            if (result.status === 401) {
                navigate('/Login');
                return;
            }

            if (result.status !== 'error') {
                setData(prevData => [...prevData, ...result.data]);
                setNextPage(result.nextPage);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast({
                title: "Error fetching data",
                description: "There was an error loading the data. Please try again.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
        setIsLoading(false);
    };

    useEffect(() => {
        setData([]); // Reset the data on initial load
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
        <Box minH="100vh">
            <Navbar />
            <Box ml={{ base: 0, md: "250px" }} p={5}>
                <VStack spacing={5} align="stretch">
                    <Heading>Shop 2 Low Stock</Heading>

                    <HStack>
                        <Select value="low_stock">
                            <option value="low_stock">LOW STOCK</option>
                        </Select>
                        <Input
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </HStack>

                    <Table variant="simple">
                        <Thead>
                            <Tr>
                                <Th>Product Name</Th>
                                <Th>Quantity</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {filteredData.map((item, index) => (
                                <Tr key={index}>
                                    <Td>{item.product_name}</Td>
                                    <Td>{item.quantity}</Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>

                    {filteredData.length === 0 && !isLoading && (
                        <Text>No results found. Try adjusting your search.</Text>
                    )}

                    <Button
                        onClick={loadMore}
                        isLoading={isLoading}
                        loadingText="Loading..."
                        isDisabled={!nextPage || isLoading}
                    >
                        Load More
                    </Button>
                </VStack>
            </Box>
        </Box>
    );
};

export default LowStock;
