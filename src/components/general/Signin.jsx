import {useEffect, useState} from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Flex,
    Heading,
    Button,
    useColorModeValue,
    VStack,
    Text,
    useToast,
    Spinner,
    Icon,
    Card,
    CardBody,
    Divider, Stack
} from "@chakra-ui/react";
import { FcGoogle } from "react-icons/fc";
import { FiKey } from "react-icons/fi";
import SequelizerAuth from "../axios/sequalizerAuth.js";
import { GoogleAuthProvider, signInWithPopup, getAuth, onAuthStateChanged, signInWithCustomToken } from "firebase/auth";
import authService from "components/axios/authService.js";
import { auth, firestore } from "../firebase/firebase.js";
import {apiService} from "../../apiService.js";
import {
    browserSupportsWebAuthn,
    platformAuthenticatorIsAvailable,
    startAuthentication,
    startRegistration
} from "@simplewebauthn/browser";
import axios from "axios";
import {doc, getDoc} from "firebase/firestore";

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_ALLTECH_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

const SignIn = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const navigate = useNavigate();
    const toast = useToast();
    const provider = new GoogleAuthProvider();
    const [webAuthnSupported, setWebAuthnSupported] = useState(false);
    const [showSignInOptions, setShowSignInOptions] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);

    // Check WebAuthn support and existing user session on component mount
    useEffect(() => {
        const checkWebAuthnSupport = async () => {
            try {
                const supported = browserSupportsWebAuthn();
                const platformAuthAvailable = await platformAuthenticatorIsAvailable();
                setWebAuthnSupported(supported && platformAuthAvailable);
            } catch (error) {
                console.error("Error checking WebAuthn support:", error);
                setWebAuthnSupported(false);
            }
        };

        const checkExistingSession = async () => {
            setCheckingAuth(true);
            const unsubscribe = onAuthStateChanged(auth, async (user) => {
                if (user) {
                    // User is already signed in, redirect to home
                    navigate("/", { replace: true });
                } else {
                    // No existing session, show sign-in options
                    setShowSignInOptions(true);
                }
                setCheckingAuth(false);
                setIsLoading(false);
            });

            return unsubscribe;
        };

        const init = async () => {
            await checkWebAuthnSupport();
            const unsubscribe = await checkExistingSession();
            return unsubscribe;
        };

        const unsubscribe = init();

        // Cleanup subscription on unmount
        return () => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        };
    }, [navigate]);

    // NEW FUNCTION: Direct Passkey Authentication without prior Google login
    const handleDirectPasskeyAuth = async () => {
        try {
            setIsAuthenticating(true);

            // 1. Get authentication options without requiring an ID token
            const optionsResponse = await axiosInstance.post('/sequel/api/generate-auth-options-public');
            const options = optionsResponse.data;

            // 2. Start the authentication process
            const authResp = await startAuthentication({optionsJSON: options});

            // 3. Send verification request - this will identify the user from the credential ID
            const verificationResp = await axiosInstance.post('/sequel/api/verify-auth-options-public', {
                id: authResp.id,
                rawId: authResp.rawId,
                response: authResp.response,
                type: authResp.type,
                clientExtensionResults: authResp.clientExtensionResults
            });

            if (verificationResp.data.success) {
                // 4. The server identifies the user and returns a Firebase custom token
                const { firebaseToken, userInfo } = verificationResp.data;

                // 5. Sign in to Firebase with the custom token
                await signInWithCustomToken(auth, firebaseToken);

                // 6. Get a fresh ID token to authenticate with your backends
                const freshUser = auth.currentUser;
                const idToken = await freshUser.getIdToken();

                // 7. Authenticate with both backend services
                const { data: authData, status: authStatus } = await authService.mainLogin(idToken);
                const { data: sequelData, status: sequelStatus } = await apiService.sequelizer_login(idToken);

                if (authStatus === 200 && sequelStatus === 200) {
                    await SequelizerAuth.storeAccessToken(sequelData.token);
                    await authService.storeTokens(authData);

                    toast({
                        status: "success",
                        description: "Successfully signed in with passkey",
                    });

                    navigate("/", {
                        replace: true
                    });
                } else {
                    throw new Error('Failed to authenticate with backend services');
                }
            } else {
                toast({
                    status: "error",
                    description: "Unable to verify your identity",
                });
            }
        } catch (error) {
            console.error('Passkey authentication failed:', error);
            toast({
                status: "error",
                description: error.message || "Passkey authentication failed",
            });
        } finally {
            setIsAuthenticating(false);
        }
    };

    // Handle Google Sign-in (mostly unchanged)
    const handleGoogleSignIn = async () => {
        try {
            setIsLoading(true);

            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            const idToken = await user.getIdToken();

            // Authenticate with backend
            const { data: authData, status: authStatus } = await authService.mainLogin(idToken);
            const { data: sequelData, status: sequelStatus } = await apiService.sequelizer_login(idToken);

            if (authStatus === 200 && sequelStatus === 200) {
                await SequelizerAuth.storeAccessToken(sequelData.token);
                await authService.storeTokens(authData);
            } else {
                throw new Error('Failed to authenticate with backend services');
            }

            // Check for existing passkey
            const userDoc = await getDoc(doc(firestore, 'users', user.uid));
            const hasExistingPasskey = userDoc.exists() &&
                userDoc.data().credentials &&
                userDoc.data().credentials.length > 0;

            // Register passkey if supported and none exists
            if (webAuthnSupported && !hasExistingPasskey) {
                await handleWebauthnRegistration(idToken);
            } else {
                // User is authenticated, redirect to home
                navigate("/", { replace: true });
            }
        } catch (error) {
            console.error("Google sign-in failed:", error);
            await auth.signOut();
            toast({
                status: "error",
                description: error.message || 'Unable to login',
            });
        } finally {
            setIsLoading(false);
        }
    };

    // WebAuthn registration (stays the same)
    const handleWebauthnRegistration = async (idToken) => {
        // Only proceed with registration if WebAuthn is supported
        if (!webAuthnSupported) {
            toast({
                status: "error",
                description: "Your browser doesn't support passkeys",
            });
            return;
        }

        try {
            const response = await axiosInstance.post('/sequel/api/generate-registration-options', {idToken});
            const options = response.data;

            // Pass the options to the authenticator and wait for a response
            const attResp = await startRegistration({optionsJSON: options, useAutoRegister: true});
            const verificationResp = await axiosInstance.post('/sequel/api/verify-registration', {
                idToken,
                response: attResp
            });

            if (verificationResp && verificationResp.data.success) {
                toast({
                    status: "success",
                    description: verificationResp.data.message,
                });

                // Successfully registered, redirect to home
                navigate("/", { replace: true });
            } else {
                toast({
                    status: "error",
                    description: "An error occurred registering your passkey",
                });
            }
        } catch (error) {
            // Some basic error handling
            if (error.name === 'InvalidStateError') {
                toast({
                    status: "error",
                    description: 'Error: Authenticator was probably already registered by user'
                });
            } else {
                toast({
                    status: "error",
                    description: error.message || "Failed to register passkey",
                });
            }
            throw error;
        }
    };

    return (
        <Flex
            minH="100vh"
            align="center"
            justify="center"
            bg={useColorModeValue(
                'linear-gradient(135deg, #e3ffe7 0%, #d9e7ff 100%)',
                'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)'
            )}
            p={4}
        >
            <Box
                w="full"
                maxW="400px"
            >
                <Card
                    bg={useColorModeValue('white', 'gray.800')}
                    borderRadius="2xl"
                    boxShadow="xl"
                    overflow="hidden"
                    border="1px solid"
                    borderColor={useColorModeValue('gray.100', 'gray.700')}
                >
                    <CardBody p={8}>
                        <VStack spacing={6}>
                            {/* Header */}
                            <VStack spacing={2}>
                                <Heading
                                    size="xl"
                                    bgGradient="linear(to-r, blue.400, teal.400)"
                                    bgClip="text"
                                    letterSpacing="tight"
                                >
                                    Welcome Back
                                </Heading>
                                <Text
                                    color={useColorModeValue('gray.600', 'gray.400')}
                                    textAlign="center"
                                    fontSize="md"
                                >
                                    Sign in to access the system
                                </Text>
                            </VStack>
                            <Divider />

                            {/* Loading State */}
                            {isLoading || isAuthenticating || checkingAuth ? (
                                <VStack py={4} spacing={4}>
                                    <Spinner
                                        size="xl"
                                        thickness="3px"
                                        speed="0.65s"
                                        color={useColorModeValue('blue.500', 'blue.300')}
                                    />
                                    <Text color={useColorModeValue('gray.600', 'gray.400')} fontSize="sm">
                                        {checkingAuth ? 'Checking your account...' :
                                            isAuthenticating ? 'Verifying your identity...' :
                                                'Loading sign-in options...'}
                                    </Text>
                                </VStack>
                            ) : showSignInOptions && (
                                <Stack spacing={4} w="full">
                                    {/* Always show both options with passkey first if supported */}
                                    {webAuthnSupported && (
                                        <Button
                                            leftIcon={<Icon as={FiKey} boxSize={5} />}
                                            size="lg"
                                            w="full"
                                            h="50px"
                                            colorScheme="teal"
                                            onClick={handleDirectPasskeyAuth}
                                            _hover={{
                                                transform: 'translateY(-2px)',
                                                shadow: 'lg',
                                            }}
                                            transition="all 0.2s"
                                        >
                                            Sign in with Passkey
                                        </Button>
                                    )}

                                    <Button
                                        leftIcon={<Icon as={FcGoogle} boxSize={5} />}
                                        size="lg"
                                        w="full"
                                        h="50px"
                                        onClick={handleGoogleSignIn}
                                        _hover={{
                                            transform: 'translateY(-2px)',
                                            shadow: 'lg',
                                        }}
                                        transition="all 0.2s"
                                        bg={useColorModeValue('white', 'gray.700')}
                                        color={useColorModeValue('gray.800', 'white')}
                                        border="1px solid"
                                        borderColor={useColorModeValue('gray.200', 'gray.600')}
                                    >
                                        Continue with Google
                                    </Button>
                                </Stack>
                            )}

                            {/* Footer Text */}
                            <Text
                                fontSize="xs"
                                color={useColorModeValue('gray.500', 'gray.400')}
                                textAlign="center"
                            >
                                By signing in, you agree to our Terms of Service and Privacy Policy
                            </Text>
                        </VStack>
                    </CardBody>
                </Card>
            </Box>
        </Flex>
    );
};

export default SignIn;