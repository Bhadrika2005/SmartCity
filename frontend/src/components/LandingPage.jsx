import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  useColorModeValue,
  Icon,
  Button,
  Flex,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { motion } from 'framer-motion';
import { FaCloudSun, FaCar, FaWind, FaMapMarkedAlt } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
  100% { transform: translateY(0px); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

function FeatureCard({ icon, title, description, to }) {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      p={6}
      bg={bgColor}
      borderRadius="lg"
      boxShadow="lg"
      borderWidth={1}
      borderColor={borderColor}
      _hover={{ transform: 'translateY(-5px)', transition: 'all 0.3s ease' }}
    >
      <VStack spacing={4} align="center">
        <Box
          p={3}
          bg="blue.500"
          color="white"
          borderRadius="full"
          fontSize="2xl"
        >
          {icon}
        </Box>
        <Heading size="md">{title}</Heading>
        <Text textAlign="center" color="gray.500">
          {description}
        </Text>
        <Button
          as={RouterLink}
          to={to}
          colorScheme="blue"
          size="lg"
          width="full"
        >
          Explore
        </Button>
      </VStack>
    </Box>
  );
}

function LandingPage() {
  const navigate = useNavigate();
  const bgGradient = useColorModeValue(
    'linear(to-b, blue.50, white)',
    'linear(to-b, gray.900, gray.800)'
  );

  const features = [
    {
      icon: <FaMapMarkedAlt />,
      title: 'Travel Route',
      description: 'Find best travel routes and optimize your journey for new cities.',
      path: '/traffic',
    },
    {
      icon: <FaCloudSun />,
      title: 'Weather Insights',
      description: 'Get detailed weather information including temperature, humidity, and air quality',
      path: '/weather',
    },
    {
      icon: <FaWind />,
      title: 'Air Quality',
      description: 'Track air quality levels and get recommendations for outdoor activities',
      path: '/airquality',
    },
  ];

  const mapRef = useRef(null);

  return (
    <Box
      minH="100vh"
      bgGradient={bgGradient}
      py={20}
      position="relative"
      overflow="hidden"
    >
      {/* Background Animation */}
      <MotionBox
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        zIndex={0}
        opacity={0.1}
      >
        {[...Array(20)].map((_, i) => (
          <MotionBox
            key={i}
            position="absolute"
            w="100px"
            h="100px"
            bg="blue.500"
            borderRadius="full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              y: [null, Math.random() * -100],
              x: [null, Math.random() * 100],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        ))}
      </MotionBox>

      <Container maxW="container.xl" position="relative" zIndex={1}>
        <VStack spacing={16}>
          {/* Header */}
          <MotionFlex
            direction="column"
            align="center"
            textAlign="center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Heading
              size="2xl"
              bgGradient="linear(to-r, blue.400, purple.500)"
              bgClip="text"
              mb={4}
            >
              Smart City Dashboard
            </Heading>
            <Text fontSize="xl" color="gray.500" maxW="2xl">
              Your one-stop solution for real-time weather, air quality, and travel route information.
              Make informed decisions with our comprehensive city insights.
            </Text>
          </MotionFlex>

          {/* Feature Cards */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} width="full">
            {features.map((feature) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                to={feature.path}
              />
            ))}
          </SimpleGrid>

          {/* Call to Action */}
          <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Button
              size="lg"
              colorScheme="blue"
              onClick={() => navigate('/dashboard')}
              px={8}
              py={6}
              fontSize="lg"
              _hover={{ transform: 'translateY(-2px)' }}
              transition="all 0.2s"
            >
              Launch Dashboard
            </Button>
          </MotionBox>
        </VStack>
      </Container>
    </Box>
  );
}

export default LandingPage; 