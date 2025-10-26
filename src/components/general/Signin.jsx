import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Flex,
    Heading,
    useColorModeValue,
    VStack,
    Text,
    useToast,
    Spinner,
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
    HStack,
    PinInput,
    PinInputField,
} from "@chakra-ui/react";
import {
    FcGoogle
} from "react-icons/fc";
import {
    KeyIcon,
    EnvelopeIcon,
    ArrowRightIcon,
    XMarkIcon,
    ShieldCheckIcon,
    LockClosedIcon
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import SequelizerAuth from "../axios/sequalizerAuth.js";
import {
    GoogleAuthProvider,
    signInWithPopup,
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
import ModernCard from "../ui/ModernCard";
import ModernButton from "../ui/ModernButton";

const MotionBox = motion.create(Box);
const MotionFlex = motion.create(Flex);

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

    // Authentication flow state
    const [authStep, setAuthStep] = useState(0); // 0: Google Sign-in, 1: PIN, 2: 2FA
    const [secondFactorMethod, setSecondFactorMethod] = useState("passkey");
    const [waitingForPasskey, setWaitingForPasskey] = useState(false);

    // PIN Code state
    const [pinCode, setPinCode] = useState("");
    const [pinError, setPinError] = useState(false);
    const [correctSignInCode, setCorrectSignInCode] = useState("");

    // Email 2FA
    const [email, setEmail] = useState("");
    const [emailSent, setEmailSent] = useState(false);
    const [emailSending, setEmailSending] = useState(false);

    // Current user state after first factor
    const [currentUser, setCurrentUser] = useState(null);
    const [currentIdToken, setCurrentIdToken] = useState(null);
    const [userDocData, setUserDocData] = useState(null);

    // Modern color scheme
    const bgGradient = useColorModeValue(
        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        "linear-gradient(135deg, #2d3748 0%, #1a202c 100%)"
    );
    const cardBg = useColorModeValue("white", "gray.800");
    const textColor = useColorModeValue("gray.800", "white");
    const mutedTextColor = useColorModeValue("gray.600", "gray.400");

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

        const checkEmailSignInLink = async () => {
            if (isSignInWithEmailLink(auth, window.location.href)) {
                let emailForSignIn = localStorage.getItem("emailForSignIn");

                if (!emailForSignIn) {
                    emailForSignIn = window.prompt("Please provide your email for confirmation");
                }

                try {
                    setIsAuthenticating(true);
                    const result = await signInWithEmailLink(auth, emailForSignIn, window.location.href);
                    const user = result.user;
                    const idToken = await user.getIdToken();

                    window.history.replaceState({}, document.title, window.location.pathname);
                    localStorage.removeItem("emailForSignIn");

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
        };

        init();
    }, [navigate, toast]);

    // Complete the authentication with backend services
    const completeAuthentication = async (user, idToken) => {
        try {
            const { data: authData, status: authStatus } = await authService.mainLogin(idToken);
            const { data: sequelData, status: sequelStatus } = await apiService.sequelizer_login(idToken);

            if (authStatus === 200 && sequelStatus === 200) {
                await SequelizerAuth.storeAccessToken(sequelData.token);
                await authService.storeTokens(authData);

                toast({
                    status: "success",
                    description: "Successfully signed in",
                });

                navigate("/", { replace: true });
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
    const handlePasskeyVerification = async (isAutomatic = false) => {
        try {
            setWaitingForPasskey(true);
            setIsAuthenticating(true);

            if (!currentUser) {
                throw new Error("No user credentials found");
            }

            const optionsResponse = await axiosInstance.post("/sequel/api/generate-auth-options", { idToken: currentIdToken });
            const options = optionsResponse.data;

            const authResp = await startAuthentication({ optionsJSON: options });

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
                throw new Error("Unable to verify your identity with passkey");
            }
        } catch (error) {
            console.error("Passkey verification failed:", error);

            if (isAutomatic) {
                // If automatic passkey auth fails, fall back to manual 2FA selection
                toast({
                    status: "warning",
                    description: "Passkey authentication failed. Please choose an alternative method.",
                });
                setAuthStep(2);
                setSecondFactorMethod("email");
            } else {
                toast({
                    status: "error",
                    description: error.message || "Passkey verification failed",
                });
                await auth.signOut();
                resetAuthFlow();
            }
        } finally {
            setIsAuthenticating(false);
            setWaitingForPasskey(false);
        }
    };

    // Register a new passkey for the user
    const handleWebauthnRegistration = async (isAutomatic = false) => {
        if (!webAuthnSupported) {
            if (isAutomatic) {
                // Fallback to email if passkey registration not supported
                setAuthStep(2);
                setSecondFactorMethod("email");
                return;
            }
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
                await handlePasskeyVerification();
            } else {
                throw new Error("An error occurred registering your passkey");
            }
        } catch (error) {
            console.error("Passkey registration failed:", error);

            if (isAutomatic) {
                // If automatic registration fails, fall back to email
                toast({
                    status: "warning",
                    description: "Passkey setup failed. Please use email verification.",
                });
                setAuthStep(2);
                setSecondFactorMethod("email");
            } else {
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
                await auth.signOut();
                resetAuthFlow();
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

            setCurrentUser(user);
            setCurrentIdToken(idToken);

            const userDoc = await getDoc(doc(firestore, "users", user.uid));
            if (!userDoc.exists()) {
                toast({
                    status: 'error',
                    description: 'You are not allowed to sign in'
                });
                await auth.signOut();
                return;
            }

            const userData = userDoc.data();
            setUserDocData(userData);

            // Check for signinCode
            if (!userData.signinCode) {
                toast({
                    status: 'error',
                    description: 'No sign-in code configured for this account'
                });
                await auth.signOut();
                return;
            }

            // Ensure signinCode is a string for comparison
            setCorrectSignInCode(String(userData.signinCode));

            const hasExistingPasskey = userData.credentials && userData.credentials.length > 0;
            setHasPasskey(hasExistingPasskey);

            // Move to PIN step
            setAuthStep(1);

            toast({
                status: "success",
                description: "Please enter your 4-digit PIN code",
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

    // Handle PIN verification
    const handlePinComplete = async (value) => {
        setPinCode(value);

        // Convert both to strings and trim for comparison
        const enteredPin = String(value).trim();
        const correctPin = String(correctSignInCode).trim();


        if (enteredPin === correctPin) {
            setPinError(false);

            // Correct PIN - proceed with automatic WebAuthn flow
            if (hasPasskey && webAuthnSupported) {
                // User has passkey - authenticate automatically
                toast({
                    status: "success",
                    description: "PIN verified! Authenticating with passkey...",
                });
                await handlePasskeyVerification(true);
            } else if (webAuthnSupported) {
                // User doesn't have passkey - register automatically
                toast({
                    status: "success",
                    description: "PIN verified! Setting up passkey...",
                });
                await handleWebauthnRegistration(true);
            } else {
                // WebAuthn not supported - fall back to email
                toast({
                    status: "success",
                    description: "PIN verified! Please complete email verification.",
                });
                setAuthStep(2);
                setSecondFactorMethod("email");
            }
        } else {
            // Incorrect PIN
            setPinError(true);
            toast({
                status: "error",
                description: "Incorrect PIN code. Please try again.",
            });

            // Clear the pin and sign out user
            setTimeout(async () => {
                await auth.signOut();
                resetAuthFlow();
            }, 1500);
        }
    };

    // Reset auth flow
    const resetAuthFlow = () => {
        setAuthStep(0);
        setPinCode("");
        setPinError(false);
        setCorrectSignInCode("");
        setCurrentUser(null);
        setCurrentIdToken(null);
        setUserDocData(null);
        setHasPasskey(false);
        setEmailSent(false);
        setEmail("");
        setSecondFactorMethod("passkey");
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

            const actionCodeSettings = {
                url: window.location.href,
                handleCodeInApp: true,
            };

            await sendSignInLinkToEmail(auth, email, actionCodeSettings);
            localStorage.setItem("emailForSignIn", email);

            setEmailSent(true);
            toast({
                status: "success",
                description: "Sign-in link sent to your email!",
            });
        } catch (error) {
            await auth.signOut();
            console.error("Email link sign-in failed:", error);
            toast({
                status: "error",
                description: error.message || "Failed to send sign-in link",
            });
        } finally {
            setEmailSending(false);
        }
    };

    // Render based on current auth step
    const renderAuthStep = () => {
        if (authStep === 0) {
            return (
                <VStack spacing={6} w="full">
                    <VStack spacing={2} textAlign="center">
                        <Heading size="lg" color={textColor}>
                            Welcome Back
                        </Heading>
                        <Text color={mutedTextColor} fontSize="md">
                            Sign in to access your ALLTECH POS system
                        </Text>
                    </VStack>

                    <ModernButton
                        leftIcon={<FcGoogle size={20} />}
                        size="lg"
                        isFullWidth
                        variant="gradient"
                        onClick={handleGoogleSignIn}
                    >
                        Sign in with Google
                    </ModernButton>
                </VStack>
            );
        } else if (authStep === 1) {
            return (
                <VStack spacing={6} w="full">
                    <VStack spacing={2} textAlign="center">
                        <Box
                            w="16"
                            h="16"
                            bg={pinError ? "red.500" : "primary.500"}
                            borderRadius="full"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            boxShadow="lg"
                            transition="all 0.3s"
                        >
                            <LockClosedIcon size={32} color="white" />
                        </Box>
                        <Heading size="lg" color={textColor}>
                            Enter PIN Code
                        </Heading>
                        <Text color={mutedTextColor} fontSize="md">
                            Enter your 4-digit PIN to continue
                        </Text>
                    </VStack>

                    <VStack spacing={4} w="full" align="center">
                        <HStack spacing={4}>
                            <PinInput
                                size="lg"
                                value={pinCode}
                                onChange={setPinCode}
                                onComplete={handlePinComplete}
                                isInvalid={pinError}
                                type="number"
                                mask
                                placeholder="●"
                                autoFocus
                            >
                                <PinInputField
                                    borderRadius="lg"
                                    fontSize="2xl"
                                    fontWeight="bold"
                                    w="16"
                                    h="16"
                                    borderColor={pinError ? "red.500" : "gray.300"}
                                    _focus={{
                                        borderColor: pinError ? "red.500" : "primary.500",
                                        boxShadow: pinError ? "0 0 0 1px red.500" : "0 0 0 1px var(--chakra-colors-primary-500)"
                                    }}
                                />
                                <PinInputField
                                    borderRadius="lg"
                                    fontSize="2xl"
                                    fontWeight="bold"
                                    w="16"
                                    h="16"
                                    borderColor={pinError ? "red.500" : "gray.300"}
                                    _focus={{
                                        borderColor: pinError ? "red.500" : "primary.500",
                                        boxShadow: pinError ? "0 0 0 1px red.500" : "0 0 0 1px var(--chakra-colors-primary-500)"
                                    }}
                                />
                                <PinInputField
                                    borderRadius="lg"
                                    fontSize="2xl"
                                    fontWeight="bold"
                                    w="16"
                                    h="16"
                                    borderColor={pinError ? "red.500" : "gray.300"}
                                    _focus={{
                                        borderColor: pinError ? "red.500" : "primary.500",
                                        boxShadow: pinError ? "0 0 0 1px red.500" : "0 0 0 1px var(--chakra-colors-primary-500)"
                                    }}
                                />
                                <PinInputField
                                    borderRadius="lg"
                                    fontSize="2xl"
                                    fontWeight="bold"
                                    w="16"
                                    h="16"
                                    borderColor={pinError ? "red.500" : "gray.300"}
                                    _focus={{
                                        borderColor: pinError ? "red.500" : "primary.500",
                                        boxShadow: pinError ? "0 0 0 1px red.500" : "0 0 0 1px var(--chakra-colors-primary-500)"
                                    }}
                                />
                            </PinInput>
                        </HStack>

                        {pinError && (
                            <Alert status="error" borderRadius="lg" w="full">
                                <AlertIcon />
                                <AlertDescription>
                                    Incorrect PIN. You will be signed out.
                                </AlertDescription>
                            </Alert>
                        )}
                    </VStack>

                    <Text fontSize="sm" color={mutedTextColor} textAlign="center">
                        Signed in as {currentUser?.email}
                    </Text>
                </VStack>
            );
        } else if (authStep === 2) {
            return (
                <VStack spacing={6} w="full">
                    <VStack spacing={2} textAlign="center">
                        <Heading size="lg" color={textColor}>
                            Two-Factor Authentication
                        </Heading>
                        <Text color={mutedTextColor} fontSize="md">
                            Complete the second authentication step for enhanced security
                        </Text>
                    </VStack>

                    <Alert status="info" borderRadius="lg" bg="primary.50" borderColor="primary.200">
                        <AlertIcon color="primary.500" />
                        <VStack align="start" spacing={1}>
                            <AlertTitle color="primary.700">Secure Your Account</AlertTitle>
                            <AlertDescription color="primary.600">
                                Choose your preferred second authentication method below.
                            </AlertDescription>
                        </VStack>
                    </Alert>

                    {/* 2FA Method Selection */}
                    <RadioGroup onChange={setSecondFactorMethod} value={secondFactorMethod} w="full">
                        <VStack align="start" spacing={4}>
                            {hasPasskey && webAuthnSupported && (
                                <Radio value="passkey" size="lg">
                                    <HStack spacing={3}>
                                        <KeyIcon size={20} />
                                        <VStack align="start" spacing={0}>
                                            <Text fontWeight="medium">Use Passkey</Text>
                                            <Text fontSize="sm" color={mutedTextColor}>
                                                Authenticate with biometrics or PIN
                                            </Text>
                                        </VStack>
                                    </HStack>
                                </Radio>
                            )}

                            <Radio value="email" size="lg">
                                <HStack spacing={3}>
                                    <EnvelopeIcon size={20} />
                                    <VStack align="start" spacing={0}>
                                        <Text fontWeight="medium">Email Verification</Text>
                                        <Text fontSize="sm" color={mutedTextColor}>
                                            Receive a secure link via email
                                        </Text>
                                    </VStack>
                                </HStack>
                            </Radio>

                            {!hasPasskey && webAuthnSupported && (
                                <Radio value="register-passkey" size="lg">
                                    <HStack spacing={3}>
                                        <ShieldCheckIcon size={20} />
                                        <VStack align="start" spacing={0}>
                                            <Text fontWeight="medium">Create Passkey</Text>
                                            <Text fontSize="sm" color={mutedTextColor}>
                                                Set up biometric authentication
                                            </Text>
                                        </VStack>
                                    </HStack>
                                </Radio>
                            )}
                        </VStack>
                    </RadioGroup>

                    <Divider />

                    {/* Method specific UI */}
                    {secondFactorMethod === "passkey" && (
                        <VStack spacing={4} w="full">
                            {waitingForPasskey ? (
                                <VStack spacing={4} py={6}>
                                    <Spinner size="xl" color="primary.500" thickness="3px" />
                                    <Text fontSize="md" textAlign="center" color={mutedTextColor}>
                                        Waiting for your passkey authentication...
                                    </Text>
                                </VStack>
                            ) : (
                                <ModernButton
                                    leftIcon={<KeyIcon size={18} />}
                                    size="lg"
                                    isFullWidth
                                    variant="gradient"
                                    onClick={() => handlePasskeyVerification(false)}
                                >
                                    Authenticate with Passkey
                                </ModernButton>
                            )}
                        </VStack>
                    )}

                    {secondFactorMethod === "email" && (
                        <VStack spacing={4} w="full">
                            {!emailSent ? (
                                <>
                                    <FormControl>
                                        <InputGroup size="lg">
                                            <Input
                                                type="email"
                                                placeholder="your.email@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                borderRadius="lg"
                                                bg={cardBg}
                                            />
                                            <InputRightElement>
                                                <IconButton
                                                    size="sm"
                                                    onClick={() => setEmail("")}
                                                    icon={<XMarkIcon size={16} />}
                                                    aria-label="Clear email"
                                                    variant="ghost"
                                                />
                                            </InputRightElement>
                                        </InputGroup>
                                    </FormControl>

                                    <ModernButton
                                        isFullWidth
                                        size="lg"
                                        onClick={handleEmailSignIn}
                                        isLoading={emailSending}
                                        loadingText="Sending..."
                                        rightIcon={<ArrowRightIcon size={16} />}
                                    >
                                        Send Verification Link
                                    </ModernButton>
                                </>
                            ) : (
                                <>
                                    <Alert status="success" borderRadius="lg">
                                        <AlertIcon />
                                        <VStack align="start" spacing={1}>
                                            <AlertTitle>Verification link sent!</AlertTitle>
                                            <AlertDescription>
                                                Check your inbox at {email} and click the link to complete sign-in.
                                            </AlertDescription>
                                        </VStack>
                                    </Alert>

                                    <ModernButton
                                        isFullWidth
                                        variant="gradient"
                                        onClick={() => {
                                            setEmailSent(false);
                                            setEmail("");
                                        }}
                                    >
                                        Use Different Email
                                    </ModernButton>
                                </>
                            )}
                        </VStack>
                    )}

                    {secondFactorMethod === "register-passkey" && (
                        <VStack spacing={4} w="full">
                            <Alert status="info" borderRadius="lg">
                                <AlertIcon />
                                <VStack align="start" spacing={1}>
                                    <AlertTitle>About Passkeys</AlertTitle>
                                    <AlertDescription>
                                        Passkeys use your device's built-in security like fingerprint or face recognition for secure, passwordless authentication.
                                    </AlertDescription>
                                </VStack>
                            </Alert>

                            {waitingForPasskey ? (
                                <VStack spacing={4} py={6}>
                                    <Spinner size="xl" color="primary.500" thickness="3px" />
                                    <Text fontSize="md" textAlign="center" color={mutedTextColor}>
                                        Setting up your passkey...
                                    </Text>
                                </VStack>
                            ) : (
                                <ModernButton
                                    leftIcon={<ShieldCheckIcon size={18} />}
                                    size="lg"
                                    isFullWidth
                                    variant="gradient"
                                    onClick={() => handleWebauthnRegistration(false)}
                                >
                                    Create Passkey
                                </ModernButton>
                            )}
                        </VStack>
                    )}
                </VStack>
            );
        }
    };

    return (
        <MotionFlex
            minH="100vh"
            align="center"
            justify="center"
            bg={bgGradient}
            p={4}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <MotionBox
                w="full"
                maxW="md"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <ModernCard variant="elevated">
                    <VStack spacing={8}>
                        {/* Logo Section */}
                        <VStack spacing={4}>
                            <Box
                                w="16"
                                h="16"
                                bg="linear-gradient(135deg, #4A90E2 0%, #667EEA 100%)"
                                borderRadius="2xl"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                boxShadow="lg"
                            >
                                <Text color="white" fontWeight="bold" fontSize="2xl">
                                    A
                                </Text>
                            </Box>
                            <VStack spacing={1}>
                                <Heading
                                    size="xl"
                                    bgGradient="linear(to-r, primary.400, primary.600)"
                                    bgClip="text"
                                    letterSpacing="tight"
                                >
                                    ALLTECH
                                </Heading>
                                <Text color={mutedTextColor} fontSize="sm" fontWeight="medium">
                                    Point of Sale System
                                </Text>
                            </VStack>
                        </VStack>

                        {/* Authentication Steps */}
                        <Stepper size="sm" index={authStep} colorScheme="primary" w="full">
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
                                        incomplete={<StepNumber>3</StepNumber>}
                                        active={<StepNumber>3</StepNumber>}
                                    />
                                </StepIndicator>
                                <Box flexShrink="0">
                                    <StepTitle>Verify</StepTitle>
                                </Box>
                            </Step>
                        </Stepper>

                        <Divider />

                        {/* Loading State */}
                        {isLoading ? (
                            <VStack py={8} spacing={4}>
                                <Spinner size="xl" color="primary.500" thickness="3px" />
                                <Text color={mutedTextColor}>Initializing...</Text>
                            </VStack>
                        ) : isAuthenticating ? (
                            <VStack py={8} spacing={4}>
                                <Spinner size="xl" color="primary.500" thickness="3px" />
                                <Text color={mutedTextColor}>Authenticating...</Text>
                            </VStack>
                        ) : (
                            renderAuthStep()
                        )}

                        {/* Footer */}
                        <Text
                            fontSize="xs"
                            color={mutedTextColor}
                            textAlign="center"
                            lineHeight="relaxed"
                        >
                            By signing in, you agree to our Terms of Service and Privacy Policy.
                            Your data is protected with enterprise-grade security.
                        </Text>
                    </VStack>
                </ModernCard>
            </MotionBox>
        </MotionFlex>
    );
};

export default SignIn;
