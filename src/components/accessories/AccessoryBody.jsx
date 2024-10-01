import {
    Box,
    Container,
    VStack,
    Flex,
    Heading,
    InputGroup,
    Input,
    InputRightElement,
    Icon,
    SimpleGrid,
    Skeleton,
    Text,
    HStack,
    Button, useColorModeValue,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import Navbar from '../Navbar.jsx';


const AccessoryBody = ({
                             pageBgColor,
                             searchParam,
                             setSearchParam,
                             loading,
                             searchResults,
                             shopData,
                             renderItems,
                             currentPage,
                             setCurrentPage,
                         }) => {
    return (
        <Flex direction="column" minH="100vh">
            <Navbar />
            <Box
                bg={pageBgColor}
                flex={1}
                p={{ base: 4, md: 8 }}
                ml={{ base: 0, md: '250px' }}
                transition="margin-left 0.3s"
            >
                <Container maxW="container.xl" py={8}>
                    <VStack spacing={8} align="stretch">
                        <Flex
                            direction={{ base: 'column', md: 'row' }}
                            justify="space-between"
                            align={{ base: 'stretch', md: 'center' }}
                            wrap="wrap"
                            mb={6}
                        >
                            <Heading
                                as="h1"
                                size={{ base: 'xl', md: '2xl' }}
                                color={useColorModeValue('gray.800', 'white')}
                                mb={{ base: 4, md: 0 }}
                            >
                                Shop 2 Accessories
                            </Heading>
                            <InputGroup maxW={{ base: '100%', md: 'md' }} width="full">
                                <Input
                                    placeholder="Search accessories"
                                    value={searchParam}
                                    onChange={(e) => setSearchParam(e.target.value)}
                                    borderRadius="full"
                                />
                                <InputRightElement>
                                    <Icon as={SearchIcon} color="gray.500" />
                                </InputRightElement>
                            </InputGroup>
                        </Flex>

                        {loading ? (
                            <SimpleGrid
                                columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
                                spacing={{ base: 4, md: 6 }}
                                w="full"
                            >
                                {[...Array(8)].map((_, index) => (
                                    <Skeleton
                                        key={index}
                                        height={{ base: '250px', sm: '300px' }}
                                        borderRadius="lg"
                                    />
                                ))}
                            </SimpleGrid>
                        ) : searchResults.length > 0 || shopData ? (
                            renderItems(searchResults.length > 0 ? searchResults : shopData)
                        ) : (
                            <Text fontSize={{ base: 'lg', md: 'xl' }} textAlign="center">
                                No items found.
                            </Text>
                        )}

                        {searchResults.length === 0 && !loading && (
                            <HStack justify="center" spacing={4} mt={6}>
                                <Button
                                    onClick={() => setCurrentPage((prev) => prev - 1)}
                                    isDisabled={currentPage === 1}
                                    size={{ base: 'sm', md: 'md' }}
                                >
                                    Previous
                                </Button>
                                <Button
                                    onClick={() => setCurrentPage((prev) => prev + 1)}
                                    size={{ base: 'sm', md: 'md' }}
                                >
                                    Next
                                </Button>
                            </HStack>
                        )}
                    </VStack>
                </Container>
            </Box>
        </Flex>
    );
};

export default AccessoryBody;
