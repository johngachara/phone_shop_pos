import { useState } from "react";
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
    Divider
} from "@chakra-ui/react";
import { FcGoogle } from "react-icons/fc";
import SequelizerAuth from "../components/axios/sequalizerAuth.js"
import { motion } from "framer-motion";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import authService from "components/axios/authService.js";
import { auth } from "../components/firebase/firebase.js";
import {apiService} from "../apiService.js";

const MotionBox = motion.create(Box);

const SignIn = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const toast = useToast();
    const provider = new GoogleAuthProvider();

    // Handle Google Sign-in
    const handleGoogleSignIn = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            const idToken = await user.getIdToken();

            // Authenticate with backend
            const { data: authData,status:authStatus } = await authService.mainLogin(idToken);
            const { data : sequelData,status:sequelStatus } = await apiService.sequelizer_login(idToken)
            await SequelizerAuth.storeAccessToken(sequelData.token)
            await authService.storeTokens(authData);
            navigate("/");
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
                                    <Text
                                        color={useColorModeValue('gray.600', 'gray.400')}
                                        fontSize="sm"
                                    >
                                        Signing you in...
                                    </Text>
                                </VStack>
                            ) : (
                                <Button
                                    leftIcon={<Icon as={FcGoogle} boxSize={5} />}
                                    size="lg"
                                    w="full"
                                    h="50px"
                                    colorScheme="blue"
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