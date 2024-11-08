import React, { useState, useEffect } from 'react';
import {
    Box,
    IconButton,
    Drawer,
    DrawerContent,
    DrawerCloseButton,
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverHeader,
    PopoverBody,
    PopoverFooter,
    PopoverArrow,
    PopoverCloseButton,
    Button,
    Text
} from '@chakra-ui/react';
import { ChatIcon } from '@chakra-ui/icons';
import AskAi from './screens/AskAi.jsx';

function ChatbotWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [showIntro, setShowIntro] = useState(false);

    useEffect(() => {
        const checkAndShowIntro = () => {
            const lastShownDate = localStorage.getItem('chatbotIntroLastShown');
            const today = new Date().toDateString();

            if (!lastShownDate || lastShownDate !== today) {
                setShowIntro(true);
                const hideTimer = setTimeout(() => setShowIntro(false), 5000); // Hide after 5 seconds
                const introTimer = setTimeout(() => setShowIntro(true), 1000); // Show after 1 second
                return () => {
                    clearTimeout(hideTimer);
                    clearTimeout(introTimer);
                };
            }
        };

        checkAndShowIntro();
    }, []);

    const onOpen = () => {
        setIsOpen(true);
        setShowIntro(false);
        updateLastShownDate();
    };

    const onClose = () => setIsOpen(false);

    const handleIntroClose = () => {
        setShowIntro(false);
        updateLastShownDate();
    };

    const updateLastShownDate = () => {
        const today = new Date().toDateString();
        localStorage.setItem('chatbotIntroLastShown', today);
    };

    return (
        <>
            <Box position="fixed" bottom="20px" right="20px" zIndex="1000">
                <Popover
                    isOpen={showIntro}
                    onClose={handleIntroClose}
                    placement="top-end"
                    closeOnBlur={false}
                >
                    <PopoverTrigger>
                        <IconButton
                            icon={<ChatIcon />}
                            onClick={onOpen}
                            colorScheme="blue"
                            size="lg"
                            borderRadius="full"
                            boxShadow="lg"
                        />
                    </PopoverTrigger>
                    <PopoverContent>
                        <PopoverArrow />
                        <PopoverCloseButton />
                        <PopoverHeader fontWeight="bold">Need Help?</PopoverHeader>
                        <PopoverBody>
                            <Text>
                                Meet AllTech AI: Your New Assistant for Instant Help!
                            </Text>
                        </PopoverBody>
                        <PopoverFooter display="flex" justifyContent="flex-end">
                            <Button colorScheme="blue" size="sm" onClick={onOpen}>
                                Ask a Question
                            </Button>
                        </PopoverFooter>
                    </PopoverContent>
                </Popover>
            </Box>

            <Drawer placement="right" onClose={onClose} isOpen={isOpen} size="md">
                <DrawerContent display="flex" flexDirection="column" height="100vh">
                    <DrawerCloseButton />
                    <Box flex="1" overflowY="auto">
                        <AskAi />
                    </Box>
                </DrawerContent>
            </Drawer>
        </>
    );
}

export default ChatbotWidget;
