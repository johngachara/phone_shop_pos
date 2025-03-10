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
    Button,
    useColorModeValue,
    Card,
    CardBody,
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
} from '@chakra-ui/react';
import { SearchIcon, ChevronRightIcon, RepeatIcon } from '@chakra-ui/icons';
import Navbar from '../general/Navbar.jsx';
import AccessoriesSkeleton from "components/accessories/AccessoriesSkeleton.jsx";

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
    const headerBg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const searchBg = useColorModeValue('gray.50', 'gray.700');

    return (
        <Flex direction="column" minH="100vh">
            <Navbar />
            <Box
                bg={pageBgColor}
                flex={1}
                ml={{ base: 0, md: '250px' }}
                transition="margin-left 0.3s"
            >
                <Container maxW="container.xl" py={6}>
                    <VStack spacing={6} align="stretch">
                        {/* Header Section */}
                        <Card
                            bg={headerBg}
                            borderBottom="1px"
                            borderColor={borderColor}
                            shadow="sm"
                        >
                            <CardBody>
                                <Flex
                                    direction={{ base: 'column', md: 'row' }}
                                    justify="space-between"
                                    align={{ base: 'stretch', md: 'center' }}
                                    gap={4}
                                >
                                    <VStack align="stretch" spacing={2}>
                                        <Breadcrumb
                                            spacing="8px"
                                            separator={<ChevronRightIcon color="gray.500" />}
                                        >
                                            <BreadcrumbItem>
                                                <BreadcrumbLink color="blue.500">Shop</BreadcrumbLink>
                                            </BreadcrumbItem>
                                            <BreadcrumbItem isCurrentPage>
                                                <BreadcrumbLink>Accessories</BreadcrumbLink>
                                            </BreadcrumbItem>
                                        </Breadcrumb>

                                        <Heading
                                            as="h1"
                                            size={{ base: 'lg', md: 'xl' }}
                                            color={useColorModeValue('gray.800', 'white')}
                                        >
                                            Shop 2 Accessories
                                        </Heading>
                                    </VStack>

                                    <InputGroup maxW={{ base: '100%', md: 'md' }}>
                                        <Input
                                            placeholder="Search accessories..."
                                            value={searchParam}
                                            onChange={(e) => setSearchParam(e.target.value)}
                                            bg={searchBg}
                                            borderRadius="lg"
                                            fontSize="md"
                                            _focus={{
                                                borderColor: 'blue.400',
                                                boxShadow: 'outline',
                                            }}
                                        />
                                        <InputRightElement>
                                            <Icon as={SearchIcon} color="gray.500" />
                                        </InputRightElement>
                                    </InputGroup>
                                </Flex>
                            </CardBody>
                        </Card>

                        {/* Content Section */}
                        <Box>
                            {loading ? (
                               <AccessoriesSkeleton />
                            ) : searchResults.length > 0 || shopData ? (
                                renderItems(searchResults.length > 0 ? searchResults : shopData)
                            ) : (
                                <Card bg={headerBg} shadow="sm">
                                    <CardBody>
                                        <VStack py={10} spacing={4}>
                                            <Text
                                                fontSize={{ base: 'lg', md: 'xl' }}
                                                color="gray.500"
                                                textAlign="center"
                                            >
                                                No accessories found matching your search.
                                            </Text>
                                            <Button
                                                leftIcon={<RepeatIcon />}
                                                colorScheme="blue"
                                                variant="outline"
                                                onClick={() => setSearchParam('')}
                                            >
                                                Clear Search
                                            </Button>
                                        </VStack>
                                    </CardBody>
                                </Card>
                            )}
                        </Box>

                        {/* Pagination */}
                        {searchResults.length === 0 && !loading && (
                            <Card bg={headerBg} shadow="sm">
                                <CardBody>
                                    <HStack justify="center" spacing={4}>
                                        <Button
                                            onClick={() => setCurrentPage((prev) => prev - 1)}
                                            isDisabled={currentPage === 1}
                                            size={{ base: 'md', md: 'lg' }}
                                            colorScheme="blue"
                                            variant="outline"
                                            leftIcon={<ChevronRightIcon transform="rotate(180deg)" />}
                                        >
                                            Previous Page
                                        </Button>
                                        <Text
                                            fontSize="md"
                                            fontWeight="medium"
                                            color="gray.600"
                                        >
                                            Page {currentPage}
                                        </Text>
                                        <Button
                                            onClick={() => setCurrentPage((prev) => prev + 1)}
                                            size={{ base: 'md', md: 'lg' }}
                                            colorScheme="blue"
                                            rightIcon={<ChevronRightIcon />}
                                        >
                                            Next Page
                                        </Button>
                                    </HStack>
                                </CardBody>
                            </Card>
                        )}
                    </VStack>
                </Container>
            </Box>
        </Flex>
    );
};

export default AccessoryBody;