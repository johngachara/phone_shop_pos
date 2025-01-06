import {
    Box,
    Button,
    Heading,
    HStack,
    Text,
    Badge,
    VStack,
    useColorModeValue,
    IconButton,
    Divider,
    Tooltip,
    Card,
    CardBody,
    Flex,
    Progress,
    Stack
} from '@chakra-ui/react';
import { DeleteIcon, EditIcon, ArrowForwardIcon } from '@chakra-ui/icons';
import { motion } from 'framer-motion';

const MotionBox = motion.create(Box);

const RenderAccessoryItems = ({
                                  item,
                                  index,
                                  openDrawer,
                                  setDeleteItemId,
                                  setIsDeleteDialogOpen
                              }) => {
    const bgColor = useColorModeValue('white', 'gray.800');
    const textColor = useColorModeValue('gray.600', 'gray.300');
    const cardHoverBg = useColorModeValue('gray.50', 'gray.700');

    // Stock level calculation
    const getStockStatus = (quantity) => {
        if (quantity === 0) return { color: 'red', status: 'Out of Stock', progress: 0 };
        if (quantity <= 3) return { color: 'red', status: 'Critical', progress: 20 };
        if (quantity <= 10) return { color: 'yellow', status: 'Moderate', progress: 60 };
        if (quantity <= 50) return { color: 'blue', status: 'Good', progress: 80 };
        return { color: 'green', status: 'Optimal', progress: 100 };
    };

    const stockStatus = getStockStatus(item.quantity);

    return (
        <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
        >
            <Card
                bg={bgColor}
                height="100%"
                borderRadius="xl"
                overflow="hidden"
                position="relative"
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
                                {parseFloat(item.price).toFixed(2)}
                            </Heading>
                        </Stack>

                        {/* Action Buttons */}
                        <VStack spacing={3}>
                            <Button
                                colorScheme="blue"
                                width="full"
                                size="lg"
                                isDisabled={item.quantity < 1}
                                onClick={() => openDrawer("sell", item)}
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
                                        onClick={() => openDrawer("update", item)}
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
        </MotionBox>
    );
};

export default RenderAccessoryItems;