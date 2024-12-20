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
        setCurrentPage,
        onLoadMore,
        disableUpdateButton,
        hasMore
    } = props;

    const { searchResults, loading: searchLoading } = useSearchScreens(searchParam);

    return (
        <Container maxW="container.xl" py={8}>
            <VStack spacing={8} align="stretch">
                <VStack
                    spacing={4}
                    align={{ base: "center", md: "stretch" }}
                    mb={{ base: 4, md: 8 }}
                >
                    <Heading
                        as="h1"
                        size={{ base: "lg", md: "2xl" }}
                        color={useColorModeValue("gray.800", "white")}
                        textAlign={{ base: "center", md: "left" }}
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
                </VStack>

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
                        disableUpdateButton={disableUpdateButton}
                    />
                ) : (
                    <Text fontSize="xl" textAlign="center">
                        No items found.
                    </Text>
                )}

                {searchResults.length === 0 && !loading && shopData && !searchLoading && (
                    <HStack justify="center" spacing={4} mt={8} wrap="wrap">
                        <Button
                            onClick={onLoadMore}
                            isLoading={loading}
                            mt={4}
                        >
                            Load More
                        </Button>
                    </HStack>
                )}
            </VStack>
        </Container>
    );
}