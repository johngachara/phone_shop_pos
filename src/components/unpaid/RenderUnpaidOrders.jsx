import {Badge, Box, Button, Divider, Flex, HStack, Icon, Text, VStack} from "@chakra-ui/react";
import {FaShoppingCart, FaUndo} from "react-icons/fa";
import {motion} from "framer-motion";

const MotionBox = motion(Box);

export default function RenderUnpaidOrders({item, index, cardBgColor, textColor, complete, loadState, sending, setRefundId, setDialogOpen}) {
    return(
        <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            borderRadius="2xl"
            overflow="hidden"
            boxShadow="xl"
            bg={cardBgColor}
            _hover={{ transform: "translateY(-5px)", boxShadow: "2xl" }}
        >
            <Flex direction="column" h="100%">
                <Box
                    bg="blue.500"
                    color="white"
                    p={{ base: 2, md: 4 }}
                    fontWeight="bold"
                    fontSize={{ base: "lg", md: "xl" }}
                >
                    <Text isTruncated>{item.customer_name || ''}</Text>
                </Box>

                <VStack p={{ base: 4, md: 6 }} align="stretch" spacing={4} flex={1}>
                    <Flex direction={{ base: "column", md: "row" }} justify="space-between" align="center">
                        <Badge colorScheme="teal" fontWeight="bold" fontSize="sm" textTransform="uppercase" px={2} py={1} borderRadius="full">
                            Unpaid
                        </Badge>
                        <Text fontWeight="bold" color={textColor} fontSize={{ base: "md", md: "xl" }}>
                            {typeof item.selling_price === 'number' ? item.selling_price.toFixed(2) : item.selling_price || ''}
                        </Text>
                    </Flex>

                    <Divider />

                    <Text color={textColor} fontSize={{ base: "sm", md: "md" }}>
                        <strong>Product:</strong> {item.product_name || ''}
                    </Text>

                    <Text color={textColor} fontSize={{ base: "sm", md: "md" }}>
                        <strong>Quantity:</strong> {item.quantity || ''}
                    </Text>

                    <Divider />

                    <HStack spacing={4} mt="auto" direction={{ base: "column", md: "row" }}>
                        <Button
                            onClick={() => complete(item.id)}
                            colorScheme="blue"
                            size={{ base: "sm", md: "md" }}
                            flex={1}
                            leftIcon={<Icon as={FaShoppingCart} />}
                            isLoading={loadState[item.id]}
                            loadingText="Completing..."
                        >
                            Complete
                        </Button>
                        <Button
                            onClick={() => {
                                setRefundId(item.id);
                                setDialogOpen(true);
                            }}
                            colorScheme="red"
                            size={{ base: "sm", md: "md" }}
                            flex={1}
                            leftIcon={<Icon as={FaUndo} />}
                            isLoading={sending[item.id]}
                            loadingText="Refunding..."
                        >
                            Refund
                        </Button>
                    </HStack>
                </VStack>
            </Flex>
        </MotionBox>
    )
}