import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Flex,
    Heading,
    Button,
    useColorModeValue
} from "@chakra-ui/react";

import toast, { Toaster } from 'react-hot-toast';
import { FcGoogle } from "react-icons/fc";
import { motion } from "framer-motion";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../components/firebase/firebase.js";
import { doc, getDoc } from "firebase/firestore"; // To fetch user data from Firestore
import { firestore } from "../components/firebase/firebase.js";
import {apiService} from "../apiService.js"; // Initialize Firestore

const MotionBox = motion(Box);

const Signin = () => {
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const provider = new GoogleAuthProvider();

    const signInWithGoogle = async () => {
        setIsLoading(true);
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            const uid = user.uid;

            // Fetch the user document from Firestore using the UID
            const userDocRef = doc(firestore, "users", uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();

                // Check if the user has a role
                if (userData.role) {
                    try {
                        // Get Firebase ID token
                        const firebaseToken = await user.getIdToken();

                        // Send Firebase token to Django backend
                        const { data, status, message } = await apiService.main_login(firebaseToken);
                        if (status === 403) {
                            throw new Error("You are forbidden to sign in");
                        } else if (status !== 200) {
                            throw new Error(message || "Error during sign in");
                        }

                        // Store JWT token
                        localStorage.setItem("access", data.access); // JWT token
                        localStorage.setItem("refresh", data.refresh)
                        const { data: sequelizerData, status: sequelizerStatus } = await apiService.sequelizer_login({
                         firebaseToken
                        });

                        if (sequelizerStatus !== 200) {
                            throw new Error("Incorrect Username or password sequelizer");
                        }

                        localStorage.setItem("accessories", sequelizerData.token); // Store sequelizer token
                        // Navigate to homepage after successful login
                        navigate("/");
                    } catch (error) {
                        console.error("Error during API call:", error);
                        toast.error(error.message);
                        await auth.signOut();
                    }
                } else {
                    // No role found in the Firestore document
                    await auth.signOut();
                    toast.error("Your account does not have a role and cannot sign in.");
                }
            } else {
                // User does not exist in Firestore
                await auth.signOut();
                toast.error("Your account is not in the system.");
            }
        } catch (error) {
            console.error("Error during sign-in:", error);
            if (error.code === 'auth/popup-closed-by-user') {
                toast.error("Sign-in was cancelled. Please try again.");
            } else if (error.code === 'auth/network-request-failed') {
                toast.error("Network error. Please check your internet connection.");
            } else {
                toast.error("Error during Google Sign-In. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const bgColor = useColorModeValue('white', 'gray.800');
    const textColor = useColorModeValue('gray.800', 'white');

    return (
        <Flex
            justify="center"
            align="center"
            minH="100vh"
            bgGradient={useColorModeValue('linear(to-r, teal.300, blue.500)', 'linear(to-r, gray.800, gray.900)')}
            position="relative"
            overflow="hidden"
        >
            <Toaster />
            <MotionBox
                bg={bgColor}
                p={8}
                borderRadius="xl"
                boxShadow="2xl"
                maxW="400px"
                w="90%"
                backdropFilter="blur(10px)"
                border="1px solid"
                borderColor={useColorModeValue('gray.200', 'gray.700')}
                zIndex={1}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                whileHover={{ scale: 1.05 }}
            >
                <Heading as="h2" size="2xl" textAlign="center" mb={8} color={textColor}>
                    ALLTECH SHOP 2
                </Heading>
                <Button
                    leftIcon={<FcGoogle />}
                    mt={4}
                    colorScheme="teal"
                    variant="solid"
                    width="full"
                    size="lg"
                    isLoading={isLoading}
                    loadingText="Signing in"
                    onClick={signInWithGoogle}
                    _hover={{ bg: useColorModeValue('teal.500', 'teal.400') }}
                    _active={{ bg: useColorModeValue('teal.600', 'teal.500') }}
                >
                    Sign in with Google
                </Button>
            </MotionBox>
            <Box
                position="absolute"
                top="0"
                left="0"
                w="100%"
                h="100%"
                pointerEvents="none"
                opacity="0.1"
                zIndex={0}
                filter="blur(8px)"
            />
        </Flex>
    );
};

export default Signin;
