import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Input,
  Button,
  Text,
  useToast,
  Heading,
  Flex,
  Icon,
  useColorModeValue,
  Spinner,
  Badge,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Divider,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  List,
  ListItem,
  ListIcon,
  Select,
  Collapse,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaCar, 
  FaTrafficLight, 
  FaMapMarkerAlt, 
  FaClock, 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaTimesCircle,
  FaRoute,
  FaSearch,
  FaDirections,
  FaChevronDown,
  FaChevronRight,
  FaBus,
  FaWalking,
  FaBicycle
} from 'react-icons/fa';
import { getTraffic, searchLocation, getRoute } from '../services/api';
import MapComponentReactLeaflet from '../MapComponent';
import axios from 'axios';
import { debounce } from 'lodash';

// Create motion components using the new syntax
const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5 }
  }
};

const EnhancedTrafficMap = () => {
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [trafficData, setTrafficData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showRouteOptions, setShowRouteOptions] = useState(false);
  const [transportMode, setTransportMode] = useState('car');
  const [showCityPopup, setShowCityPopup] = useState(false);
  const toast = useToast();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.700');

  const transportModes = [
    { name: 'Car', value: 'car', icon: <FaCar />, eta: 'Fastest route' },
    { name: 'Public Transit', value: 'transit', icon: <FaBus />, eta: 'Includes walking' },
    { name: 'Walking', value: 'pedestrian', icon: <FaWalking />, eta: 'No traffic' },
    { name: 'Bicycle', value: 'bicycle', icon: <FaBicycle />, eta: 'Bike lanes' }
  ];

  const [startSuggestions, setStartSuggestions] = useState([]);
  const [endSuggestions, setEndSuggestions] = useState([]);
  const [selectedStart, setSelectedStart] = useState(null);
  const [selectedEnd, setSelectedEnd] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);

  // Debounced search for start location
  const debouncedStartSearch = useRef(
    debounce(async (value) => {
      if (value.length < 2) return setStartSuggestions([]);
      try {
        const results = await searchLocation(value);
        setStartSuggestions(results);
      } catch (e) {
        setStartSuggestions([]);
      }
    }, 500)
  ).current;

  // Debounced search for end location
  const debouncedEndSearch = useRef(
    debounce(async (value) => {
      if (value.length < 2) return setEndSuggestions([]);
      try {
        const results = await searchLocation(value);
        setEndSuggestions(results);
      } catch (e) {
        setEndSuggestions([]);
      }
    }, 500)
  ).current;

  // Handle start location input
  const handleStartInput = (e) => {
    setStartLocation(e.target.value);
    setSelectedStart(null);
    debouncedStartSearch(e.target.value);
  };

  // Handle end location input
  const handleEndInput = (e) => {
    setEndLocation(e.target.value);
    setSelectedEnd(null);
    debouncedEndSearch(e.target.value);
  };

  // Handle start suggestion select
  const handleStartSelect = (suggestion) => {
    setStartLocation(suggestion.name);
    setSelectedStart(suggestion);
    setStartSuggestions([]);
    setErrorMessage('');
  };

  // Handle end suggestion select
  const handleEndSelect = (suggestion) => {
    setEndLocation(suggestion.name);
    setSelectedEnd(suggestion);
    setEndSuggestions([]);
    setErrorMessage('');
  };

  // Only allow route search if both start and end are selected
  const canGetRoute = selectedStart && selectedEnd;

  // Update map center when a city is selected
  useEffect(() => {
    if (selectedStart && !selectedEnd) {
      setTrafficData({
        latitude: selectedStart.latitude,
        longitude: selectedStart.longitude,
        location: selectedStart.name
      });
      setSelectedRoute(null);
    }
    if (selectedEnd && !selectedStart) {
      setTrafficData({
        latitude: selectedEnd.latitude,
        longitude: selectedEnd.longitude,
        location: selectedEnd.name
      });
      setSelectedRoute(null);
    }
  }, [selectedStart, selectedEnd]);

  // Modified handleRouteSearch to use selected suggestions
  const handleRouteSearch = async () => {
    if (!canGetRoute) {
      setErrorMessage('Please select both start and end locations from the suggestions.');
      return;
    }
    setShowCityPopup(false);
    setSearchResults([]);
    setSelectedResult(null);
    setRouteLoading(true);
    setErrorMessage('');
    try {
      const route = await getRoute(selectedStart.name, selectedEnd.name, transportMode);
      setSelectedRoute(route);
      setShowRouteOptions(true);
      // Center map on route
      const routeCenter = route.coordinates[Math.floor(route.coordinates.length / 2)];
      setTrafficData({
        latitude: routeCenter[0],
        longitude: routeCenter[1],
        location: `${selectedStart.name} to ${selectedEnd.name}`
      });
    } catch (error) {
      setErrorMessage(error.message || 'Failed to get route. Please try again.');
      setSelectedRoute(null);
    } finally {
      setRouteLoading(false);
    }
  };

  // Initialize with user's location
  useEffect(() => {
    const getUserLocation = () => {
      if (navigator.geolocation) {
        setLoading(true);
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              // Reverse geocode the coordinates to get the location name
              const response = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
                params: {
                  lat: position.coords.latitude,
                  lon: position.coords.longitude,
                  format: 'json'
                }
              });

              const locationName = response.data.display_name;
              const data = await getTraffic(locationName);
              setTrafficData({
                ...data,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                location: locationName
              });
            } catch (error) {
              console.error('Error getting location data:', error);
              toast({
                title: 'Error',
                description: 'Failed to get your location data. Using default location.',
                status: 'error',
                duration: 3000,
                isClosable: true,
              });
              // Fallback to default location if geolocation fails
              fetchDefaultTrafficData();
            } finally {
              setLoading(false);
            }
          },
          (error) => {
            console.error('Geolocation error:', error);
            toast({
              title: 'Location Access Denied',
              description: 'Using default location. Enable location access for better results.',
              status: 'warning',
              duration: 5000,
              isClosable: true,
            });
            // Fallback to default location if geolocation is denied
            fetchDefaultTrafficData();
          }
        );
      } else {
        // Fallback for browsers that don't support geolocation
        fetchDefaultTrafficData();
      }
    };

    const fetchDefaultTrafficData = async () => {
      try {
        const defaultLocation = 'New York'; // Default to a major city
        const data = await getTraffic(defaultLocation);
        setTrafficData(data);
      } catch (error) {
        console.error('Error fetching default traffic data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load initial traffic data',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    getUserLocation();
  }, []);

  // Function to fit map bounds to show all markers
  const fitMapToMarkers = (results) => {
    if (!mapRef.current || !results.length) return;

    const bounds = results.reduce(
      (bounds, result) => bounds.extend([result.latitude, result.longitude]),
      L.latLngBounds([results[0].latitude, results[0].longitude], [results[0].latitude, results[0].longitude])
    );

    mapRef.current.fitBounds(bounds, { padding: [50, 50] });
  };

  // Function to handle keyboard navigation
  const handleKeyPress = async (e) => {
    if (e.key === 'Enter') {
      if (e.target.name === 'search') {
        handleSearch();
      } else if (e.target.name === 'route' && startLocation && endLocation) {
        handleRouteSearch();
      }
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) {
      toast({
        title: 'Error',
        description: 'Please enter a search query',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setSearchLoading(true);
    try {
      const results = await searchLocation(searchQuery);
      setSearchResults(results);
      setSelectedResult(null);
      setSelectedRoute(null); // Clear any existing route
      setShowCityPopup(true); // Show popup for city search
      
      if (results.length > 0) {
        // Update traffic data for the first result
        const data = await getTraffic(results[0].name);
        setTrafficData({
          ...data,
          latitude: results[0].latitude,
          longitude: results[0].longitude,
          location: results[0].name
        });
        // Fit map to show all search results
        fitMapToMarkers(results);
      }
    } catch (error) {
      console.error('Error searching location:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to search location',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleResultClick = async (result) => {
    setSelectedResult(result);
    setSearchLoading(true);
    try {
      const data = await getTraffic(result.name);
      setTrafficData({
        ...data,
        latitude: result.latitude,
        longitude: result.longitude,
        location: result.name
      });
      setSearchQuery(result.name);
      // Auto-fill start location with the selected result
      setStartLocation(result.name);
      // Center map on selected location
      if (mapRef.current) {
        mapRef.current.setView([result.latitude, result.longitude], 13);
      }
      // If both start and end are set, trigger route search
      if (startLocation && endLocation) {
        handleRouteSearch();
      }
    } catch (error) {
      console.error('Error getting traffic data:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to get traffic data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSearchLoading(false);
    }
  };

  // Auto-trigger route search when both start and end locations are set and changed
  useEffect(() => {
    if (startLocation && endLocation && startLocation !== endLocation) {
      handleRouteSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startLocation, endLocation, transportMode]);

  // Add map reference
  const mapRef = useRef(null);

  // Automatically fit map to route when selectedRoute changes
  useEffect(() => {
    if (selectedRoute && selectedRoute.coordinates && selectedRoute.coordinates.length > 1 && mapRef.current) {
      const L = require('leaflet');
      const bounds = L.latLngBounds(selectedRoute.coordinates.map(coord => [coord[0], coord[1]]));
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [selectedRoute]);

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')} py={8}>
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          <MotionBox
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <Heading size="lg" textAlign="center" bgGradient="linear(to-r, blue.400, purple.500)" bgClip="text">
              Travel Route Map
            </Heading>
          </MotionBox>

          {/* Search Panel */}
          <Card bg={cardBg} borderRadius="lg" boxShadow="lg">
            <CardBody>
              <VStack spacing={4}>
                <HStack width="100%">
                  <Input
                    name="search"
                    placeholder="Search location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    size="lg"
                    bg={bgColor}
                    borderColor={borderColor}
                  />
                  <Button
                    colorScheme="blue"
                    size="lg"
                    onClick={handleSearch}
                    isLoading={searchLoading}
                    leftIcon={<FaSearch />}
                  >
                    Search
                  </Button>
                </HStack>

                {/* Route Planning */}
                <HStack width="100%" spacing={4}>
                  <Box position="relative" width="100%">
                    <Input
                      name="route"
                      placeholder="Start location"
                      value={startLocation}
                      onChange={handleStartInput}
                      size="lg"
                      bg={bgColor}
                      borderColor={borderColor}
                      autoComplete="off"
                    />
                    {startSuggestions.length > 0 && (
                      <Box position="absolute" zIndex={10} bg="white" width="100%" boxShadow="md" borderRadius="md">
                        {startSuggestions.map((s, i) => (
                          <Box key={i} px={4} py={2} _hover={{ bg: 'gray.100', cursor: 'pointer' }} onClick={() => handleStartSelect(s)}>
                            {s.name}
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                  <Box position="relative" width="100%">
                    <Input
                      name="route"
                      placeholder="End location"
                      value={endLocation}
                      onChange={handleEndInput}
                      size="lg"
                      bg={bgColor}
                      borderColor={borderColor}
                      autoComplete="off"
                    />
                    {endSuggestions.length > 0 && (
                      <Box position="absolute" zIndex={10} bg="white" width="100%" boxShadow="md" borderRadius="md">
                        {endSuggestions.map((s, i) => (
                          <Box key={i} px={4} py={2} _hover={{ bg: 'gray.100', cursor: 'pointer' }} onClick={() => handleEndSelect(s)}>
                            {s.name}
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                  <Select
                    value={transportMode}
                    onChange={(e) => setTransportMode(e.target.value)}
                    size="lg"
                    width="200px"
                    bg={bgColor}
                    borderColor={borderColor}
                  >
                    {transportModes.map((mode) => (
                      <option key={mode.value} value={mode.value}>
                        {mode.name}
                      </option>
                    ))}
                  </Select>
                  <Button
                    colorScheme="blue"
                    size="lg"
                    onClick={handleRouteSearch}
                    isLoading={routeLoading}
                    leftIcon={<FaDirections />}
                    isDisabled={!canGetRoute}
                  >
                    Get Route
                  </Button>
                </HStack>
                {/* Show error message if any */}
                {errorMessage && (
                  <Box mt={2} color="red.500" fontWeight="bold">{errorMessage}</Box>
                )}
              </VStack>
            </CardBody>
          </Card>

          {/* Map and Traffic Information */}
          <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6}>
            <GridItem colSpan={{ base: 1, md: 2 }}>
              <Box 
                height="600px" 
                width="100%"
                borderRadius="lg" 
                overflow="hidden" 
                boxShadow="lg"
                position="relative"
              >
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
                <MapComponentReactLeaflet 
                  ref={mapRef}
                  traffic={trafficData} 
                  mode={transportMode}
                  route={selectedRoute}
                  searchResults={selectedRoute ? [] : searchResults}
                  selectedResult={selectedRoute ? null : selectedResult}
                  onMarkerClick={handleResultClick}
                />
                {/* City search popup */}
                {showCityPopup && !selectedRoute && (
                  <Box position="absolute" top="20px" left="50%" transform="translateX(-50%)" bg="white" p={4} borderRadius="md" boxShadow="lg" zIndex={20} minW="300px">
                    <Text fontWeight="bold" color="blue.600">Enter start and destination city to find the best route.</Text>
                    <Button mt={2} colorScheme="blue" size="sm" onClick={() => setShowCityPopup(false)}>Close</Button>
                  </Box>
                )}
              </Box>
            </GridItem>

            <GridItem>
              <VStack spacing={4} align="stretch">
                {/* Search Results */}
                {searchResults.length > 0 && !selectedRoute && (
                  <MotionBox
                    initial="hidden"
                    animate="visible"
                    variants={itemVariants}
                  >
                    <Card bg={cardBg} borderRadius="lg" boxShadow="lg">
                      <CardHeader>
                        <Heading size="md">Search Results</Heading>
                      </CardHeader>
                      <CardBody>
                        <List spacing={2}>
                          {searchResults.map((result, index) => (
                            <ListItem 
                              key={index} 
                              p={2} 
                              _hover={{ bg: 'gray.100', cursor: 'pointer' }}
                              onClick={() => handleResultClick(result)}
                            >
                              <HStack>
                                <Icon as={FaMapMarkerAlt} color="blue.500" />
                                <VStack align="start" spacing={0}>
                                  <Text fontWeight="medium">{result.name}</Text>
                                  <Text fontSize="sm" color="gray.600">{result.type}</Text>
                                </VStack>
                              </HStack>
                            </ListItem>
                          ))}
                        </List>
                      </CardBody>
                    </Card>
                  </MotionBox>
                )}

                {/* Route Information */}
                {selectedRoute && (
                  <MotionBox
                    initial="hidden"
                    animate="visible"
                    variants={itemVariants}
                  >
                    <Card bg={cardBg} borderRadius="lg" boxShadow="lg">
                      <CardHeader>
                        <Heading size="md">Route Information</Heading>
                      </CardHeader>
                      <CardBody>
                        <VStack align="stretch" spacing={4}>
                          <Stat>
                            <StatLabel>Distance</StatLabel>
                            <StatNumber>{selectedRoute.distance} km</StatNumber>
                          </Stat>
                          <Stat>
                            <StatLabel>Duration</StatLabel>
                            <StatNumber>{selectedRoute.formattedDuration || selectedRoute.duration + ' min'}</StatNumber>
                          </Stat>
                          {selectedRoute.formattedTrafficDelay && (
                            <Stat>
                              <StatLabel>Traffic Delay</StatLabel>
                              <StatNumber>{selectedRoute.formattedTrafficDelay}</StatNumber>
                            </Stat>
                          )}
                        </VStack>
                      </CardBody>
                    </Card>
                  </MotionBox>
                )}

                {/* Traffic Alerts */}
                {trafficData?.alerts && trafficData.alerts.length > 0 && (
                  <MotionBox
                    initial="hidden"
                    animate="visible"
                    variants={itemVariants}
                  >
                    <Card bg={cardBg} borderRadius="lg" boxShadow="lg">
                      <CardHeader>
                        <Heading size="md">Traffic Alerts</Heading>
                      </CardHeader>
                      <CardBody>
                        <List spacing={2}>
                          {trafficData.alerts.map((alert, index) => (
                            <ListItem key={index}>
                              <ListIcon as={FaExclamationTriangle} color="orange.500" />
                              {alert}
                            </ListItem>
                          ))}
                        </List>
                      </CardBody>
                    </Card>
                  </MotionBox>
                )}
              </VStack>
            </GridItem>
          </Grid>
        </VStack>
      </Container>
    </Box>
  );
};

export default EnhancedTrafficMap;