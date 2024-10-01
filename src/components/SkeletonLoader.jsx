import {
    Box,
    Skeleton,
    SkeletonCircle,
    SkeletonText,
    Stack,
    useColorModeValue
} from "@chakra-ui/react";
const SkeletonLoader = () => {
    const bgColor = useColorModeValue("gray.50", "gray.900");
    const contentBgColor = useColorModeValue("white", "gray.800");
    const sidebarBgColor = useColorModeValue("gray.100", "gray.700");

    return (
        <Box
            height="100vh"
            width="100vw"
            bg={bgColor}
            position="fixed"
            top="0"
            left="0"
            zIndex="9999"
            display="flex"
        >
            {/* Sidebar skeleton */}
            <Box
                width="250px"
                height="100%"
                bg={sidebarBgColor}
                p="4"
                display={{ base: "none", md: "block" }}
            >
                <SkeletonCircle size="10" mb="4" />
                <Stack spacing="4">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} height="30px" />
                    ))}
                </Stack>
            </Box>

            {/* Main content skeleton */}
            <Box
                flex="1"
                p="6"
                bg={contentBgColor}
            >
                <SkeletonText mt="4" noOfLines={2} spacing="4" skeletonHeight="2" />
                <Stack mt="6" spacing="4">
                    {[...Array(8)].map((_, i) => (
                        <Skeleton key={i} height="60px" />
                    ))}
                </Stack>
            </Box>
        </Box>
    );
};

export default SkeletonLoader;