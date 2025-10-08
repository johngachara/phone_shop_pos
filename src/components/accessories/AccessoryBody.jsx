import {
    Box,
    Container,
    VStack,
    Flex,
    Heading,
    InputGroup,
    Input,
    InputRightElement,
    Icon,
    Text,
    HStack,
    Button,
    useColorModeValue,
    Card,
    CardBody,
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
} from '@chakra-ui/react';
import { 
    MagnifyingGlassIcon, 
    ChevronRightIcon, 
    ArrowPathIcon,
    Cog6ToothIcon 
} from '@heroicons/react/24/outline';
import { motion } from "framer-motion";
import ModernCard from '../ui/ModernCard';
import ModernButton from '../ui/ModernButton';
import Navbar from '../general/Navbar.jsx';

const MotionBox = motion.create(Box);
const MotionContainer = motion.create(Container);

const AccessoryBody = ({
                           pageBgColor,
                           searchParam,
                           setSearchParam,
                           loading,
                           searchResults,
                           shopData,
                           renderItems,
                           currentPage,
                           setCurrentPage,
                           hasData
                       }) => {
    const cardBgColor = useColorModeValue('white', 'gray.800');
    const textColor = useColorModeValue('gray.800', 'white');
    const mutedTextColor = useColorModeValue('gray.600', 'gray.400');
    const borderColor = useColorModeValue('gray.200', 'gray.700');

    const renderContent = () => {
        if (!hasData && !loading && searchResults.length === 0) {
            return (
                <ModernCard variant="outlined">
                    <VStack spacing={6} py={12} textAlign="center">
                        <Box
                            p={4}
                            bg="gray.100"
                            borderRadius="full"
                            color="gray.400"
                        >
                            <Cog6ToothIcon size={48} />
                        </Box>
                        <VStack spacing={2}>
                            <Heading size="lg" color={textColor}>
                                No accessories found
                            </Heading>
                            <Text color={mutedTextColor} fontSize="lg">
                                {searchParam 
                                    ? "Try adjusting your search terms" 
                                    : "Start by adding some accessories to your inventory"
                                }
                            </Text>
                        </VStack>
                        <ModernButton
                            leftIcon={<ArrowPathIcon size={16} />}
                            variant="outline"
                            onClick={() => setSearchParam('')}
                        >
                            Clear Search
                        </ModernButton>
                    </VStack>
                </ModernCard>
            );
        }

        return renderItems(searchResults.length > 0 ? searchResults : (shopData || []));
    };

    return (
        <Flex direction="column" minH="100vh">
            <Navbar />
            <Box
                bg={pageBgColor}
                flex={1}
                ml={{ base: 0, md: '280px' }}
            >
                <MotionContainer
                    maxW="8xl"
                    py={8}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <VStack spacing={8} align="stretch">
                        {/* Header Section */}
                        <MotionBox
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <ModernCard variant="elevated">
                                <VStack spacing={6} align="stretch">
                                    {/* Breadcrumb */}
                                    <Breadcrumb
                                        spacing="8px"
                                        separator={<ChevronRightIcon size={16} color={mutedTextColor} />}
                                        fontSize="sm"
                                        color={mutedTextColor}
                                    >
                                        <BreadcrumbItem>
                                            <BreadcrumbLink color="primary.500" fontWeight="medium">
                                                Inventory
                                            </BreadcrumbLink>
                                        </BreadcrumbItem>
                                        <BreadcrumbItem isCurrentPage>
                                            <BreadcrumbLink color={textColor} fontWeight="medium">
                                                Accessories
                                            </BreadcrumbLink>
                                        </BreadcrumbItem>
                                    </Breadcrumb>

                                    {/* Header Content */}
                                    <Flex
                                        direction={{ base: "column", lg: "row" }}
                                        justify="space-between"
                                        align={{ base: "stretch", lg: "center" }}
                                        gap={6}
                                    >
                                        <VStack align="start" spacing={2}>
                                            <HStack spacing={3}>
                                                <Box
                                                    p={2}
                                                    bg="primary.100"
                                                    borderRadius="lg"
                                                    color="primary.600"
                                                >
                                                    <Cog6ToothIcon size={24} />
                                                </Box>
                                                <Heading
                                                    fontSize={{ base: "2xl", md: "3xl" }}
                                                    fontWeight="bold"
                                                    color={textColor}
                                                    letterSpacing="tight"
                                                >
                                                    Accessories Inventory
                                                </Heading>
                                            </HStack>
                                            <Text color={mutedTextColor} fontSize="lg">
                                                Manage your accessories and track stock levels
                                            </Text>
                                        </VStack>

                                        {/* Search Bar */}
                                        <Box minW={{ base: "full", lg: "400px" }}>
                                            <InputGroup size="lg">
                                                <Input
                                                    placeholder="Search accessories..."
                                                    value={searchParam}
                                                    onChange={(e) => setSearchParam(e.target.value)}
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
                                                <InputRightElement pointerEvents="none">
                                                    <Icon 
                                                        as={MagnifyingGlassIcon} 
                                                        color={mutedTextColor} 
                                                        boxSize={5}
                                                    />
                                                </InputRightElement>
                                            </InputGroup>
                                        </Box>
                                    </Flex>
                                </VStack>
                            </ModernCard>
                        </MotionBox>

                        {/* Content Section */}
                        <MotionBox
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            {renderContent()}
                        </MotionBox>

                        {/* Pagination */}
                        {searchResults.length === 0 && (
                            <MotionBox
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3, delay: 0.4 }}
                            >
                                <ModernCard variant="outlined">
                                    <HStack justify="center" spacing={4}>
                                        <ModernButton
                                            onClick={() => setCurrentPage((prev) => prev - 1)}
                                            isDisabled={currentPage === 1}
                                            variant="elevated"
                                            leftIcon={<ChevronRightIcon size={16} style={{ transform: 'rotate(180deg)' }} />}
                                        >
                                            Previous
                                        </ModernButton>
                                        <Text
                                            fontSize="md"
                                            fontWeight="medium"
                                            color={textColor}
                                            px={4}
                                        >
                                            Page {currentPage}
                                        </Text>
                                        <ModernButton
                                            onClick={() => setCurrentPage((prev) => prev + 1)}
                                            variant="elevated"
                                            rightIcon={<ChevronRightIcon size={16} />}
                                        >
                                            Next
                                        </ModernButton>
                                    </HStack>
                                </ModernCard>
                            </MotionBox>
                        )}
                    </VStack>
                </MotionContainer>
            </Box>
        </Flex>
    );
};

export default AccessoryBody;