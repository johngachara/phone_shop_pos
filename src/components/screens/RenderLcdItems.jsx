import {
    Box,
    Heading,
    Text,
    SimpleGrid,
    HStack,
    VStack,
    useColorModeValue,
    Tooltip,
    IconButton,
    Flex,
    Divider,
} from "@chakra-ui/react";
import { 
    TrashIcon, 
    PencilIcon, 
    ArrowRightIcon,
    CurrencyDollarIcon 
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import ModernCard from "../ui/ModernCard";
import ModernButton from "../ui/ModernButton";
import StockIndicator from "../ui/StockIndicator";
import ItemSkeleton from "./ItemSkeleton";

const MotionBox = motion(Box);

export default function RenderLcdItems({
                                           items,
                                           handleSellClick,
                                           handleUpdateClick,
                                           setDeleteItemId,
                                           setIsDeleteDialogOpen,
                                           isItemsLoading
                                       }) {
    const textColor = useColorModeValue("gray.700", "gray.200");
    const priceColor = useColorModeValue("primary.600", "primary.300");
    const mutedTextColor = useColorModeValue("gray.500", "gray.400");

    return (
        <SimpleGrid
            columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
            spacing={6}
            w="full"
        >
            {items.map((item, index) => {
                if (isItemsLoading) {
                    return (
                        <MotionBox
                            key={item.id || index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                            <ItemSkeleton />
                        </MotionBox>
                    );
                }

                return (
                    <MotionBox
                        key={item.id || index}
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
                                        {item.product_name}
                                    </Heading>
                                    <Text fontSize="sm" color={mutedTextColor}>
                                        Product ID: {item.id}
                                    </Text>
                                </Box>

                                {/* Stock Indicator */}
                                <StockIndicator 
                                    quantity={item.quantity}
                                    maxQuantity={100}
                                    size="md"
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
                                                {parseFloat(item.price).toFixed(0)}
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
                                        isDisabled={item.quantity < 1}
                                        onClick={() => handleSellClick(item)}
                                        rightIcon={<ArrowRightIcon size={16} />}
                                    >
                                        Quick Sell
                                    </ModernButton>
                                    
                                    <HStack width="full" spacing={2}>
                                        <Tooltip label="Edit Product" hasArrow placement="top">
                                            <IconButton
                                                icon={<PencilIcon size={18} />}
                                                variant="outline"
                                                colorScheme="gray"
                                                flex={1}
                                                onClick={() => handleUpdateClick(item)}
                                                size="lg"
                                                aria-label="Update item"
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
            })}
        </SimpleGrid>
    );
}