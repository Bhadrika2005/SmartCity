import React, { useState, useEffect } from 'react';
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
  SimpleGrid,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Card,
  CardBody,
  CardHeader,
  List,
  ListItem,
  ListIcon,
  Image,
  Tooltip,
  Center,
  Circle,
  useBreakpointValue,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import { 
  WiDaySunny, 
  WiRain, 
  WiSnow, 
  WiFog, 
  WiCloudy, 
  WiThunderstorm,
  WiStrongWind,
  WiHumidity,
  WiRaindrop,
  WiBarometer,
  WiThermometer,
  WiTime4,
  WiSunrise,
  WiSunset,
  WiWindDeg,
  WiRaindrop as WiDroplet,
  WiFog as WiMist,
  WiCloudy as WiCloud,
  WiThunderstorm as WiStorm,
  WiDaySunny as WiSun,
} from 'react-icons/wi';
import { 
  FaMapMarkerAlt, 
  FaSearch, 
  FaCloud, 
  FaCloudRain, 
  FaSnowflake, 
  FaSmog, 
  FaBolt,
  FaTemperatureHigh,
  FaTemperatureLow,
  FaWind,
  FaTint,
  FaEye,
  FaCloudSun,
  FaCloudMoon,
  FaMoon,
  FaSun,
  FaCloudShowersHeavy,
  FaCloudRain as FaRain,
  FaCloudSun as FaCloudSunny,
  FaCloudMoon as FaCloudMoony,
  FaMoon as FaMoonPhase,
  FaSun as FaSunPhase,
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import { getWeather } from '../services/api';

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

const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.8 }
  }
};

const scaleVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: { duration: 0.5 }
  }
};

// Weather icon mapping
const weatherIcons = {
  'Sunny': FaSunPhase,
  'Clear': FaSunPhase,
  'Partly cloudy': FaCloudSunny,
  'Cloudy': FaCloud,
  'Rain': FaRain,
  'Snow': FaSnowflake,
  'Mist': FaSmog,
  'Fog': FaSmog,
  'Thunder': FaBolt,
  'Thunderstorm': FaBolt,
  'Light rain': FaCloudRain,
  'Heavy rain': FaCloudShowersHeavy,
  'Light snow': FaSnowflake,
  'Heavy snow': FaSnowflake,
  'Sleet': FaSnowflake,
  'Hail': FaSnowflake,
  'Drizzle': FaCloudRain,
  'Overcast': FaCloud,
  'Blizzard': FaSnowflake,
  'Dust': FaSmog,
  'Smoke': FaSmog,
  'Haze': FaSmog,
  'Sand': FaSmog,
  'Ash': FaSmog,
  'Squall': FaWind,
  'Tornado': FaWind,
};

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);
const MotionGrid = motion(Grid);
const MotionCard = motion(Card);

const Weather = () => {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const toast = useToast();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.700');
  const accentColor = useColorModeValue('blue.500', 'blue.300');
  const textColor = useColorModeValue('gray.800', 'white');
  const subTextColor = useColorModeValue('gray.600', 'gray.300');
  const iconColor = useColorModeValue('yellow.500', 'yellow.300');
  const gradientBg = useColorModeValue(
    'linear(to-r, blue.100, purple.100)',
    'linear(to-r, blue.900, purple.900)'
  );
  
  const isMobile = useBreakpointValue({ base: true, md: false });

  const handleSearch = async () => {
    if (!city) {
      toast({
        title: 'Error',
        description: 'Please enter a city name',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    try {
      const data = await getWeather(city);
      setWeather(data);
    } catch (error) {
      console.error('Error fetching weather:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to fetch weather data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (condition) => {
    const iconKey = Object.keys(weatherIcons).find(key => 
      condition.toLowerCase().includes(key.toLowerCase())
    );
    return weatherIcons[iconKey] || FaSunPhase;
  };

  const getAQIColor = (aqi) => {
    if (aqi >= 150) return 'red';
    if (aqi >= 100) return 'orange';
    if (aqi >= 50) return 'yellow';
    return 'green';
  };

  const getAQIStatus = (aqi) => {
    if (aqi >= 150) return 'Unhealthy';
    if (aqi >= 100) return 'Moderate';
    if (aqi >= 50) return 'Sensitive';
    return 'Good';
  };

  const getWindDirection = (degrees) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <MotionBox
          variants={fadeInVariants}
          initial="hidden"
          animate="visible"
          textAlign="center"
          position="relative"
          mb={2}
        >
          {/* Animated background gradient */}
          <Box
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            w={{ base: '120%', md: '80%' }}
            h={{ base: '120px', md: '180px' }}
            zIndex={0}
            bgGradient="radial(ellipse at center, blue.100 0%, purple.100 100%)"
            filter="blur(32px)"
            opacity={0.7}
            borderRadius="3xl"
          />
          {/* Decorative weather icon */}
          <Box position="absolute" top={{ base: '10px', md: '20px' }} left={{ base: '10px', md: '40px' }} zIndex={1}>
            <Icon as={WiDaySunny} boxSize={{ base: 12, md: 20 }} color="yellow.300" filter="drop-shadow(0 2px 8px #fbbf24)" />
          </Box>
          <Heading 
            size="2xl" 
            bgGradient="linear(to-r, blue.400, purple.500, pink.400)" 
            bgClip="text"
            fontWeight="extrabold"
            letterSpacing="tight"
            fontFamily="'Poppins', 'Segoe UI', Arial, sans-serif"
            textShadow="0 4px 24px rgba(80,0,120,0.10)"
            zIndex={2}
            position="relative"
            mb={2}
          >
            Weather Insights
          </Heading>
          <Text fontSize={{ base: 'lg', md: 'xl' }} color={subTextColor} zIndex={2} position="relative" fontWeight="medium" mb={2}>
            Get detailed weather information for any city around the world
          </Text>
        </MotionBox>

        <MotionBox
          variants={scaleVariants}
          initial="hidden"
          animate="visible"
          p={6}
          bg={cardBg}
          borderRadius="lg"
          boxShadow="lg"
          borderWidth={1}
          borderColor={borderColor}
        >
          <HStack spacing={4}>
            <InputGroup size="lg">
              <InputLeftElement pointerEvents="none">
                <Icon as={FaMapMarkerAlt} color={accentColor} />
              </InputLeftElement>
              <Input
                placeholder="Enter city name..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                size="lg"
                bg={bgColor}
                borderColor={borderColor}
                _hover={{ borderColor: accentColor }}
                _focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
              />
            </InputGroup>
            <Button
              colorScheme="blue"
              size="lg"
              onClick={handleSearch}
              isLoading={loading}
              loadingText="Searching..."
              leftIcon={<FaSearch />}
            >
              Search
            </Button>
          </HStack>
        </MotionBox>

        {loading && (
          <Center py={10}>
            <Spinner size="xl" color={accentColor} thickness="4px" />
          </Center>
        )}

        {weather && !loading && (
          <MotionBox
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <Tabs 
              variant="enclosed" 
              colorScheme="blue" 
              onChange={(index) => setActiveTab(index)}
              isFitted
              mb={6}
            >
              <TabList>
                <Tab>Current Weather</Tab>
                <Tab>Forecast</Tab>
                <Tab>Details</Tab>
              </TabList>

              <TabPanels>
                {/* Current Weather Tab */}
                <TabPanel>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <MotionCard
                      variants={itemVariants}
                      bg={cardBg}
                      borderRadius="lg"
                      boxShadow="lg"
                      borderWidth={1}
                      borderColor={borderColor}
                      overflow="hidden"
                    >
                      <CardBody p={6}>
                        <VStack spacing={4} align="center">
                          <Image
                            src={`https:${weather.current.icon}`}
                            alt={weather.current.condition}
                            boxSize="80px"
                          />
                          <Heading size="lg">{weather.city}</Heading>
                          <Text fontSize="5xl" fontWeight="bold">
                            {weather.current.temperature}°C
                          </Text>
                          <Text color={subTextColor} fontSize="xl">
                            {weather.current.condition}
                          </Text>
                        </VStack>
                      </CardBody>
                    </MotionCard>
                    <MotionCard
                      variants={itemVariants}
                      bg={cardBg}
                      borderRadius="lg"
                      boxShadow="lg"
                      borderWidth={1}
                      borderColor={borderColor}
                      overflow="hidden"
                    >
                      <CardBody p={6}>
                        <SimpleGrid columns={2} spacing={4}>
                          <Stat>
                            <StatLabel color={subTextColor}>Wind</StatLabel>
                            <StatNumber fontSize="2xl">
                              <Flex align="center">
                                <Icon as={FaWind} mr={2} color={accentColor} />
                                {weather.current.wind_speed} km/h
                              </Flex>
                            </StatNumber>
                          </Stat>
                          <Stat>
                            <StatLabel color={subTextColor}>Humidity</StatLabel>
                            <StatNumber fontSize="2xl">
                              <Flex align="center">
                                <Icon as={FaTint} mr={2} color={accentColor} />
                                {weather.current.humidity}%
                              </Flex>
                            </StatNumber>
                          </Stat>
                        </SimpleGrid>
                      </CardBody>
                    </MotionCard>
                  </SimpleGrid>
                </TabPanel>

                {/* Forecast Tab */}
                <TabPanel>
                  <MotionCard
                    variants={itemVariants}
                    bg={cardBg}
                    borderRadius="lg"
                    boxShadow="lg"
                    borderWidth={1}
                    borderColor={borderColor}
                    overflow="hidden"
                  >
                    <CardHeader bg={gradientBg} py={4}>
                      <Heading size="md">Today + Next 4 Days Forecast</Heading>
                    </CardHeader>
                    <CardBody p={6}>
                      <SimpleGrid columns={{ base: 1, sm: 2, md: 5 }} spacing={6}>
                        {(() => {
                          if (!weather.forecast || weather.forecast.length === 0) return null;
                          const todayStr = new Date().toISOString().slice(0, 10);
                          let todayIdx = weather.forecast.findIndex(day => day.date === todayStr);
                          if (todayIdx === -1) {
                            todayIdx = 0;
                          }
                          const start = todayIdx;
                          const end = Math.min(weather.forecast.length, todayIdx + 5);
                          const daysToShow = weather.forecast.slice(start, end);
                          return daysToShow.map((day, index) => (
                            <Box
                              key={index}
                              bgGradient="linear(to-br, blue.50, white)"
                              borderRadius="2xl"
                              boxShadow="0 4px 24px 0 rgba(0,0,0,0.08)"
                              p={5}
                              transition="transform 0.2s, box-shadow 0.2s"
                              _hover={{
                                transform: 'translateY(-6px) scale(1.04)',
                                boxShadow: '0 8px 32px 0 rgba(0,0,0,0.16)',
                                bgGradient: 'linear(to-br, blue.100, purple.50)'
                              }}
                              display="flex"
                              flexDirection="column"
                              alignItems="center"
                              justifyContent="center"
                            >
                              <Text fontWeight="bold" fontSize="lg" color="blue.700" mb={2}>
                                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                              </Text>
                              <Image src={`https:${day.icon}`} alt={day.condition} boxSize="56px" mb={2} dropShadow="md" />
                              <Text fontSize="3xl" fontWeight="extrabold" color="purple.700" mb={1}>
                                {day.max_temp}°
                              </Text>
                              <Text fontSize="md" color="gray.500" mb={1}>
                                {day.min_temp}°
                              </Text>
                              <Text fontSize="md" color="gray.700" fontWeight="medium" mb={2}>
                                {day.condition}
                              </Text>
                              <Flex align="center" fontSize="md" color={day.chance_of_rain > 40 ? 'blue.500' : 'blue.300'}>
                                <Icon as={FaTint} mr={1} />
                                <Text fontWeight="bold">{day.chance_of_rain}%</Text>
                              </Flex>
                            </Box>
                          ));
                        })()}
                      </SimpleGrid>
                    </CardBody>
                  </MotionCard>
                </TabPanel>

                {/* Details Tab */}
                <TabPanel>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <MotionCard
                      variants={itemVariants}
                      bg={cardBg}
                      borderRadius="lg"
                      boxShadow="lg"
                      borderWidth={1}
                      borderColor={borderColor}
                      overflow="hidden"
                    >
                      <CardHeader bg={gradientBg} py={4}>
                        <Heading size="md">Weather Details</Heading>
                      </CardHeader>
                      <CardBody>
                        <List spacing={3}>
                          <ListItem>
                            <Flex justify="space-between" align="center">
                              <Flex align="center">
                                <ListIcon as={FaTemperatureHigh} color="red.400" boxSize={5} />
                                <Text>High Temperature</Text>
                              </Flex>
                              <Text fontWeight="bold">{weather.forecast[0].max_temp}°C</Text>
                            </Flex>
                          </ListItem>
                          <ListItem>
                            <Flex justify="space-between" align="center">
                              <Flex align="center">
                                <ListIcon as={FaTemperatureLow} color="blue.400" boxSize={5} />
                                <Text>Low Temperature</Text>
                              </Flex>
                              <Text fontWeight="bold">{weather.forecast[0].min_temp}°C</Text>
                            </Flex>
                          </ListItem>
                          <ListItem>
                            <Flex justify="space-between" align="center">
                              <Flex align="center">
                                <ListIcon as={FaWind} color="gray.400" boxSize={5} />
                                <Text>Wind Speed</Text>
                              </Flex>
                              <Text fontWeight="bold">{weather.current.wind_speed} km/h</Text>
                            </Flex>
                          </ListItem>
                          <ListItem>
                            <Flex justify="space-between" align="center">
                              <Flex align="center">
                                <ListIcon as={FaTint} color="blue.400" boxSize={5} />
                                <Text>Humidity</Text>
                              </Flex>
                              <Text fontWeight="bold">{weather.current.humidity}%</Text>
                            </Flex>
                          </ListItem>
                        </List>
                      </CardBody>
                    </MotionCard>
                  </SimpleGrid>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </MotionBox>
        )}
      </VStack>
    </Container>
  );
};

export default Weather; 