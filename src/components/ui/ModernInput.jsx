import {
    FormControl,
    FormLabel,
    Input,
    InputGroup,
    InputLeftElement,
    InputRightElement,
    FormErrorMessage,
    useColorModeValue,
    Box,
    Text,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useState } from "react";

const MotionBox = motion(Box);

const ModernInput = ({
    label,
    placeholder,
    type = "text",
    value,
    onChange,
    error,
    leftIcon,
    rightIcon,
    isRequired = false,
    isDisabled = false,
    size = "md",
    variant = "floating",
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(!!value);
    
    const bgColor = useColorModeValue("white", "gray.800");
    const borderColor = useColorModeValue("gray.300", "gray.600");
    const focusBorderColor = useColorModeValue("primary.500", "primary.400");
    const labelColor = useColorModeValue("gray.600", "gray.400");
    
    const handleChange = (e) => {
        setHasValue(!!e.target.value);
        onChange?.(e);
    };
    
    const handleFocus = (e) => {
        setIsFocused(true);
        props.onFocus?.(e);
    };
    
    const handleBlur = (e) => {
        setIsFocused(false);
        props.onBlur?.(e);
    };

    if (variant === "floating") {
        return (
            <FormControl isInvalid={!!error} isRequired={isRequired}>
                <Box position="relative">
                    <InputGroup size={size}>
                        {leftIcon && (
                            <InputLeftElement pointerEvents="none">
                                {leftIcon}
                            </InputLeftElement>
                        )}
                        <Input
                            type={type}
                            value={value}
                            onChange={handleChange}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            placeholder=" "
                            isDisabled={isDisabled}
                            bg={bgColor}
                            borderColor={borderColor}
                            borderRadius="lg"
                            borderWidth="2px"
                            _hover={{
                                borderColor: focusBorderColor,
                            }}
                            _focus={{
                                borderColor: focusBorderColor,
                                boxShadow: `0 0 0 1px ${focusBorderColor}`,
                            }}
                            _disabled={{
                                opacity: 0.6,
                                cursor: "not-allowed",
                            }}
                            {...props}
                        />
                        {rightIcon && (
                            <InputRightElement>
                                {rightIcon}
                            </InputRightElement>
                        )}
                    </InputGroup>
                    
                    {label && (
                        <MotionBox
                            as="label"
                            position="absolute"
                            left={leftIcon ? "10" : "4"}
                            top="50%"
                            transform="translateY(-50%)"
                            bg={bgColor}
                            px="2"
                            color={labelColor}
                            fontSize="md"
                            pointerEvents="none"
                            zIndex="1"
                            animate={{
                                y: isFocused || hasValue ? "-32px" : "-50%",
                                scale: isFocused || hasValue ? 0.85 : 1,
                                color: isFocused ? focusBorderColor : labelColor,
                            }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                        >
                            {label}
                            {isRequired && (
                                <Text as="span" color="red.500" ml="1">
                                    *
                                </Text>
                            )}
                        </MotionBox>
                    )}
                </Box>
                {error && (
                    <FormErrorMessage mt="2" fontSize="sm">
                        {error}
                    </FormErrorMessage>
                )}
            </FormControl>
        );
    }

    // Standard variant
    return (
        <FormControl isInvalid={!!error} isRequired={isRequired}>
            {label && (
                <FormLabel color={labelColor} fontWeight="medium" mb="2">
                    {label}
                </FormLabel>
            )}
            <InputGroup size={size}>
                {leftIcon && (
                    <InputLeftElement pointerEvents="none">
                        {leftIcon}
                    </InputLeftElement>
                )}
                <Input
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    isDisabled={isDisabled}
                    bg={bgColor}
                    borderColor={borderColor}
                    borderRadius="lg"
                    _hover={{
                        borderColor: focusBorderColor,
                    }}
                    _focus={{
                        borderColor: focusBorderColor,
                        boxShadow: `0 0 0 1px ${focusBorderColor}`,
                    }}
                    {...props}
                />
                {rightIcon && (
                    <InputRightElement>
                        {rightIcon}
                    </InputRightElement>
                )}
            </InputGroup>
            {error && (
                <FormErrorMessage mt="2" fontSize="sm">
                    {error}
                </FormErrorMessage>
            )}
        </FormControl>
    );
};

export default ModernInput;