import {
    Box,
    Skeleton,
    SkeletonCircle,
    SkeletonText,
    Stack,
    useColorModeValue,
    Flex,
    Center,
    Spinner,
    Text,
    Fade
} from "@chakra-ui/react";
import { useEffect, useState } from "react";

// Mode types:
// - "full" = Full layout with sidebar and content (default)
// - "auth" = Lighter auth/login loading state
// - "content" = Just the main content area for lazy loading components
// - "minimal" = Minimal spinner for quick operations

const SkeletonLoader = ({ mode = "full", message = "", duration = 0 }) => {
    const bgColor = useColorModeValue("gray.50", "gray.900");
    const contentBgColor = useColorModeValue("white", "gray.800");
    const sidebarBgColor = useColorModeValue("gray.100", "gray.700");
    const textColor = useColorModeValue("gray.600", "gray.300");

    const [showLoader, setShowLoader] = useState(true);
    const [timeoutExceeded, setTimeoutExceeded] = useState(false);

    // Optional timeout effect for showing a different state if loading takes too long
    useEffect(() => {
        if (duration > 0) {
            const timeout = setTimeout(() => {
                setTimeoutExceeded(true);
            }, duration);

            return () => clearTimeout(timeout);
        }
    }, [duration]);

    // Render different loaders based on mode
    const renderLoader = () => {
        switch (mode) {
            case "auth":
                return (
                    <Fade in={showLoader}>
                        <Center height="100vh" width="100%" flexDirection="column">
                            <Spinner
                                size="xl"
                                color="blue.500"
                                thickness="4px"
                                speed="0.65s"
                                mb={6}
                            />
                            <Text fontSize="lg" color={textColor}>
                                {message || "Signing you in..."}
                            </Text>
                        </Center>
                    </Fade>
                );

            case "content":
                return (
                    <Fade in={showLoader}>
                        <Box
                            width="100%"
                            p={4}
                            bg={contentBgColor}
                            borderRadius="md"
                            boxShadow="sm"
                        >
                            <SkeletonText mt="2" noOfLines={2} spacing="4" skeletonHeight="2" />
                            <Stack mt="6" spacing="4">
                                {[...Array(5)].map((_, i) => (
                                    <Skeleton key={i} height="60px" />
                                ))}
                            </Stack>
                        </Box>
                    </Fade>
                );

            case "minimal":
                return (
                    <Fade in={showLoader}>
                        <Center p={4}>
                            <Spinner size="md" color="blue.500" mr={3} />
                            <Text>{message || "Loading..."}</Text>
                        </Center>
                    </Fade>
                );

            case "full":
            default:
                return (
                    <Fade in={showLoader}>
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
                                <Flex alignItems="center" mb={6}>
                                    <SkeletonCircle size="10" mr={3} />
                                    <Skeleton height="20px" width="70%" />
                                </Flex>
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
                                <Skeleton height="40px" width="200px" mb={6} />
                                <SkeletonText mt="4" noOfLines={2} spacing="4" skeletonHeight="2" />
                                <Stack mt="6" spacing="4">
                                    {[...Array(6)].map((_, i) => (
                                        <Skeleton key={i} height="60px" />
                                    ))}
                                </Stack>
                            </Box>
                        </Box>
                    </Fade>
                );
        }
    };

    // Show a fallback message if loading takes too long
    if (timeoutExceeded) {
        return (
            <Center height="100vh" width="100%" flexDirection="column" p={4} textAlign="center">
                <Text fontSize="lg" mb={3}>
                    This is taking longer than expected...
                </Text>
                <Text fontSize="md" color={textColor} maxWidth="500px">
                    {message || "We're still working on it. You can continue waiting or try refreshing the page."}
                </Text>
            </Center>
        );
    }

    return renderLoader();
};

export default SkeletonLoader;