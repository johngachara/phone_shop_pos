import { useEffect, useState } from "react";
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
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase/firebase.js";
import AddScreenModal from "./screens/AddScreenModal.jsx";
import AddAccessoryModal from "./accessories/AddAccesoryModal.jsx";
import useCheckRole from "./hooks/useCheckRole.js";
import SequelizerAuth from "./axios/sequalizerAuth.js"
const MotionBox = motion.create(Box);
const MotionText = motion(Text);

export default function Navbar() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { colorMode, toggleColorMode } = useColorMode();
    const { role, loading: roleLoading } = useCheckRole();

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

    const [isLoading, setIsLoading] = useState(false);
    const isMobile = useBreakpointValue({ base: true, md: false });

    // Theme colors
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
    const handleLogout = () => {
        SequelizerAuth.logout();
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) navigate("/Login");
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, [navigate]);

    // Modal handlers
    const handleScreenModalOpen = () => {
        openScreenModal();
        if (isMobile) closeMobileDrawer();
    };

    const handleAccessoryModalOpen = () => {
        openAccessoryModal();
        if (isMobile) closeMobileDrawer();
    };

    // Navigation item component
    const NavItem = ({ to, icon, label, onClick, badgeCount }) => {
        const isCurrentPath = location.pathname === to;

        return (
            <MotionBox
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
                position="relative"
            >
                <Tooltip
                    label={isCollapsed ? label : ""}
                    placement="right"
                    isDisabled={!isCollapsed}
                    hasArrow
                >
                    <Button
                        as={Link}
                        to={to}
                        w="full"
                        variant="ghost"
                        justifyContent={isCollapsed ? "center" : "flex-start"}
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
                        <AnimatePresence>
                            {!isCollapsed && (
                                <MotionText
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: "auto" }}
                                    exit={{ opacity: 0, width: 0 }}
                                    ml={3}
                                    overflow="hidden"
                                    whiteSpace="nowrap"
                                >
                                    {label}
                                </MotionText>
                            )}
                        </AnimatePresence>
                        {badgeCount && !isCollapsed && (
                            <Badge
                                position="absolute"
                                right={2}
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
            </MotionBox>
        );
    };

    const SidebarContent = ({ isMobileView = false }) => (
        <Flex direction="column" h="full" py={6} px={4} position="relative">
            {/* Desktop Collapse Toggle */}
            {!isMobileView && (
                <IconButton
                    icon={isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                    onClick={() => setIsCollapsed(!isCollapsed)}
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
                />
                <NavItem
                    to="/Accessories"
                    icon={<SettingsIcon />}
                    label="Accessories"
                    onClick={isMobileView ? closeMobileDrawer : undefined}
                />

                <Button
                    onClick={handleScreenModalOpen}
                    variant="ghost"
                    justifyContent={isCollapsed && !isMobileView ? "center" : "flex-start"}
                    leftIcon={<AddIcon />}
                    w="full"
                    h="40px"
                    mb={1}
                >
                    {(!isCollapsed || isMobileView) && "Add Screen"}
                </Button>

                <Button
                    onClick={handleAccessoryModalOpen}
                    variant="ghost"
                    justifyContent={isCollapsed && !isMobileView ? "center" : "flex-start"}
                    leftIcon={<AddIcon />}
                    w="full"
                    h="40px"
                    mb={1}
                >
                    {(!isCollapsed || isMobileView) && "Add Accessory"}
                </Button>

                <NavItem
                    to="/SavedOrders"
                    icon={<TimeIcon />}
                    label="Unpaid Orders"
                    onClick={isMobileView ? closeMobileDrawer : undefined}
                    badgeCount={3}
                />
                <NavItem
                    to="/LowStock"
                    icon={<WarningIcon />}
                    label="Low Stock"
                    onClick={isMobileView ? closeMobileDrawer : undefined}
                />
                <Button
                    onClick={() => {
                        window.location.reload();
                        if (isMobileView) closeMobileDrawer();
                    }}
                    variant="ghost"
                    justifyContent={isCollapsed && !isMobileView ? "center" : "flex-start"}
                    leftIcon={<RepeatIcon />}
                    w="full"
                    h="40px"
                    mb={1}
                >
                    {(!isCollapsed || isMobileView) && "Refresh"}
                </Button>
            </VStack>

            {/* User Section*/}
            <Box mt={6} pt={6} borderTop="1px" borderColor={borderColor}>
                {/* User Info */}
                <Flex align="center" mb={4}>
                    <Avatar
                        size="sm"
                        name={user?.email === "alltechmain@gmail.com" ? "AT" : user?.displayName?.[0]}
                        src={user?.photoURL}
                    />
                    {(!isCollapsed || isMobileView) && (
                        <Box ml={3}>
                            <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                                {user?.displayName || "ALLTECH"}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                                {role || "User"}
                            </Text>
                        </Box>
                    )}
                </Flex>

                {/* Dark Mode Toggle */}
                <Button
                    onClick={toggleColorMode}
                    variant="ghost"
                    justifyContent={isCollapsed && !isMobileView ? "center" : "flex-start"}
                    leftIcon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
                    w="full"
                    h="40px"
                    mb={2}
                >
                    {(!isCollapsed || isMobileView) && (colorMode === "light" ? "Dark Mode" : "Light Mode")}
                </Button>

                {/* Logout Button */}
                <Button
                    onClick={handleLogout}
                    variant="ghost"
                    justifyContent={isCollapsed && !isMobileView ? "center" : "flex-start"}
                    leftIcon={<DragHandleIcon />}
                    w="full"
                    h="40px"
                    color="red.400"
                    _hover={{
                        bg: "red.50",
                        color: "red.500"
                    }}
                >
                    {(!isCollapsed || isMobileView) && "Logout"}
                </Button>
            </Box>
        </Flex>
    );
    // Mobile View
    if (isMobile) {
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

                {/* Modals */}
                <AddScreenModal
                    isOpen={isScreenModalOpen}
                    onClose={closeScreenModal}
                    isLoading={isLoading}
                />

                <AddAccessoryModal
                    isOpen={isAccessoryModalOpen}
                    onClose={closeAccessoryModal}
                />
            </>
        );
    }
    return (
        <>
            <MotionBox
                bg={bgColor}
                h="100vh"
                position="fixed"
                left={0}
                top={0}
                borderRight="1px"
                borderColor={borderColor}
                initial={{ width: "250px" }}
                animate={{ width: isCollapsed ? "80px" : "250px" }}
                transition={{ duration: 0.2 }}
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
            </MotionBox>

            {/* Main Content Area - Adjusts based on sidebar state */}
            <Box
                ml={{ base: 0, md: isCollapsed ? "80px" : "250px" }}
                transition="margin 0.2s"
                p={4}
            >
                {/* Content goes here */}
            </Box>

            {/* Modals */}
            <AddScreenModal
                isOpen={isScreenModalOpen}
                onClose={closeScreenModal}
                isLoading={isLoading}
            />

            <AddAccessoryModal
                isOpen={isAccessoryModalOpen}
                onClose={closeAccessoryModal}
            />
        </>
    );
}