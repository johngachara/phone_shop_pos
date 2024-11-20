import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Flex,
    Heading,
    Button,
    useColorModeValue,
    VStack,
    Text,
    Divider,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    useToast
} from "@chakra-ui/react";

import { FcGoogle } from "react-icons/fc";

import { motion } from "framer-motion";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../components/firebase/firebase.js";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { firestore } from "../components/firebase/firebase.js";
import authService from "components/axios/authService.js";
import sequalizerAuth from "components/axios/sequalizerAuth.js";

const MotionBox = motion.create(Box);

// WebAuthn credential storage key in localStorage
const LAST_USER_KEY = "last_user_id";

// Helper function to convert ArrayBuffer to Base64
const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let string = '';
    for (const byte of bytes) {
        string += String.fromCharCode(byte);
    }
    return btoa(string);
};

// Helper function to convert Base64 to ArrayBuffer
const base64ToArrayBuffer = (base64) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
};

const SignIn = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [webAuthnAvailable, setWebAuthnAvailable] = useState(false);
    const [hasRegisteredWebAuthn, setHasRegisteredWebAuthn] = useState(false);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const toast = useToast();
    const provider = new GoogleAuthProvider();

    // Check WebAuthn availability and previous registration
    useEffect(() => {
        const checkWebAuthnSupport = async () => {
            try {
                if (window.PublicKeyCredential) {
                    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
                    setWebAuthnAvailable(available);

                    // Check for existing credentials
                    const lastUserId = localStorage.getItem(LAST_USER_KEY);
                    if (lastUserId) {
                        const userDoc = await getDoc(doc(firestore, "users", lastUserId));
                        if (userDoc.exists() && userDoc.data().webAuthnCredentials) {
                            setHasRegisteredWebAuthn(true);
                        }
                    }
                }
            } catch (err) {
                console.error("Error checking WebAuthn support:", err);
                setWebAuthnAvailable(false);
            }
        };

        checkWebAuthnSupport();
    }, []);

    // Create WebAuthn credential
    const registerWebAuthnCredential = async (userId, userEmail, userName) => {
        try {
            const challengeBytes = new Uint8Array(32);
            window.crypto.getRandomValues(challengeBytes);

            const createCredentialOptions = {
                challenge: challengeBytes,
                rp: {
                    name: "ALLTECH SHOP 2",
                    id: window.location.hostname
                },
                user: {
                    id: Uint8Array.from(userId, c => c.charCodeAt(0)),
                    name: userEmail,
                    displayName: userName
                },
                pubKeyCredParams: [
                    { type: "public-key", alg: -7 },   // ES256
                    { type: "public-key", alg: -257 }  // RS256
                ],
                timeout: 60000,
                attestation: "none",
                authenticatorSelection: {
                    userVerification: "preferred",
                    requireResidentKey: false
                }
            };

            const credential = await navigator.credentials.create({
                publicKey: createCredentialOptions
            });

            const credentialData = {
                id: credential.id,
                rawId: arrayBufferToBase64(credential.rawId),
                type: credential.type,
                attestationObject: arrayBufferToBase64(credential.response.attestationObject),
                clientDataJSON: arrayBufferToBase64(credential.response.clientDataJSON),
                transports: credential.response.getTransports ? credential.response.getTransports() : []
            };

            // Store in Firestore
            const userRef = doc(firestore, "users", userId);
            await updateDoc(userRef, {
                webAuthnCredentials: credentialData
            });

            setHasRegisteredWebAuthn(true);
            localStorage.setItem(LAST_USER_KEY, userId);

            toast({
                title: "Security key registered successfully",
                description: "You can now use your security key or biometric authentication for sign-in",
                status: "success",
                duration: 3000,
                isClosable: true
            });

            return true;
        } catch (error) {
            console.error("Error registering WebAuthn credential:", error);

            let errorMessage = "Failed to register security key.";
            if (error.name === "NotAllowedError") {
                errorMessage = "Permission denied. Please allow security key registration.";
            } else if (error.name === "SecurityError") {
                errorMessage = "Security error. Please ensure you're using HTTPS.";
            }

            toast({
                title: "Registration Error",
                description: errorMessage,
                status: "error",
                duration: 5000,
                isClosable: true
            });

            return false;
        }
    };

    // Verify WebAuthn credential
    const verifyWebAuthnCredential = async () => {
        try {
            const lastUserId = localStorage.getItem(LAST_USER_KEY);
            if (!lastUserId) {
                throw new Error("No registered credentials found");
            }

            const userDoc = await getDoc(doc(firestore, "users", lastUserId));
            if (!userDoc.exists() || !userDoc.data().webAuthnCredentials) {
                throw new Error("No credentials found for this user");
            }

            const storedCredential = userDoc.data().webAuthnCredentials;
            const challengeBytes = new Uint8Array(32);
            window.crypto.getRandomValues(challengeBytes);

            const assertionOptions = {
                challenge: challengeBytes,
                allowCredentials: [{
                    id: base64ToArrayBuffer(storedCredential.rawId),
                    type: 'public-key',
                    transports: storedCredential.transports || ['usb', 'ble', 'nfc', 'internal']
                }],
                timeout: 60000,
                userVerification: "preferred",
                rpId: window.location.hostname
            };

            const assertion = await navigator.credentials.get({
                publicKey: assertionOptions
            });

            if (assertion) {
                return userDoc.data();
            }
        } catch (error) {
            console.error("Error verifying WebAuthn credential:", error);
            let errorMessage = "Authentication failed.";

            if (error.name === "NotAllowedError") {
                errorMessage = "Permission denied. Please try again.";
            } else if (error.message === "No registered credentials found") {
                errorMessage = "Please sign in with Google first to set up security key authentication.";
            }

            toast({
                title: "Authentication Error",
                description: errorMessage,
                status: "error",
                duration: 5000,
                isClosable: true
            });

            throw error;
        }
    };

    // Handle WebAuthn sign in
    const handleWebAuthnSignIn = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const userData = await verifyWebAuthnCredential();
            if (userData.role) {
                // Re-authenticate with Firebase silently
                const user = auth.currentUser;
                if (!user) {
                    throw new Error("Firebase session expired. Please sign in with Google.");
                }

                const firebaseToken = await user.getIdToken();

                // Main auth login
                const { data: mainData, status: mainStatus } =
                    await authService.mainLogin(firebaseToken);
                if (mainStatus === 200) {
                    await authService.storeTokens({
                        access: mainData.access,
                        refresh: mainData.refresh
                    });
                }

                // Sequalizer auth
                const { data: sequelizerData, status: sequelizerStatus } =
                    await sequalizerAuth.axiosInstance.post('/nodeapp/api/authenticate', {
                        idToken: firebaseToken
                    });
                if (sequelizerStatus === 200) {
                    await sequalizerAuth.storeAccessToken(sequelizerData.token);
                }

                navigate("/");
            } else {
                throw new Error("Your account does not have required permissions.");
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Google sign in
    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            const uid = user.uid;

            // Store user ID for WebAuthn
            localStorage.setItem(LAST_USER_KEY, uid);

            const userDocRef = doc(firestore, "users", uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();

                if (userData.role) {
                    const firebaseToken = await user.getIdToken();

                    // Main auth login
                    const { data: mainData, status: mainStatus } =
                        await authService.mainLogin(firebaseToken);
                    if (mainStatus === 200) {
                        await authService.storeTokens({
                            access: mainData.access,
                            refresh: mainData.refresh
                        });
                    }

                    // Sequalizer auth
                    const { data: sequelizerData, status: sequelizerStatus } =
                        await sequalizerAuth.axiosInstance.post('/nodeapp/api/authenticate', {
                            idToken: firebaseToken
                        });
                    if (sequelizerStatus === 200) {
                        await sequalizerAuth.storeAccessToken(sequelizerData.token);
                    }

                    // If WebAuthn is available but not registered, offer registration
                    if (webAuthnAvailable && !userData.webAuthnCredentials) {
                        const shouldRegister = window.confirm(
                            "Would you like to set up security key authentication for faster sign-in next time?"
                        );

                        if (shouldRegister) {
                            await registerWebAuthnCredential(
                                uid,
                                user.email,
                                user.displayName
                            );
                        }
                    }

                    navigate("/");
                } else {
                    throw new Error("Your account does not have required permissions.");
                }
            } else {
                throw new Error("Your account is not registered in the system.");
            }
        } catch (error) {
            console.error("Sign-in error:", error);
            let errorMessage = "Sign-in failed.";

            if (error.code === 'auth/popup-closed-by-user') {
                errorMessage = "Sign-in cancelled. Please try again.";
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = "Network error. Please check your connection.";
            } else {
                errorMessage = error.message;
            }

            setError(errorMessage);
            toast({
                title: "Sign-in Error",
                description: errorMessage,
                status: "error",
                duration: 5000,
                isClosable: true
            });
        } finally {
            setIsLoading(false);
        }
    };

    // UI Theme values
    const bgColor = useColorModeValue('white', 'gray.800');
    const textColor = useColorModeValue('gray.800', 'white');

    return (
        <Flex
            justify="center"
            align="center"
            minH="100vh"
            bgGradient={useColorModeValue(
                'linear(to-r, teal.300, blue.500)',
                'linear(to-r, gray.800, gray.900)'
            )}
            position="relative"
            overflow="hidden"
        >
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
                <VStack spacing={6}>
                    <Heading as="h2" size="2xl" textAlign="center" color={textColor}>
                        ALLTECH SHOP 2
                    </Heading>

                    {error && (
                        <Alert status="error" borderRadius="md">
                            <AlertIcon />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Show security key button if WebAuthn is available and registered */}
                    {webAuthnAvailable && hasRegisteredWebAuthn ? (
                        <Button
                            colorScheme="purple"
                            variant="solid"
                            width="full"
                            size="lg"
                            isLoading={isLoading}
                            loadingText="Verifying"
                            onClick={handleWebAuthnSignIn}
                        >
                            Sign in with fingerprint
                        </Button>
                    ) : (
                        // Show Google button if WebAuthn is not available or not registered
                        <>
                            <Button
                                leftIcon={<FcGoogle />}
                                colorScheme="teal"
                                variant="solid"
                                width="full"
                                size="lg"
                                isLoading={isLoading}
                                loadingText="Signing in"
                                onClick={handleGoogleSignIn}
                            >
                                Sign in with Google
                            </Button>

                            {webAuthnAvailable && (
                                <Text fontSize="sm" color={textColor} textAlign="center">
                                    Sign in with Google to enable fingerprint authentication
                                </Text>
                            )}
                        </>
                    )}

                    {/*  small link to switch authentication method */}
                    {webAuthnAvailable && hasRegisteredWebAuthn && (
                        <Button
                            variant="link"
                            size="sm"
                            color={textColor}
                            onClick={() => {
                                // Clear WebAuthn registration
                                localStorage.removeItem(LAST_USER_KEY);
                                setHasRegisteredWebAuthn(false);

                                toast({
                                    title: "Authentication method switched",
                                    description: "You can now sign in with Google",
                                    status: "info",
                                    duration: 3000,
                                    isClosable: true
                                });
                            }}
                        >
                            Switch to Google Sign-in
                        </Button>
                    )}
                </VStack>
            </MotionBox>
        </Flex>
    );
};

export default SignIn;