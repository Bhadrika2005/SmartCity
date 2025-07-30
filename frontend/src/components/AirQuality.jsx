import React, { useState } from 'react';
import {
  Box,
  Container,
  Input,
  InputGroup,
  InputLeftElement,
  Text,
  VStack,
  HStack,
  Heading,
  Button,
  useColorModeValue,
  useToast,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Badge,
  List,
  ListItem,
  ListIcon,
  Card,
  CardHeader,
  CardBody,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { FaCloud, FaWind, FaTemperatureHigh, FaTemperatureLow } from 'react-icons/fa';

const AirQuality = () => {
  const [city, setCity] = useState('');
  const [airQuality, setAirQuality] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleSearch = async () => {
    if (!city.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a city name',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/air-quality?city=${encodeURIComponent(city)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch air quality data');
      }

      const data = await response.json();
      setAirQuality(data);
    } catch (error) {
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

  const getAQIColor = (value) => {
    if (value <= 50) return 'green';
    if (value <= 100) return 'yellow';
    if (value <= 150) return 'orange';
    if (value <= 200) return 'red';
    if (value <= 300) return 'purple';
    return 'red';
  };

  const getHealthRecommendations = (aqi) => {
    if (aqi <= 50) {
      return [
        'Air quality is satisfactory',
        'Enjoy outdoor activities',
        'No health impacts expected'
      ];
    } else if (aqi <= 100) {
      return [
        'Air quality is acceptable',
        'Sensitive individuals may experience minor symptoms',
        'Consider reducing prolonged outdoor exertion'
      ];
    } else if (aqi <= 150) {
      return [
        'Sensitive groups should reduce outdoor activities',
        'People with heart or lung disease should take precautions',
        'Children and older adults should limit outdoor exertion'
      ];
    } else if (aqi <= 200) {
      return [
        'Everyone may begin to experience health effects',
        'Sensitive groups should avoid outdoor activities',
        'Consider wearing masks if going outside'
      ];
    } else if (aqi <= 300) {
      return [
        'Health warnings of emergency conditions',
        'Avoid outdoor activities',
        'Keep windows closed',
        'Use air purifiers'
      ];
    } else {
      return [
        'Health alert: everyone may experience serious health effects',
        'Stay indoors',
        'Use air purifiers',
        'Wear N95 masks if going outside is necessary'
      ];
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading 
            size="xl" 
            bgGradient="linear(to-r, blue.400, purple.500)" 
            bgClip="text"
            mb={2}
          >
            Air Quality Index
          </Heading>
          <Text fontSize="lg" color="gray.500">
            Check real-time air quality for any city
          </Text>
        </Box>

        <Box>
          <InputGroup size="lg">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input 
              placeholder="Enter city name" 
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              size="lg"
              bg={bgColor}
              borderColor={borderColor}
              _hover={{ borderColor: 'blue.400' }}
              _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
            />
          </InputGroup>
          <Button 
            colorScheme="blue" 
            size="lg"
            w="100%"
            mt={4}
            onClick={handleSearch}
            isLoading={isLoading}
          >
            Check Air Quality
          </Button>
        </Box>

        {airQuality && airQuality.current && airQuality.current.measurements && (
          <Card bg={bgColor} borderWidth={1} borderColor={borderColor}>
            <CardHeader>
              <Heading size="md">
                Air Quality Information for {airQuality.meta.city}, {airQuality.meta.state}
              </Heading>
              <Text fontSize="sm" color="gray.500" mt={2}>
                Last updated: {new Date(airQuality.current.lastUpdated).toLocaleString()}
              </Text>
            </CardHeader>
            <CardBody>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <Box>
                  <Heading size="md" mb={4}>Air Quality Index</Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    {airQuality.current.measurements.map((measurement, index) => (
                      <Stat key={index}>
                        <StatLabel>{measurement.parameter.toUpperCase()}</StatLabel>
                        <StatNumber>
                          <Badge 
                            colorScheme={getAQIColor(measurement.value)} 
                            fontSize="md" 
                            p={2}
                          >
                            {measurement.value} {measurement.unit}
                          </Badge>
                        </StatNumber>
                        <StatHelpText>
                          {measurement.status}
                        </StatHelpText>
                      </Stat>
                    ))}
                  </SimpleGrid>
                </Box>

                <Box>
                  <Heading size="md" mb={4}>Weather Conditions</Heading>
                  <SimpleGrid columns={2} spacing={4}>
                    <Stat>
                      <StatLabel>Temperature</StatLabel>
                      <StatNumber>{airQuality.current.weather.temperature}°C</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel>Humidity</StatLabel>
                      <StatNumber>{airQuality.current.weather.humidity}%</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel>Wind Speed</StatLabel>
                      <StatNumber>{airQuality.current.weather.wind_speed} m/s</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel>Wind Direction</StatLabel>
                      <StatNumber>{airQuality.current.weather.wind_direction}°</StatNumber>
                    </Stat>
                  </SimpleGrid>
                </Box>
              </SimpleGrid>

              <Box mt={6}>
                <Text fontWeight="bold" mb={2}>Health Recommendations</Text>
                <List spacing={2}>
                  {getHealthRecommendations(
                    airQuality.current.measurements.find(m => m.parameter === 'pm25')?.value || 0
                  ).map((recommendation, index) => (
                    <ListItem key={index}>
                      <ListIcon as={FaCloud} color={
                        getAQIColor(
                          airQuality.current.measurements.find(m => m.parameter === 'pm25')?.value || 0
                        ) + '.400'
                      } />
                      {recommendation}
                    </ListItem>
                  ))}
                </List>
              </Box>

              <Box mt={6} p={4} bg="gray.50" borderRadius="md">
                <Text fontSize="sm" color="gray.500">
                  Data provided by IQAir. Location: {airQuality.meta.city}, {airQuality.meta.state}, {airQuality.meta.country}
                </Text>
              </Box>
            </CardBody>
          </Card>
        )}
      </VStack>
    </Container>
  );
};

export default AirQuality; 