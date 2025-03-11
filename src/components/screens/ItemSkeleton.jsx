import {
    Box,
    Skeleton,
    SkeletonText,
    VStack,
    HStack,
    useColorModeValue,
    Card,
    CardBody
} from "@chakra-ui/react";

export default function ItemSkeleton() {
    const bgColor = useColorModeValue("white", "gray.800");

    return (
        <Card
            bg={bgColor}
            height="100%"
            borderRadius="xl"
            overflow="hidden"
            boxShadow="sm"
        >
            <CardBody p={5}>
                <VStack spacing={4} align="stretch">
                    {/* Header with Product Name and Badge */}
                    <HStack justify="space-between">
                        <Skeleton height="24px" width="70%" />
                        <Skeleton height="24px" width="25%" borderRadius="full" />
                    </HStack>

                    {/* Stock Level */}
                    <Box>
                        <Skeleton height="16px" width="80px" mb={1} />
                        <Skeleton height="8px" width="100%" borderRadius="full" />
                        <Skeleton height="16px" width="60px" mt={1} ml="auto" />
                    </Box>

                    <Skeleton height="1px" width="100%" />

                    {/* Price Section */}
                    <Box>
                        <Skeleton height="16px" width="80px" mb={1} />
                        <Skeleton height="36px" width="120px" />
                    </Box>

                    {/* Action Buttons */}
                    <VStack spacing={3}>
                        <Skeleton height="48px" width="100%" borderRadius="md" />
                        <HStack width="100%" spacing={2}>
                            <Skeleton height="40px" width="100%" borderRadius="md" />
                            <Skeleton height="40px" width="100%" borderRadius="md" />
                        </HStack>
                    </VStack>
                </VStack>
            </CardBody>
        </Card>
    );
}