import {
    Box,
    Container,
    Heading,
    Input,
    InputGroup,
    InputRightElement,
    Text,
    VStack,
    SimpleGrid,
    Icon,
    Button,
    useColorModeValue,
    Fade
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import RenderLcdItems from "./RenderLcdItems";
import useSearchScreens from "../hooks/useSearchScreens";

export default function LcdBody({
                                    searchParam,
                                    setSearchParam,
                                    loading,
                                    shopData,
                                    handleSellClick,
                                    handleUpdateClick,
                                    handleCompleteClick,
                                    setDeleteItemId,
                                    setIsDeleteDialogOpen,
                                    currentPage,
                                    setCurrentPage,
                                    onLoadMore,
                                    disableUpdateButton,
                                    hasMore
                                }) {
    const { searchResults, loading: searchLoading } = useSearchScreens(searchParam);
    const bgColor = useColorModeValue("white", "gray.800");
    const textColor = useColorModeValue("gray.800", "white");

    return (
        <Box bg={useColorModeValue("gray.50", "gray.900")} minH="100vh">
            <Container maxW="8xl" py={8}>
                <VStack spacing={8} align="stretch">
                    {/* Header Section */}
                    <Box
                        bg={bgColor}
                        p={6}
                        borderRadius="xl"
                        boxShadow="sm"
                        position="sticky"
                        top="0"
                        zIndex="sticky"
                    >
                        <VStack spacing={4} align={{ base: "center", md: "stretch" }}>
                            <Heading
                                fontSize={{ base: "2xl", md: "3xl" }}
                                fontWeight="bold"
                                color={textColor}
                                textAlign={{ base: "center", md: "left" }}
                            >
                                Screens Inventory
                            </Heading>
                            <InputGroup
                                size="lg"
                                maxW={{ base: "100%", md: "2xl" }}
                            >
                                <Input
                                    placeholder="Search by name, category, or SKU..."
                                    value={searchParam}
                                    onChange={(e) => setSearchParam(e.target.value)}
                                    borderRadius="full"
                                    bg={useColorModeValue("white", "gray.700")}
                                    _focus={{
                                        boxShadow: "outline",
                                        borderColor: "blue.400"
                                    }}
                                    fontSize="md"
                                />
                                <InputRightElement pointerEvents="none">
                                    <Icon as={SearchIcon} color="gray.400" w={5} h={5} />
                                </InputRightElement>
                            </InputGroup>
                        </VStack>
                    </Box>

                    {/* Content Section */}
                    <Fade in={!loading && !searchLoading}>
                        {loading || searchLoading ? (
                            <SimpleGrid
                                columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
                                spacing={6}
                                w="full"
                            >
                                {[...Array(8)].map((_, index) => (
                                    <Box
                                        key={index}
                                        bg={bgColor}
                                        height="300px"
                                        borderRadius="xl"
                                        boxShadow="sm"
                                        position="relative"
                                        overflow="hidden"
                                    >
                                        <Box
                                            position="absolute"
                                            top="0"
                                            left="0"
                                            right="0"
                                            bottom="0"
                                            bg="gray.100"
                                            animation="pulse 2s infinite"
                                        />
                                    </Box>
                                ))}
                            </SimpleGrid>
                        ) : searchResults?.length > 0 || shopData ? (
                            <RenderLcdItems
                                items={searchResults?.length > 0 ? searchResults : shopData}
                                handleSellClick={handleSellClick}
                                handleUpdateClick={handleUpdateClick}
                                handleCompleteClick={handleCompleteClick}
                                setDeleteItemId={setDeleteItemId}
                                setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                                disableUpdateButton={disableUpdateButton}
                            />
                        ) : (
                            <Box
                                textAlign="center"
                                py={20}
                                bg={bgColor}
                                borderRadius="xl"
                                boxShadow="sm"
                            >
                                <Text
                                    fontSize="xl"
                                    color={textColor}
                                    fontWeight="medium"
                                >
                                    No items found
                                </Text>
                                <Text color="gray.500" mt={2}>
                                    Try adjusting your search terms
                                </Text>
                            </Box>
                        )}
                    </Fade>

                    {/* Load More Section */}
                    {searchResults?.length === 0 && !loading && shopData && !searchLoading && hasMore && (
                        <Box textAlign="center" mt={8}>
                            <Button
                                onClick={onLoadMore}
                                isLoading={loading}
                                size="lg"
                                colorScheme="blue"
                                borderRadius="full"
                                px={8}
                                _hover={{
                                    transform: "translateY(-2px)",
                                    boxShadow: "lg"
                                }}
                                transition="all 0.2s"
                            >
                                Load More
                            </Button>
                        </Box>
                    )}
                </VStack>
            </Container>
        </Box>
    );
}