import Navbar from "components/Navbar.jsx";
import {
    Box,
    Flex,
    Heading,
    SimpleGrid,
    Stat,
    StatHelpText,
    StatLabel,
    StatNumber,
    Table,
    TableCaption, Tbody, Td, Th, Thead, Tr
} from "@chakra-ui/react";
import AdminSkeletonLoading from "components/AdminSkeletonLoading.jsx";
import {Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import React from "react";

export default function DashboardPage({loading,data,accessoryData}) {
    return(
        <Flex>
            <Navbar />
            <Box
                flex="1"
                ml={{ base: 0, md: '250px' }} // Adjust margin-left based on screen size
                p={5}
            >
                {loading || !data || !accessoryData ? <AdminSkeletonLoading /> : (
                    <Box>
                        <Heading mb={5}>Admin Dashboard</Heading>
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={10} mb={10}>
                            <Stat>
                                <StatLabel>Total Screens Sale</StatLabel>
                                <StatNumber>{data.total_sales.toFixed(2) || 0}</StatNumber>
                            </Stat>
                            {/*<Stat>*/}
                            {/*    <StatLabel>Total Accessories Sale</StatLabel>*/}
                            {/*    <StatNumber>{accessoryData?.total_sales.toFixed(2) || 0}</StatNumber>*/}
                            {/*</Stat>*/}
                            <Stat>
                                <StatLabel>Top Screen Sold</StatLabel>
                                <StatNumber>{data.top_products[0].product_name}</StatNumber>
                                <StatHelpText>{data.top_products[0].total_quantity} units</StatHelpText>
                            </Stat>
                            {/*<Stat>*/}
                            {/*    <StatLabel>Top Accessory Sold</StatLabel>*/}
                            {/*    <StatNumber>{accessoryData?.top_products[0].product_name || ""}</StatNumber>*/}
                            {/*    <StatHelpText>{accessoryData?.top_products[0].total_quantity || 0} units</StatHelpText>*/}
                            {/*</Stat>*/}
                            <Stat>
                                <StatLabel>Top Screen Customer</StatLabel>
                                <StatNumber>{data.high_value_customers[0].customer_name_lower}</StatNumber>
                                <StatHelpText>{data.high_value_customers[0].total_spend.toFixed(2)}</StatHelpText>
                            </Stat>
                            {/*<Stat>*/}
                            {/*    <StatLabel>Top Accessory Customer</StatLabel>*/}
                            {/*    <StatNumber>{accessoryData.customer_analysis[0].customer_lower}</StatNumber>*/}
                            {/*    <StatHelpText>{accessoryData.customer_analysis[0].total_spend}</StatHelpText>*/}
                            {/*</Stat>*/}
                        </SimpleGrid>

                        <Flex direction={{ base: 'column', lg: 'row' }} gap={10} mb={10}>
                            <Box flex={1}>
                                <Heading size="md" mb={3}>Screens Monthly Sales Trend</Heading>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={data.monthly_sales_trend}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="total_sales" fill="#8884d8" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                            {/*<Box flex={1}>*/}
                            {/*    <Heading size="md" mb={3}>Accessory Monthly Sales Trend</Heading>*/}
                            {/*    <ResponsiveContainer width="100%" height={300}>*/}
                            {/*        <BarChart data={accessoryData?.monthly_sales}>*/}
                            {/*            <CartesianGrid strokeDasharray="3 3" />*/}
                            {/*            <XAxis dataKey="month" />*/}
                            {/*            <YAxis />*/}
                            {/*            <Tooltip />*/}
                            {/*            <Legend />*/}
                            {/*            <Bar dataKey="total_sales" fill="#8884d8" />*/}
                            {/*        </BarChart>*/}
                            {/*    </ResponsiveContainer>*/}
                            {/*</Box>*/}
                        </Flex>

                        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={10}>
                            <Box>
                                <Heading size="md" mb={3}>Top Selling Screens</Heading>
                                <Table variant="simple">
                                    <TableCaption>Top 5 Selling Screens</TableCaption>
                                    <Thead>
                                        <Tr>
                                            <Th>Product</Th>
                                            <Th isNumeric>Quantity</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {data.top_products.map((product, index) => (
                                            <Tr key={index}>
                                                <Td>{product.product_name}</Td>
                                                <Td isNumeric>{product.total_quantity}</Td>
                                            </Tr>
                                        ))}
                                    </Tbody>
                                </Table>
                            </Box>
                            {/*<Box>*/}
                            {/*    <Heading size="md" mb={3}>Top Selling Accessories</Heading>*/}
                            {/*    <Table variant="simple">*/}
                            {/*        <TableCaption>Top 5 Selling Accessories</TableCaption>*/}
                            {/*        <Thead>*/}
                            {/*            <Tr>*/}
                            {/*                <Th>Product</Th>*/}
                            {/*                <Th isNumeric>Quantity</Th>*/}
                            {/*            </Tr>*/}
                            {/*        </Thead>*/}
                            {/*        <Tbody>*/}
                            {/*            {accessoryData?.top_products.map((product, index) => (*/}
                            {/*                <Tr key={index}>*/}
                            {/*                    <Td>{product.product_name}</Td>*/}
                            {/*                    <Td isNumeric>{product.total_quantity}</Td>*/}
                            {/*                </Tr>*/}
                            {/*            ))}*/}
                            {/*        </Tbody>*/}
                            {/*    </Table>*/}
                            {/*</Box>*/}
                            <Box>
                                <Heading size="md" mb={3}>Frequent Screen Customers</Heading>
                                <Table variant="simple">
                                    <TableCaption>Top 5 Frequent Screen Customers</TableCaption>
                                    <Thead>
                                        <Tr>
                                            <Th>Customer</Th>
                                            <Th isNumeric>Transactions</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {data.frequent_customers.slice(0, 5).map((customer, index) => (
                                            <Tr key={index}>
                                                <Td>{customer.customer_name_lower}</Td>
                                                <Td isNumeric>{customer.total_transactions}</Td>
                                            </Tr>
                                        ))}
                                    </Tbody>
                                </Table>
                            </Box>
                            {/*<Box>*/}
                            {/*    <Heading size="md" mb={3}>Frequent Accessory Customers</Heading>*/}
                            {/*    <Table variant="simple">*/}
                            {/*        <TableCaption>Top 5 Frequent Accessory Customers</TableCaption>*/}
                            {/*        <Thead>*/}
                            {/*            <Tr>*/}
                            {/*                <Th>Customer</Th>*/}
                            {/*                <Th isNumeric>Transactions</Th>*/}
                            {/*            </Tr>*/}
                            {/*        </Thead>*/}
                            {/*        <Tbody>*/}
                            {/*            {accessoryData.customer_analysis.slice(0, 5).map((customer, index) => (*/}
                            {/*                <Tr key={index}>*/}
                            {/*                    <Td>{customer.customer_lower}</Td>*/}
                            {/*                    <Td isNumeric>{customer.total_transactions}</Td>*/}
                            {/*                </Tr>*/}
                            {/*            ))}*/}
                            {/*        </Tbody>*/}
                            {/*    </Table>*/}
                            {/*</Box>*/}
                            <Box>
                                <Heading size="md" mb={3}>High Value Screen Customers</Heading>
                                <Table variant="simple">
                                    <TableCaption>Top 5 High Value Screen Customers</TableCaption>
                                    <Thead>
                                        <Tr>
                                            <Th>Customer</Th>
                                            <Th isNumeric>Total Spend</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {data.high_value_customers.map((customer, index) => (
                                            <Tr key={index}>
                                                <Td>{customer.customer_name_lower}</Td>
                                                <Td isNumeric>{customer.total_spend.toFixed(2)}</Td>
                                            </Tr>
                                        ))}
                                    </Tbody>
                                </Table>
                            </Box>
                            {/*<Box>*/}
                            {/*    <Heading size="md" mb={3}>High Value Accessory Customers</Heading>*/}
                            {/*    <Table variant="simple">*/}
                            {/*        <TableCaption>Top 5 High Value Accessory Customers</TableCaption>*/}
                            {/*        <Thead>*/}
                            {/*            <Tr>*/}
                            {/*                <Th>Customer</Th>*/}
                            {/*                <Th isNumeric>Total Spend</Th>*/}
                            {/*            </Tr>*/}
                            {/*        </Thead>*/}
                            {/*        <Tbody>*/}
                            {/*            {accessoryData.customer_analysis.slice(0,5).map((customer, index) => (*/}
                            {/*                <Tr key={index}>*/}
                            {/*                    <Td>{customer.customer_lower}</Td>*/}
                            {/*                    <Td isNumeric>{customer.total_spend}</Td>*/}
                            {/*                </Tr>*/}
                            {/*            ))}*/}
                            {/*        </Tbody>*/}
                            {/*    </Table>*/}
                            {/*</Box>*/}
                        </SimpleGrid>
                    </Box>
                )}
            </Box>
        </Flex>
    )
}