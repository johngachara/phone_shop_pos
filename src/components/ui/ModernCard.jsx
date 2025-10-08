import {
    Box,
    Card,
    CardBody,
    CardHeader,
    useColorModeValue,
} from "@chakra-ui/react";
import { motion } from "framer-motion";

const MotionCard = motion.create(Card);

const ModernCard = ({ 
    children, 
    header, 
    variant = "elevated",
    isHoverable = true,
    ...props 
}) => {
    const bgColor = useColorModeValue("white", "gray.800");
    const borderColor = useColorModeValue("gray.200", "gray.700");
    const shadowColor = useColorModeValue("rgba(0, 0, 0, 0.1)", "rgba(0, 0, 0, 0.3)");
    
    const variants = {
        elevated: {
            bg: bgColor,
            borderRadius: "xl",
            boxShadow: `0 4px 6px -1px ${shadowColor}, 0 2px 4px -1px ${shadowColor}`,
            border: "1px solid",
            borderColor: borderColor,
        },
        outlined: {
            bg: bgColor,
            borderRadius: "xl",
            border: "2px solid",
            borderColor: borderColor,
            boxShadow: "none",
        },
        filled: {
            bg: useColorModeValue("gray.50", "gray.700"),
            borderRadius: "xl",
            border: "none",
            boxShadow: "none",
        },
    };
    
    const hoverAnimation = isHoverable ? {
        whileHover: {
            y: -4,
            boxShadow: `0 20px 25px -5px ${shadowColor}, 0 10px 10px -5px ${shadowColor}`,
            transition: { duration: 0.2 }
        },
        whileTap: {
            y: -2,
            transition: { duration: 0.1 }
        }
    } : {};

    return (
        <MotionCard
            {...variants[variant]}
            {...hoverAnimation}
            transition={{ duration: 0.2, ease: "easeOut" }}
            {...props}
        >
            {header && (
                <CardHeader pb={2}>
                    {header}
                </CardHeader>
            )}
            <CardBody pt={header ? 2 : 6}>
                {children}
            </CardBody>
        </MotionCard>
    );
};

export default ModernCard;