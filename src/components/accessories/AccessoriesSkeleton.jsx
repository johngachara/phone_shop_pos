import {
    Box,
    Skeleton,
    SkeletonText,
    SimpleGrid,
    VStack,
    HStack,
    useColorModeValue,
    Container,
    Heading,
    InputGroup,
    Input,
    InputRightElement,
    Icon,
    Card,
    CardBody,
    Divider,
    Button,
    IconButton,
    Badge,
    Text,
    Flex,
    Stack,
    Progress
} from "@chakra-ui/react";
import { SearchIcon, DeleteIcon, EditIcon, ArrowForwardIcon } from "@chakra-ui/icons";

const AccessoriesSkeleton = () => {
    const bgColor = useColorModeValue("white", "gray.800");
    const textColor = useColorModeValue("gray.700", "gray.200");
    const cardHoverBg = useColorModeValue("gray.50", "gray.700");

    return (
        <Box bg={useColorModeValue("gray.50", "gray.900")} minH="100vh">
            <Container maxW="8xl" py={8}>
                <VStack spacing={8} align="stretch">


                    {/* Cards with Skeleton Content */}
                    <SimpleGrid
                        columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
                        spacing={6}
                        w="full"
                    >
                        {[...Array(8)].map((_, index) => (
                            <Card
                                key={index}
                                bg={bgColor}
                                height="100%"
                                borderRadius="xl"
                                overflow="hidden"
                                _hover={{
                                    transform: 'translateY(-2px)',
                                    shadow: 'lg',
                                    bg: cardHoverBg
                                }}
                                transition="all 0.2s"
                            >
                                <CardBody p={5}>
                                    <VStack spacing={4} align="stretch">
                                        {/* Header with Skeleton Product Name and Badge */}
                                        <Flex justify="space-between" align="start" gap={2}>
                                            <Skeleton height="24px" width="70%" />
                                            <Badge
                                                colorScheme="gray"
                                                px={3}
                                                py={1}
                                                borderRadius="full"
                                                textTransform="none"
                                            >
                                                <Skeleton height="16px" width="60px" />
                                            </Badge>
                                        </Flex>

                                        {/* Skeleton Stock Level */}
                                        <Box>
                                            <Text fontSize="sm" mb={1} color={textColor}>
                                                Stock Level
                                            </Text>
                                            <Skeleton height="8px" borderRadius="full" />
                                            <Flex justify="flex-end" mt={1}>
                                                <Skeleton height="16px" width="60px" />
                                            </Flex>
                                        </Box>

                                        <Divider />

                                        {/* Skeleton Price */}
                                        <Stack>
                                            <Text fontSize="sm" color={textColor}>
                                                Unit Price
                                            </Text>
                                            <Skeleton height="32px" width="100px" />
                                        </Stack>

                                        {/* Action Buttons - Fully Rendered */}
                                        <VStack spacing={3}>
                                            <Button
                                                colorScheme="blue"
                                                width="full"
                                                size="lg"
                                                rightIcon={<ArrowForwardIcon />}
                                                _hover={{ transform: 'translateY(-1px)' }}
                                            >
                                                Quick Sell
                                            </Button>
                                            <HStack width="full" spacing={2}>
                                                <IconButton
                                                    icon={<EditIcon />}
                                                    variant="outline"
                                                    colorScheme="gray"
                                                    flex={1}
                                                    size="lg"
                                                    aria-label="Update item"
                                                />
                                                <IconButton
                                                    icon={<DeleteIcon />}
                                                    variant="outline"
                                                    colorScheme="red"
                                                    flex={1}
                                                    size="lg"
                                                    aria-label="Delete item"
                                                />
                                            </HStack>
                                        </VStack>
                                    </VStack>
                                </CardBody>
                            </Card>
                        ))}
                    </SimpleGrid>

                    {/* Load More Button - Fully Rendered */}
                    <Box textAlign="center" mt={8}>
                        <Button
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
                </VStack>
            </Container>
        </Box>
    );
};

export default AccessoriesSkeleton;