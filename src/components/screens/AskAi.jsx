import React, { useState, useRef, useEffect } from 'react';
import OpenAI from "openai";
import {
    Box,
    VStack,
    Heading,
    Input,
    Button,
    Text,
    useToast,
    Flex,
    useColorModeValue,
} from '@chakra-ui/react';
import {keyframes} from '@chakra-ui/system'
const token = import.meta.env.VITE_GITHUB_TOKEN
const endpoint = "https://models.inference.ai.azure.com";

// Typing animation keyframes
const blink = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0; }
  100% { opacity: 1; }
`;

const TypewriterText = ({ text, isComplete }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (!isComplete && currentIndex < text.length) {
            const timeout = setTimeout(() => {
                setDisplayedText(prev => prev + text[currentIndex]);
                setCurrentIndex(currentIndex + 1);
            }, 20); // Adjust typing speed here
            return () => clearTimeout(timeout);
        }
    }, [currentIndex, text, isComplete]);

    useEffect(() => {
        if (isComplete) {
            setDisplayedText(text);
        }
    }, [isComplete, text]);

    return <Text>{displayedText}</Text>;
};

const TypingIndicator = () => {
    return (
        <Box
            display="inline-block"
            p={2}
            borderRadius="md"
            bg="gray.100"
            maxW="70%"
            mb={2}
        >
            <Text
                display="inline-block"
                animation={`${blink} 1s infinite`}
                fontSize="lg"
            >
                •••
            </Text>
        </Box>
    );
};

export default function AskAi() {
    const client = new OpenAI({ baseURL: endpoint, apiKey: token ,dangerouslyAllowBrowser:true});
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [completedMessages, setCompletedMessages] = useState(new Set());
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
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = { text: input, sender: 'user', id: Date.now() };
        setMessages(prev => [...prev, userMessage]);
        chatHistoryRef.current.push(userMessage);
        setInput('');
        setIsLoading(true);
        setIsTyping(true);

        try {
            const systemPrompt = `You are an AI assistant for Alltech, a phone repair shop in Nyeri, Kenya. Your primary role is to assist Alltech employees with information about phones, repairs, and related inquiries, reducing their need to search online. You also serve as a general knowledge assistant, capable of answering questions on various topics beyond just phone repairs. Important note: You do not have specific information about Alltech's services, pricing, or policies. Your knowledge is limited to general information about phones, repairs, and other topics.

Key points:

1. Prioritize questions about phone model numbers. Provide these answers immediately and concisely.

2. Offer accurate, brief responses on topics including:
   - Common phone issues and troubleshooting steps
   - General repair procedures and typical timeframes
   - Phone specifications and compatibility
   - General tech support queries
   - Component-level repair information when relevant
   - Safety considerations for repairs
   - Tool recommendations for specific repairs
   - Incase a model number of a phone or phone part is asked try and find all the different brands containing thatt model number before giving results

3. Maintain a professional yet approachable tone.

4. Act as a general knowledge assistant when needed:
   - Answer questions about various topics beyond phone repairs
   - Provide helpful information on technology, science, history, and other subjects
   - Assist with general queries and problem-solving
   - Help with basic calculations and conversions
   - Offer explanations on various topics in simple terms

5. If you're uncertain about any information, clearly state this and suggest where the employee might find the answer.

6. Do not provide any specific information about Alltech's services, prices, or policies. If asked, explain that you don't have access to this information and suggest the employee check internal resources or ask a manager.

7. Avoid providing information about competitor shops or services unless specifically asked.

8. If asked about tasks beyond your knowledge or capabilities, politely explain your limitations and suggest appropriate alternatives.

9. Respect customer privacy by not discussing specific customer details or repair cases.

10. Be prepared to explain technical terms in simple language if needed.

11. When discussing repairs, always mention relevant safety precautions and potential risks.

Remember, your goal is to be a comprehensive assistant, providing both specific phone-related information for Alltech staff and general knowledge when needed, while maintaining professionalism and accuracy.`;

            const response = await client.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: systemPrompt },
                    ...chatHistoryRef.current.map(msg => ({
                        role: msg.sender === 'user' ? 'user' : 'assistant',
                        content: msg.text
                    }))
                ],
                temperature: 0.7,
                max_tokens: 500
            });

            const botMessage = {
                text: response.choices[0].message.content,
                sender: 'bot',
                id: Date.now()
            };
            setMessages(prev => [...prev, botMessage]);
            chatHistoryRef.current.push(botMessage);

            // Wait for typing animation to complete
            setTimeout(() => {
                setCompletedMessages(prev => new Set([...prev, botMessage.id]));
            }, botMessage.text.length * 20 + 500); // Adjust based on typing speed
        } catch (error) {
            console.error('Error generating response:', error);
            toast({
                title: 'Error',
                description: error.message || 'An error occurred while generating the response.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }

        setIsLoading(false);
        setIsTyping(false);
    };

    const textColor = useColorModeValue("gray.800", "white");
    const bgColor = useColorModeValue("white", "gray.800");

    return (
        <Box display="flex" flexDirection="column" height="100%" overflow="hidden">
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
                    {messages.map((message) => (
                        <Box
                            key={message.id}
                            alignSelf={message.sender === 'user' ? 'flex-end' : 'flex-start'}
                            bg={bgColor}
                            textColor={textColor}
                            p={2}
                            borderRadius="md"
                            maxW="70%"
                            mb={2}
                        >
                            <TypewriterText
                                text={message.text}
                                isComplete={completedMessages.has(message.id)}
                            />
                        </Box>
                    ))}
                    {isTyping && <TypingIndicator />}
                    <div ref={messagesEndRef} />
                </Flex>
                <Box mt={4}>
                    <Flex>
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message..."
                            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                            mr={2}
                            disabled={isLoading}
                        />
                        <Button
                            onClick={handleSend}
                            isLoading={isLoading}
                            loadingText="Sending"
                            colorScheme="blue"
                            disabled={isLoading}
                        >
                            Send
                        </Button>
                    </Flex>
                </Box>
            </VStack>
        </Box>
    );
}