import { useEffect, useState, memo, useMemo, useCallback } from "react";
import {
    Box,
    Flex,
    Button,
    Text,
    Avatar,
    useDisclosure,
    Drawer,
    DrawerBody,
    DrawerHeader,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
    IconButton,
    useBreakpointValue,
    useColorMode,
    useColorModeValue,
    VStack,
    Tooltip,
    Badge,
    HStack,
    Divider,
} from "@chakra-ui/react";
import {
    Bars3Icon,
    MoonIcon,
    SunIcon,
    PlusIcon,
    StarIcon,
    ExclamationTriangleIcon,
    ArrowPathIcon,
    Cog6ToothIcon,
    ClockIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import AddScreenModal from "../screens/AddScreenModal.jsx";
import AddAccessoryModal from "../accessories/AddAccesoryModal.jsx";
import SequelizerAuth from "../axios/sequalizerAuth.js";

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

const Navbar = () => {
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { colorMode, toggleColorMode } = useColorMode();

    // Modern color scheme
    const bgColor = useColorModeValue("white", "gray.900");
    const borderColor = useColorModeValue("gray.200", "gray.700");
    const textColor = useColorModeValue("gray.700", "gray.200");
    const activeColor = useColorModeValue("primary.600", "primary.400");
    const hoverBgColor = useColorModeValue("primary.50", "primary.900");
    const shadowColor = useColorModeValue(
        "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)"
    );

    // Drawer and modal controls
    const {
        isOpen: isMobileDrawerOpen,
        onOpen: openMobileDrawer,
        onClose: closeMobileDrawer
    } = useDisclosure();

    const {
        isOpen: isScreenModalOpen,
        onOpen: openScreenModal,
        onClose: closeScreenModal
    } = useDisclosure();

    const {
        isOpen: isAccessoryModalOpen,
        onOpen: openAccessoryModal,
        onClose: closeAccessoryModal
    } = useDisclosure();

    const isMobile = useBreakpointValue({ base: true, md: false });

    // Auth handlers
    const handleLogout = useCallback(() => {
        SequelizerAuth.logout();
    }, []);

    // Modal handlers
    const handleScreenModalOpen = useCallback(() => {
        openScreenModal();
        if (isMobile) closeMobileDrawer();
    }, [isMobile, openScreenModal, closeMobileDrawer]);

    const handleAccessoryModalOpen = useCallback(() => {
        openAccessoryModal();
        if (isMobile) closeMobileDrawer();
    }, [isMobile, openAccessoryModal, closeMobileDrawer]);

    const handleRefresh = useCallback(() => {
        window.location.reload();
        if (isMobile) closeMobileDrawer();
    }, [isMobile, closeMobileDrawer]);

    const handleCollapseToggle = useCallback(() => {
        setIsCollapsed(prev => !prev);
    }, []);

    // Navigation items configuration
    const navigationItems = [
        {
            to: "/",
            icon: StarIcon,
            label: "LCD Screens",
            badgeCount: 0,
        },
        {
            to: "/Accessories",
            icon: Cog6ToothIcon,
            label: "Accessories",
            badgeCount: 0,
        },
        {
            to: "/SavedOrders",
            icon: ClockIcon,
            label: "Unpaid Orders",
            badgeCount: 3,
        },
        {
            to: "/LowStock",
            icon: ExclamationTriangleIcon,
            label: "Low Stock",
            badgeCount: 0,
        },
    ];

    const actionItems = [
        {
            icon: PlusIcon,
            label: "Add Screen",
            onClick: handleScreenModalOpen,
            colorScheme: "primary",
        },
        {
            icon: PlusIcon,
            label: "Add Accessory",
            onClick: handleAccessoryModalOpen,
            colorScheme: "primary",
        },
        {
            icon: ArrowPathIcon,
            label: "Refresh",
            onClick: handleRefresh,
            colorScheme: "gray",
        },
    ];

    // Navigation item component
    const NavItem = memo(({ to, icon: IconComponent, label, onClick, badgeCount, isMobileView = false }) => {
        const isCurrentPath = location.pathname === to;
        const showText = isMobileView || !isCollapsed;

        return (
            <MotionBox
                position="relative"
                whileHover={{ x: 2 }}
                transition={{ duration: 0.2 }}
            >
                <Tooltip
                    label={isCollapsed && !isMobileView ? label : ""}
                    placement="right"
                    isDisabled={showText}
                    hasArrow
                >
                    <Button
                        as={Link}
                        to={to}
                        w="full"
                        variant="ghost"
                        justifyContent={showText ? "flex-start" : "center"}
                        h="12"
                        mb={2}
                        color={isCurrentPath ? activeColor : textColor}
                        bg={isCurrentPath ? hoverBgColor : "transparent"}
                        borderRadius="xl"
                        fontWeight={isCurrentPath ? "semibold" : "medium"}
                        _hover={{
                            bg: hoverBgColor,
                            color: activeColor,
                            transform: "translateX(4px)",
                        }}
                        onClick={onClick}
                        position="relative"
                        transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                    >
                        <HStack spacing={3} w="full">
                            <IconComponent size={20} />
                            {showText && (
                                <Text fontSize="md" flex={1} textAlign="left">
                                    {label}
                                </Text>
                            )}
                            {badgeCount > 0 && showText && (
                                <Badge
                                    colorScheme="red"
                                    borderRadius="full"
                                    fontSize="xs"
                                    minW="5"
                                    h="5"
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                >
                                    {badgeCount}
                                </Badge>
                            )}
                        </HStack>
                        {badgeCount > 0 && !showText && (
                            <Badge
                                position="absolute"
                                right="-2"
                                top="-2"
                                colorScheme="red"
                                borderRadius="full"
                                fontSize="xs"
                                minW="5"
                                h="5"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                            >
                                {badgeCount}
                            </Badge>
                        )}
                    </Button>
                </Tooltip>
                {isCurrentPath && (
                    <MotionBox
                        position="absolute"
                        left={0}
                        top={0}
                        bottom={0}
                        w="1"
                        bg={activeColor}
                        borderRadius="full"
                        layoutId="activeIndicator"
                        transition={{ duration: 0.2 }}
                    />
                )}
            </MotionBox>
        );
    });

    NavItem.displayName = 'NavItem';

    // Action button component
    const ActionButton = memo(({ icon: IconComponent, label, onClick, isMobileView = false, colorScheme = "gray" }) => {
        const showText = isMobileView || !isCollapsed;

        return (
            <MotionBox whileHover={{ x: 2 }} transition={{ duration: 0.2 }}>
                <Button
                    onClick={onClick}
                    variant="ghost"
                    justifyContent={showText ? "flex-start" : "center"}
                    w="full"
                    h="12"
                    mb={2}
                    color={textColor}
                    borderRadius="xl"
                    fontWeight="medium"
                    _hover={{
                        bg: hoverBgColor,
                        color: activeColor,
                        transform: "translateX(4px)",
                    }}
                    transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                >
                    <HStack spacing={3} w="full">
                        <IconComponent size={20} />
                        {showText && (
                            <Text fontSize="md" flex={1} textAlign="left">
                                {label}
                            </Text>
                        )}
                    </HStack>
                </Button>
            </MotionBox>
        );
    });

    ActionButton.displayName = 'ActionButton';

    // Sidebar content component
    const SidebarContent = memo(({ isMobileView = false }) => (
        <MotionFlex
            direction="column"
            h="full"
            py={6}
            px={4}
            position="relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            {/* Desktop Collapse Toggle */}
            {!isMobileView && (
                <MotionBox
                    position="absolute"
                    right={-4}
                    top={4}
                    zIndex={100}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <IconButton
                        icon={isCollapsed ? <ChevronRightIcon size={16} /> : <ChevronLeftIcon size={16} />}
                        onClick={handleCollapseToggle}
                        size="sm"
                        variant="outline"
                        bg={bgColor}
                        borderColor={borderColor}
                        borderRadius="full"
                        boxShadow="md"
                        _hover={{ 
                            bg: hoverBgColor,
                            borderColor: activeColor,
                        }}
                        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                        display={{ base: "none", md: "flex" }}
                    />
                </MotionBox>
            )}

            {/* Logo */}
            <MotionFlex
                align="center"
                mb={8}
                justify={isCollapsed && !isMobileView ? "center" : "flex-start"}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
            >
                <Box
                    w={isCollapsed && !isMobileView ? "10" : "12"}
                    h={isCollapsed && !isMobileView ? "10" : "12"}
                    bg="linear-gradient(135deg, #4A90E2 0%, #667EEA 100%)"
                    borderRadius="xl"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    mr={isCollapsed && !isMobileView ? 0 : 3}
                    boxShadow="lg"
                >
                    <Text
                        color="white"
                        fontWeight="bold"
                        fontSize={isCollapsed && !isMobileView ? "lg" : "xl"}
                    >
                        {isCollapsed && !isMobileView ? "AT" : "A"}
                    </Text>
                </Box>
                {(!isCollapsed || isMobileView) && (
                    <VStack align="start" spacing={0}>
                        <Text
                            fontSize="xl"
                            fontWeight="bold"
                            color={activeColor}
                            letterSpacing="tight"
                        >
                            ALLTECH
                        </Text>
                        <Text fontSize="xs" color={textColor} fontWeight="medium">
                            Point of Sale
                        </Text>
                    </VStack>
                )}
            </MotionFlex>

            {/* Main Navigation */}
            <VStack align="stretch" flex={1} spacing={1}>
                <Text
                    fontSize="xs"
                    fontWeight="semibold"
                    color={textColor}
                    textTransform="uppercase"
                    letterSpacing="wide"
                    mb={3}
                    px={3}
                    display={isCollapsed && !isMobileView ? "none" : "block"}
                >
                    Inventory
                </Text>
                
                {navigationItems.map((item) => (
                    <NavItem
                        key={item.to}
                        {...item}
                        onClick={isMobileView ? closeMobileDrawer : undefined}
                        isMobileView={isMobileView}
                    />
                ))}

                <Divider my={4} />

                <Text
                    fontSize="xs"
                    fontWeight="semibold"
                    color={textColor}
                    textTransform="uppercase"
                    letterSpacing="wide"
                    mb={3}
                    px={3}
                    display={isCollapsed && !isMobileView ? "none" : "block"}
                >
                    Actions
                </Text>

                {actionItems.map((item, index) => (
                    <ActionButton
                        key={index}
                        {...item}
                        isMobileView={isMobileView}
                    />
                ))}
            </VStack>

            {/* User Section */}
            <Box mt={6} pt={6} borderTop="1px" borderColor={borderColor}>
                {/* System Info */}
                <MotionFlex
                    align="center"
                    mb={4}
                    p={3}
                    borderRadius="xl"
                    bg={useColorModeValue("gray.50", "gray.800")}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                >
                    <Avatar
                        size="sm"
                        name="ALLTECH"
                        bg="linear-gradient(135deg, #4A90E2 0%, #667EEA 100%)"
                        color="white"
                    />
                    {(isMobileView || !isCollapsed) && (
                        <Box ml={3}>
                            <Text fontSize="sm" fontWeight="semibold">
                                ALLTECH System
                            </Text>
                            <Text fontSize="xs" color={textColor}>
                                Administrator
                            </Text>
                        </Box>
                    )}
                </MotionFlex>

                {/* Settings Actions */}
                <VStack spacing={1}>
                    <ActionButton
                        icon={colorMode === "light" ? MoonIcon : SunIcon}
                        label={colorMode === "light" ? "Dark Mode" : "Light Mode"}
                        onClick={toggleColorMode}
                        isMobileView={isMobileView}
                    />

                    <ActionButton
                        icon={ArrowRightOnRectangleIcon}
                        label="Sign Out"
                        onClick={handleLogout}
                        isMobileView={isMobileView}
                        colorScheme="red"
                    />
                </VStack>
            </Box>
        </MotionFlex>
    ));

    SidebarContent.displayName = 'SidebarContent';

    // Mobile view
    const mobileView = useMemo(() => {
        if (!isMobile) return null;

        return (
            <>
                {/* Mobile Header */}
                <MotionBox
                    position="fixed"
                    top={0}
                    left={0}
                    right={0}
                    bg={bgColor}
                    px={4}
                    py={4}
                    borderBottom="1px"
                    borderColor={borderColor}
                    zIndex={99}
                    boxShadow={shadowColor}
                    initial={{ y: -100 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <Flex justify="space-between" align="center">
                        <HStack spacing={3}>
                            <Box
                                w="10"
                                h="10"
                                bg="linear-gradient(135deg, #4A90E2 0%, #667EEA 100%)"
                                borderRadius="lg"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                            >
                                <Text color="white" fontWeight="bold" fontSize="lg">
                                    A
                                </Text>
                            </Box>
                            <VStack align="start" spacing={0}>
                                <Text fontSize="lg" fontWeight="bold" color={activeColor}>
                                    ALLTECH
                                </Text>
                                <Text fontSize="xs" color={textColor}>
                                    Point of Sale
                                </Text>
                            </VStack>
                        </HStack>
                        <IconButton
                            aria-label="Menu"
                            icon={<Bars3Icon size={24} />}
                            onClick={openMobileDrawer}
                            variant="ghost"
                            size="lg"
                            borderRadius="xl"
                        />
                    </Flex>
                </MotionBox>

                {/* Mobile Drawer */}
                <Drawer
                    isOpen={isMobileDrawerOpen}
                    placement="left"
                    onClose={closeMobileDrawer}
                    size="xs"
                >
                    <DrawerOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
                    <DrawerContent bg={bgColor} borderRadius="0 2xl 2xl 0">
                        <DrawerHeader borderBottomWidth="1px" borderColor={borderColor}>
                            <Flex justify="space-between" align="center">
                                <Text fontSize="lg" fontWeight="bold" color={activeColor}>
                                    Navigation
                                </Text>
                                <DrawerCloseButton position="static" />
                            </Flex>
                        </DrawerHeader>
                        <DrawerBody p={0}>
                            <SidebarContent isMobileView={true} />
                        </DrawerBody>
                    </DrawerContent>
                </Drawer>

                {/* Content Spacer */}
                <Box pt="80px" />
            </>
        );
    }, [isMobile, bgColor, borderColor, shadowColor, activeColor, textColor, openMobileDrawer, isMobileDrawerOpen, closeMobileDrawer]);

    // Desktop view
    const desktopView = useMemo(() => {
        if (isMobile) return null;

        return (
            <MotionBox
                bg={bgColor}
                h="100vh"
                position="fixed"
                left={0}
                top={0}
                borderRight="1px"
                borderColor={borderColor}
                width={isCollapsed ? "80px" : "280px"}
                zIndex={99}
                overflowY="auto"
                overflowX="hidden"
                boxShadow={shadowColor}
                initial={{ x: -280 }}
                animate={{ 
                    x: 0,
                    width: isCollapsed ? "80px" : "280px"
                }}
                transition={{ 
                    duration: 0.3,
                    ease: "easeOut"
                }}
                css={{
                    '&::-webkit-scrollbar': {
                        width: '4px',
                    },
                    '&::-webkit-scrollbar-track': {
                        background: 'transparent',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: borderColor,
                        borderRadius: '2px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                        background: activeColor,
                    },
                }}
            >
                <SidebarContent isMobileView={false} />
            </MotionBox>
        );
    }, [isMobile, bgColor, borderColor, isCollapsed, shadowColor, activeColor]);

    return (
        <>
            {mobileView}
            {desktopView}

            {/* Modals */}
            <AddScreenModal
                isOpen={isScreenModalOpen}
                onClose={closeScreenModal}
            />

            <AddAccessoryModal
                isOpen={isAccessoryModalOpen}
                onClose={closeAccessoryModal}
            />
        </>
    );
};

export default memo(Navbar);