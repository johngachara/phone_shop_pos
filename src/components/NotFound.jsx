
import { Box, Heading, Text, Button, Image } from "@chakra-ui/react";
import { Link } from "react-router-dom";

const NotFound = () => {
    return (
        <Box
            textAlign="center"
            py={10}
            px={6}
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            height="100vh"
            bgGradient="linear(to-r, teal.400, purple.500)"
        >
            <Image
                src="https://static.vecteezy.com/system/resources/previews/026/472/504/non_2x/surreal-arch-with-plant-on-windowsill-error-404-flash-message-night-sun-surrealizm-empty-state-ui-design-page-not-found-popup-cartoon-image-flat-illustration-concept-on-white-background-vector.jpg" // Replace with your 404 image
                alt="404"
                boxSize="300px"
                mb={6}
            />
            <Heading as="h1" fontSize="6xl" color="white">
                404
            </Heading>
            <Text fontSize="xl" color="white" mt={4}>
                Oops! The page you're looking for doesn't exist.
            </Text>
            <Button
                as={Link}
                to="/"
                mt={8}
                colorScheme="purple"
                bg="white"
                color="purple.500"
                variant="solid"
                size="lg"
                _hover={{ bg: "purple.200" }}
            >
                Go Back to Home
            </Button>
        </Box>
    );
};

export default NotFound;
