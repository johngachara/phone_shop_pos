import {
    Box,
    SimpleGrid,
    Input,
    InputGroup,
    InputLeftElement,
    Skeleton,
    SkeletonText,
    Icon,
    Text
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { FaSearch } from "react-icons/fa";
import RenderUnpaidOrders from "components/unpaid/RenderUnpaidOrders.jsx";
import {useSelector} from "react-redux";
const MotionBox = motion(Box)


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
    const {loading} = useSelector(state => state.savedOrders);
    // Ensure filteredData is always an array
    const filteredData = Array.isArray(savedData) ? savedData.filter(item =>
        Object.values(item).some(value =>
            value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
    ) : [];

    return (
        <>
            <InputGroup mb={8}>
                <InputLeftElement pointerEvents="none">
                    <Icon as={FaSearch} color="gray.300" />
                </InputLeftElement>
                <Input
                    type="text"
                    placeholder="Search by customer"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    size={{ base: "sm", md: "md" }}
                />
            </InputGroup>
            <AnimatePresence>
                {filteredData.length > 0 ? (
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={{ base: 4, md: 6, lg: 8 }}>
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
                ) : (
                    loading ? (
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={{ base: 4, md: 6, lg: 8 }}>
                            {[...Array(6)].map((_, index) => (
                                <MotionBox
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    borderRadius="xl"
                                    overflow="hidden"
                                    boxShadow="lg"
                                    bg={cardBgColor}
                                >
                                    <Skeleton height="200px" />
                                    <Box p={{ base: 4, md: 6 }}>
                                        <SkeletonText mt="4" noOfLines={4} spacing="4" />
                                        <Skeleton height="40px" mt="4" />
                                    </Box>
                                </MotionBox>
                            ))}
                        </SimpleGrid>
                    ) : <Text>No unpaid orders found.</Text>
                )}
            </AnimatePresence>
        </>
    );
};

export default UnpaidOrdersBody;