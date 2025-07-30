import React, { useState, useEffect } from 'react';
import { getWeather } from '../services/api';
import {
  Box,
  Input,
  Button,
  VStack,
  HStack,
  Text,
  useToast,
  Card,
  CardBody,                                                           
  Heading,
  Image,
  Flex,
  Spinner,
  useColorModeValue,
  Divider,
  Grid,
  GridItem,
  Icon,
  Badge,
  InputGroup,
  InputLeftElement,
  List,
  ListItem,
  ListIcon,
  StatNumber,
} from '@chakra-ui/react';
import { FaSearch, FaTemperatureHigh, FaTemperatureLow, FaWind, FaTint, FaEye, FaMapMarkerAlt } from 'react-icons/fa';
import { WiHumidity } from 'react-icons/wi';
import { BsCloudRain } from 'react-icons/bs';

const WeatherCard = ({ city }) => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        const data = await getWeather(city);
        setWeatherData(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (city) {
      fetchWeather();
    }
  }, [city]);

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

    setLoading(true);
    setError(null);
    
    try {
      const data = await getWeather(city);
      setWeatherData(data);
      
      toast({
        title: 'Success',
        description: `Weather data for ${data.city} retrieved successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch weather data');
      toast({
        title: 'Error',
        description: err.response?.data?.error || 'Failed to fetch weather data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-24 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!weatherData) {
    return null;
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">{weatherData.city}</h2>
      
      {/* Current Weather */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <img 
              src={`https:${weatherData.current.icon}`} 
              alt={weatherData.current.condition}
              className="w-16 h-16"
            />
            <div className="ml-4">
              <div className="text-4xl font-bold">{weatherData.current.temperature}°C</div>
              <div className="text-gray-600">{weatherData.current.condition}</div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center">
            <WiHumidity className="text-blue-500 text-2xl mr-2" />
            <div>
              <div className="text-sm text-gray-600">Humidity</div>
              <div className="font-semibold">{weatherData.current.humidity}%</div>
            </div>
          </div>
          <div className="flex items-center">
            <StatNumber fontSize="2xl">
              <Flex align="center">
                <Icon as={FaWind} mr={2} color={accentColor} />
                {weatherData.current.wind_speed} km/h
              </Flex>
            </StatNumber>
          </div>
        </div>
      </div>

      {/* Forecast */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3">5-Day Forecast</h3>
        <div className="grid grid-cols-5 gap-2">
          {weatherData.forecast.map((day, index) => (
            <div key={index} className="text-center p-2 rounded-lg bg-gray-50">
              <div className="text-sm font-medium">{formatDate(day.date)}</div>
              <img 
                src={`https:${day.icon}`} 
                alt={day.condition}
                className="w-10 h-10 mx-auto my-1"
              />
              <div className="text-sm font-semibold">{day.max_temp}°</div>
              <div className="text-xs text-gray-500">{day.min_temp}°</div>
              <div className="flex items-center justify-center mt-1">
                <BsCloudRain className="text-blue-500 text-xs mr-1" />
                <span className="text-xs">{day.chance_of_rain}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <List spacing={3} mt={4}>
        <ListItem>
          <Flex justify="space-between" align="center">
            <Flex align="center">
              <ListIcon as={FaTemperatureHigh} color="red.400" boxSize={5} />
              <Text>High Temperature</Text>
            </Flex>
            <Text fontWeight="bold">{weatherData.forecast[0].max_temp}°C</Text>
          </Flex>
        </ListItem>
        <ListItem>
          <Flex justify="space-between" align="center">
            <Flex align="center">
              <ListIcon as={FaTemperatureLow} color="blue.400" boxSize={5} />
              <Text>Low Temperature</Text>
            </Flex>
            <Text fontWeight="bold">{weatherData.forecast[0].min_temp}°C</Text>
          </Flex>
        </ListItem>
      </List>
    </div>
  );
};

export default WeatherCard;
