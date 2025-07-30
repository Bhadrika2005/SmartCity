import React, { useState } from 'react';
import {
  Box,
  Button,
  Text,
  VStack,
  Heading,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Code,
  Divider,
} from '@chakra-ui/react';
import { testTomTomApi } from '../services/api';

const ApiKeyTester = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const toast = useToast();

  const handleTestApi = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    
    try {
      const data = await testTomTomApi();
      setResult(data);
      
      if (data.status === 'success') {
        toast({
          title: 'API Key Test Successful',
          description: 'Your TomTom API key is working correctly.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'API Key Test Failed',
          description: data.message || 'There was an issue with your TomTom API key.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (err) {
      setError(err.message || 'An error occurred while testing the API key.');
      toast({
        title: 'API Key Test Failed',
        description: err.message || 'There was an issue with your TomTom API key.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={6} borderWidth={1} borderRadius="lg" boxShadow="md">
      <VStack spacing={4} align="stretch">
        <Heading size="md">TomTom API Key Tester</Heading>
        <Text>
          Use this tool to test if your TomTom API key is working correctly. If the test fails,
          you'll need to update your API key in the backend/.env file.
        </Text>
        
        <Button
          colorScheme="blue"
          onClick={handleTestApi}
          isLoading={loading}
          loadingText="Testing..."
        >
          Test API Key
        </Button>
        
        {loading && (
          <Box textAlign="center" py={4}>
            <Spinner size="xl" />
            <Text mt={2}>Testing your TomTom API key...</Text>
          </Box>
        )}
        
        {error && (
          <Alert status="error">
            <AlertIcon />
            <Box>
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Box>
          </Alert>
        )}
        
        {result && (
          <Box>
            <Alert status={result.status === 'success' ? 'success' : 'error'}>
              <AlertIcon />
              <Box>
                <AlertTitle>
                  {result.status === 'success' ? 'Success' : 'Error'}
                </AlertTitle>
                <AlertDescription>{result.message}</AlertDescription>
              </Box>
            </Alert>
            
            {result.details && (
              <Box mt={4}>
                <Text fontWeight="bold">Details:</Text>
                <Text>{result.details}</Text>
              </Box>
            )}
            
            {result.response && (
              <Box mt={4}>
                <Text fontWeight="bold">Response:</Text>
                <Code p={2} borderRadius="md" display="block" whiteSpace="pre-wrap">
                  {JSON.stringify(result.response, null, 2)}
                </Code>
              </Box>
            )}
          </Box>
        )}
        
        <Divider my={4} />
        
        <Box>
          <Heading size="sm" mb={2}>How to Fix API Key Issues</Heading>
          <Text>If your API key test fails, follow these steps:</Text>
          <VStack align="stretch" mt={2} spacing={2}>
            <Text>1. Go to the <a href="https://developer.tomtom.com/" target="_blank" rel="noopener noreferrer">TomTom Developer Portal</a></Text>
            <Text>2. Sign up for a free account if you don't have one already</Text>
            <Text>3. Create a new project</Text>
            <Text>4. Enable the "Search API" service in your project</Text>
            <Text>5. Get your API key from the project dashboard</Text>
            <Text>6. Update the <Code>REACT_APP_TOMTOM_API_KEY</Code> in the <Code>backend/.env</Code> file</Text>
            <Text>7. Restart the backend server</Text>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default ApiKeyTester; 