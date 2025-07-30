import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Input,
  IconButton,
  useColorModeValue,
  Flex,
  Avatar,
  Spinner,
  useToast,
} from '@chakra-ui/react';
import { FaRobot, FaTimes, FaPaperPlane } from 'react-icons/fa';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const toast = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);
    setIsLoading(true);

    try {
      // Here you would typically call your backend API
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();
      setMessages(prev => [...prev, { text: data.response, sender: 'bot' }]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to get response from chatbot',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <>
      {/* Floating Chat Button */}
      <Button
        position="fixed"
        bottom="20px"
        right="20px"
        leftIcon={<FaRobot />}
        colorScheme="blue"
        onClick={() => setIsOpen(!isOpen)}
        zIndex={1000}
      >
        Chat with Assistant
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Box
          position="fixed"
          bottom="80px"
          right="20px"
          width="350px"
          height="500px"
          bg={bgColor}
          borderRadius="lg"
          boxShadow="lg"
          borderWidth="1px"
          borderColor={borderColor}
          zIndex={1000}
        >
          {/* Chat Header */}
          <Flex
            p={3}
            borderBottomWidth="1px"
            borderColor={borderColor}
            alignItems="center"
            justifyContent="space-between"
          >
            <HStack>
              <Avatar size="sm" icon={<FaRobot />} />
              <Text fontWeight="bold">City Explorer Assistant</Text>
            </HStack>
            <IconButton
              icon={<FaTimes />}
              size="sm"
              variant="ghost"
              onClick={() => setIsOpen(false)}
            />
          </Flex>

          {/* Chat Messages */}
          <Box
            p={3}
            height="calc(100% - 120px)"
            overflowY="auto"
          >
            <VStack spacing={3} align="stretch">
              {messages.map((message, index) => (
                <Flex
                  key={index}
                  justify={message.sender === 'user' ? 'flex-end' : 'flex-start'}
                >
                  <Box
                    maxW="80%"
                    p={3}
                    borderRadius="lg"
                    bg={message.sender === 'user' ? 'blue.500' : 'gray.100'}
                    color={message.sender === 'user' ? 'white' : 'black'}
                  >
                    <Text>{message.text}</Text>
                  </Box>
                </Flex>
              ))}
              {isLoading && (
                <Flex justify="flex-start">
                  <Box p={3} borderRadius="lg" bg="gray.100">
                    <Spinner size="sm" />
                  </Box>
                </Flex>
              )}
              <div ref={messagesEndRef} />
            </VStack>
          </Box>

          {/* Input Area */}
          <Flex
            p={3}
            borderTopWidth="1px"
            borderColor={borderColor}
          >
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about weather, traffic, or cities..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <IconButton
              icon={<FaPaperPlane />}
              ml={2}
              colorScheme="blue"
              onClick={handleSendMessage}
              isLoading={isLoading}
            />
          </Flex>
        </Box>
      )}
    </>
  );
};

export default Chatbot; 