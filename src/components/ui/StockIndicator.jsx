import {
    Box,
    Progress,
    Text,
    VStack,
    HStack,
    useColorModeValue,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import StatusBadge from "./StatusBadge";

const MotionBox = motion(Box);

const StockIndicator = ({ 
    quantity, 
    maxQuantity = 30,
    showLabel = true,
    size = "md",
    ...props 
}) => {
    const percentage = Math.min((quantity / maxQuantity) * 100, 100);
    
    const getStockStatus = (qty) => {
        if (qty === 0) return { status: 'error', label: 'Out of Stock', color: 'red' };
        if (qty <= 3) return { status: 'error', label: 'Critical', color: 'red' };
        if (qty <= 10) return { status: 'warning', label: 'Low Stock', color: 'yellow' };
        if (qty <= 50) return { status: 'info', label: 'Good Stock', color: 'blue' };
        return { status: 'success', label: 'In Stock', color: 'green' };
    };

    const stockStatus = getStockStatus(quantity);
    const textColor = useColorModeValue("gray.600", "gray.400");

    const sizes = {
        sm: {
            height: "6px",
            fontSize: "xs",
            badgeSize: "sm",
        },
        md: {
            height: "8px",
            fontSize: "sm",
            badgeSize: "md",
        },
        lg: {
            height: "12px",
            fontSize: "md",
            badgeSize: "lg",
        },
    };

    const sizeConfig = sizes[size];

    return (
        <MotionBox
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            {...props}
        >
            <VStack spacing={2} align="stretch">
                {showLabel && (
                    <HStack justify="space-between" align="center">
                        <Text fontSize={sizeConfig.fontSize} color={textColor} fontWeight="medium">
                            Stock Level
                        </Text>
                        <StatusBadge 
                            status={stockStatus.status}
                            label={stockStatus.label}
                            size={sizeConfig.badgeSize}
                        />
                    </HStack>
                )}
                
                <Box>
                    <Progress
                        value={percentage}
                        colorScheme={stockStatus.color}
                        borderRadius="full"
                        size={size}
                        hasStripe={quantity > 0}
                        isAnimated={quantity > 0}
                        bg={useColorModeValue("gray.200", "gray.700")}
                    />
                    <HStack justify="space-between" mt={1}>
                        <Text fontSize="md" color={textColor}>
                            0
                        </Text>
                        <Text fontSize="md" color={textColor} fontWeight="medium">
                            {quantity} units
                        </Text>
                        <Text fontSize="md" color={textColor}>
                            {maxQuantity}+
                        </Text>
                    </HStack>
                </Box>
            </VStack>
        </MotionBox>
    );
};

export default StockIndicator;