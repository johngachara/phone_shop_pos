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
    Alert,
    AlertIcon,
    AlertDescription,
    useToast
} from "@chakra-ui/react";
import { FcGoogle } from "react-icons/fc";
import { motion } from "framer-motion";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../components/firebase/firebase.js";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { firestore } from "../components/firebase/firebase.js";
import authService from "components/axios/authService.js";
import sequalizerAuth from "components/axios/sequalizerAuth.js";

const MotionBox = motion.create(Box);
const LAST_USER_KEY = "last_user_id";

// Helper functions for ArrayBuffer conversion remain the same
const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let string = '';
    for (const byte of bytes) {
        string += String.fromCharCode(byte);
    }
    return btoa(string);
};

const base64ToArrayBuffer = (base64) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
};

// Improved device identification
const generateDeviceId = () => {
    // Get detailed browser information
    const browserInfo = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: navigator.deviceMemory,
        vendor: navigator.vendor,
        // Use modern navigator properties for platform detection
        mobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        screen: {
            width: window.screen.width,
            height: window.screen.height,
            pixelRatio: window.devicePixelRatio
        }
    };

    // Create a unique string combining device characteristics
    const deviceString = JSON.stringify({
        ...browserInfo,
        hostname: window.location.hostname
    });

    // Generate a hash of the device string
    return btoa(encodeURIComponent(deviceString)).replace(/[/+=]/g, '');
};

const SignIn = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [webAuthnAvailable, setWebAuthnAvailable] = useState(false);
    const [hasRegisteredWebAuthn, setHasRegisteredWebAuthn] = useState(false);
    const [error, setError] = useState(null);
    const [currentDeviceId] = useState(generateDeviceId());

    const navigate = useNavigate();
    const toast = useToast();
    const provider = new GoogleAuthProvider();

    // Enhanced WebAuthn support check
    useEffect(() => {
        const checkWebAuthnSupport = async () => {
            try {
                if (window.PublicKeyCredential) {
                    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
                    setWebAuthnAvailable(available);

                    const lastUserId = localStorage.getItem(LAST_USER_KEY);
                    if (lastUserId) {
                        const userDoc = await getDoc(doc(firestore, "users", lastUserId));
                        if (userDoc.exists() && userDoc.data().webAuthnCredentials) {
                            // Check for credentials matching current environment
                            const deviceCredential = userDoc.data().webAuthnCredentials.find(
                                cred => cred.deviceId === currentDeviceId &&
                                    cred.hostname === window.location.hostname
                            );
                            setHasRegisteredWebAuthn(!!deviceCredential);
                        }
                    }
                }
            } catch (err) {
                console.error("Error checking WebAuthn support:", err);
                setWebAuthnAvailable(false);
            }
        };

        checkWebAuthnSupport();
    }, [currentDeviceId]);

    // Modified registration function to handle automatic registration for new environments
    const registerWebAuthnCredential = async (userId, userEmail, userName, autoRegister = false) => {
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
                    { type: "public-key", alg: -7 },
                    { type: "public-key", alg: -257 }
                ],
                timeout: 60000,
                attestation: "none",
                authenticatorSelection: {
                    authenticatorAttachment: "platform",
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
                transports: credential.response.getTransports ? credential.response.getTransports() : [],
                deviceId: currentDeviceId,
                deviceInfo: {
                    userAgent: navigator.userAgent,
                    language: navigator.language,
                    mobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
                    touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
                    screen: {
                        width: window.screen.width,
                        height: window.screen.height,
                        pixelRatio: window.devicePixelRatio
                    }
                },
                hostname: window.location.hostname,
                dateAdded: new Date().toISOString()
            };

            const userRef = doc(firestore, "users", userId);
            const userDoc = await getDoc(userRef);
            const existingCredentials = userDoc.exists() ?
                (userDoc.data().webAuthnCredentials || []) : [];

            // Check for existing credential for this device and hostname
            const existingCredIndex = existingCredentials.findIndex(
                cred => cred.deviceId === currentDeviceId &&
                    cred.hostname === window.location.hostname
            );

            if (existingCredIndex !== -1) {
                existingCredentials[existingCredIndex] = credentialData;
            } else {
                existingCredentials.push(credentialData);
            }

            await updateDoc(userRef, {
                webAuthnCredentials: existingCredentials
            });

            setHasRegisteredWebAuthn(true);
            localStorage.setItem(LAST_USER_KEY, userId);

            if (!autoRegister) {
                toast({
                    title: "Security key registered successfully",
                    description: `Fingerprint authentication enabled for ${window.location.hostname}`,
                    status: "success",
                    duration: 3000,
                    isClosable: true
                });
            }

            return true;
        } catch (error) {
            console.error("Error registering WebAuthn credential:", error);
            if (!autoRegister) {
                toast({
                    title: "Registration Error",
                    description: "Failed to register security key. Please try again.",
                    status: "error",
                    duration: 5000,
                    isClosable: true
                });
            }
            return false;
        }
    };

    // Modified Google sign-in to handle automatic WebAuthn registration
    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            const uid = user.uid;

            localStorage.setItem(LAST_USER_KEY, uid);

            const userDocRef = doc(firestore, "users", uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();

                if (userData.role) {
                    const firebaseToken = await user.getIdToken();

                    // Handle authentication tokens
                    const { data: mainData, status: mainStatus } =
                        await authService.mainLogin(firebaseToken);
                    if (mainStatus === 200) {
                        await authService.storeTokens({
                            access: mainData.access,
                            refresh: mainData.refresh
                        });
                    }

                    const { data: sequelizerData, status: sequelizerStatus } =
                        await sequalizerAuth.axiosInstance.post('/nodeapp/api/authenticate', {
                            idToken: firebaseToken
                        });
                    if (sequelizerStatus === 200) {
                        await sequalizerAuth.storeAccessToken(sequelizerData.token);
                    }

                    // Check if WebAuthn is available and not registered for current environment
                    if (webAuthnAvailable) {
                        const hasExistingCredential = userData.webAuthnCredentials?.some(
                            cred => cred.deviceId === currentDeviceId &&
                                cred.hostname === window.location.hostname
                        );

                        if (!hasExistingCredential) {
                            const shouldRegister = window.confirm(
                                `Would you like to enable fingerprint authentication for ${window.location.hostname}?`
                            );

                            if (shouldRegister) {
                                await registerWebAuthnCredential(
                                    uid,
                                    user.email,
                                    user.displayName
                                );
                            }
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
            let errorMessage = error.message;

            if (error.code === 'auth/popup-closed-by-user') {
                errorMessage = "Sign-in cancelled. Please try again.";
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = "Network error. Please check your connection.";
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
                bg={useColorModeValue('white', 'gray.800')}
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
                    <Heading as="h2" size="2xl" textAlign="center">
                        ALLTECH SHOP 2
                    </Heading>

                    {error && (
                        <Alert status="error" borderRadius="md">
                            <AlertIcon />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {webAuthnAvailable && hasRegisteredWebAuthn ? (
                        <>
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
                            <Button
                                variant="link"
                                size="sm"
                                onClick={() => {
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
                        </>
                    ) : (
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
                                <Text fontSize="sm" textAlign="center">
                                    Sign in with Google to enable fingerprint authentication for this device
                                </Text>
                            )}
                        </>
                    )}
                </VStack>
            </MotionBox>
        </Flex>
    );
};

export default SignIn;