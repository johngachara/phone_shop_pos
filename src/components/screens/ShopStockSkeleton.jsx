import {
    Box,
    Skeleton,
    SkeletonText,
    SimpleGrid,
    VStack,
    HStack,
    useColorModeValue,
    Container,
} from "@chakra-ui/react";

const ShopStockSkeleton = () => {
    const cardBg = useColorModeValue("white", "gray.800");
    const borderColor = useColorModeValue("gray.200", "gray.700");

    return (
        <Container maxW="container.xl" py={8}>
            {/* Search Bar Skeleton */}
            <VStack spacing={8} width="full">
                <HStack width="full" justify="space-between">
                    <Skeleton height="40px" width="200px" />
                    <Skeleton height="40px" width={{ base: "full", md: "320px" }} />
                </HStack>

                {/* Cards Grid */}
                <SimpleGrid
                    columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
                    spacing={6}
                    width="full"
                >
                    {[...Array(8)].map((_, idx) => (
                        <Box
                            key={idx}
                            bg={cardBg}
                            borderRadius="xl"
                            overflow="hidden"
                            boxShadow="sm"
                            border="1px"
                            borderColor={borderColor}
                            p={5}
                        >
                            {/* Card Header */}
                            <VStack spacing={4} align="stretch">
                                <Skeleton height="24px" width="80%" />
                                <Skeleton height="20px" width="40%" />

                                {/* Stock Status */}
                                <HStack>
                                    <SkeletonText noOfLines={1} width="30%" />
                                    <Skeleton height="16px" width="60px" />
                                </HStack>

                                {/* Price Section */}
                                <Box pt={2}>
                                    <Skeleton height="32px" width="120px" />
                                </Box>

                                {/* Action Buttons */}
                                <VStack spacing={3} pt={2}>
                                    <Skeleton height="40px" width="full" />
                                    <HStack width="full" spacing={2}>
                                        <Skeleton height="40px" width="full" />
                                        <Skeleton height="40px" width="full" />
                                    </HStack>
                                </VStack>
                            </VStack>
                        </Box>
                    ))}
                </SimpleGrid>

                {/* Load More Skeleton */}
                <Skeleton height="40px" width={{ base: "full", md: "200px" }} />
            </VStack>
        </Container>
    );
};

export default ShopStockSkeleton;