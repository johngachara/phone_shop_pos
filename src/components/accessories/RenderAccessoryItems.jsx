import {Badge, Box, Button, Heading, HStack, Text} from "@chakra-ui/react";
import {DeleteIcon, EditIcon} from "@chakra-ui/icons";
import {motion} from "framer-motion";
const MotionBox = motion(Box);
const RenderAccessoryItems = ({ item, index, bgColor, textColor, openDrawer, setDeleteItemId, setIsDeleteDialogOpen }) => {
    return (
        <MotionBox
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            borderRadius="lg"
            overflow="hidden"
            boxShadow="md"
            bg={bgColor}
            _hover={{ boxShadow: "lg", transform: "translateY(-5px)" }}
            height="100%"
            display="flex"
            flexDirection="column"
        >
            <Box p={5} flex="1" display="flex" flexDirection="column">
                <Heading size={{ base: "md", sm: "lg" }} mb={2} isTruncated>
                    {item.product_name}
                </Heading>
                <Text fontSize={{ base: "lg", sm: "xl", md: "2xl" }} fontWeight="bold" mb={2}>
                    {item.price}
                </Text>
                <Text color={textColor} mb={4} fontSize={{ base: "sm", sm: "md" }}>
                    Quantity: {item.quantity}
                </Text>
                <Badge colorScheme="teal" mb={4} alignSelf="flex-start">
                    {item.quantity > 0 ? "In Stock" : "Out Of Stock"}
                </Badge>

                <HStack spacing={2} mt={4} wrap="wrap">
                    <Button
                        colorScheme="blue"
                        size={{ base: "sm", md: "md" }}
                        width="100%"
                        isDisabled={item.quantity < 1}
                        onClick={() => openDrawer("sell", item)}
                    >
                        Sell
                    </Button>
                    <Button
                        leftIcon={<EditIcon />}
                        colorScheme="green"
                        variant="outline"
                        size={{ base: "sm", md: "md" }}
                        width="100%"
                        onClick={() => openDrawer("update", item)}
                    >
                        Update
                    </Button>
                    <Button
                        leftIcon={<DeleteIcon />}
                        colorScheme="red"
                        variant="outline"
                        size={{ base: "sm", md: "md" }}
                        width="100%"
                        onClick={() => {
                            setDeleteItemId(item.id);
                            setIsDeleteDialogOpen(true);
                        }}
                    >
                        Delete
                    </Button>
                </HStack>
            </Box>
        </MotionBox>
    );
};
export default RenderAccessoryItems;