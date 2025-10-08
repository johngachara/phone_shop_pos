import {
    Box,
    Container,
    Heading,
    Input,
    InputGroup,
    InputRightElement,
    Text,
    VStack,
    Icon,
    useColorModeValue,
    HStack,
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink, Flex, SimpleGrid, useToast,
} from "@chakra-ui/react";
import { 
    MagnifyingGlassIcon,
    ChevronRightIcon,
    CubeIcon 
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { Meilisearch } from "meilisearch";
import RenderLcdItems from "./RenderLcdItems";
import ItemSkeleton from "./ItemSkeleton";
import ModernCard from "../ui/ModernCard";
import ModernButton from "../ui/ModernButton";
import useSearchStore from "components/zustand/useScreenSearch.js";

const MotionBox = motion.create(Box);
const MotionContainer = motion.create(Container);

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
                                    onLoadMore,
                                    isItemsLoading,
                                    isLoadingMore
                                }) {
    const { searchResults, loading: searchLoading, setSearchResults, setLoading } = useSearchStore();
    const bgColor = useColorModeValue("gray.50", "gray.900");
    const cardBgColor = useColorModeValue("white", "gray.800");
    const textColor = useColorModeValue("gray.800", "white");
    const mutedTextColor = useColorModeValue("gray.600", "gray.400");
    const borderColor = useColorModeValue("gray.200", "gray.700");
    const toast = useToast()
    const client = new Meilisearch({
        host: import.meta.env.VITE_MEILISEARCH_URL,
        apiKey: import.meta.env.VITE_MEILISEARCH_KEY
    });

    const displayData = searchResults?.length > 0 ? searchResults : shopData;
    const showLoadingSkeleton = loading && !displayData || searchLoading;
    const showEmptyState = !showLoadingSkeleton && !displayData?.length && !searchLoading;

    useEffect(() => {
        const handleSearch = async () => {
            if (!searchParam) {
                setSearchResults([]);
                return;
            }
            if (searchParam.length > 0) {
                setLoading(true);
            }
            try {
                const response = await client.index('Shop2Stock').search(searchParam);
                const info = response.hits;
                if(info.length === 0){
                   toast({
                       status : "warning",
                       title : "No Results Found",
                       description : "No item with given name found",
                       position : "top"
                   })
                }
                setSearchResults(info);
            } catch (err) {
                console.error("Search error:", err);
            } finally {
                setLoading(false);
            }
        };
        const debounceSearch = setTimeout(handleSearch, 200);
        return () => clearTimeout(debounceSearch);
    }, [searchParam]);

    return (
        <Box bg={bgColor} minH="100vh">
            <MotionContainer
                maxW="8xl"
                py={8}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <VStack spacing={8} align="stretch">
                    {/* Header Section */}
                    <MotionBox
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <ModernCard variant="elevated">
                            <VStack spacing={6} align="stretch">
                                {/* Breadcrumb */}
                                <Breadcrumb
                                    spacing="8px"
                                    separator={<ChevronRightIcon size={16} color={mutedTextColor} />}
                                    fontSize="sm"
                                    color={mutedTextColor}
                                >
                                    <BreadcrumbItem>
                                        <BreadcrumbLink color="primary.500" fontWeight="medium">
                                            Inventory
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbItem isCurrentPage>
                                        <BreadcrumbLink color={textColor} fontWeight="medium">
                                            LCD Screens
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                </Breadcrumb>

                                {/* Header Content */}
                                <Flex
                                    direction={{ base: "column", lg: "row" }}
                                    justify="space-between"
                                    align={{ base: "stretch", lg: "center" }}
                                    gap={6}
                                >
                                    <VStack align="start" spacing={2}>
                                        <HStack spacing={3}>
                                            <Box
                                                p={2}
                                                bg="primary.100"
                                                borderRadius="lg"
                                                color="primary.600"
                                            >
                                                <CubeIcon size={24} />
                                            </Box>
                                            <Heading
                                                fontSize={{ base: "2xl", md: "3xl" }}
                                                fontWeight="bold"
                                                color={textColor}
                                                letterSpacing="tight"
                                            >
                                                LCD Screens Inventory
                                            </Heading>
                                        </HStack>
                                        <Text color={mutedTextColor} fontSize="lg">
                                            Manage your screen inventory and track stock levels
                                        </Text>
                                    </VStack>

                                    {/* Search Bar */}
                                    <Box minW={{ base: "full", lg: "400px" }}>
                                        <InputGroup size="lg">
                                            <Input
                                                placeholder="Search by product name..."
                                                value={searchParam}
                                                onChange={(e) => setSearchParam(e.target.value)}
                                                borderRadius="xl"
                                                bg={cardBgColor}
                                                borderColor={borderColor}
                                                borderWidth="2px"
                                                fontSize="md"
                                                _hover={{
                                                    borderColor: "primary.400",
                                                }}
                                                _focus={{
                                                    borderColor: "primary.500",
                                                    boxShadow: "0 0 0 1px rgba(74, 144, 226, 0.6)",
                                                }}
                                                _placeholder={{
                                                    color: mutedTextColor,
                                                }}
                                            />
                                            <InputRightElement pointerEvents="none">
                                                <Icon 
                                                    as={MagnifyingGlassIcon} 
                                                    color={mutedTextColor} 
                                                    boxSize={5}
                                                />
                                            </InputRightElement>
                                        </InputGroup>
                                    </Box>
                                </Flex>
                            </VStack>
                        </ModernCard>
                    </MotionBox>

                    {/* Content Section */}
                    <MotionBox
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        {showLoadingSkeleton ? (
                            <SimpleGrid
                                columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
                                spacing={6}
                                w="full"
                            >
                                {[...Array(8)].map((_, index) => (
                                    <MotionBox
                                        key={index}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.1 }}
                                    >
                                        <ItemSkeleton />
                                    </MotionBox>
                                ))}
                            </SimpleGrid>
                        ) : displayData?.length > 0 ? (
                            <RenderLcdItems
                                items={displayData}
                                handleSellClick={handleSellClick}
                                handleUpdateClick={handleUpdateClick}
                                handleCompleteClick={handleCompleteClick}
                                setDeleteItemId={setDeleteItemId}
                                setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                                isItemsLoading={isItemsLoading}
                            />
                        ) : showEmptyState ? (
                            <ModernCard variant="outlined">
                                <VStack spacing={6} py={12} textAlign="center">
                                    <Box
                                        p={4}
                                        bg="gray.100"
                                        borderRadius="full"
                                        color="gray.400"
                                    >
                                        <CubeIcon size={48} />
                                    </Box>
                                    <VStack spacing={2}>
                                        <Heading size="lg" color={textColor}>
                                            No screens found
                                        </Heading>
                                        <Text color={mutedTextColor} fontSize="lg">
                                            {searchParam 
                                                ? "Try adjusting your search terms" 
                                                : "Start by adding some LCD screens to your inventory"
                                            }
                                        </Text>
                                    </VStack>
                                    {searchParam && (
                                        <ModernButton
                                            variant="outline"
                                            onClick={() => setSearchParam("")}
                                        >
                                            Clear Search
                                        </ModernButton>
                                    )}
                                </VStack>
                            </ModernCard>
                        ) : null}
                    </MotionBox>

                    {/* Load More Section */}
                    {!showLoadingSkeleton && !searchLoading && displayData?.length > 11 && (
                        <MotionBox
                            textAlign="center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: 0.4 }}
                        >
                            <ModernButton
                                onClick={onLoadMore}
                                isLoading={isLoadingMore}
                                loadingText="Loading more..."
                                size="lg"
                                variant="solid"
                                colorScheme="elevated"
                            >
                                Load More Products
                            </ModernButton>
                        </MotionBox>
                    )}
                </VStack>
            </MotionContainer>
        </Box>
    );
}