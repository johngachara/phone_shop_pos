import  { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
    useColorMode, Skeleton,
} from "@chakra-ui/react";
import { ChevronDownIcon, HamburgerIcon, MoonIcon, SunIcon } from "@chakra-ui/icons";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase/firebase.js";
import AddScreenModal from "components/screens/AddScreenModal.jsx";
import AddAccessoryModal from "components/accessories/AddAccesoryModal.jsx";
import useCheckRole from "components/hooks/useCheckRole.js";

export default function Navbar() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const location = useLocation();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { colorMode, toggleColorMode } = useColorMode();
    const bgColor = useColorModeValue("gray.100", "gray.800");
    const textColor = useColorModeValue("gray.700", "gray.200");
    const activeColor = useColorModeValue("blue.500", "blue.300");
    const isMobile = useBreakpointValue({ base: true, md: false });
    const { role, loading:roleLoading, error } = useCheckRole();
    const Logout = () => {
        localStorage.removeItem("access");
        localStorage.removeItem("accessories");
        navigate("/Login");
    };

    const isActive = (path) => location.pathname === path;

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) navigate('/Login');
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, [navigate]);

    const DarkModeButton = () => (
        <Button
            onClick={toggleColorMode}
            variant="ghost"
            aria-label="Toggle Dark Mode"
            mb={4} // Margin to space it from other elements
        >
            {colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
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

    const NavContent = ({ onItemClick }) => {
        const [isAddScreenModalOpen, setIsAddScreenModalOpen] = useState(false);
        const [isAddAccessoryModalOpen, setIsAddAccessoryModalOpen] = useState(false);
        const [activeButton, setActiveButton] = useState(null);

        const handleButtonClick = (buttonName) => {
            setActiveButton(buttonName);
            switch (buttonName) {
                case 'addScreen':
                    setIsAddScreenModalOpen(true);
                    break;
                case 'addAccessory':
                    setIsAddAccessoryModalOpen(true);
                    break;
                default:
                    // Handle any unexpected button names
                    console.warn(`Unexpected button name: ${buttonName}`);
            }
            onItemClick && onItemClick();
        };
        const buttonStyle = (buttonName) => ({
            justifyContent: "flex-start",
            width: "100%",
            color: activeButton === buttonName ? activeColor : textColor,
            fontWeight:activeButton === buttonName ? "bold" : "normal",
            variant:"ghost",
        });

        return (
            <VStack align="stretch" spacing={2} flex={1}>
                <NavItem to="/" onClick={onItemClick}>Screens</NavItem>
                <NavItem to="/Accessories" onClick={onItemClick}>Accessories</NavItem>
                <Button
                    onClick={() => handleButtonClick('addAccessory')}
                    {...buttonStyle('addAccessory')}
                >
                    Add New Accessory
                </Button>
                <Button
                    onClick={() => handleButtonClick('addScreen')}
                    {...buttonStyle('addScreen')}
                >
                    Add New Screen
                </Button>
                <NavItem to="/SavedOrders" onClick={onItemClick}>Unpaid Orders</NavItem>
                <NavItem to="/LowStock" onClick={onItemClick}>Low Stock</NavItem>
                {/* Conditional rendering based on role */}
                {roleLoading ? (
                    <Skeleton height="40px" width="100%" />
                ) : error ? (
                    <Text color="red.500">Failed to load role</Text>
                ) : role === 'admin' ? (
                    <NavItem to="/Admin" onClick={onItemClick}>Admin Dashboard</NavItem>
                ) : null}

                {/* Conditional rendering based on role */}
                {roleLoading ? (
                    <Skeleton height="40px" width="100%" />
                ) : error ? (
                    <Text color="red.500">Failed to load role</Text>
                ) : role === 'admin' ? (
                    <NavItem to="/detailed" onClick={onItemClick}>Shop Transactions</NavItem>
                ) : null}

                <Button onClick={() => { window.location.reload(); onItemClick && onItemClick(); }} variant="ghost">Refresh</Button>

                <AddScreenModal
                    isOpen={isAddScreenModalOpen}
                    onClose={() => {
                        setIsAddScreenModalOpen(false);
                        setActiveButton(null);
                    }}
                />
                <AddAccessoryModal
                    isOpen={isAddAccessoryModalOpen}
                    onClose={() => {
                        setIsAddAccessoryModalOpen(false);
                        setActiveButton(null);
                    }}
                />
            </VStack>
        );
    };
    const SidebarContent = () => (
        <Flex direction="column" h="full" p={4}>
            <Box mb={6}>
                <Text fontSize="xl" fontWeight="bold" color={textColor}>
                    ALLTECH
                </Text>
            </Box>

            <NavContent />

            <Box mt={4}>
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
            </Box>

            <DarkModeButton />
        </Flex>
    );

    if (isMobile) {
        return (
            <>
                <Box position="fixed" top={3} right={4} zIndex={20}>
                    <IconButton
                        aria-label="Open menu"
                        icon={<HamburgerIcon />}
                        onClick={onOpen}
                    />
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
            </>
        );
    }

    return (
        <Box
            bg={bgColor}
            w={{ base: "full", md: "250px" }}
            h="100vh"
            position={{ base: "fixed", md: "fixed" }}
            left={0}
            top={0}
            boxShadow="sm"
            p={4}
            zIndex="20"
            display={{ base: "none", md: "block" }}
        >
            <SidebarContent />
        </Box>
    );
}
