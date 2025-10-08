import {
    Button,
    useColorModeValue,
    Spinner,
    HStack,
    Text,
} from "@chakra-ui/react";
import { motion } from "framer-motion";

const MotionButton = motion.create(Button);

const ModernButton = ({
    children,
    variant = "solid",
    size = "md",
    colorScheme = "primary",
    isLoading = false,
    loadingText,
    leftIcon,
    rightIcon,
    isFullWidth = false,
    ...props
}) => {
    const variants = {
        solid: {
            bg: "#4285f4",
            color: "white",
            _hover: {
                bg: "#357ae8",
            },
            _active: {
                bg: "#2a66c9",
            },
        },
        outline: {
            borderColor: "#4285f4",
            color: "#4285f4",
            _hover: {
                bg: "rgba(66, 133, 244, 0.04)",
            },
        },
        ghost: {
            color: "#4285f4",
            _hover: {
                bg: "rgba(66, 133, 244, 0.04)",
            },
        },
        gradient: {
            bgGradient: "linear(to-r, #4285f4, #357ae8)",
            color: "white",
            _hover: {
                bgGradient: "linear(to-r, #357ae8, #2a66c9)",
            },
        },
    };

    return (
        <MotionButton
            {...variants[variant]}
            size={size}
            isLoading={isLoading}
            loadingText={loadingText}
            width={isFullWidth ? "full" : "auto"}
            borderRadius="lg"
            fontWeight="semibold"
            transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
            whileHover={{ y: -1 }}
            whileTap={{ y: 0 }}
            _focus={{
                boxShadow: `0 0 0 3px rgba(74, 144, 226, 0.1)`,
            }}
            {...props}
        >
            <HStack spacing={2}>
                {leftIcon && !isLoading && leftIcon}
                {isLoading && <Spinner size="sm" />}
                <Text>{children}</Text>
                {rightIcon && !isLoading && rightIcon}
            </HStack>
        </MotionButton>
    );
};

export default ModernButton;