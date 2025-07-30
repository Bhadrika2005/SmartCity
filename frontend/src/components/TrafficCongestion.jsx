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
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FaCar, FaTrafficLight, FaMapMarkerAlt, FaClock, FaExclamationTriangle, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { getTraffic } from '../services/api';
import SearchTrafficMap from '../SearchTrafficMap';

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

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

const TrafficCongestion = () => {
  const [location, setLocation] = useState('');
  const [traffic, setTraffic] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.700');

  const handleSearch = async () => {
    if (!location) {
      toast({
        title: 'Error',
        description: 'Please enter a location',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    try {
      const data = await getTraffic(location);
      setTraffic(data);
    } catch (error) {
      console.error('Error fetching traffic data:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch traffic data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

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

  const getCongestionIcon = (level) => {
    switch (level) {
      case 'Low':
        return <FaCheckCircle color="green" />;
      case 'Medium':
        return <FaTrafficLight color="yellow" />;
      case 'High':
        return <FaExclamationTriangle color="orange" />;
      case 'Severe':
        return <FaTimesCircle color="red" />;
      default:
        return <FaCar />;
    }
  };

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')} py={8}>
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          <Heading size="lg" textAlign="center" bgGradient="linear(to-r, blue.400, purple.500)" bgClip="text">
            Traffic Congestion Monitor
          </Heading>

          <HStack spacing={4}>
            <Input
              placeholder="Enter location (e.g., New York, Times Square)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              size="lg"
              bg={bgColor}
              borderColor={borderColor}
              _hover={{ borderColor: 'blue.400' }}
              _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
            />
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

          {traffic && (
            <MotionBox
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              p={6}
              bg={cardBg}
              borderRadius="lg"
              boxShadow="lg"
              borderWidth={1}
              borderColor={borderColor}
            >
              <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
                <GridItem>
                  <MotionFlex
                    variants={itemVariants}
                    direction="column"
                    align="center"
                    justify="center"
                    p={6}
                  >
                    <Icon
                      as={FaCar}
                      boxSize={24}
                      color="blue.400"
                      mb={4}
                    />
                    <Text fontSize="2xl" fontWeight="bold" mt={4}>
                      {traffic.location}
                    </Text>
                    <Badge
                      colorScheme={getCongestionColor(traffic.congestion_level)}
                      fontSize="xl"
                      p={2}
                      mt={2}
                    >
                      {traffic.congestion_level} Congestion
                    </Badge>
                    <Text fontSize="4xl" fontWeight="bold" mt={4}>
                      {traffic.congestion_percentage}%
                    </Text>
                    <Text fontSize="lg" color="gray.500">
                      Congestion Level
                    </Text>
                  </MotionFlex>
                </GridItem>

                <GridItem>
                  <MotionFlex
                    variants={itemVariants}
                    direction="column"
                    gap={4}
                    p={6}
                  >
                    <Box>
                      <Text fontSize="lg" fontWeight="bold">Average Speed</Text>
                      <Text fontSize="xl">{traffic.average_speed} km/h</Text>
                    </Box>
                    <Box>
                      <Text fontSize="lg" fontWeight="bold">Travel Time</Text>
                      <Text fontSize="xl">{traffic.travel_time} minutes</Text>
                    </Box>
                    <Box>
                      <Text fontSize="lg" fontWeight="bold">Incidents</Text>
                      <Text fontSize="xl">{traffic.incidents} reported</Text>
                    </Box>
                    <Box>
                      <Text fontSize="lg" fontWeight="bold">Last Updated</Text>
                      <Text fontSize="xl">{traffic.last_updated}</Text>
                    </Box>
                  </MotionFlex>
                </GridItem>
              </Grid>

              <Divider my={6} />

              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                <Card bg={useColorModeValue('blue.50', 'blue.900')} variant="outline">
                  <CardHeader>
                    <Heading size="md">Traffic Flow</Heading>
                  </CardHeader>
                  <CardBody>
                    <Stat>
                      <StatLabel>Current Status</StatLabel>
                      <StatNumber>{traffic.flow_status}</StatNumber>
                      <StatHelpText>
                        <StatArrow type={traffic.flow_status === 'Improving' ? 'increase' : 'decrease'} />
                        {traffic.flow_trend}% from last hour
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>

                <Card bg={useColorModeValue('green.50', 'green.900')} variant="outline">
                  <CardHeader>
                    <Heading size="md">Recommended Routes</Heading>
                  </CardHeader>
                  <CardBody>
                    <List spacing={2}>
                      {traffic.alternative_routes.map((route, index) => (
                        <ListItem key={index}>
                          <ListIcon as={FaCheckCircle} color="green.500" />
                          {route}
                        </ListItem>
                      ))}
                    </List>
                  </CardBody>
                </Card>

                <Card bg={useColorModeValue('orange.50', 'orange.900')} variant="outline">
                  <CardHeader>
                    <Heading size="md">Traffic Alerts</Heading>
                  </CardHeader>
                  <CardBody>
                    <List spacing={2}>
                      {traffic.alerts.map((alert, index) => (
                        <ListItem key={index}>
                          <ListIcon as={FaExclamationTriangle} color="orange.500" />
                          {alert}
                        </ListItem>
                      ))}
                    </List>
                  </CardBody>
                </Card>
              </SimpleGrid>
            </MotionBox>
          )}

          <Box h="500px" borderRadius="lg" overflow="hidden" boxShadow="lg">
            <SearchTrafficMap />
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default TrafficCongestion;