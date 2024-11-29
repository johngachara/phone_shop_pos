import {Badge, Box, Button, Heading, HStack, SimpleGrid, Text, useColorModeValue} from "@chakra-ui/react";
import { DeleteIcon } from "@chakra-ui/icons";
import { motion } from "framer-motion";

const MotionBox = motion.create(Box);

export default function RenderLcdItems(props) {
    const { items, handleSellClick, handleUpdateClick, setDeleteItemId, setIsDeleteDialogOpen,disableUpdateButton } = props;
    const textColor = useColorModeValue("gray.800", "white");
    const bgColor = useColorModeValue("white", "gray.800");

    return (
        <SimpleGrid
            columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
            spacing={6}
            w="full"
        >
            {items.map((item, index) => (
                <MotionBox
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    borderRadius="lg"
                    overflow="hidden"
                    boxShadow="md"
                    bg={bgColor}
                    _hover={{ boxShadow: "lg", transform: "translateY(-5px)" }}
                    p={{ base: 2, md: 5 }}
                >
                    <Box p={5}>
                        <Heading size="md" mb={2} isTruncated>
                            {item.product_name}
                        </Heading>
                        <Text fontSize="2xl" fontWeight="bold" mb={2}>
                            {item.price}
                        </Text>
                        <Text color={textColor} mb={4}>
                            Quantity: {item.quantity}
                        </Text>
                        <Badge colorScheme="teal" mb={4}>
                            {item.quantity > 0 ? "In Stock" : "Out Of Stock"}
                        </Badge>
                        <HStack spacing={2} mt={4} wrap="wrap">
                            <Button
                                colorScheme="blue"
                                size={{ base: "sm", md: "md" }}
                                flex={{ base: "full", md: "initial" }}
                                onClick={() => handleSellClick(item)}
                                isDisabled={item.quantity < 1}
                            >
                                Sell
                            </Button>
                            {
                                !disableUpdateButton && (
                                    <HStack spacing={2} mt={4} wrap="wrap">
                                    <Button
                                        colorScheme="green"
                                        variant="outline"
                                        size={{ base: "sm", md: "md" }}
                                        onClick={() => handleUpdateClick(item)}
                                    >
                                        Update
                                    </Button>
                                <Button
                                leftIcon={<DeleteIcon />}
                            colorScheme="red"
                            variant="outline"
                            size={{ base: "sm", md: "md" }}
                            onClick={() => {
                                setDeleteItemId(item.id);
                                setIsDeleteDialogOpen(true);
                            }}
                        >
                            Delete
                        </Button>
                                    </HStack>
                                )
                            }
                        </HStack>
                    </Box>
                </MotionBox>
            ))}
        </SimpleGrid>
    );
}