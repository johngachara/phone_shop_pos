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
} from "@chakra-ui/react";
import {
    HamburgerIcon,
    MoonIcon,
    SunIcon,
    AddIcon,
    StarIcon,
    WarningIcon,
    RepeatIcon,
    SettingsIcon,
    TimeIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    DragHandleIcon
} from "@chakra-ui/icons";
import { Link, useLocation } from "react-router-dom";
import AddScreenModal from "../screens/AddScreenModal.jsx";
import AddAccessoryModal from "../accessories/AddAccesoryModal.jsx";
import SequelizerAuth from "../axios/sequalizerAuth.js";


const Navbar = () => {
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { colorMode, toggleColorMode } = useColorMode();

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

    // Only check breakpoint value when component mounts or window resizes
    const isMobile = useBreakpointValue({ base: true, md: false });

    // Memoize color values to prevent recalculations
    const bgColor = useColorModeValue("white", "gray.900");
    const textColor = useColorModeValue("gray.700", "gray.100");
    const activeColor = useColorModeValue("blue.500", "blue.400");
    const hoverBgColor = useColorModeValue("gray.50", "gray.800");
    const borderColor = useColorModeValue("gray.200", "gray.700");
    const shadowColor = useColorModeValue(
        "0 4px 6px rgba(160, 174, 192, 0.1)",
        "0 4px 6px rgba(9, 17, 28, 0.4)"
    );

    // Auth handlers
    const handleLogout = useCallback(() => {
        SequelizerAuth.logout();
    }, []);

    // Modal handlers with useCallback
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

    // Optimize resize handling with debounce
    useEffect(() => {
        let resizeTimer;

        const handleResize = () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                const shouldCollapse = window.innerWidth < 768 && window.innerWidth > 480;
                if (isCollapsed !== shouldCollapse) {
                    setIsCollapsed(shouldCollapse);
                }
            }, 100); // 100ms debounce
        };

        window.addEventListener('resize', handleResize);
        // Call once to set initial state
        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(resizeTimer);
        };
    }, [isCollapsed]);

    // Navigation item component - fixed to properly handle mobile view
    const NavItem = memo(({ to, icon, label, onClick, badgeCount, isMobileView = false }) => {
        const isCurrentPath = location.pathname === to;
        // Show text if either we're in mobile view OR sidebar is not collapsed
        const showText = isMobileView || !isCollapsed;

        return (
            <Box position="relative">
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
                        h="40px"
                        mb={1}
                        color={isCurrentPath ? activeColor : textColor}
                        bg={isCurrentPath ? hoverBgColor : "transparent"}
                        _hover={{
                            bg: hoverBgColor,
                            color: activeColor,
                        }}
                        onClick={onClick}
                        position="relative"
                    >
                        {icon}
                        {showText && (
                            <Text ml={3} overflow="hidden" whiteSpace="nowrap">
                                {label}
                            </Text>
                        )}
                        {badgeCount > 0 && (
                            <Badge
                                position="absolute"
                                right={showText ? 2 : "-6px"}
                                top={showText ? "auto" : "-6px"}
                                colorScheme="red"
                                borderRadius="full"
                            >
                                {badgeCount}
                            </Badge>
                        )}
                    </Button>
                </Tooltip>
                {isCurrentPath && (
                    <Box
                        position="absolute"
                        left={0}
                        top={0}
                        bottom={0}
                        w="3px"
                        bg={activeColor}
                        borderRightRadius="full"
                    />
                )}
            </Box>
        );
    });

    // Explicitly define name for React DevTools
    NavItem.displayName = 'NavItem';

    // Action button component - consistent handling of text display
    const ActionButton = memo(({ icon, label, onClick, isMobileView = false, colorScheme = "gray" }) => {
        // Show text if either we're in mobile view OR sidebar is not collapsed
        const showText = isMobileView || !isCollapsed;

        return (
            <Button
                onClick={onClick}
                variant="ghost"
                justifyContent={showText ? "flex-start" : "center"}
                leftIcon={icon}
                w="full"
                h="40px"
                mb={1}
                color={colorScheme === "gray" ? textColor : `${colorScheme}.400`}
                _hover={{
                    bg: colorScheme === "gray" ? hoverBgColor : `${colorScheme}.50`,
                    color: colorScheme === "gray" ? activeColor : `${colorScheme}.500`
                }}
            >
                {showText && label}
            </Button>
        );
    });

    ActionButton.displayName = 'ActionButton';

    // SidebarContent component with proper handling of mobile view
    const SidebarContent = memo(({ isMobileView = false }) => (
        <Flex direction="column" h="full" py={6} px={4} position="relative">
            {/* Desktop Collapse Toggle */}
            {!isMobileView && (
                <IconButton
                    icon={isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                    onClick={handleCollapseToggle}
                    position="absolute"
                    right={-4}
                    top={2}
                    transform="translateX(100%)"
                    borderLeftRadius="0"
                    bg={bgColor}
                    borderLeft="1px"
                    borderTop="1px"
                    borderBottom="1px"
                    borderColor={borderColor}
                    size="sm"
                    display={{ base: "none", md: "flex" }}
                    zIndex={100}
                    boxShadow={shadowColor}
                    _hover={{ bg: hoverBgColor }}
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                />
            )}

            {/* Logo */}
            <Flex align="center" mb={8} justify={isCollapsed && !isMobileView ? "center" : "flex-start"}>
                <Text
                    fontSize={isCollapsed && !isMobileView ? "xl" : "2xl"}
                    fontWeight="bold"
                    color={activeColor}
                    letterSpacing="tight"
                >
                    {isCollapsed && !isMobileView ? "AT" : "ALLTECH"}
                </Text>
            </Flex>

            {/* Main Navigation */}
            <VStack align="stretch" flex={1} spacing={2}>
                <NavItem
                    to="/"
                    icon={<StarIcon />}
                    label="Screens"
                    onClick={isMobileView ? closeMobileDrawer : undefined}
                    isMobileView={isMobileView}
                    badgeCount={0}
                />

                <NavItem
                    to="/Accessories"
                    icon={<SettingsIcon />}
                    label="Accessories"
                    onClick={isMobileView ? closeMobileDrawer : undefined}
                    isMobileView={isMobileView}
                    badgeCount={0}
                />

                <ActionButton
                    onClick={handleScreenModalOpen}
                    icon={<AddIcon />}
                    label="Add Screen"
                    isMobileView={isMobileView}
                />

                <ActionButton
                    onClick={handleAccessoryModalOpen}
                    icon={<AddIcon />}
                    label="Add Accessory"
                    isMobileView={isMobileView}
                />

                <NavItem
                    to="/SavedOrders"
                    icon={<TimeIcon />}
                    label="Unpaid Orders"
                    onClick={isMobileView ? closeMobileDrawer : undefined}
                    isMobileView={isMobileView}
                    badgeCount={3}
                />

                <NavItem
                    to="/LowStock"
                    icon={<WarningIcon />}
                    label="Low Stock"
                    onClick={isMobileView ? closeMobileDrawer : undefined}
                    isMobileView={isMobileView}
                    badgeCount={0}
                />

                <ActionButton
                    onClick={handleRefresh}
                    icon={<RepeatIcon />}
                    label="Refresh"
                    isMobileView={isMobileView}
                />
            </VStack>

            {/* User Section*/}
            <Box mt={6} pt={6} borderTop="1px" borderColor={borderColor}>
                {/* System Info */}
                <Flex align="center" mb={4}>
                    <Avatar
                        size="sm"
                        name="AT"
                        bg={activeColor}
                    />
                    {(isMobileView || !isCollapsed) && (
                        <Box ml={3}>
                            <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                                ALLTECH System
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                                Admin
                            </Text>
                        </Box>
                    )}
                </Flex>

                {/* Dark Mode Toggle */}
                <ActionButton
                    onClick={toggleColorMode}
                    icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
                    label={colorMode === "light" ? "Dark Mode" : "Light Mode"}
                    isMobileView={isMobileView}
                />

                {/* Logout Button */}
                <ActionButton
                    onClick={handleLogout}
                    icon={<DragHandleIcon />}
                    label="Logout"
                    isMobileView={isMobileView}
                    colorScheme="red"
                />
            </Box>
        </Flex>
    ));

    SidebarContent.displayName = 'SidebarContent';

    // Memoize the rendered components to prevent unnecessary re-renders
    const mobileView = useMemo(() => {
        if (!isMobile) return null;

        return (
            <>
                {/* Mobile Header */}
                <Box
                    position="fixed"
                    top={0}
                    left={0}
                    right={0}
                    bg={bgColor}
                    px={4}
                    py={3}
                    borderBottom="1px"
                    borderColor={borderColor}
                    zIndex={99}
                    boxShadow={shadowColor}
                >
                    <Flex justify="space-between" align="center">
                        <Text fontSize="xl" fontWeight="bold" color={activeColor}>
                            ALLTECH
                        </Text>
                        <IconButton
                            aria-label="Menu"
                            icon={<HamburgerIcon />}
                            onClick={openMobileDrawer}
                            variant="ghost"
                        />
                    </Flex>
                </Box>

                {/* Mobile Drawer */}
                <Drawer
                    isOpen={isMobileDrawerOpen}
                    placement="left"
                    onClose={closeMobileDrawer}
                    zIndex={1000}
                >
                    <DrawerOverlay />
                    <DrawerContent bg={bgColor}>
                        <DrawerHeader borderBottomWidth="1px">
                            <Flex justify="space-between" align="center">
                                <Text fontSize="xl" fontWeight="bold">Menu</Text>
                                <DrawerCloseButton />
                            </Flex>
                        </DrawerHeader>
                        <DrawerBody p={0}>
                            <SidebarContent isMobileView={true} />
                        </DrawerBody>
                    </DrawerContent>
                </Drawer>

                {/* Content Spacer */}
                <Box pt="60px">
                    {/* Content goes here */}
                </Box>
            </>
        );
    }, [isMobile, bgColor, borderColor, shadowColor, activeColor, openMobileDrawer, isMobileDrawerOpen, closeMobileDrawer]);

    const desktopView = useMemo(() => {
        if (isMobile) return null;

        return (
            <>
                <Box
                    bg={bgColor}
                    h="100vh"
                    position="fixed"
                    left={0}
                    top={0}
                    borderRight="1px"
                    borderColor={borderColor}
                    width={isCollapsed ? "80px" : "250px"}
                    transition="width 0.2s"
                    zIndex={99}
                    overflowY="auto"
                    overflowX="hidden"
                    css={{
                        '&::-webkit-scrollbar': {
                            width: '4px',
                        },
                        '&::-webkit-scrollbar-track': {
                            width: '6px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            background: borderColor,
                            borderRadius: '24px',
                        },
                    }}
                    boxShadow={shadowColor}
                >
                    <SidebarContent isMobileView={false} />
                </Box>

                {/* Main Content Area - Adjusts based on sidebar state */}
                <Box
                    ml={isCollapsed ? "80px" : "250px"}
                    transition="margin 0.2s"
                    p={4}
                >
                    {/* Content goes here */}
                </Box>
            </>
        );
    }, [isMobile, bgColor, borderColor, isCollapsed, shadowColor]);

    // Modals are rendered conditionally but kept out of memoized views
    // to ensure they update properly when isOpen changes
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