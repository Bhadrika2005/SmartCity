// components/SearchTrafficMap.js
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Input,
  VStack,
  HStack,
  Button,
  Text,
  useToast,
  Spinner,
  Select,
  Badge,
  Flex,
  Heading,
  Container,
  useColorModeValue,
  SimpleGrid,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Icon,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Link,
} from '@chakra-ui/react';
import { searchTraffic } from './services/api';
import MapComponentReactLeaflet from './MapComponent';
import { FaMapMarkerAlt, FaCar, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

const SearchTrafficMap = () => {
  const [area, setArea] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [traffic, setTraffic] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('traffic');
  const [apiError, setApiError] = useState(false);
  const toast = useToast();
  const mapContainerRef = useRef(null);

  // Fetch suggestions when area changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (area.length < 3) {
        setSuggestions([]);
        return;
      }

      try {
        const response = await searchTraffic(area, mode);
        if (response.data && Array.isArray(response.data)) {
          setSuggestions(response.data);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        // Don't show error toast for suggestions to avoid spamming the user
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [area, mode]);

  // Handle search
  const handleSearch = async () => {
    if (!area) {
      toast({
        title: 'Error',
        description: 'Please enter an area',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    setApiError(false);
    try {
      const response = await searchTraffic(area, mode);
      if (response.data) {
        setTraffic(response.data);
        setSuggestions([]);
        
        // Show success toast
        toast({
          title: 'Location Found',
          description: `Traffic data for ${response.data.area} has been loaded.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error searching traffic:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch traffic data';
      
      // Check if it's an API key error
      if (errorMessage.includes('API key') || error.response?.status === 403) {
        setApiError(true);
        toast({
          title: 'API Key Error',
          description: 'The map service is temporarily unavailable. Please check your API key configuration or try again later.',
          status: 'error',
          duration: 7000,
          isClosable: true,
          action: (
            <Button 
              size="sm" 
              colorScheme="blue" 
              onClick={() => window.location.href = '/api-test'}
            >
              Test API Key
            </Button>
          ),
        });
      } else {
        toast({
          title: 'Error',
          description: errorMessage,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
      setTraffic(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setArea(suggestion.area);
    setTraffic(suggestion);
    setSuggestions([]);
  };

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.800');

  // Get congestion level color
  const getCongestionColor = (level) => {
    switch (level) {
      case 'Low':
        return 'green';
      case 'Medium':
        return 'yellow';
      case 'High':
        return 'orange';
      case 'Severe':
        return 'red';
      default:
        return 'gray';
    }
  };

  // Transform traffic data for dashboard display
  const getDashboardData = () => {
    if (!traffic) return null;
    
    return {
      location: traffic.area,
      congestion_level: traffic.congestion >= 70 ? 'Severe' : 
                        traffic.congestion >= 50 ? 'High' : 
                        traffic.congestion >= 30 ? 'Medium' : 'Low',
      congestion_percentage: traffic.congestion,
      average_speed: traffic.speed,
      flow_status: traffic.speed > traffic.freeFlow * 0.7 ? 'Improving' : 'Worsening',
      flow_trend: Math.abs(Math.round((traffic.speed / traffic.freeFlow - 1) * 100)),
      travel_time: Math.round(10 * (traffic.freeFlow / traffic.speed)),
      incidents: Math.floor(Math.random() * 5), // Mock data
      alternative_routes: [
        'Take Highway 101',
        'Use Surface Streets',
        'Consider Public Transit'
      ],
      alerts: [
        'Construction on Main St',
        'Accident on Highway 5'
      ]
    };
  };

  const dashboardData = getDashboardData();
  
  return (
    <VStack spacing={6} align="stretch">
      {apiError && (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>API Key Error</AlertTitle>
            <AlertDescription>
              The map service is temporarily unavailable. Please check the API key configuration or try again later.
              <Link href="/api-test" color="blue.500" ml={2} textDecoration="underline">
                Test API Key
              </Link>
            </AlertDescription>
          </Box>
        </Alert>
      )}
      
      <HStack spacing={4}>
        <Box flex={1} position="relative">
          <Input
            placeholder="Enter area name..."
          value={area}
          onChange={(e) => setArea(e.target.value)}
            size="lg"
            bg={bgColor}
            borderColor={borderColor}
            _hover={{ borderColor: 'blue.400' }}
            _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
          />
          {suggestions.length > 0 && (
            <Box
              position="absolute"
              top="100%"
              left={0}
              right={0}
              zIndex={1}
              bg={bgColor}
              borderWidth={1}
              borderColor={borderColor}
              borderRadius="md"
              boxShadow="sm"
              maxH="200px"
              overflowY="auto"
            >
              {suggestions.map((suggestion, index) => (
                <Box
                  key={index}
                  p={2}
                  cursor="pointer"
                  _hover={{ bg: 'gray.100' }}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <Text>{suggestion.area}</Text>
                </Box>
              ))}
            </Box>
          )}
        </Box>
        <Select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          width="150px"
          size="lg"
          bg={bgColor}
          borderColor={borderColor}
        >
          <option value="traffic">Traffic</option>
          <option value="air">Air Quality</option>
        </Select>
        <Button
          colorScheme="blue"
          size="lg"
          onClick={handleSearch}
          isLoading={loading}
          loadingText="Searching..."
          leftIcon={<FaMapMarkerAlt />}
        >
          Search
        </Button>
      </HStack>

      <Box
        ref={mapContainerRef}
        borderWidth={1}
        borderColor={borderColor}
        borderRadius="lg"
        overflow="hidden"
        position="relative"
        height="500px"
        boxShadow="lg"
      >
        <MapComponentReactLeaflet traffic={traffic} mode={mode} />
        {loading && (
          <Flex
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="rgba(0, 0, 0, 0.3)"
            alignItems="center"
            justifyContent="center"
            zIndex={10}
          >
            <Spinner size="xl" color="white" />
          </Flex>
        )}
      </Box>

      {dashboardData && (
        <Box p={6} bg={cardBg} borderRadius="lg" borderWidth={1} borderColor={borderColor} boxShadow="lg">
          <VStack align="stretch" spacing={4}>
            <Heading size="md">Traffic Information for {dashboardData.location}</Heading>
            
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={6}>
              <Stat>
                <StatLabel>Congestion Level</StatLabel>
                <StatNumber>
                  <Badge colorScheme={getCongestionColor(dashboardData.congestion_level)} fontSize="md" p={2}>
                    {dashboardData.congestion_level}
                  </Badge>
                </StatNumber>
                <StatHelpText>
                  {dashboardData.congestion_percentage}% congestion
                </StatHelpText>
              </Stat>
              
              <Stat>
                <StatLabel>Average Speed</StatLabel>
                <StatNumber>{dashboardData.average_speed} km/h</StatNumber>
                <StatHelpText>
                  <StatArrow type={dashboardData.flow_status === 'Improving' ? 'increase' : 'decrease'} />
                  {dashboardData.flow_trend}% from last hour
                </StatHelpText>
              </Stat>
              
              <Stat>
                <StatLabel>Travel Time</StatLabel>
                <StatNumber>{dashboardData.travel_time} minutes</StatNumber>
                <StatHelpText>
                  {dashboardData.incidents} incidents reported
                </StatHelpText>
              </Stat>
            </SimpleGrid>
            
            <Divider my={4} />
            
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              <Box>
                <Heading size="sm" mb={2}>Recommended Routes</Heading>
                {dashboardData.alternative_routes.map((route, index) => (
                  <Flex key={index} align="center" mb={2}>
                    <Icon as={FaCar} color="green.500" mr={2} />
                    <Text>{route}</Text>
                  </Flex>
                ))}
              </Box>
              
              <Box>
                <Heading size="sm" mb={2}>Traffic Alerts</Heading>
                {dashboardData.alerts.map((alert, index) => (
                  <Flex key={index} align="center" mb={2}>
                    <Icon as={FaExclamationTriangle} color="orange.500" mr={2} />
                    <Text>{alert}</Text>
                  </Flex>
                ))}
              </Box>
            </SimpleGrid>
          </VStack>
        </Box>
      )}
    </VStack>
  );
};

export default SearchTrafficMap;
