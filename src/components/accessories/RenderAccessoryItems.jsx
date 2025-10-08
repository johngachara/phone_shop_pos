import {
    Box,
    Heading,
    HStack,
    Text,
    VStack,
    useColorModeValue,
    IconButton,
    Tooltip,
    Flex,
    Divider,
} from '@chakra-ui/react';
import {EditIcon,TrashIcon} from 'lucide-react'
import {
    ArrowRightIcon,
    CurrencyDollarIcon 
} from '@heroicons/react/24/outline';
import { motion } from "framer-motion";
import ModernCard from "../ui/ModernCard";
import ModernButton from "../ui/ModernButton";
import StockIndicator from "../ui/StockIndicator";

const MotionBox = motion.create(Box);

const RenderAccessoryItems = ({
                                  item,
                                  index,
                                  openDrawer,
                                  setDeleteItemId,
                                  setIsDeleteDialogOpen,
                                  isLoading
                              }) => {
    const textColor = useColorModeValue('gray.700', 'gray.200');
    const priceColor = useColorModeValue('primary.600', 'primary.300');
    const mutedTextColor = useColorModeValue('gray.500', 'gray.400');

    return (
        <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
        >
            <ModernCard variant="elevated" isHoverable>
                <VStack spacing={5} align="stretch">
                    {/* Product Header */}
                    <Box>
                        <Heading
                            size="md"
                            color={textColor}
                            noOfLines={2}
                            lineHeight="1.3"
                            mb={2}
                        >
                            {item?.product_name || "Product Name"}
                        </Heading>
                        <Text fontSize="sm" color={mutedTextColor}>
                            Product ID: {item?.id || "N/A"}
                        </Text>
                    </Box>

                    {/* Stock Indicator */}
                    <StockIndicator 
                        quantity={isLoading ? 0 : item.quantity}
                        maxQuantity={30}
                        size="lg"
                    />

                    <Divider />

                    {/* Price Section */}
                    <Flex align="center" justify="space-between">
                        <VStack align="start" spacing={1}>
                            <Text fontSize="sm" color={mutedTextColor} fontWeight="medium">
                                Unit Price
                            </Text>
                            <HStack spacing={1}>
                                <CurrencyDollarIcon size={20} color={priceColor} />
                                <Heading size="lg" color={priceColor}>
                                    {isLoading ? '0.00' : parseFloat(item.price).toFixed(0)}
                                </Heading>
                            </HStack>
                        </VStack>
                    </Flex>

                    {/* Action Buttons */}
                    <VStack spacing={3}>
                        <ModernButton
                            variant="gradient"
                            colorScheme="primary"
                            size="lg"
                            isFullWidth
                            isDisabled={isLoading || (item && item.quantity < 1)}
                            onClick={() => openDrawer("sell", item)}
                            rightIcon={<ArrowRightIcon size={16} />}
                        >
                            Quick Sell
                        </ModernButton>

                        <HStack width="full" spacing={2}>
                            <Tooltip label="Edit Product" hasArrow placement="top">
                                <IconButton
                                    icon={<EditIcon size={18} />}
                                    variant="outline"
                                    colorScheme="gray"
                                    flex={1}
                                    onClick={() => openDrawer("update", item)}
                                    size="lg"
                                    aria-label="Update item"
                                    isDisabled={isLoading}
                                    borderRadius="lg"
                                    _hover={{
                                        transform: "translateY(-1px)",
                                        boxShadow: "md",
                                    }}
                                />
                            </Tooltip>
                            <Tooltip label="Delete Product" hasArrow placement="top">
                                <IconButton
                                    icon={<TrashIcon size={18} />}
                                    variant="outline"
                                    colorScheme="red"
                                    flex={1}
                                    onClick={() => {
                                        setDeleteItemId(item.id);
                                        setIsDeleteDialogOpen(true);
                                    }}
                                    size="lg"
                                    aria-label="Delete item"
                                    isDisabled={isLoading}
                                    borderRadius="lg"
                                    _hover={{
                                        transform: "translateY(-1px)",
                                        boxShadow: "md",
                                    }}
                                />
                            </Tooltip>
                        </HStack>
                    </VStack>
                </VStack>
            </ModernCard>
        </MotionBox>
    );
};

export default RenderAccessoryItems;