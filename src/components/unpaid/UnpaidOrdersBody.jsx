import {
    Box,
    SimpleGrid,
    Input,
    InputGroup,
    InputLeftElement,
    Icon,
    Text,
    VStack,
    Heading,
    useColorModeValue,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { MagnifyingGlassIcon, ClockIcon } from "@heroicons/react/24/outline";
import RenderUnpaidOrders from "components/unpaid/RenderUnpaidOrders.jsx";
import ModernCard from "../ui/ModernCard";
import useUnpaidStore from "components/zustand/useUnpaidStore.js";

const MotionBox = motion(Box);

const UnpaidOrdersBody = ({
                              searchTerm,
                              setSearchTerm,
                              savedData,
                              cardBgColor,
                              sending,
                              loadState,
                              setDialogOpen,
                              textColor,
                              complete,
                              setRefundId
                          }) => {
    const { isLoading } = useUnpaidStore();
    const mutedTextColor = useColorModeValue("gray.500", "gray.400");
    const borderColor = useColorModeValue("gray.200", "gray.700");

    const filteredData = Array.isArray(savedData) ? savedData.filter(item =>
        Object.values(item).some(value =>
            value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
    ) : [];

    const SkeletonCard = () => (
        <ModernCard variant="elevated">
            <VStack spacing={4} p={6}>
                <Box w="full" h="20" bg="gray.200" borderRadius="lg" />
                <Box w="full" h="16" bg="gray.100" borderRadius="md" />
                <Box w="full" h="12" bg="gray.100" borderRadius="md" />
            </VStack>
        </ModernCard>
    );

    return (
        <VStack spacing={8} align="stretch">
            {/* Search Bar */}
            <MotionBox
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <InputGroup size="lg">
                    <InputLeftElement pointerEvents="none">
                        <Icon as={MagnifyingGlassIcon} color={mutedTextColor} boxSize={5} />
                    </InputLeftElement>
                    <Input
                        type="text"
                        placeholder="Search by customer name, product, or order ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        borderRadius="xl"
                        bg={cardBgColor}
                        borderColor={borderColor}
                        borderWidth="2px"
                        fontSize="md"
                        _hover={{
                            borderColor: "primary.400",
                        }}
                        _focus={{
                            borderColor: "primary.500",
                            boxShadow: "0 0 0 1px rgba(74, 144, 226, 0.6)",
                        }}
                        _placeholder={{
                            color: mutedTextColor,
                        }}
                    />
                </InputGroup>
            </MotionBox>

            {/* Content */}
            <AnimatePresence mode="wait">
                {filteredData.length > 0 ? (
                    <MotionBox
                        key="content"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <SimpleGrid 
                            columns={{ base: 1, md: 2, lg: 3 }} 
                            spacing={{ base: 4, md: 6, lg: 8 }}
                        >
                            {filteredData.map((item, index) => {
                                if (!item || typeof item !== 'object') {
                                    console.error('Invalid item in filteredData:', item);
                                    return null;
                                }
                                return (
                                    <RenderUnpaidOrders
                                        key={item.id || index}
                                        item={item}
                                        index={index}
                                        cardBgColor={cardBgColor}
                                        sending={sending}
                                        loadState={loadState}
                                        setDialogOpen={setDialogOpen}
                                        textColor={textColor}
                                        complete={complete}
                                        setRefundId={setRefundId}
                                    />
                                );
                            })}
                        </SimpleGrid>
                    </MotionBox>
                ) : isLoading ? (
                    <MotionBox
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <SimpleGrid 
                            columns={{ base: 1, md: 2, lg: 3 }} 
                            spacing={{ base: 4, md: 6, lg: 8 }}
                        >
                            {[...Array(6)].map((_, index) => (
                                <MotionBox
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                >
                                    <SkeletonCard />
                                </MotionBox>
                            ))}
                        </SimpleGrid>
                    </MotionBox>
                ) : (
                    <MotionBox
                        key="empty"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                    >
                        <ModernCard variant="outlined">
                            <VStack spacing={6} py={16} textAlign="center">
                                <Box
                                    p={4}
                                    bg="gray.100"
                                    borderRadius="full"
                                    color="gray.400"
                                >
                                    <ClockIcon size={48} />
                                </Box>
                                <VStack spacing={2}>
                                    <Heading size="lg" color={textColor}>
                                        No unpaid orders found
                                    </Heading>
                                    <Text color={mutedTextColor} fontSize="lg" maxW="md">
                                        {searchTerm 
                                            ? "No orders match your search criteria. Try adjusting your search terms."
                                            : "All orders have been completed or there are no pending orders at the moment."
                                        }
                                    </Text>
                                </VStack>
                            </VStack>
                        </ModernCard>
                    </MotionBox>
                )}
            </AnimatePresence>
        </VStack>
    );
};

export default UnpaidOrdersBody;