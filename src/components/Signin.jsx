import { useState, useEffect, useCallback } from "react";
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
    useToast,
    Spinner
} from "@chakra-ui/react";
import { FcGoogle } from "react-icons/fc";
import { motion } from "framer-motion";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../components/firebase/firebase.js";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { firestore } from "../components/firebase/firebase.js";
import authService from "components/axios/authService.js";
import sequalizerAuth from "components/axios/sequalizerAuth.js";

const MotionBox = motion(Box);
const LAST_USER_KEY = "last_user_id";
const WEBAUTHN_PREFERENCE_KEY = "webauthn_disabled";

// Enhanced device detection with feature detection
const getDeviceInfo = () => {
    const deviceInfo = {
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        hasTouchscreen: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        hasStrongCPU: navigator.hardwareConcurrency > 2,
        hasSecureContext: window.isSecureContext,
        hasPlatformAuth: false, // Will be updated later
        hasWebAuthnAPI: !!window.PublicKeyCredential,
        hasStrongSecurity: false // Will be updated based on security checks
    };

    return deviceInfo;
};

// ArrayBuffer conversion utilities
const bufferUtils = {
    arrayBufferToBase64: (buffer) => {
        return btoa(String.fromCharCode(...new Uint8Array(buffer)));
    },

    base64ToArrayBuffer: (base64) => {
        const binaryString = atob(base64);
        return Uint8Array.from(binaryString, char => char.charCodeAt(0)).buffer;
    }
};

// Enhanced device identification
const generateDeviceId = () => {
    const deviceInfo = {
        ...getDeviceInfo(),
        screen: {
            width: window.screen.width,
            height: window.screen.height,
            pixelRatio: window.devicePixelRatio
        },
        language: navigator.language,
        platform: navigator.platform,
        vendor: navigator.vendor,
        userAgent: navigator.userAgent
    };

    return btoa(encodeURIComponent(JSON.stringify(deviceInfo))).replace(/[/+=]/g, '');
};

const SignIn = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [webAuthnSupport, setWebAuthnSupport] = useState({
        isAvailable: false,
        error: null,
        details: null
    });
    const [hasRegisteredWebAuthn, setHasRegisteredWebAuthn] = useState(false);
    const [error, setError] = useState(null);
    const [deviceInfo] = useState(getDeviceInfo());
    const [currentDeviceId] = useState(generateDeviceId());

    const navigate = useNavigate();
    const toast = useToast();
    const provider = new GoogleAuthProvider();

    // Comprehensive WebAuthn support check
    const checkWebAuthnSupport = useCallback(async () => {
        if (localStorage.getItem(WEBAUTHN_PREFERENCE_KEY) === 'true') {
            setWebAuthnSupport({
                isAvailable: false,
                error: 'WebAuthn disabled by user preference',
                details: null
            });
            return;
        }

        try {
            // Check for basic requirements
            if (!window.isSecureContext) {
                throw new Error('Page is not served over HTTPS');
            }

            if (!window.PublicKeyCredential) {
                throw new Error('WebAuthn API is not available');
            }

            // Check platform authenticator
            const platformAuthAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();

            // Check conditional UI
            const conditionalUIAvailable = 'conditional' in navigator.credentials ?
                await PublicKeyCredential.isConditionalMediationAvailable() : false;

            // Additional security checks
            const securityChecks = {
                hasStrongCPU: navigator.hardwareConcurrency > 2,
                hasSecureContext: window.isSecureContext,
                hasPlatformAuth: platformAuthAvailable,
                hasConditionalUI: conditionalUIAvailable
            };

            // Device capability assessment
            const deviceCapabilities = {
                ...deviceInfo,
                ...securityChecks
            };

            setWebAuthnSupport({
                isAvailable: platformAuthAvailable || conditionalUIAvailable,
                error: null,
                details: deviceCapabilities
            });

            // Check for existing credentials
            const lastUserId = localStorage.getItem(LAST_USER_KEY);
            if (lastUserId) {
                const userDoc = await getDoc(doc(firestore, "users", lastUserId));
                if (userDoc.exists()) {
                    const credentials = userDoc.data().webAuthnCredentials || [];
                    const hasCredential = credentials.some(
                        cred => cred.deviceId === currentDeviceId &&
                            cred.hostname === window.location.hostname
                    );
                    setHasRegisteredWebAuthn(hasCredential);
                }
            }
        } catch (err) {
            console.error("WebAuthn support check failed:", err);
            setWebAuthnSupport({
                isAvailable: false,
                error: err.message,
                details: {
                    ...deviceInfo,
                    errorType: err.name,
                    errorMessage: err.message
                }
            });
        }
    }, [currentDeviceId, deviceInfo]);

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                await checkWebAuthnSupport();
            } finally {
                setIsInitializing(false);
            }
        };

        initializeAuth();
    }, [checkWebAuthnSupport]);

    // Enhanced WebAuthn credential verification
    const verifyWebAuthnCredential = async () => {
        try {
            const lastUserId = localStorage.getItem(LAST_USER_KEY);
            if (!lastUserId) {
                throw new Error("No registered credentials found");
            }

            const userDoc = await getDoc(doc(firestore, "users", lastUserId));
            if (!userDoc.exists()) {
                throw new Error("User not found");
            }

            const storedCredentials = userDoc.data().webAuthnCredentials || [];
            const validCredentials = storedCredentials.filter(
                cred => cred.hostname === window.location.hostname
            );

            if (!validCredentials.length) {
                throw new Error("No valid credentials found for this device");
            }

            const challengeBytes = crypto.getRandomValues(new Uint8Array(32));

            const assertionOptions = {
                challenge: challengeBytes,
                allowCredentials: validCredentials.map(cred => ({
                    id: bufferUtils.base64ToArrayBuffer(cred.rawId),
                    type: 'public-key',
                    transports: cred.transports || ['internal']
                })),
                timeout: 60000,
                userVerification: "preferred",
                rpId: window.location.hostname
            };

            const credential = await navigator.credentials.get({
                publicKey: assertionOptions
            });

            if (!credential) {
                throw new Error("No credential received");
            }

            // Update last used timestamp
            const usedCredential = validCredentials.find(
                cred => cred.id === credential.id
            );

            if (usedCredential) {
                const updatedCredentials = storedCredentials.map(cred =>
                    cred.id === usedCredential.id
                        ? { ...cred, lastUsed: new Date().toISOString() }
                        : cred
                );

                await updateDoc(doc(firestore, "users", lastUserId), {
                    webAuthnCredentials: updatedCredentials
                });
            }

            return userDoc.data();
        } catch (error) {
            console.error("WebAuthn verification failed:", error);
            throw new Error(error.message || "Authentication failed");
        }
    };

    // Enhanced registration with better error handling
    const registerWebAuthnCredential = async (userId, userEmail, userName, autoRegister = false) => {
        try {
            if (!webAuthnSupport.isAvailable) {
                throw new Error("WebAuthn is not available on this device");
            }

            const challengeBytes = crypto.getRandomValues(new Uint8Array(32));

            const authenticatorSelection = {
                authenticatorAttachment: deviceInfo.isMobile ? "platform" : "cross-platform",
                userVerification: "preferred",
                requireResidentKey: false,
                residentKey: "preferred"
            };

            const createOptions = {
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
                    { type: "public-key", alg: -7 },  // ES256
                    { type: "public-key", alg: -257 } // RS256
                ],
                timeout: 60000,
                attestation: "none",
                authenticatorSelection,
                extensions: {
                    credProps: true,
                    largeBlob: { support: "preferred" }
                }
            };

            const credential = await navigator.credentials.create({
                publicKey: createOptions
            });

            if (!credential) {
                throw new Error("No credential received");
            }

            const credentialData = {
                id: credential.id,
                rawId: bufferUtils.arrayBufferToBase64(credential.rawId),
                type: credential.type,
                attestationObject: bufferUtils.arrayBufferToBase64(credential.response.attestationObject),
                clientDataJSON: bufferUtils.arrayBufferToBase64(credential.response.clientDataJSON),
                transports: credential.response.getTransports?.() || [],
                deviceId: currentDeviceId,
                deviceInfo: {
                    ...deviceInfo,
                    registrationTime: new Date().toISOString()
                },
                hostname: window.location.hostname,
                dateAdded: new Date().toISOString()
            };

            const userRef = doc(firestore, "users", userId);
            const userDoc = await getDoc(userRef);
            const existingCredentials = userDoc.exists()
                ? (userDoc.data().webAuthnCredentials || [])
                : [];

            const credentialIndex = existingCredentials.findIndex(
                cred => cred.deviceId === currentDeviceId &&
                    cred.hostname === window.location.hostname
            );

            if (credentialIndex !== -1) {
                existingCredentials[credentialIndex] = credentialData;
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
                    description: `${deviceInfo.isMobile ? 'Biometric' : 'Security key'} authentication enabled`,
                    status: "success",
                    duration: 3000,
                    isClosable: true
                });
            }

            return true;
        } catch (error) {
            console.error("WebAuthn registration failed:", error);

            if (!autoRegister) {
                toast({
                    title: "Registration Error",
                    description: error.message || "Failed to register security key",
                    status: "error",
                    duration: 5000,
                    isClosable: true
                });
            }

            return false;
        }
    };

    // Handle WebAuthn authentication
    const handleWebAuthnSignIn = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const userData = await verifyWebAuthnCredential();

            if (!userData.role) {
                throw new Error("Insufficient permissions");
            }

            const user = auth.currentUser;
            if (!user) {
                throw new Error("Firebase session expired");
            }

            const firebaseToken = await user.getIdToken();

            // Handle main service authentication
            const { data: mainData, status: mainStatus } =
                await authService.mainLogin(firebaseToken);

            if (mainStatus === 200) {
                await authService.storeTokens({
                    access: mainData.access,
                    refresh: mainData.refresh
                });
            }

            // Handle sequelizer authentication
            const { data: sequelizerData, status: sequelizerStatus } =
                await sequalizerAuth.axiosInstance.post('/nodeapp/api/authenticate', {
                    idToken: firebaseToken
                });

            if (sequelizerStatus === 200) {
                await sequalizerAuth.storeAccessToken(sequelizerData.token);
            }

            navigate("/");
        } catch (error) {
            console.error("WebAuthn sign-in failed:", error);
            setError(error.message);

            // Handle specific error cases
            if (error.message.includes("Firebase session expired")) {
                localStorage.removeItem(LAST_USER_KEY);
                setHasRegisteredWebAuthn(false);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Google Sign-in
    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            const uid = user.uid;

            localStorage.setItem(LAST_USER_KEY, uid);

            const userDoc = await getDoc(doc(firestore, "users", uid));

            if (!userDoc.exists()) {
                throw new Error("Account not registered in system");
            }

            const userData = userDoc.data();

            if (!userData.role) {
                throw new Error("Insufficient permissions");
            }

            const firebaseToken = await user.getIdToken();

            // Handle main service authentication
            const { data: mainData, status: mainStatus } =
                await authService.mainLogin(firebaseToken);

            if (mainStatus === 200) {
                await authService.storeTokens({
                    access: mainData.access,
                    refresh: mainData.refresh
                });
            }

            // Handle sequelizer authentication
            const { data: sequelizerData, status: sequelizerStatus } =
                await sequalizerAuth.axiosInstance.post('/nodeapp/api/authenticate', {
                    idToken: firebaseToken
                });
            if (sequelizerStatus === 200) {
                await sequalizerAuth.storeAccessToken(sequelizerData.token);
            }

            // Handle WebAuthn registration prompt
            if (webAuthnSupport.isAvailable && !hasRegisteredWebAuthn) {
                const shouldSetupWebAuthn = window.confirm(
                    `Would you like to enable ${deviceInfo.isMobile ? 'biometric' : 'security key'} authentication for faster sign-in next time?`
                );

                if (shouldSetupWebAuthn) {
                    const registered = await registerWebAuthnCredential(
                        uid,
                        user.email,
                        user.displayName
                    );

                    if (!registered) {
                        toast({
                            title: "Notice",
                            description: "You can set up passwordless authentication later in settings",
                            status: "info",
                            duration: 5000,
                            isClosable: true
                        });
                    }
                }
            }

            navigate("/");
        } catch (error) {
            console.error("Google sign-in failed:", error);
            setIsLoading(false);

            let errorMessage = "Sign-in failed";

            // Handle specific error cases
            switch (error.code) {
                case 'auth/popup-closed-by-user':
                    errorMessage = "Sign-in cancelled";
                    break;
                case 'auth/network-request-failed':
                    errorMessage = "Network error - please check your connection";
                    break;
                case 'auth/user-disabled':
                    errorMessage = "This account has been disabled";
                    break;
                case 'auth/popup-blocked':
                    errorMessage = "Pop-up blocked - please enable pop-ups for this site";
                    break;
                default:
                    errorMessage = error.message || "An unexpected error occurred";
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

    // Handle WebAuthn preference toggle
    const handleDisableWebAuthn = () => {
        localStorage.setItem(WEBAUTHN_PREFERENCE_KEY, 'true');
        localStorage.removeItem(LAST_USER_KEY);
        setHasRegisteredWebAuthn(false);
        setWebAuthnSupport(prev => ({
            ...prev,
            isAvailable: false,
            error: 'WebAuthn disabled by user preference'
        }));
        toast({
            title: "Authentication method changed",
            description: "Passwordless authentication disabled",
            status: "info",
            duration: 3000,
            isClosable: true
        });
    };

    // Re-enable WebAuthn
    const handleReEnableWebAuthn = async () => {
        localStorage.removeItem(WEBAUTHN_PREFERENCE_KEY);
        await checkWebAuthnSupport();
        toast({
            title: "Passwordless authentication",
            description: "You can now set up passwordless sign-in",
            status: "info",
            duration: 3000,
            isClosable: true
        });
    };

    if (isInitializing) {
        return (
            <Flex justify="center" align="center" minH="100vh">
                <VStack spacing={4}>
                    <Spinner size="xl" color="blue.500" />
                    <Text>Initializing authentication...</Text>
                </VStack>
            </Flex>
        );
    }

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
                whileHover={{ scale: 1.02 }}
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

                    {webAuthnSupport.error && !hasRegisteredWebAuthn && (
                        <Alert status="info" borderRadius="md">
                            <AlertIcon />
                            <AlertDescription>
                                {webAuthnSupport.error === 'WebAuthn disabled by user preference' ? (
                                    <VStack align="start" spacing={2}>
                                        <Text>Passwordless sign-in is disabled</Text>
                                        <Button
                                            size="sm"
                                            colorScheme="blue"
                                            variant="link"
                                            onClick={handleReEnableWebAuthn}
                                        >
                                            Enable passwordless sign-in
                                        </Button>
                                    </VStack>
                                ) : (
                                    `Passwordless sign-in unavailable: ${webAuthnSupport.error}`
                                )}
                            </AlertDescription>
                        </Alert>
                    )}

                    {webAuthnSupport.isAvailable && hasRegisteredWebAuthn ? (
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
                                {deviceInfo.isMobile
                                    ? "Sign in with Biometrics"
                                    : "Sign in with Security Key"}
                            </Button>
                            <Button
                                variant="link"
                                size="sm"
                                onClick={handleDisableWebAuthn}
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
                            {webAuthnSupport.isAvailable && (
                                <Text fontSize="sm" color="gray.500" textAlign="center">
                                    {deviceInfo.isMobile
                                        ? "Sign in with Google to enable biometric authentication"
                                        : "Sign in with Google to enable security key authentication"}
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