import {
    Badge,
    HStack,
    Icon,
    useColorModeValue,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { 
    CheckCircleIcon, 
    ExclamationTriangleIcon, 
    XCircleIcon,
    ClockIcon 
} from "@heroicons/react/24/outline";

const MotionBadge = motion(Badge);

const StatusBadge = ({ 
    status, 
    label, 
    size = "md",
    showIcon = true,
    ...props 
}) => {
    const statusConfig = {
        success: {
            colorScheme: "green",
            icon: CheckCircleIcon,
            bg: useColorModeValue("green.50", "green.900"),
            color: useColorModeValue("green.700", "green.200"),
            borderColor: useColorModeValue("green.200", "green.700"),
        },
        warning: {
            colorScheme: "yellow",
            icon: ExclamationTriangleIcon,
            bg: useColorModeValue("yellow.50", "yellow.900"),
            color: useColorModeValue("yellow.700", "yellow.200"),
            borderColor: useColorModeValue("yellow.200", "yellow.700"),
        },
        error: {
            colorScheme: "red",
            icon: XCircleIcon,
            bg: useColorModeValue("red.50", "red.900"),
            color: useColorModeValue("red.700", "red.200"),
            borderColor: useColorModeValue("red.200", "red.700"),
        },
        pending: {
            colorScheme: "blue",
            icon: ClockIcon,
            bg: useColorModeValue("blue.50", "blue.900"),
            color: useColorModeValue("blue.700", "blue.200"),
            borderColor: useColorModeValue("blue.200", "blue.700"),
        },
        info: {
            colorScheme: "blue",
            icon: ClockIcon,
            bg: useColorModeValue("blue.50", "blue.900"),
            color: useColorModeValue("blue.700", "blue.200"),
            borderColor: useColorModeValue("blue.200", "blue.700"),
        },
    };

    const config = statusConfig[status] || statusConfig.info;
    const IconComponent = config.icon;

    const sizes = {
        sm: {
            fontSize: "xs",
            px: 2,
            py: 1,
            iconSize: 3,
        },
        md: {
            fontSize: "sm",
            px: 3,
            py: 1,
            iconSize: 4,
        },
        lg: {
            fontSize: "md",
            px: 4,
            py: 2,
            iconSize: 5,
        },
    };

    const sizeConfig = sizes[size];

    return (
        <MotionBadge
            bg={config.bg}
            color={config.color}
            borderWidth="1px"
            borderColor={config.borderColor}
            borderRadius="full"
            fontWeight="semibold"
            fontSize={sizeConfig.fontSize}
            px={sizeConfig.px}
            py={sizeConfig.py}
            display="inline-flex"
            alignItems="center"
            gap={1}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
            {...props}
        >
            <HStack spacing={1}>
                {showIcon && (
                    <Icon 
                        as={IconComponent} 
                        boxSize={sizeConfig.iconSize}
                    />
                )}
                {label}
            </HStack>
        </MotionBadge>
    );
};

export default StatusBadge;