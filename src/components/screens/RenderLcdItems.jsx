import {
    Box,
    Badge,
    Button,
    Heading,
    Text,
    SimpleGrid,
    HStack,
    VStack,
    useColorModeValue,
    Card,
    CardBody,
    Progress,
    Tooltip,
    IconButton,
    Flex,
    Divider,
    Stack,
} from "@chakra-ui/react";
import { DeleteIcon, EditIcon, ArrowForwardIcon } from "@chakra-ui/icons";
import ItemSkeleton from "./ItemSkeleton";

export default function RenderLcdItems({
                                           items,
                                           handleSellClick,
                                           handleUpdateClick,
                                           setDeleteItemId,
                                           setIsDeleteDialogOpen,
                                           //disableUpdateButton,
                                           isItemsLoading
                                       }) {
    const bgColor = useColorModeValue("white", "gray.800");
    const textColor = useColorModeValue("gray.700", "gray.200");
    const cardHoverBg = useColorModeValue("gray.50", "gray.700");

    // Stock level calculation
    const getStockStatus = (quantity) => {
        if (quantity === 0) return { color: 'red', status: 'Out of Stock', progress: 0 };
        if (quantity <= 3) return { color: 'red', status: 'Critical Stock', progress: 20 };
        if (quantity <= 10) return { color: 'blue', status: 'Good Stock', progress: 80 };
        return { color: 'green', status: 'Optimal', progress: 100 };
    };

    return (
        <SimpleGrid
            columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
            spacing={6}
            w="full"
        >
            {items.map((item, index) => {
                const stockStatus = getStockStatus(item.quantity);

                // If items are still loading but we have skeleton data, show skeleton inside each card
                if (isItemsLoading) {
                    return (
                        <Box key={item.id || index}>
                            <ItemSkeleton />
                        </Box>
                    );
                }

                return (
                    <Box
                        key={item.id || index}
                    >
                        <Card
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
                                    {/* Header with Stock Badge */}
                                    <Flex justify="space-between" align="start" gap={2}>
                                        <Heading
                                            size="md"
                                            noOfLines={2}
                                            flex="1"
                                        >
                                            {item.product_name}
                                        </Heading>
                                        <Tooltip
                                            label={`${item.quantity} units remaining`}
                                            placement="top"
                                            hasArrow
                                        >
                                            <Badge
                                                colorScheme={stockStatus.color}
                                                px={3}
                                                py={1}
                                                borderRadius="full"
                                                textTransform="none"
                                                display="flex"
                                                alignItems="center"
                                                gap={2}
                                            >
                                                {stockStatus.status}
                                            </Badge>
                                        </Tooltip>
                                    </Flex>

                                    {/* Stock Level Indicator */}
                                    <Box>
                                        <Text fontSize="sm" mb={1} color={textColor}>
                                            Stock Level
                                        </Text>
                                        <Progress
                                            value={stockStatus.progress}
                                            colorScheme={stockStatus.color}
                                            borderRadius="full"
                                            size="sm"
                                            hasStripe={item.quantity > 0}
                                            isAnimated={item.quantity > 0}
                                        />
                                        <Text
                                            fontSize="sm"
                                            color={textColor}
                                            mt={1}
                                            textAlign="right"
                                        >
                                            {item.quantity} units
                                        </Text>
                                    </Box>

                                    <Divider />

                                    {/* Price Section */}
                                    <Stack>
                                        <Text fontSize="sm" color={textColor}>
                                            Unit Price
                                        </Text>
                                        <Heading size="lg" color={useColorModeValue('blue.600', 'blue.300')}>
                                            {parseFloat(item.price).toFixed(0)}
                                        </Heading>
                                    </Stack>

                                    {/* Action Buttons */}
                                    <VStack spacing={3}>
                                        <Button
                                            colorScheme="blue"
                                            width="full"
                                            size="lg"
                                            isDisabled={item.quantity < 1}
                                            onClick={() => handleSellClick(item)}
                                            rightIcon={<ArrowForwardIcon />}
                                            _hover={{ transform: 'translateY(-1px)' }}
                                        >
                                            Quick Sell
                                        </Button>
                                        <HStack width="full" spacing={2}>
                                            <Tooltip label="Update Item" hasArrow>
                                                <IconButton
                                                    icon={<EditIcon />}
                                                    variant="outline"
                                                    colorScheme="gray"
                                                    flex={1}
                                                    onClick={() => handleUpdateClick(item)}
                                                    size="lg"
                                                    aria-label="Update item"
                                                />
                                            </Tooltip>
                                            <Tooltip label="Delete Item" hasArrow>
                                                <IconButton
                                                    icon={<DeleteIcon />}
                                                    variant="outline"
                                                    colorScheme="red"
                                                    flex={1}
                                                    onClick={() => {
                                                        setDeleteItemId(item.id);
                                                        setIsDeleteDialogOpen(true);
                                                    }}
                                                    size="lg"
                                                    aria-label="Delete item"
                                                />
                                            </Tooltip>
                                        </HStack>
                                    </VStack>
                                </VStack>
                            </CardBody>
                        </Card>
                    </Box>
                );
            })}
        </SimpleGrid>
    );
}