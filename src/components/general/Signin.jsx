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
    Alert,
    AlertIcon,
    AlertDescription,
    useToast,
    Spinner,
    Icon,
    Card,
    CardBody,
    Divider, Stack
} from "@chakra-ui/react";
import { FcGoogle } from "react-icons/fc";
import SequelizerAuth from "../axios/sequalizerAuth.js"
import { motion } from "framer-motion";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
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

const MotionBox = motion.create(Box);
const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_ALLTECH_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

const SignIn = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const toast = useToast();
    const provider = new GoogleAuthProvider();
    const [isCheckingPasskey, setIsCheckingPasskey] = useState(true);
    const [hasPasskey, setHasPasskey] = useState(false);
    const [webAuthnSupported, setWebAuthnSupported] = useState(false);

    useEffect(() => {
        checkWebAuthnSupport();
    }, []);

    const checkWebAuthnSupport = async () => {
        // Check if browser supports WebAuthn
        const supported = browserSupportsWebAuthn();
        // Check if platform authenticator is available
        const platformAuthAvailable = await platformAuthenticatorIsAvailable();
        setWebAuthnSupported(supported && platformAuthAvailable);
    };
    const handlePasskeyVerification = async () => {
        try {
            setIsLoading(true);

            // Get current user and their ID token
            const currentUser = auth.currentUser;
            if (!currentUser) {
                throw new Error('No user credentials found');
            }
            const idToken = await currentUser.getIdToken();

            // Get authentication options
            const optionsResponse = await axiosInstance.post('/sequel/api/generate-auth-options',
                { idToken }
            );

            const options = optionsResponse.data;

            // Start the authentication process
            const authResp = await startAuthentication({optionsJSON : options });

            // Send verification request
            const verificationResp = await axiosInstance.post('/sequel/api/verify-authentication',
                {
                    idToken,
                    id: authResp.id,
                    rawId: authResp.rawId,
                    response: authResp.response,
                    type: authResp.type,
                    clientExtensionResults: authResp.clientExtensionResults
                }
            );

            if (verificationResp.data.success) {
                toast({
                    status: "success",
                    description: "Successfully signed in with passkey",
                });

                navigate("/",{
                    replace : true
                });
            } else {
                toast({
                    status: "error",
                    description: "Unable to verify your identity",
                })
            }
        } catch (error) {
            console.error('Passkey verification failed:', error);
            toast({
                status: "error",
                description: error.message || "Passkey verification failed",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleWebauthnRegistration = async (idToken) => {
        // Only proceed with registration if WebAuthn is supported and user doesn't have a passkey
        if (!webAuthnSupported) {
            toast({
                status: "error",
                description: "Your browser doesn't support passkeys",
            });
            return;
        }
        try{
            const response = await axiosInstance.post('/sequel/api/generate-registration-options', {idToken})
            const options = response.data
            let attResp;
            // Pass the options to the authenticator and wait for a response
            attResp = await startRegistration({optionsJSON : options ,useAutoRegister : true});
            const verificationResp = await axiosInstance.post('/sequel/api/verify-registration',{ idToken , response : attResp });

            if (verificationResp && verificationResp.data.success) {
                toast({
                    status: "success",
                    description: verificationResp.data.message,
                })
            } else {
               toast({
                   status: "error",
                   description: "An error occured",
               })
            }

            }catch(error){
            // Some basic error handling
            if (error.name === 'InvalidStateError') {
                toast({
                    status: "error",
                    description: 'Error: Authenticator was probably already registered by user'
                })
            } else {
                toast({
                    status: "error",
                    description: error.message,
                })
            }

            throw error;
        }
        }
    // Handle Google Sign-in
    const handleGoogleSignIn = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            const idToken = await user.getIdToken();

            // Authenticate with backend
            const { data: authData, status: authStatus } = await authService.mainLogin(idToken);
            const { data: sequelData, status: sequelStatus } = await apiService.sequelizer_login(idToken);
            await SequelizerAuth.storeAccessToken(sequelData.token);
            await authService.storeTokens(authData);

            // Check for existing passkey
            const currentUser = auth.currentUser;
            const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
            const hasExistingPasskey = userDoc.exists() &&
                userDoc.data().credentials &&
                userDoc.data().credentials.length > 0;

            // Only register if no passkey exists
            if (!hasExistingPasskey) {
                await handleWebauthnRegistration(idToken);
            }

            if(authStatus === 200 && sequelStatus === 200){
                await handlePasskeyVerification()
            }
        } catch (error) {
            console.error("Google sign-in failed:", error);
            setError('Unable to login');
        } finally {
            setIsLoading(false);
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
            <MotionBox
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
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

                            {/* Error Alert */}
                            {error && (
                                <Alert
                                    status="error"
                                    borderRadius="xl"
                                    bg={useColorModeValue('red.50', 'red.900')}
                                >
                                    <AlertIcon />
                                    <AlertDescription fontSize="sm">
                                        {error}
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Loading State */}
                            {isLoading ? (
                                <VStack py={4} spacing={4}>
                                    <Spinner
                                        size="xl"
                                        thickness="3px"
                                        speed="0.65s"
                                        color={useColorModeValue('blue.500', 'blue.300')}
                                    />
                                    <Text color={useColorModeValue('gray.600', 'gray.400')} fontSize="sm">
                                        {isCheckingPasskey ? 'Checking for passkeys...' : 'Signing you in...'}
                                    </Text>
                                </VStack>
                            ) : (
                                <Stack spacing={4} w="full">
                                    {hasPasskey && (
                                        <Button
                                            leftIcon={<Icon as={FiKey} boxSize={5} />}
                                            size="lg"
                                            w="full"
                                            h="50px"
                                            colorScheme="teal"
                                            onClick={handlePasskeyVerification}
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
            </MotionBox>
        </Flex>
    );
};

export default SignIn;