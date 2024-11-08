import { useEffect, useState } from "react";
import {
    Flex,
    Button,
    useColorModeValue,
    Box,
    VStack,
    Text,
    Avatar,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
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
    Skeleton,
} from "@chakra-ui/react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronDownIcon, HamburgerIcon, MoonIcon, SunIcon } from "@chakra-ui/icons";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase/firebase.js";
import AddScreenModal from "components/screens/AddScreenModal.jsx";

import useCheckRole from "components/hooks/useCheckRole.js";
import AddAccessoryModal from "components/accessories/AddAccesoryModal.jsx";

export default function Navbar() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const location = useLocation();
    const { isOpen, onOpen, onClose } = useDisclosure(); // Drawer control
    const { colorMode, toggleColorMode } = useColorMode();
    const bgColor = useColorModeValue("gray.100", "gray.800");
    const textColor = useColorModeValue("gray.700", "gray.200");
    const activeColor = useColorModeValue("blue.500", "blue.300");
    const isMobile = useBreakpointValue({ base: true, md: false });
    const { role, loading: roleLoading, error } = useCheckRole();

    // Modal states
    const {
        isOpen: isScreenModalOpen,
        onOpen: openScreenModal,
        onClose: closeScreenModal,
    } = useDisclosure();

    const {
        isOpen: isAccessoryModalOpen,
        onOpen: openAccessoryModal,
        onClose: closeAccessoryModal,
    } = useDisclosure();

    const [activeModal, setActiveModal] = useState(null);

    // Screen modal config
    const [isLoading, setIsLoading] = useState(false);
    const fieldConfig = [
        { label: "Screen Name", name: "screen_name", type: "text", placeholder: "Enter screen name" },
        { label: "Resolution", name: "resolution", type: "text", placeholder: "Enter resolution" },
        { label: "Price", name: "price", type: "number", placeholder: "Enter price" },
    ];

    const primaryButtonConfig = {
        label: "Add Screen",
        onClick: () => {
            setIsLoading(true);
            setTimeout(() => {
                console.log("Screen added successfully");
                setIsLoading(false);
                closeScreenModal();
            }, 2000);
        },
    };

    const secondaryButtonConfig = {
        label: "Cancel",
        onClick: closeScreenModal,
    };

    // Navigation helpers
    const Logout = () => {
        localStorage.removeItem("access");
        localStorage.removeItem("accessories");
        localStorage.removeItem("refresh")
        navigate("/Login");
    };

    const isActive = (path) => location.pathname === path;

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) navigate("/Login");
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, [navigate]);

    // Handle modal opens with active state
    const handleScreenModalOpen = () => {
        setActiveModal('screen');
        openScreenModal();
    };

    const handleAccessoryModalOpen = () => {
        setActiveModal('accessory');
        openAccessoryModal();
    };

    // Handle modal closes
    const handleScreenModalClose = () => {
        setActiveModal(null);
        closeScreenModal();
    };

    const handleAccessoryModalClose = () => {
        setActiveModal(null);
        closeAccessoryModal();
    };

    const DarkModeButton = () => (
        <Button onClick={toggleColorMode} variant="ghost" mb={4}>
            {colorMode === "light" ? <MoonIcon /> : <SunIcon />}
        </Button>
    );

    const NavItem = ({ to, children, onClick }) => (
        <Button
            as={Link}
            to={to}
            color={isActive(to) ? activeColor : textColor}
            fontWeight={isActive(to) ? "bold" : "normal"}
            variant="ghost"
            justifyContent="flex-start"
            width="100%"
            onClick={onClick}
        >
            {children}
        </Button>
    );

    const ActionButton = ({ onClick, isActive, children }) => (
        <Button
            onClick={onClick}
            variant="ghost"
            justifyContent="flex-start"
            fontWeight="normal"
            width="100%"
            color={isActive ? activeColor : textColor}
        >
            {children}
        </Button>
    );

    const SidebarContent = () => (
        <Flex direction="column" h="full" p={4}>
            <Box mb={6}>
                <Text fontSize="xl" fontWeight="bold" color={textColor}>
                    ALLTECH
                </Text>
            </Box>

            <VStack align="stretch" spacing={2} flex={1}>
                <NavItem to="/" onClick={onClose}>Screens</NavItem>
                {/*<NavItem to="/Accessories" onClick={onClose}>Accessories</NavItem>*/}
                <ActionButton
                    onClick={handleScreenModalOpen}
                    isActive={activeModal === 'screen'}
                >
                    Add New Screen
                </ActionButton>
                {/*<ActionButton*/}
                {/*    onClick={handleAccessoryModalOpen}*/}
                {/*    isActive={activeModal === 'accessory'}*/}
                {/*>*/}
                {/*    Add New Accessory*/}
                {/*</ActionButton>*/}
                <NavItem to="/SavedOrders" onClick={onClose}>Unpaid Orders</NavItem>
                <NavItem to="/LowStock" onClick={onClose}>Low Stock</NavItem>

                {roleLoading ? (
                    <Skeleton height="40px" width="100%" />
                ) : error ? (
                    <Text color="red.500">Failed to load role</Text>
                ) : role === "admin" ? (
                    <>
                        <NavItem to="/Admin" onClick={onClose}>Admin Dashboard</NavItem>
                        <NavItem to="/detailed" onClick={onClose}>Shop Transactions</NavItem>
                    </>
                ) : null}

                <Button
                    onClick={() => {
                        window.location.reload();
                        onClose();
                    }}
                    variant="ghost"
                >
                    Refresh
                </Button>
            </VStack>

            <Menu>
                <MenuButton as={Button} rightIcon={<ChevronDownIcon />} variant="ghost" size="sm" width="100%">
                    <Flex align="center">
                        <Avatar size="sm" name={user?.displayName} src={user?.photoURL} mr={2} />
                        <Text>{user?.displayName}</Text>
                    </Flex>
                </MenuButton>
                <MenuList>
                    <MenuItem onClick={Logout}>Logout</MenuItem>
                </MenuList>
            </Menu>

            <DarkModeButton />
        </Flex>
    );

    if (isMobile) {
        return (
            <>
                <Box position="fixed" top={3} right={4} zIndex={20}>
                    <IconButton aria-label="Open menu" icon={<HamburgerIcon />} onClick={onOpen} />
                </Box>
                <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
                    <DrawerOverlay>
                        <DrawerContent bg={bgColor}>
                            <DrawerCloseButton />
                            <DrawerHeader>Menu</DrawerHeader>
                            <DrawerBody>
                                <SidebarContent />
                            </DrawerBody>
                        </DrawerContent>
                    </DrawerOverlay>
                </Drawer>

                <AddScreenModal
                    isOpen={isScreenModalOpen}
                    onClose={handleScreenModalClose}
                    isLoading={isLoading}
                    fieldConfig={fieldConfig}
                    primaryButtonConfig={primaryButtonConfig}
                    secondaryButtonConfig={secondaryButtonConfig}
                />


            </>
        );
    }

    return (
        <Box
            bg={bgColor}
            w={{ base: "full", md: "250px" }}
            h="100vh"
            position="fixed"
            left={0}
            top={0}
            boxShadow="sm"
            p={4}
            zIndex="20"
            display={{ base: "none", md: "block" }}
        >
            <SidebarContent />

            <AddScreenModal
                isOpen={isScreenModalOpen}
                onClose={handleScreenModalClose}
                isLoading={isLoading}
                fieldConfig={fieldConfig}
                primaryButtonConfig={primaryButtonConfig}
                secondaryButtonConfig={secondaryButtonConfig}
            />

            <AddAccessoryModal
                isOpen={isAccessoryModalOpen}
                onClose={handleAccessoryModalClose}
            />
        </Box>
    );
}