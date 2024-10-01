import {
    Box,
    Flex,
    Heading,
    SimpleGrid,
    Skeleton,
    Stat,
    StatHelpText,
    StatLabel,
    StatNumber,
    Table, TableCaption, Tbody, Td, Th, Thead, Tr
} from "@chakra-ui/react";
import {ResponsiveContainer} from "recharts";
import React from "react";

const AdminSkeletonLoading = () => (
    <Box p={5}>
        <Heading mb={5}>
            <Skeleton height="20px" width="200px" />
        </Heading>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={10} mb={10}>
            {[...Array(4)].map((_, index) => (
                <Stat key={index}>
                    <StatLabel><Skeleton height="20px" width="150px" /></StatLabel>
                    <StatNumber><Skeleton height="30px" width="100px" /></StatNumber>
                    <StatHelpText><Skeleton height="20px" width="80px" /></StatHelpText>
                </Stat>
            ))}
        </SimpleGrid>

        <Flex direction={{ base: 'column', lg: 'row' }} gap={10} mb={10}>
            {[...Array(2)].map((_, index) => (
                <Box flex={1} key={index}>
                    <Heading size="md" mb={3}><Skeleton height="20px" width="200px" /></Heading>
                    <ResponsiveContainer width="100%" height={300}>
                        <Skeleton height={300} />
                    </ResponsiveContainer>
                </Box>
            ))}
        </Flex>

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={10}>
            {[...Array(2)].map((_, index) => (
                <Box key={index}>
                    <Heading size="md" mb={3}><Skeleton height="20px" width="200px" /></Heading>
                    <Table variant="simple">
                        <TableCaption><Skeleton height="20px" width="200px" /></TableCaption>
                        <Thead>
                            <Tr>
                                <Th><Skeleton height="20px" width="200px" /></Th>
                                <Th isNumeric><Skeleton height="20px" width="150px" /></Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {[...Array(5)].map((_, index) => (
                                <Tr key={index}>
                                    <Td><Skeleton height="20px" width="200px" /></Td>
                                    <Td isNumeric><Skeleton height="20px" width="150px" /></Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </Box>
            ))}
        </SimpleGrid>
    </Box>
);
export default AdminSkeletonLoading