import { useEffect, useState } from "react";
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
    Divider,
    Input,
    FormControl,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    InputGroup,
    InputRightElement,
    IconButton,
    Step,
    StepIcon,
    StepIndicator,
    StepNumber,
    StepSeparator,
    StepStatus,
    StepTitle,
    Stepper,
    Radio,
    RadioGroup,
} from "@chakra-ui/react";
import { FcGoogle } from "react-icons/fc";
import { FiKey, FiMail, FiArrowRight, FiX, FiShield } from "react-icons/fi";
import SequelizerAuth from "../axios/sequalizerAuth.js";
import {
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged,
    sendSignInLinkToEmail,
    isSignInWithEmailLink,
    signInWithEmailLink,
} from "firebase/auth";
import authService from "components/axios/authService.js";
import { auth, firestore } from "../firebase/firebase.js";
import { apiService } from "../../apiService.js";
import {
    browserSupportsWebAuthn,
    platformAuthenticatorIsAvailable,
    startAuthentication,
    startRegistration,
} from "@simplewebauthn/browser";
import axios from "axios";
import { doc, getDoc } from "firebase/firestore";

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_ALLTECH_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

const SignIn = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const navigate = useNavigate();
    const toast = useToast();
    const provider = new GoogleAuthProvider();
    const [hasPasskey, setHasPasskey] = useState(false);
    const [webAuthnSupported, setWebAuthnSupported] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(false);

    // Authentication flow state
    const [authStep, setAuthStep] = useState(0); // 0: Google Sign In, 1: 2FA
    const [secondFactorMethod, setSecondFactorMethod] = useState("passkey"); // passkey, email, phone
    const [waitingForPasskey, setWaitingForPasskey] = useState(false);

    // Email 2FA
    const [email, setEmail] = useState("");
    const [emailSent, setEmailSent] = useState(false);
    const [emailSending, setEmailSending] = useState(false);



    // Current user state after first factor
    const [currentUser, setCurrentUser] = useState(null);
    const [currentIdToken, setCurrentIdToken] = useState(null);

    // Check WebAuthn support on component mount
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
                    try {
                        // User is already signed in, check for passkey
                        const userDoc = await getDoc(doc(firestore, "users", user.uid));
                        const userHasPasskey =
                            userDoc.exists() &&
                            userDoc.data().credentials &&
                            userDoc.data().credentials.length > 0;
                        setHasPasskey(userHasPasskey);
                    } catch (error) {
                        console.error("Error checking user session:", error);
                    }
                }
                setCheckingAuth(false);
                setIsLoading(false);
            });

            return unsubscribe;
        };

        // Check if the current URL contains an email sign-in link
        const checkEmailSignInLink = async () => {
            if (isSignInWithEmailLink(auth, window.location.href)) {
                let emailForSignIn = localStorage.getItem("emailForSignIn");

                if (!emailForSignIn) {
                    // If email is not found in local storage, prompt user
                    emailForSignIn = window.prompt("Please provide your email for confirmation");
                }

                try {
                    setIsAuthenticating(true);
                    const result = await signInWithEmailLink(auth, emailForSignIn, window.location.href);
                    const user = result.user;
                    const idToken = await user.getIdToken();

                    // Clear the URL and email from localStorage
                    window.history.replaceState({}, document.title, window.location.pathname);
                    localStorage.removeItem("emailForSignIn");

                    // Complete authentication
                    await completeAuthentication(user, idToken);
                } catch (error) {
                    console.error("Email link sign-in failed:", error);
                    toast({
                        status: "error",
                        description: error.message || "Email link sign-in failed",
                    });
                } finally {
                    setIsAuthenticating(false);
                }
            }
        };

        const init = async () => {
            await checkWebAuthnSupport();
            await checkEmailSignInLink();
            const unsubscribe = await checkExistingSession();
            return unsubscribe;
        };

        const unsubscribe = init();

        // Cleanup subscription on unmount
        return () => {
            if (typeof unsubscribe === "function") {
                unsubscribe();
            }
        };
    }, [navigate, toast]);

    // Complete the authentication with backend services
    const completeAuthentication = async (user, idToken) => {
        try {
            // Authenticate with backend
            const { data: authData, status: authStatus } = await authService.mainLogin(idToken);
            const { data: sequelData, status: sequelStatus } = await apiService.sequelizer_login(idToken);

            if (authStatus === 200 && sequelStatus === 200) {
                await SequelizerAuth.storeAccessToken(sequelData.token);
                await authService.storeTokens(authData);

                toast({
                    status: "success",
                    description: "Successfully signed in",
                });

                navigate("/", {
                    replace: true,
                });
                return true;
            } else {
                throw new Error("Failed to authenticate with backend services");
            }
        } catch (error) {
            console.error("Authentication failed:", error);
            toast({
                status: "error",
                description: error.message || "Authentication failed",
            });
            return false;
        }
    };

    // Handle passkey verification
    const handlePasskeyVerification = async () => {
        try {
            setWaitingForPasskey(true);
            setIsAuthenticating(true);

            if (!currentUser) {
                throw new Error("No user credentials found");
            }

            // Get authentication options
            const optionsResponse = await axiosInstance.post("/sequel/api/generate-auth-options", { idToken: currentIdToken });
            const options = optionsResponse.data;

            // Start the authentication process
            const authResp = await startAuthentication({ optionsJSON: options });

            // Send verification request
            const verificationResp = await axiosInstance.post("/sequel/api/verify-authentication", {
                idToken: currentIdToken,
                id: authResp.id,
                rawId: authResp.rawId,
                response: authResp.response,
                type: authResp.type,
                clientExtensionResults: authResp.clientExtensionResults,
            });

            if (verificationResp.data.success) {
                await completeAuthentication(currentUser, currentIdToken);
            } else {
                toast({
                    status: "error",
                    description: "Unable to verify your identity with passkey",
                });
            }
        } catch (error) {
            console.error("Passkey verification failed:", error);
            toast({
                status: "error",
                description: error.message || "Passkey verification failed",
            });
        } finally {
            setIsAuthenticating(false);
            setWaitingForPasskey(false);
        }
    };

    // Register a new passkey for the user
    const handleWebauthnRegistration = async () => {
        if (!webAuthnSupported) {
            toast({
                status: "error",
                description: "Your browser doesn't support passkeys",
            });
            return;
        }

        try {
            setWaitingForPasskey(true);
            const response = await axiosInstance.post("/sequel/api/generate-registration-options", { idToken: currentIdToken });
            const options = response.data;

            // Pass the options to the authenticator and wait for a response
            const attResp = await startRegistration({ optionsJSON: options, useAutoRegister: true });
            const verificationResp = await axiosInstance.post("/sequel/api/verify-registration", {
                idToken: currentIdToken,
                response: attResp,
            });

            if (verificationResp && verificationResp.data.success) {
                setHasPasskey(true);
                toast({
                    status: "success",
                    description: verificationResp.data.message || "Passkey registered successfully",
                });
                // Now that we've registered a passkey, verify with it
                await handlePasskeyVerification();
            } else {
                toast({
                    status: "error",
                    description: "An error occurred registering your passkey",
                });
            }
        } catch (error) {
            if (error.name === "InvalidStateError") {
                toast({
                    status: "error",
                    description: "Error: Authenticator was probably already registered by user",
                });
            } else {
                toast({
                    status: "error",
                    description: error.message || "Failed to register passkey",
                });
            }
        } finally {
            setWaitingForPasskey(false);
        }
    };

    // Handle Google Sign-in (First factor)
    const handleGoogleSignIn = async () => {
        try {
            setIsAuthenticating(true);

            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            const idToken = await user.getIdToken();

            // Store user info for second factor
            setCurrentUser(user);
            setCurrentIdToken(idToken);

            // Check for existing passkey
            const userDoc = await getDoc(doc(firestore, "users", user.uid));
            if(!userDoc.exists()){
               toast({
                   status:'error',
                   message : 'You are not allowed to sign in'
               })
                return;
            }
            const hasExistingPasskey =
                userDoc.exists() && userDoc.data().credentials && userDoc.data().credentials.length > 0;

            setHasPasskey(hasExistingPasskey);

            // Move to second factor step
            setAuthStep(1);
            setSecondFactorMethod(hasExistingPasskey ? "passkey" : "email");

            toast({
                status: "success",
                description: "Please complete the two-factor authentication",
            });
        } catch (error) {
            console.error("Google sign-in failed:", error);
            await auth.signOut();
            toast({
                status: "error",
                description: error.message || "Unable to login with Google",
            });
        } finally {
            setIsAuthenticating(false);
        }
    };

    // Handle Email Link as second factor
    const handleEmailSignIn = async () => {
        if (!email.trim() || email !== currentUser.email) {
            toast({
                status: "error",
                description: "Please enter your email address",
            });
            return;
        }

        try {
            setEmailSending(true);

            // Configure action code settings
            const actionCodeSettings = {
                url: window.location.href,
                handleCodeInApp: true,
            };

            // Send sign-in link to email
            await sendSignInLinkToEmail(auth, email, actionCodeSettings);

            // Save the email locally to complete sign-in if the page is closed
            localStorage.setItem("emailForSignIn", email);

            setEmailSent(true);
            toast({
                status: "success",
                description: "Sign-in link sent to your email!",
            });
        } catch (error) {
            console.error("Email link sign-in failed:", error);
            toast({
                status: "error",
                description: error.message || "Failed to send sign-in link",
            });
        } finally {
            setEmailSending(false);
        }
    };

    // Skip second factor and continue
    const skipSecondFactor = async () => {
        if (!currentUser || !currentIdToken) {
            toast({
                status: "error",
                description: "Authentication error. Please try again.",
            });
            return;
        }

        try {
            setIsAuthenticating(true);
            await completeAuthentication(currentUser, currentIdToken);
        } catch (error) {
            console.error("Authentication failed:", error);
            toast({
                status: "error",
                description: error.message || "Authentication failed",
            });
        } finally {
            setIsAuthenticating(false);
        }
    };

    // Render based on current auth step
    const renderAuthStep = () => {
        if (authStep === 0) {
            // Step 1: Google Sign In (Primary method)
            return (
                <VStack spacing={4} w="full">
                    <Text fontWeight="medium" fontSize="lg" textAlign="center">
                        Sign in to your account
                    </Text>

                    <Button
                        leftIcon={<Icon as={FcGoogle} boxSize={5} />}
                        size="lg"
                        w="full"
                        h="50px"
                        onClick={handleGoogleSignIn}
                        _hover={{
                            transform: "translateY(-2px)",
                            shadow: "lg",
                        }}
                        transition="all 0.2s"
                        bg={useColorModeValue("white", "gray.700")}
                        color={useColorModeValue("gray.800", "white")}
                        border="1px solid"
                        borderColor={useColorModeValue("gray.200", "gray.600")}
                    >
                        Continue with Google
                    </Button>
                </VStack>
            );
        } else if (authStep === 1) {
            // Step 2: Second Factor Authentication
            return (
                <VStack spacing={4} w="full">
                    <Text fontWeight="medium" fontSize="lg" textAlign="center">
                        Two-Factor Authentication
                    </Text>

                    <Alert status="info" borderRadius="md">
                        <AlertIcon />
                        <VStack align="start" spacing={1}>
                            <AlertTitle>Secure your account</AlertTitle>
                            <AlertDescription>
                                Please complete the second authentication step to enhance your account security.
                            </AlertDescription>
                        </VStack>
                    </Alert>

                    {/* 2FA Method Selection */}
                    <RadioGroup onChange={setSecondFactorMethod} value={secondFactorMethod} w="full">
                        <VStack align="start" spacing={3}>
                            {hasPasskey && webAuthnSupported && (
                                <Radio value="passkey">
                                    <Flex align="center">
                                        <Icon as={FiKey} mr={2} />
                                        <Text>Use Passkey</Text>
                                    </Flex>
                                </Radio>
                            )}

                            <Radio value="email">
                                <Flex align="center">
                                    <Icon as={FiMail} mr={2} />
                                    <Text>Email Link Verification</Text>
                                </Flex>
                            </Radio>

                            {!hasPasskey && webAuthnSupported && (
                                <Radio value="register-passkey">
                                    <Flex align="center">
                                        <Icon as={FiShield} mr={2} />
                                        <Text>Register a Passkey</Text>
                                    </Flex>
                                </Radio>
                            )}
                        </VStack>
                    </RadioGroup>

                    <Divider my={2} />

                    {/* Method specific UI */}
                    {secondFactorMethod === "passkey" && (
                        <VStack spacing={4} w="full">
                            {waitingForPasskey ? (
                                <VStack spacing={4} py={4}>
                                    <Spinner
                                        size="xl"
                                        thickness="3px"
                                        speed="0.65s"
                                        color={useColorModeValue("blue.500", "blue.300")}
                                    />
                                    <Text fontSize="sm" textAlign="center">
                                        Waiting for your passkey...
                                    </Text>
                                </VStack>
                            ) : (
                                <Button
                                    leftIcon={<Icon as={FiKey} boxSize={5} />}
                                    size="lg"
                                    w="full"
                                    colorScheme="teal"
                                    onClick={handlePasskeyVerification}
                                    _hover={{
                                        transform: "translateY(-2px)",
                                        shadow: "lg",
                                    }}
                                    transition="all 0.2s"
                                >
                                    Verify with Fingerprint or Pin
                                </Button>
                            )}
                        </VStack>
                    )}

                    {secondFactorMethod === "email" && (
                        <VStack spacing={4} w="full">
                            {!emailSent ? (
                                <>
                                    <FormControl>
                                        <InputGroup>
                                            <Input
                                                type="email"
                                                placeholder="your.email@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                size="lg"
                                            />
                                            <InputRightElement width="4.5rem" h="100%">
                                                <IconButton
                                                    h="1.75rem"
                                                    size="sm"
                                                    onClick={() => setEmail("")}
                                                    icon={<FiX />}
                                                    aria-label="Clear email"
                                                    variant="ghost"
                                                />
                                            </InputRightElement>
                                        </InputGroup>
                                    </FormControl>

                                    <Button
                                        w="full"
                                        colorScheme="blue"
                                        size="lg"
                                        onClick={handleEmailSignIn}
                                        isLoading={emailSending}
                                        rightIcon={<FiArrowRight />}
                                    >
                                        Send Verification Link
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Alert status="info" borderRadius="md">
                                        <AlertIcon />
                                        <VStack align="start" spacing={1}>
                                            <AlertTitle>Verification link sent!</AlertTitle>
                                            <AlertDescription>
                                                We've sent a link to {email}. Check your inbox and click the link to complete sign-in.
                                            </AlertDescription>
                                        </VStack>
                                    </Alert>

                                    <Button
                                        w="full"
                                        variant="outline"
                                        onClick={() => {
                                            setEmailSent(false);
                                            setEmail("");
                                        }}
                                    >
                                        Use a different email
                                    </Button>
                                </>
                            )}
                        </VStack>
                    )}

                    {secondFactorMethod === "register-passkey" && (
                        <VStack spacing={4} w="full">
                            <Alert status="info" borderRadius="md">
                                <AlertIcon />
                                <VStack align="start" spacing={1}>
                                    <AlertTitle>What is a passkey?</AlertTitle>
                                    <AlertDescription>
                                        A passkey lets you sign in securely using your device's built-in authentication like fingerprint or face recognition.
                                    </AlertDescription>
                                </VStack>
                            </Alert>

                            {waitingForPasskey ? (
                                <VStack spacing={4} py={4}>
                                    <Spinner
                                        size="xl"
                                        thickness="3px"
                                        speed="0.65s"
                                        color={useColorModeValue("blue.500", "blue.300")}
                                    />
                                    <Text fontSize="sm" textAlign="center">
                                        Creating your passkey...
                                    </Text>
                                </VStack>
                            ) : (
                                <Button
                                    leftIcon={<Icon as={FiKey} boxSize={5} />}
                                    size="lg"
                                    w="full"
                                    colorScheme="teal"
                                    onClick={handleWebauthnRegistration}
                                    _hover={{
                                        transform: "translateY(-2px)",
                                        shadow: "lg",
                                    }}
                                    transition="all 0.2s"
                                >
                                    Create Passkey
                                </Button>
                            )}
                        </VStack>
                    )}
                </VStack>
            );
        }
    };

    return (
        <Flex
            minH="100vh"
            align="center"
            justify="center"
            bg={useColorModeValue(
                "linear-gradient(135deg, #e3ffe7 0%, #d9e7ff 100%)",
                "linear-gradient(135deg, #1a202c 0%, #2d3748 100%)"
            )}
            p={4}
        >
            <Box w="full" maxW="400px">
                <Card
                    bg={useColorModeValue("white", "gray.800")}
                    borderRadius="2xl"
                    boxShadow="xl"
                    overflow="hidden"
                    border="1px solid"
                    borderColor={useColorModeValue("gray.100", "gray.700")}
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
                                    color={useColorModeValue("gray.600", "gray.400")}
                                    textAlign="center"
                                    fontSize="md"
                                >
                                    Sign in to access the system
                                </Text>
                            </VStack>

                            {/* Authentication Steps */}
                            <Stepper size="sm" index={authStep} colorScheme="blue" w="full">
                                <Step>
                                    <StepIndicator>
                                        <StepStatus
                                            complete={<StepIcon />}
                                            incomplete={<StepNumber>1</StepNumber>}
                                            active={<StepNumber>1</StepNumber>}
                                        />
                                    </StepIndicator>
                                    <Box flexShrink="0">
                                        <StepTitle>Sign In</StepTitle>
                                    </Box>
                                    <StepSeparator />
                                </Step>
                                <Step>
                                    <StepIndicator>
                                        <StepStatus
                                            complete={<StepIcon />}
                                            incomplete={<StepNumber>2</StepNumber>}
                                            active={<StepNumber>2</StepNumber>}
                                        />
                                    </StepIndicator>
                                    <Box flexShrink="0">
                                        <StepTitle>Two-Factor</StepTitle>
                                    </Box>
                                </Step>
                            </Stepper>
                            <Divider />

                            {/* Loading State */}
                            {isLoading || checkingAuth ? (
                                <VStack py={4} spacing={4}>
                                    <Spinner
                                        size="xl"
                                        thickness="3px"
                                        speed="0.65s"
                                        color={useColorModeValue("blue.500", "blue.300")}
                                    />
                                    <Text color={useColorModeValue("gray.600", "gray.400")} fontSize="sm">
                                        {checkingAuth ? "Checking your account..." : "Loading sign-in options..."}
                                    </Text>
                                </VStack>
                            ) : isAuthenticating ? (
                                <VStack py={4} spacing={4}>
                                    <Spinner
                                        size="xl"
                                        thickness="3px"
                                        speed="0.65s"
                                        color={useColorModeValue("blue.500", "blue.300")}
                                    />
                                    <Text color={useColorModeValue("gray.600", "gray.400")} fontSize="sm">
                                        Authenticating...
                                    </Text>
                                </VStack>
                            ) : (
                                renderAuthStep()
                            )}

                            {/* Footer Text */}
                            <Text
                                fontSize="xs"
                                color={useColorModeValue("gray.500", "gray.400")}
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