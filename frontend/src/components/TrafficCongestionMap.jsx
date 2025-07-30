import React, { useState, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  useToast,
  Spinner,
  Select,
  VStack,
  HStack,
  Badge,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaCar, FaExclamationTriangle, FaInfoCircle, FaMapMarkedAlt } from 'react-icons/fa';
import { getTrafficData, getCityInfo } from '../services/api';
import MapComponentReactLeaflet from '../MapComponent';

const TrafficCongestionMap = () => {
  const [selectedCity, setSelectedCity] = useState('');
  const [cities, setCities] = useState([]);
  const [trafficData, setTrafficData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Fetch cities on component mount
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch('http://localhost:5000/cities');
        const data = await response.json();
        setCities(data.cities);
        if (data.cities.length > 0) {
          setSelectedCity(data.cities[0].id);
        }
      } catch (error) {
        console.error('Error fetching cities:', error);
        setError('Failed to load cities. Please try again later.');
      }
    };

    fetchCities();
  }, []);

  // Fetch traffic data when city changes
  useEffect(() => {
    if (selectedCity) {
      fetchTrafficData(selectedCity);
    }
  }, [selectedCity]);

  const fetchTrafficData = async (city) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTrafficData(city);
      setTrafficData(data);
    } catch (error) {
      console.error('Error fetching traffic data:', error);
      setError(error.message || 'Failed to fetch traffic data. Please try again later.');
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch traffic data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCityChange = (e) => {
    setSelectedCity(e.target.value);
  };

  const handleRefresh = () => {
    if (selectedCity) {
      fetchTrafficData(selectedCity);
    }
  };

  const getCongestionLevel = (freeFlow, currentFlow) => {
    if (!freeFlow || !currentFlow) return 0;
    return Math.round((1 - currentFlow / freeFlow) * 100);
  };

  const getCongestionColor = (level) => {
    if (level >= 70) return 'red.500';
    if (level >= 30) return 'orange.500';
    return 'green.500';
  };

  const getCongestionText = (level) => {
    if (level >= 70) return 'Heavy';
    if (level >= 30) return 'Moderate';
    return 'Light';
  };

  return (
    <Box p={4} maxW="1200px" mx="auto">
      <Heading as="h1" size="xl" mb={6} textAlign="center">
        Real-Time Traffic Congestion Map
      </Heading>

      <Flex direction={{ base: 'column', md: 'row' }} mb={6} gap={4}>
        <Box flex="1">
          <Select 
            value={selectedCity} 
            onChange={handleCityChange}
            placeholder="Select a city"
            mb={4}
          >
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}, {city.state}
              </option>
            ))}
          </Select>

          <Button 
            colorScheme="blue" 
            leftIcon={<FaMapMarkedAlt />} 
            onClick={handleRefresh}
            isLoading={loading}
            loadingText="Refreshing..."
            width="full"
          >
            Refresh Traffic Data
          </Button>
        </Box>

        <Box flex="1">
          {error && (
            <Alert status="error" mb={4}>
              <AlertIcon />
              <AlertTitle>Error!</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {trafficData && !error && (
            <VStack align="stretch" spacing={3}>
              <Text fontWeight="bold">
                Last Updated: {new Date(trafficData.last_updated).toLocaleString()}
              </Text>
              
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <Stat>
                  <StatLabel>Traffic Incidents</StatLabel>
                  <StatNumber>{trafficData.incidents.length}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="decrease" />
                    Active incidents
                  </StatHelpText>
                </Stat>
                
                <Stat>
                  <StatLabel>Flow Segments</StatLabel>
                  <StatNumber>{trafficData.flow_segments.length}</StatNumber>
                  <StatHelpText>
                    Monitored road segments
                  </StatHelpText>
                </Stat>
              </SimpleGrid>
            </VStack>
          )}
        </Box>
      </Flex>

      <Box 
        borderWidth="1px" 
        borderRadius="lg" 
        overflow="hidden" 
        height="500px"
        borderColor={borderColor}
        bg={bgColor}
        boxShadow="md"
        position="relative"
        zIndex="1"
      >
        {loading ? (
          <Flex height="100%" justify="center" align="center">
            <Spinner size="xl" />
          </Flex>
        ) : trafficData ? (
          <MapComponentReactLeaflet 
            traffic={trafficData} 
            mode="traffic"
            style={{ height: '100%', width: '100%' }}
          />
        ) : (
          <Flex height="100%" justify="center" align="center">
            <Text>Select a city to view traffic data</Text>
          </Flex>
        )}
      </Box>

      {trafficData && trafficData.incidents.length > 0 && (
        <Box mt={6}>
          <Heading as="h2" size="md" mb={4}>
            Traffic Incidents
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {trafficData.incidents.map((incident) => (
              <Box 
                key={incident.id} 
                p={4} 
                borderWidth="1px" 
                borderRadius="md"
                borderColor={borderColor}
                bg={bgColor}
              >
                <HStack mb={2}>
                  <Icon as={FaExclamationTriangle} color="red.500" />
                  <Text fontWeight="bold">{incident.type}</Text>
                  <Badge colorScheme={
                    incident.severity === 'HIGH' ? 'red' : 
                    incident.severity === 'MEDIUM' ? 'orange' : 'yellow'
                  }>
                    {incident.severity}
                  </Badge>
                </HStack>
                <Text mb={2}>{incident.description}</Text>
                <Text fontSize="sm" color="gray.500">
                  {new Date(incident.start_time).toLocaleString()}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </Box>
      )}

      {trafficData && trafficData.flow_segments.length > 0 && (
        <Box mt={6}>
          <Heading as="h2" size="md" mb={4}>
            Traffic Flow Segments
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {trafficData.flow_segments.map((segment, index) => {
              const congestionLevel = getCongestionLevel(segment.free_flow, segment.current_flow);
              const congestionColor = getCongestionColor(congestionLevel);
              const congestionText = getCongestionText(congestionLevel);
              
              return (
                <Box 
                  key={index} 
                  p={4} 
                  borderWidth="1px" 
                  borderRadius="md"
                  borderColor={borderColor}
                  bg={bgColor}
                >
                  <HStack mb={2}>
                    <Icon as={FaCar} color={congestionColor} />
                    <Text fontWeight="bold">Segment {index + 1}</Text>
                    <Badge colorScheme={
                      congestionLevel >= 70 ? 'red' : 
                      congestionLevel >= 30 ? 'orange' : 'green'
                    }>
                      {congestionText} Congestion
                    </Badge>
                  </HStack>
                  <SimpleGrid columns={2} spacing={2}>
                    <Stat size="sm">
                      <StatLabel>Free Flow</StatLabel>
                      <StatNumber>{segment.free_flow || 'N/A'} km/h</StatNumber>
                    </Stat>
                    <Stat size="sm">
                      <StatLabel>Current Flow</StatLabel>
                      <StatNumber>{segment.current_flow || 'N/A'} km/h</StatNumber>
                    </Stat>
                  </SimpleGrid>
                </Box>
              );
            })}
          </SimpleGrid>
        </Box>
      )}
    </Box>
  );
};

export default TrafficCongestionMap;