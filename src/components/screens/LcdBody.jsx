import {
    Button,
    Container,
    Flex,
    Heading,
    HStack,
    Icon,
    Input,
    InputGroup,
    InputRightElement,
    SimpleGrid,
    Skeleton,
    Text,
    useColorModeValue,
    VStack
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import RenderLcdItems from "components/screens/RenderLcdItems.jsx";
import useSearchScreens from "components/hooks/useSearchScreens.js";

export default function LcdBody(props) {
    const {
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
        setCurrentPage
    } = props;

    const { searchResults, loading: searchLoading } = useSearchScreens(searchParam);

    return (
        <Container maxW="container.xl" py={8}>
            <VStack spacing={8} align="stretch">
                <Flex
                    justify="space-between"
                    align="center"
                    wrap="wrap"
                    mb={{ base: 4, md: 8 }}
                >
                    <Heading
                        as="h1"
                        size={{ base: "lg", md: "2xl" }}
                        color={useColorModeValue("gray.800", "white")}
                    >
                        Shop 2 Screens
                    </Heading>
                    <InputGroup maxW={{ base: "100%", md: "md" }}>
                        <Input
                            placeholder="Search LCD/TOUCH"
                            value={searchParam}
                            onChange={(e) => setSearchParam(e.target.value)}
                            borderRadius="full"
                            size={{ base: "sm", md: "md" }}
                        />
                        <InputRightElement>
                            <Icon as={SearchIcon} color="gray.500" />
                        </InputRightElement>
                    </InputGroup>
                </Flex>

                {loading || searchLoading ? (
                    <SimpleGrid
                        columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
                        spacing={6}
                        w="full"
                    >
                        {[...Array(8)].map((_, index) => (
                            <Skeleton
                                key={index}
                                height={{ base: "150px", md: "200px" }}
                                borderRadius="lg"
                            />
                        ))}
                    </SimpleGrid>
                ) : searchResults.length > 0 || shopData ? (
                    <RenderLcdItems
                        items={searchResults.length > 0 ? searchResults : shopData}
                        handleSellClick={handleSellClick}
                        handleUpdateClick={handleUpdateClick}
                        handleCompleteClick={handleCompleteClick}
                        setDeleteItemId={setDeleteItemId}
                        setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                    />
                ) : (
                    <Text fontSize="xl" textAlign="center">
                        No items found.
                    </Text>
                )}

                {searchResults.length === 0 && !loading && shopData && !searchLoading && (
                    <HStack justify="center" spacing={4} mt={8} wrap="wrap">
                        <Button
                            onClick={() => setCurrentPage((prev) => prev - 1)}
                            isDisabled={currentPage === 1}
                            size={{ base: "sm", md: "md" }}
                        >
                            Previous
                        </Button>
                        <Button
                            onClick={() => setCurrentPage((prev) => prev + 1)}
                            size={{ base: "sm", md: "md" }}
                        >
                            Next
                        </Button>
                    </HStack>
                )}
            </VStack>
        </Container>
    );
}
