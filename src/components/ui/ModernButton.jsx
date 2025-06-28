import {
    Button,
    useColorModeValue,
    Spinner,
    HStack,
    Text,
} from "@chakra-ui/react";
import { motion } from "framer-motion";

const MotionButton = motion(Button);

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
            bg: `${colorScheme}.500`,
            color: "white",
            _hover: {
                bg: `${colorScheme}.600`,
            },
            _active: {
                bg: `${colorScheme}.700`,
            },
        },
        outline: {
            borderColor: `${colorScheme}.500`,
            color: `${colorScheme}.500`,
            _hover: {
                bg: `${colorScheme}.50`,
            },
        },
        ghost: {
            color: `${colorScheme}.500`,
            _hover: {
                bg: `${colorScheme}.50`,
            },
        },
        gradient: {
            bgGradient: `linear(to-r, ${colorScheme}.400, ${colorScheme}.600)`,
            color: "white",
            _hover: {
                bgGradient: `linear(to-r, ${colorScheme}.500, ${colorScheme}.700)`,
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