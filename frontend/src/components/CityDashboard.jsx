import React, { useState, useEffect } from 'react';
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
  Icon,
  Button,
  useColorModeValue,
  Flex,
  useToast,
  Image,
  SimpleGrid,
  AspectRatio,
  Fade,
  ScaleFade,
  SlideFade,
  IconButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Grid,
  GridItem,
  Badge,
  Spinner,
  Link,
} from '@chakra-ui/react';
import { SearchIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon } from '@chakra-ui/icons';
import { FaMapMarkerAlt, FaStar, FaImage, FaLightbulb, FaSubway, FaTaxi, FaMoneyBillWave, 
  FaUtensils, FaDumbbell, FaTree, FaHotel, FaHospital, FaMoneyBill, FaShoppingBag, 
  FaDirections, FaLocationArrow, FaRuler, FaPhone, FaGlobe } from 'react-icons/fa';
import { WiDaySunny, WiRain, WiDayCloudy } from 'react-icons/wi';
import { IoLanguage } from 'react-icons/io5';

const FOURSQUARE_API_KEY = 'fsq3yn1OREcmBFYwUhIojMCLRs3UC162HhsFGWNnpmWXbc4=';

const placeCategories = [
  { name: 'Restaurants', icon: FaUtensils, category: '13000' }, // Food & Restaurants
  { name: 'Cafes', icon: FaUtensils, category: '13035' }, // Coffee Shops
  { name: 'Tourist Spots', icon: FaLightbulb, category: '16000' }, // Points of Interest
  { name: 'Parks', icon: FaTree, category: '16032' }, // Parks & Nature
  { name: 'Hotels', icon: FaHotel, category: '19014' }, // Hotels
  { name: 'Hospitals', icon: FaHospital, category: '15014' }, // Medical
  { name: 'Shopping', icon: FaShoppingBag, category: '17000,17069' }, // Malls & Markets
  { name: 'Entertainment', icon: FaStar, category: '10000' }, // Arts & Entertainment
  { name: 'Religious', icon: FaLightbulb, category: '12000' }, // Religious Places
  { name: 'Transport', icon: FaSubway, category: '19042,19043,19044' }, // Bus, Train & Transport
];

const CityDashboard = ({ cityData, onSearch, isLoading }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const toast = useToast();
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [apiError, setApiError] = useState(null);

  const handleSearch = (cityName) => {
    if (!cityName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a city name',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    onSearch(cityName);
  };

  const searchNearbyPlaces = async (category) => {
    if (!cityData) return;
    
    setIsLoadingPlaces(true);
    setSelectedCategory(category);
    setApiError(null);
    
    try {
      const radius = 5000; // 5km radius
      const limit = 9; // Top 10 results
      
      const url = new URL('https://api.foursquare.com/v3/places/search');
      url.searchParams.append('ll', `${cityData.coordinates.latitude},${cityData.coordinates.longitude}`);
      url.searchParams.append('radius', radius);
      url.searchParams.append('limit', limit);
      url.searchParams.append('categories', category);
      url.searchParams.append('sort', 'RATING'); // Using single valid sort parameter
      url.searchParams.append('fields', 'fsq_id,name,location,geocodes,categories,rating,photos,description,tel,website,hours,distance');
      
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': FOURSQUARE_API_KEY,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Foursquare API error: ${response.status} - ${errorData.message || response.statusText}`
        );
      }
      
      const data = await response.json();
      
      if (!data || !data.results || data.results.length === 0) {
        setNearbyPlaces([]);
        toast({
          title: 'No places found',
          description: `No ${category} found in this area`,
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      // Transform the response to match our expected format
      const places = data.results.map(place => {
        // Format address properly
        let formattedAddress = 'No address available';
        if (place.location) {
          const addressParts = [];
          if (place.location.address) addressParts.push(place.location.address);
          if (place.location.locality) addressParts.push(place.location.locality);
          if (place.location.region) addressParts.push(place.location.region);
          if (place.location.postcode) addressParts.push(place.location.postcode);
          if (place.location.country) addressParts.push(place.location.country);
          
          formattedAddress = addressParts.filter(Boolean).join(', ');
        }

        return {
          id: place.fsq_id,
          name: place.name,
          categories: place.categories ? place.categories.map(cat => ({ name: cat.name })) : [],
          address: formattedAddress,
          coordinates: {
            latitude: place.geocodes?.main?.latitude,
            longitude: place.geocodes?.main?.longitude
          },
          distance: place.distance ? `${(place.distance / 1000).toFixed(1)} km` : 'Distance not available',
          rating: place.rating ? `${place.rating.toFixed(1)}/10` : 'No rating',
          description: place.description || '',
          contact: {
            phone: place.tel || 'Not available',
            website: place.website || 'Not available'
          },
          openingHours: place.hours?.display || 'Not available',
          images: place.photos ? place.photos.map(photo => photo.prefix + 'original' + photo.suffix) : []
        };
      });
      
      setNearbyPlaces(places);
      
      toast({
        title: 'Places found',
        description: `Found ${places.length} ${category}(s) nearby`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
    } catch (error) {
      console.error("Foursquare API error:", error);
      setApiError(`Error fetching places: ${error.message}`);
      toast({
        title: 'Error',
        description: `Failed to fetch nearby places: ${error.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoadingPlaces(false);
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % cityData.city_images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + cityData.city_images.length) % cityData.city_images.length);
  };

  // Update PlaceDetails component to use OpenTripMap data structure
  const PlaceDetails = ({ place, onClose }) => {
    if (!place) return null;
    
    return (
      <Box p={4}>
        <Flex justifyContent="space-between" alignItems="center" mb={4}>
          <Heading size="md">{place.name}</Heading>
          <IconButton 
            icon={<CloseIcon />} 
            aria-label="Close details"
            onClick={onClose}
            size="sm"
          />
        </Flex>
        
        {place.images && place.images.length > 0 && (
          <Box mb={4}>
            <Image 
              src={place.images[0]} 
              alt={place.name} 
              borderRadius="md"
              width="100%"
              height="200px"
              objectFit="cover"
            />
          </Box>
        )}
        
        <VStack align="start" spacing={3} mb={4}>
          <HStack>
            <Icon as={FaMapMarkerAlt} color="red.500" />
            <Text>{place.address}</Text>
          </HStack>
          
          {place.coordinates && (
            <HStack>
              <Icon as={FaLocationArrow} color="blue.500" />
              <Text>
                {place.coordinates.latitude.toFixed(5)}, {place.coordinates.longitude.toFixed(5)}
              </Text>
            </HStack>
          )}
          
          {place.distance && (
            <HStack>
              <Icon as={FaRuler} color="purple.500" />
              <Text>{(place.distance / 1000).toFixed(2)} km away</Text>
            </HStack>
          )}
          
          {place.rating && (
            <HStack>
              <Icon as={FaStar} color="yellow.500" />
              <Text>{place.rating.toFixed(1)}/5</Text>
            </HStack>
          )}

          {place.contact && (place.contact.phone || place.contact.website) && (
            <VStack align="start" spacing={2}>
              {place.contact.phone && (
                <HStack>
                  <Icon as={FaPhone} color="green.500" />
                  <Text>{place.contact.phone}</Text>
                </HStack>
              )}
              {place.contact.website && (
                <HStack>
                  <Icon as={FaGlobe} color="blue.500" />
                  <Link href={place.contact.website} isExternal color="blue.500">
                    Website
                  </Link>
                </HStack>
              )}
            </VStack>
          )}

          {place.openingHours && (
            <VStack align="start" spacing={2}>
              <Heading size="sm">Opening Hours</Heading>
              <Text whiteSpace="pre-wrap">{place.openingHours}</Text>
            </VStack>
          )}
        </VStack>
        
        {place.description && (
          <Box mb={4}>
            <Heading size="sm" mb={2}>Description</Heading>
            <Text>{place.description}</Text>
          </Box>
        )}
        
        <Box>
          <Button 
            leftIcon={<FaDirections />} 
            colorScheme="blue" 
            size="sm"
            as="a"
            href={`https://www.google.com/maps/dir/?api=1&destination=${place.coordinates.latitude},${place.coordinates.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Get Directions
          </Button>
        </Box>
      </Box>
    );
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {!cityData ? (
          <ScaleFade initialScale={0.9} in={true}>
            <Flex
              direction="column"
              align="center"
              justify="center"
              minH="70vh"
              bg={bgColor}
              borderRadius="lg"
              boxShadow="base"
              p={8}
            >
              <VStack spacing={8} maxW="600px" w="100%">
                <VStack spacing={4}>
                  <Heading 
                    size="2xl" 
                    textAlign="center" 
                    bgGradient="linear(to-r, blue.400, purple.500)" 
                    bgClip="text"
                  >
                    City Explorer
                  </Heading>
                  <Text 
                    fontSize="lg" 
                    textAlign="center" 
                    color="gray.600"
                  >
                    Discover the beauty and culture of cities around the world
                  </Text>
                </VStack>

                <VStack spacing={4} w="100%">
                  <InputGroup size="lg">
                    <InputLeftElement pointerEvents="none">
                      <SearchIcon color="gray.400" />
                    </InputLeftElement>
                    <Input 
                      placeholder="Enter city name (e.g., Chennai, Mumbai, Delhi)" 
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSearch(e.target.value);
                        }
                      }}
                      size="lg"
                      bg="white"
                      borderColor="gray.200"
                      _hover={{ borderColor: 'blue.400' }}
                      _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
                    />
                  </InputGroup>
                  <Button 
                    colorScheme="blue" 
                    size="lg"
                    w="100%"
                    onClick={() => {
                      const input = document.querySelector('input');
                      handleSearch(input.value);
                    }}
                    isLoading={isLoading}
                  >
                    Explore City
                  </Button>
                </VStack>

                <VStack spacing={2} align="start" w="100%">
                  <Text fontWeight="bold" color="gray.600">Popular Cities:</Text>
                  <HStack spacing={2} wrap="wrap">
                    {/* Tamil Nadu Cities */}
                    <Button
                      variant="outline"
                      size="sm"
                      mb={2}
                      colorScheme="blue"
                      onClick={() => handleSearch("Chennai")}
                    >
                      Chennai
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      mb={2}
                      colorScheme="blue"
                      onClick={() => handleSearch("Coimbatore")}
                    >
                      Coimbatore
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      mb={2}
                      colorScheme="blue"
                      onClick={() => handleSearch("Madurai")}
                    >
                      Madurai
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      mb={2}
                      colorScheme="blue"
                      onClick={() => handleSearch("Tiruchirappalli")}
                    >
                      Trichy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      mb={2}
                      colorScheme="blue"
                      onClick={() => handleSearch("Salem")}
                    >
                      Salem
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      mb={2}
                      colorScheme="blue" 
                      onClick={() => handleSearch("Tirunelveli")}
                    >
                      Tirunelveli
                    </Button>

                    {/* Other Indian Cities */}
                    <Button
                      variant="outline"
                      size="sm"
                      mb={2}
                      onClick={() => handleSearch("Mumbai")}
                    >
                      Mumbai
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      mb={2}
                      onClick={() => handleSearch("Delhi")}
                    >
                      Delhi
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      mb={2}
                      onClick={() => handleSearch("Kolkata")}
                    >
                      Kolkata
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      mb={2}
                      onClick={() => handleSearch("Bangalore")}
                    >
                      Bangalore
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      mb={2}
                      onClick={() => handleSearch("Hyderabad")}
                    >
                      Hyderabad
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      mb={2}
                      onClick={() => handleSearch("Ahmedabad")}
                    >
                      Ahmedabad
                    </Button>
                  </HStack>
                </VStack>
              </VStack>
            </Flex>
          </ScaleFade>
        ) : (
          <>
            {/* City Hero Section */}
            <Box position="relative" borderRadius="lg" overflow="hidden" height="400px">
              <Fade in={true}>
                {cityData.city_images && cityData.city_images.length > 0 && (
                  <Image
                    src={cityData.city_images[currentImageIndex]}
                    alt={cityData.name}
                    objectFit="cover"
                    width="100%"
                    height="100%"
                  />
                )}
                <Box
                  position="absolute"
                  top="0"
                  left="0"
                  right="0"
                  bottom="0"
                  bgGradient="linear(to-b, transparent, rgba(0,0,0,0.7))"
                  display="flex"
                  alignItems="flex-end"
                  p={8}
                >
                  <VStack align="start" spacing={2}>
                    <Heading size="2xl" color="white">{cityData.name}</Heading>
                    <Text color="whiteAlpha.900" fontSize="lg" noOfLines={2}>
                      {cityData.description}
                    </Text>
                  </VStack>
                </Box>
                {cityData.city_images.length > 1 && (
                  <>
                    <IconButton
                      aria-label="Previous image"
                      icon={<ChevronLeftIcon />}
                      position="absolute"
                      left="4"
                      top="50%"
                      transform="translateY(-50%)"
                      onClick={prevImage}
                      colorScheme="whiteAlpha"
                    />
                    <IconButton
                      aria-label="Next image"
                      icon={<ChevronRightIcon />}
                      position="absolute"
                      right="4"
                      top="50%"
                      transform="translateY(-50%)"
                      onClick={nextImage}
                      colorScheme="whiteAlpha"
                    />
                  </>
                )}
              </Fade>
            </Box>

            {/* Weather Section */}
            <SlideFade in={true} offsetY="20px">
              <Box p={4} bg="blue.50" borderRadius="lg">
                <HStack spacing={4}>
                  <Image
                    src={cityData.weather.icon}
                    alt="Weather icon"
                    boxSize="50px"
                  />
                  <VStack align="start" spacing={1}>
                    <Heading size="md">{cityData.weather.temperature}°C</Heading>
                    <Text>{cityData.weather.condition}</Text>
                    <HStack>
                      <Text>Humidity: {cityData.weather.humidity}%</Text>
                      <Text>Wind: {cityData.weather.wind_speed} km/h</Text>
                    </HStack>
                  </VStack>
                </HStack>
              </Box>
            </SlideFade>

            {/* Tips & Info Section */}
            {cityData.tips_and_info && cityData.tips_and_info.length > 0 && (
              <Box mb={8}>
                <Heading size="xl" mb={6}>Tips & Info</Heading>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {cityData.tips_and_info.map((tip, index) => {
                    // Determine which icon to use based on the title
                    let IconComponent;
                    let iconColor;
                    
                    if (tip.title.toLowerCase().includes('climate')) {
                      IconComponent = WiDaySunny;
                      iconColor = 'orange.400';
                    } else if (tip.title.toLowerCase().includes('transport')) {
                      IconComponent = FaSubway;
                      iconColor = 'blue.400';
                    } else if (tip.title.toLowerCase().includes('travel')) {
                      IconComponent = FaLightbulb;
                      iconColor = 'yellow.400';
                    } else if (tip.title.toLowerCase().includes('language')) {
                      IconComponent = IoLanguage;
                      iconColor = 'green.400';
                    } else if (tip.title.toLowerCase().includes('currency')) {
                      IconComponent = FaMoneyBillWave;
                      iconColor = 'green.500';
                    } else {
                      IconComponent = FaLightbulb;
                      iconColor = 'yellow.400';
                    }
                    
                    return (
                      <Box 
                        key={index}
                        bg={useColorModeValue('white', 'gray.700')}
                        borderRadius="lg"
                        overflow="hidden"
                        boxShadow="sm"
                        borderWidth="1px"
                        borderColor={useColorModeValue('gray.100', 'gray.700')}
                      >
                        <Box px={6} py={4}>
                          <HStack spacing={3} mb={4}>
                            <Icon
                              as={IconComponent}
                              boxSize="40px"
                              color={iconColor}
                            />
                            <Heading size="lg">{tip.title}</Heading>
                          </HStack>
                          
                          <VStack align="stretch" spacing={3}>
                            {tip.content.split('. ')
                              .filter(point => point.trim().length > 3)
                              .map((point, i) => (
                                <HStack key={i} alignItems="flex-start" spacing={3}>
                                  <Text as="span" fontWeight="bold" color="black">•</Text>
                                  <Text fontSize="md">
                                    {point.trim()}{point.endsWith('.') ? '' : '.'}
                                  </Text>
                                </HStack>
                            ))}
                          </VStack>
                        </Box>
                      </Box>
                    );
                  })}
                </SimpleGrid>
              </Box>
            )}

            {/* News Section */}
            {cityData.news && cityData.news.length > 0 && (
              <Box>
                <Heading size="xl" mb={6}>Latest News</Heading>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {cityData.news.map((article, index) => (
                    <Box
                      key={index}
                      borderWidth="1px"
                      borderRadius="lg"
                      overflow="hidden"
                      boxShadow="md"
                      transition="transform 0.2s"
                      _hover={{ transform: 'scale(1.02)' }}
                      bg={useColorModeValue('white', 'gray.700')}
                    >
                      <Box p={4}>
                        <Heading size="md" mb={2}>{article.title}</Heading>
                        <Text fontSize="sm" color="gray.500" mb={3}>
                          {article.description}
                        </Text>
                        <HStack spacing={2} justify="space-between">
                          <Text fontSize="xs" color="gray.400">
                            {new Date(article.published_at).toLocaleDateString()}
                          </Text>
                          <Text fontSize="xs" color="gray.400">
                            Source: {article.source}
                          </Text>
                        </HStack>
                        <Button
                          mt={4}
                          size="sm"
                          colorScheme="blue"
                          as="a"
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Read More
                        </Button>
                      </Box>
                    </Box>
                  ))}
                </SimpleGrid>
              </Box>
            )}

            {/* Famous Places Section */}
            <Box>
              <Heading size="xl" mb={6}>Popular places</Heading>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
                {cityData.famous_places && cityData.famous_places.length > 0 ? cityData.famous_places.map((place, index) => (
                  <ScaleFade key={index} in={true} delay={index * 0.1}>
                    <Box 
                      borderWidth="1px"
                      borderRadius="lg"
                      overflow="hidden"
                      transition="transform 0.3s"
                      _hover={{ transform: 'scale(1.03)' }}
                      boxShadow="md"
                    >
                      <AspectRatio ratio={4/3} width="100%">
                        {place.image_url ? (
                          <Image 
                            src={place.image_url} 
                            alt={place.name} 
                            objectFit="cover"
                          />
                        ) : (
                          <Box 
                            bg="gray.100" 
                            display="flex" 
                            alignItems="center" 
                            justifyContent="center"
                          >
                            <Icon as={FaImage} boxSize={10} color="gray.400" />
                          </Box>
                        )}
                      </AspectRatio>
                      <Box p={4}>
                        <Heading size="md" noOfLines={1}>{place.name}</Heading>
                        <Text fontSize="sm" color="gray.500" fontStyle="italic" noOfLines={2} mt={2}>
                          {place.why_famous || `A popular attraction in ${cityData.name}`}
                        </Text>
                      </Box>
                    </Box>
                  </ScaleFade>
                )) : (
                  <Text>No famous places found for this city.</Text>
                )}
              </SimpleGrid>
            </Box>

            {/* New Nearby Places Section */}
            <Box>
              <Heading size="xl" mb={6}>Nearby Places</Heading>
              <SimpleGrid columns={{ base: 2, md: 4, lg: 7 }} spacing={4} mb={8}>
                {placeCategories.map((category) => (
                  <Button
                    key={category.name}
                    leftIcon={<Icon as={category.icon} />}
                    colorScheme={selectedCategory === category.category ? 'blue' : 'gray'}
                    variant={selectedCategory === category.category ? 'solid' : 'outline'}
                    onClick={() => searchNearbyPlaces(category.category)}
                    size="sm"
                  >
                    {category.name}
                  </Button>
                ))}
              </SimpleGrid>

              {isLoadingPlaces ? (
                <Flex justify="center" align="center" minH="200px">
                  <Spinner size="xl" />
                </Flex>
              ) : nearbyPlaces.length > 0 ? (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {nearbyPlaces.map((place) => (
                    <Box
                      key={place.id}
                      borderWidth="1px"
                      borderRadius="lg"
                      overflow="hidden"
                      boxShadow="md"
                      transition="transform 0.2s"
                      _hover={{ transform: 'scale(1.02)' }}
                      bg={useColorModeValue('white', 'gray.700')}
                    >
                      <Box p={4}>
                        <Heading size="md" mb={2}>{place.name}</Heading>
                        <HStack spacing={2} mb={2}>
                          <Icon as={FaMapMarkerAlt} color="red.500" />
                          <Text fontSize="sm" color="gray.500">
                            {place.address}
                          </Text>
                        </HStack>
                        
                        <HStack spacing={2} mb={3} flexWrap="wrap">
                          {place.categories.map((cat) => (
                            <Badge key={cat.name} colorScheme="blue" mb={1}>
                              {cat.name}
                            </Badge>
                          ))}
                        </HStack>
                        
                        {place.distance && (
                          <HStack spacing={2}>
                            <Icon as={FaStar} color="yellow.500" />
                            <Text fontSize="sm" fontWeight="bold">
                              {(place.distance / 1000).toFixed(1)} km away
                            </Text>
                          </HStack>
                        )}
                      </Box>
                    </Box>
                  ))}
                </SimpleGrid>
              ) : selectedCategory && (
                <Box 
                  p={8} 
                  textAlign="center" 
                  borderWidth="1px" 
                  borderRadius="lg" 
                  borderStyle="dashed"
                >
                  <Text color="gray.500" fontSize="lg">
                    No {placeCategories.find(c => c.category === selectedCategory)?.name || 'places'} found in {cityData.name}
                  </Text>
                  <Text color="gray.400" fontSize="sm" mt={2}>
                    Try a different category or city
                  </Text>
                </Box>
              )}
            </Box>
          </>
        )}
      </VStack>
    </Container>
  );
};

export default CityDashboard; 