import {
    Badge,
    Box,
    Text,
    VStack,
    Card,
    CardHeader,
    CardBody,
    Stack,
    useColorModeValue,
    Tooltip,
    HStack,
    Flex,
    Divider,
} from "@chakra-ui/react";
import { 
    ShoppingCartIcon, 
    ArrowUturnLeftIcon, 
    ClockIcon,
    CurrencyDollarIcon,
    CalendarDaysIcon 
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import ModernButton from "../ui/ModernButton";
import StatusBadge from "../ui/StatusBadge";

const MotionBox = motion.create(Box);

export default function RenderUnpaidOrders({
                                               item,
                                               index,
                                               cardBgColor,
                                               textColor,
                                               complete,
                                               loadState,
                                               sending,
                                               setRefundId,
                                               setDialogOpen
                                           }) {
    const borderColor = useColorModeValue("gray.200", "gray.700");
    const highlightColor = useColorModeValue("primary.50", "primary.900");
    const priceColor = useColorModeValue("primary.600", "primary.300");
    const mutedTextColor = useColorModeValue("gray.500", "gray.400");
    
    function formatPrettyDate(isoDateStr) {
        const date = new Date(isoDateStr);
        const day = date.getDate();
        const month = date.toLocaleString('default', { month: 'long' });
        const year = date.getFullYear();

        const suffix = (n) => {
            if (n >= 11 && n <= 13) return 'th';
            switch (n % 10) {
                case 1: return 'st';
                case 2: return 'nd';
                case 3: return 'rd';
                default: return 'th';
            }
        };

        return `${day}${suffix(day)} ${month} ${year}`;
    }

    return (
        <MotionBox
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
        >
            <Card
                bg={cardBgColor}
                borderRadius="2xl"
                overflow="hidden"
                boxShadow="sm"
                borderWidth="1px"
                borderColor={borderColor}
                _hover={{
                    transform: "translateY(-4px)",
                    shadow: "lg",
                    borderColor: "primary.400"
                }}
                transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
            >
                <CardHeader
                    bg="linear-gradient(135deg, #4A90E2 0%, #667EEA 100%)"
                    py={4}
                    px={6}
                >
                    <Flex justify="space-between" align="center">
                        <VStack align="start" spacing={1}>
                            <Text
                                color="white"
                                fontWeight="bold"
                                fontSize="lg"
                                isTruncated
                            >
                                {item.customer_name || 'Unknown Customer'}
                            </Text>
                            <Text color="whiteAlpha.800" fontSize="sm">
                                Order #{item.id}
                            </Text>
                        </VStack>
                        <StatusBadge 
                            status="pending"
                            label="Unpaid"
                            size="md"
                        />
                    </Flex>
                </CardHeader>

                <CardBody p={6}>
                    <Stack spacing={5}>
                        {/* Amount Section */}
                        <Box
                            bg={highlightColor}
                            p={4}
                            borderRadius="xl"
                            border="1px solid"
                            borderColor={useColorModeValue("primary.200", "primary.700")}
                        >
                            <Flex justify="space-between" align="center">
                                <HStack spacing={2}>
                                    <CurrencyDollarIcon size={20} color={priceColor} />
                                    <Text fontWeight="medium" color={textColor} fontSize="sm">
                                        Total Amount
                                    </Text>
                                </HStack>
                                <Text
                                    fontSize="2xl"
                                    fontWeight="bold"
                                    color={priceColor}
                                >
                                    {typeof item.selling_price === 'number'
                                        ? item.selling_price.toFixed(2)
                                        : item.selling_price || '0.00'}
                                </Text>
                            </Flex>
                        </Box>

                        {/* Order Details */}
                        <VStack align="stretch" spacing={4}>
                            <Box>
                                <Text color={mutedTextColor} fontSize="sm" fontWeight="medium" mb={1}>
                                    Product
                                </Text>
                                <Text fontWeight="semibold" color={textColor} fontSize="md">
                                    {item.product_name || 'Unknown Product'}
                                </Text>
                            </Box>

                            <Flex justify="space-between" align="center">
                                <HStack spacing={2}>
                                    <CalendarDaysIcon size={16} color={mutedTextColor} />
                                    <Text color={mutedTextColor} fontSize="sm" fontWeight="medium">
                                        Order Date
                                    </Text>
                                </HStack>
                                <Badge
                                    colorScheme="purple"
                                    borderRadius="full"
                                    px={3}
                                    py={1}
                                    fontSize="xs"
                                    fontWeight="semibold"
                                >
                                    {formatPrettyDate(item.created_at) || 'Unknown Date'}
                                </Badge>
                            </Flex>
                        </VStack>

                        <Divider />

                        {/* Action Buttons */}
                        <VStack spacing={3}>
                            <ModernButton
                                onClick={() => complete(item.id)}
                                variant="gradient"
                                colorScheme="primary"
                                size="lg"
                                isFullWidth
                                leftIcon={<ShoppingCartIcon size={18} />}
                                isLoading={loadState[item.id]}
                                loadingText="Completing..."
                            >
                                Mark as Paid
                            </ModernButton>
                            
                            <ModernButton
                                onClick={() => {
                                    setRefundId(item.id);
                                    setDialogOpen(true);
                                }}
                                variant="outline"
                                colorScheme="red"
                                size="lg"
                                isFullWidth
                                leftIcon={<ArrowUturnLeftIcon size={18} />}
                                isLoading={sending[item.id]}
                                loadingText="Processing..."
                            >
                                Refund Order
                            </ModernButton>
                        </VStack>
                    </Stack>
                </CardBody>
            </Card>
        </MotionBox>
    );
}