
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
    Box,
    VStack,
    Heading,
    Input,
    Button,
    Text,
    useToast,
    Flex, useColorModeValue,
} from '@chakra-ui/react';
// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_KEY);

export default function AskAi() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();
    const messagesEndRef = useRef(null);
    const chatHistoryRef = useRef([]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            scrollToBottom();
        }, 100);
        return () => clearTimeout(timer);
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = { text: input, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        chatHistoryRef.current.push(userMessage);
        setInput('');
        setIsLoading(true);

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

            const systemPrompt = `You are an AI assistant for Alltech, a phone repair shop in Nyeri, Kenya. Your primary role is to assist Alltech employees with information about phones, repairs, and related inquiries, reducing their need to search online. Important note: You do not have specific information about Alltech's services, pricing, or policies. Your knowledge is limited to general information about phones and repairs.
             Key points:

1. Prioritize questions about phone model numbers. Provide these answers immediately and concisely.

2. Offer accurate, brief responses on topics including:
   - Common phone issues and troubleshooting steps
   - General repair procedures and typical timeframes
   - Phone specifications and compatibility
   - General tech support queries

3. Maintain a professional yet approachable tone.

4. If you're uncertain about any information, clearly state this and suggest where the employee might find the answer.

5. Do not provide any specific information about Alltech's services, prices, or policies. If asked, explain that you don't have access to this information and suggest the employee check internal resources or ask a manager.

6. Avoid providing information about competitor shops or services unless specifically asked.

7. If asked about tasks beyond your knowledge or capabilities, politely explain your limitations and suggest appropriate alternatives.

8. Respect customer privacy by not discussing specific customer details or repair cases.

9. Be prepared to explain technical terms in simple language if needed.

Remember, your goal is to be a quick, reliable source of general phone-related information for Alltech staff, enhancing their efficiency and customer service, without overstepping into Alltech-specific details.

Current conversation history:
${chatHistoryRef.current.map(msg => `${msg.sender}: ${msg.text}`).join('\n')}

User's latest message: ${input}

Please respond to the user's latest message, taking into account the conversation history.`;

            const result = await model.generateContent(systemPrompt);
            const response =  result.response;
            const botMessage = { text: response.text(), sender: 'bot' };
            setMessages(prev => [...prev, botMessage]);
            chatHistoryRef.current.push(botMessage);
        } catch (error) {
            console.error('Error generating response:', error);
            toast({
                title: 'Error',
                description: 'An error occurred while generating the response.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }

        setIsLoading(false);
    };
    const textColor = useColorModeValue("gray.800", "white");
    const bgColor = useColorModeValue("white", "gray.800");
    return (
        <Box display="flex" flexDirection="column" height="100%" overflow="hidden" >
            <Heading as="h1" size="lg" textAlign="center" p={4}>
                Alltech Assistant
            </Heading>
            <VStack spacing={4} align="stretch" flex="1" p={4} overflow="hidden">
                <Flex
                    direction="column"
                    overflowY="auto"
                    bg="gray.50"
                    p={4}
                    borderRadius="md"
                    flex="1"
                >
                    {messages.map((message, index) => (
                        <Box
                            bg={bgColor}
                            textColor={textColor}
                            key={index}
                            alignSelf={message.sender === 'user' ? 'flex-end' : 'flex-start'}
                            p={2}
                            borderRadius="md"
                            maxW="70%"
                            mb={2}
                        >
                            <Text>{message.text}</Text>
                        </Box>
                    ))}
                    <div ref={messagesEndRef} />
                </Flex>
                <Box mt={4}>
                    <Flex>
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message..."
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            mr={2}
                        />
                        <Button
                            onClick={handleSend}
                            isLoading={isLoading}
                            loadingText="Sending"
                            colorScheme="blue"
                        >
                            Send
                        </Button>
                    </Flex>
                </Box>
            </VStack>
        </Box>
    );
}
