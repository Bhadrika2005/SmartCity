// components/Dashboard.js
import React, { useState } from "react";
import { 
  Box, 
  Container, 
  Heading, 
  VStack,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import CityDashboard from "./CityDashboard";

const Dashboard = () => {
  const [cityData, setCityData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const toast = useToast();

  const handleSearch = async (cityName) => {
    setIsLoading(true);
    try {
      console.log(`Searching for city: ${cityName}`);
      const response = await fetch(`http://localhost:5000/api/city-data?city=${encodeURIComponent(cityName)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch city data');
      }
      
      const data = await response.json();
      console.log('City data received:', data);
      
      // Validate places data
      if (!data.famous_places || data.famous_places.length === 0) {
        console.warn('No places data received for city:', cityName);
      } else {
        console.log(`Received ${data.famous_places.length} places for ${cityName}`);
      }
      
      setCityData(data);
    } catch (error) {
      console.error('Error fetching city data:', error);
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Box minH="100vh" bg={bgColor}>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <CityDashboard 
            cityData={cityData}
            onSearch={handleSearch}
            isLoading={isLoading}
          />
        </VStack>
      </Container>
    </Box>
  );
};

export default Dashboard;
