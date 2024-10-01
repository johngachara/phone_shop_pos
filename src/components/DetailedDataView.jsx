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
import useCheckRole from "components/hooks/useCheckRole.js";
import {apiService} from "../apiService.js";

const DetailedDataView = () => {
    const [data, setData] = useState([]);
    const [dataType, setDataType] = useState('low_stock');
    const [nextPage, setNextPage] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();
    const { role, loading:roleLoading, error } = useCheckRole();
    const navigate = useNavigate();

    const columns = {
        low_stock: ['product_name', 'quantity'],
        sales: ['product_name', 'selling_price', 'customer_name'],
        products: ['product_name', 'total_quantity'],
        customers: ['customer_name', 'total_transactions', 'total_spend'],
        accessory_sales: ['product_name', 'selling_price', 'customer'],
    };

    const fetchData = async (datatype) => {
        setIsLoading(true);
        try {
            const result = await apiService.dashboardData(datatype, localStorage.getItem("access"));

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

    const fetchAccessoryData = async () => {
        setIsLoading(true);
        try {
            const result = await apiService.dashboardData(dataType, localStorage.getItem("access"));

            if (result.status === 401) {
                navigate('/Login');
                return;
            }

            if (result.status !== 'error') {
                setData(prevData => [...prevData, ...result.data]);
                setNextPage(result.nextPage);
            }
        } catch (error) {
            console.error('Error fetching accessory data:', error);
            toast({
                title: "Error fetching accessory data",
                description: "There was an error loading the accessory data. Please try again.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
        setIsLoading(false);
    };

    useEffect(() => {
        if (roleLoading) return;  // Don't do anything while loading

        if (error) {
            toast({
                status: "error",
                description: "Error checking your role. Please try again later.",
            });
            navigate('/Login');
            return;
        }

        if (!role) {
            // If no role is found (not logged in or role missing), redirect to login
            navigate('/Login');
        } else if (role !== "admin") {
            // If the role is not admin, show an error and navigate back
            toast({
                status: "error",
                description: "You are not allowed to view this page",
            });
            navigate(-1);  // Navigate back to the previous page
        }
    }, [role, roleLoading, error, navigate, toast]);
    useEffect(() => {
        setData([]);

        if (dataType.startsWith('accessory')) {
            fetchAccessoryData();
        } else {
            fetchData(dataType);
        }
    }, [dataType]);

    const loadMore = () => {
        if (nextPage) {
            if (dataType.startsWith('accessory')) {
                fetchAccessoryData(nextPage);
            } else {
                fetchData(nextPage);
            }
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
                    <Heading>Shop 2 {dataType.replace('_', ' ').toUpperCase()} Data</Heading>

                    <HStack>
                        <Select value={dataType} onChange={(e) => setDataType(e.target.value)}>
                            <option value="sales">LCD & TOUCH SALES</option>
                            <option value="products">LCD & TOUCH SALES PER PRODUCT</option>
                            <option value="customers">LCD & TOUCH SALES PER CUSTOMER</option>
                            <option value="accessory_sales">ACCESSORY SALES</option>
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
                                {columns[dataType].map((column) => (
                                    <Th key={column}>{column.replace('_', ' ').toUpperCase()}</Th>
                                ))}
                            </Tr>
                        </Thead>
                        <Tbody>
                            {filteredData.map((item, index) => (
                                <Tr key={index}>
                                    {columns[dataType].map((column) => (
                                        <Td key={column}>
                                            {column.includes('price') || column.includes('spend')
                                                ? `${parseFloat(item[column]).toFixed(2)}`
                                                : item[column]}
                                        </Td>
                                    ))}
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>

                    {filteredData.length === 0 && (
                        <Text>No results found. Try adjusting your search.</Text>
                    )}

                    <Button
                        onClick={loadMore}
                        isLoading={isLoading || roleLoading}
                        loadingText="Loading..."
                        isDisabled={!nextPage || isLoading || roleLoading}
                    >
                        Load More
                    </Button>
                </VStack>
            </Box>
        </Box>
    );
};

export default DetailedDataView;
