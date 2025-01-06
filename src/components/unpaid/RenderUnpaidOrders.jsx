import {
    Badge,
    Box,
    Button,
    Divider,
    Flex,
    HStack,
    Icon,
    Text,
    VStack,
    Card,
    CardHeader,
    CardBody,
    Stack,
    useColorModeValue,
    Tooltip
} from "@chakra-ui/react";
import { FaShoppingCart, FaUndo, FaClock } from "react-icons/fa";
import { motion } from "framer-motion";

const MotionBox = motion(Box);

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
    const highlightColor = useColorModeValue("blue.50", "blue.900");
    const priceColor = useColorModeValue("blue.600", "blue.300");

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
                borderRadius="xl"
                overflow="hidden"
                boxShadow="sm"
                borderWidth="1px"
                borderColor={borderColor}
                _hover={{
                    transform: "translateY(-4px)",
                    shadow: "lg",
                    borderColor: "blue.400"
                }}
                transition="all 0.2s"
            >
                <CardHeader
                    bg={useColorModeValue("blue.500", "blue.600")}
                    py={4}
                    px={5}
                >
                    <Flex justify="space-between" align="center">
                        <Text
                            color="white"
                            fontWeight="bold"
                            fontSize="lg"
                            isTruncated
                        >
                            {item.customer_name || ''}
                        </Text>
                        <Tooltip label="Awaiting Payment" hasArrow>
                            <Badge
                                bg="white"
                                color="blue.500"
                                fontSize="xs"
                                px={2}
                                py={1}
                                borderRadius="full"
                                display="flex"
                                alignItems="center"
                                gap={1}
                            >
                                <Icon as={FaClock} />
                                Unpaid
                            </Badge>
                        </Tooltip>
                    </Flex>
                </CardHeader>

                <CardBody p={5}>
                    <Stack spacing={4}>
                        {/* Price Section */}
                        <Flex
                            justify="space-between"
                            align="center"
                            bg={highlightColor}
                            p={3}
                            borderRadius="lg"
                        >
                            <Text fontWeight="medium" color={textColor}>
                                Total Amount:
                            </Text>
                            <Text
                                fontSize="xl"
                                fontWeight="bold"
                                color={priceColor}
                            >
                                {typeof item.selling_price === 'number'
                                ? item.selling_price.toFixed(2)
                                : item.selling_price || ''}
                            </Text>
                        </Flex>

                        {/* Order Details */}
                        <VStack align="stretch" spacing={3}>
                            <Flex justify="space-between">
                                <Text color={textColor} fontSize="sm">
                                    Product
                                </Text>
                                <Text fontWeight="medium" color={textColor}>
                                    {item.product_name || ''}
                                </Text>
                            </Flex>

                            <Flex justify="space-between">
                                <Text color={textColor} fontSize="sm">
                                    Quantity
                                </Text>
                                <Badge
                                    colorScheme="purple"
                                    borderRadius="full"
                                    px={3}
                                >
                                    {item.quantity || ''} units
                                </Badge>
                            </Flex>
                        </VStack>

                        <Divider />

                        {/* Action Buttons */}
                        <HStack spacing={3}>
                            <Button
                                onClick={() => complete(item.id)}
                                colorScheme="blue"
                                size="lg"
                                flex={1}
                                leftIcon={<Icon as={FaShoppingCart} />}
                                isLoading={loadState[item.id]}
                                loadingText="Completing..."
                                _hover={{ transform: "translateY(-1px)" }}
                            >
                                Complete
                            </Button>
                            <Button
                                onClick={() => {
                                    setRefundId(item.id);
                                    setDialogOpen(true);
                                }}
                                colorScheme="red"
                                variant="outline"
                                size="lg"
                                flex={1}
                                leftIcon={<Icon as={FaUndo} />}
                                isLoading={sending[item.id]}
                                loadingText="Refunding..."
                                _hover={{
                                    transform: "translateY(-1px)",
                                    bg: "red.50"
                                }}
                            >
                                Refund
                            </Button>
                        </HStack>
                    </Stack>
                </CardBody>
            </Card>
        </MotionBox>
    );
}