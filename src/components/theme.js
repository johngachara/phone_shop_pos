import { extendTheme } from "@chakra-ui/react";
import { colors, gradients } from "../theme/colors.js";
import { typography } from "../theme/typography.js";
import { spacing, borderRadius, shadows } from "../theme/spacing.js";

const config = {
    initialColorMode: "light",
    useSystemColorMode: false,
};

// Custom component styles
const components = {
    Button: {
        baseStyle: {
            fontWeight: "semibold",
            borderRadius: "lg",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            _focus: {
                boxShadow: "0 0 0 3px rgba(74, 144, 226, 0.1)",
            },
        },
        variants: {
            solid: {
                bg: "primary.500",
                color: "white",
                _hover: {
                    bg: "primary.600",
                    transform: "translateY(-1px)",
                    boxShadow: "lg",
                },
                _active: {
                    bg: "primary.700",
                    transform: "translateY(0)",
                },
            },
            outline: {
                borderColor: "primary.500",
                color: "primary.500",
                _hover: {
                    bg: "primary.50",
                    transform: "translateY(-1px)",
                },
            },
            ghost: {
                color: "primary.500",
                _hover: {
                    bg: "primary.50",
                },
            },
        },
        sizes: {
            sm: {
                h: "8",
                minW: "8",
                fontSize: "sm",
                px: "3",
            },
            md: {
                h: "10",
                minW: "10",
                fontSize: "md",
                px: "4",
            },
            lg: {
                h: "12",
                minW: "12",
                fontSize: "lg",
                px: "6",
            },
        },
    },
    
    Card: {
        baseStyle: {
            container: {
                borderRadius: "xl",
                boxShadow: "sm",
                border: "1px solid",
                borderColor: "gray.200",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                _hover: {
                    boxShadow: "md",
                    transform: "translateY(-2px)",
                },
            },
        },
    },
    
    Input: {
        variants: {
            outline: {
                field: {
                    borderRadius: "lg",
                    borderColor: "gray.300",
                    _hover: {
                        borderColor: "primary.400",
                    },
                    _focus: {
                        borderColor: "primary.500",
                        boxShadow: "0 0 0 1px rgba(74, 144, 226, 0.6)",
                    },
                },
            },
        },
    },
    
    Badge: {
        baseStyle: {
            borderRadius: "full",
            fontWeight: "semibold",
            fontSize: "xs",
            px: "2",
            py: "1",
        },
    },
    
    Progress: {
        baseStyle: {
            track: {
                borderRadius: "full",
            },
            filledTrack: {
                borderRadius: "full",
            },
        },
    },
};

const theme = extendTheme({
    config,
    colors: {
        ...colors,
        brand: colors.primary,
    },
    fonts: typography.fonts,
    fontSizes: typography.fontSizes,
    fontWeights: typography.fontWeights,
    lineHeights: typography.lineHeights,
    letterSpacings: typography.letterSpacings,
    space: spacing,
    radii: borderRadius,
    shadows,
    components,
    styles: {
        global: (props) => ({
            body: {
                bg: props.colorMode === 'dark' ? 'gray.900' : 'gray.50',
                color: props.colorMode === 'dark' ? 'gray.100' : 'gray.900',
                fontFamily: 'body',
                lineHeight: 'normal',
            },
            '*': {
                borderColor: props.colorMode === 'dark' ? 'gray.700' : 'gray.200',
            },
        }),
    },
});

export default theme;