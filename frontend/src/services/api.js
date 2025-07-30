import axios from 'axios';


const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5173';
const TOMTOM_API_KEY = import.meta.env.VITE_TOMTOM_API_KEY;
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1';
const TOMTOM_API_BASE_URL = 'https://api.tomtom.com/traffic/services/4';

// Create an axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:5000', // Flask backend URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Test TomTom API key
export const testTomTomApi = async () => {
  try {
    const response = await api.get('/test_tomtom_api');
    return response.data;
  } catch (error) {
    console.error('Error testing TomTom API:', error);
    throw error;
  }
};

// Traffic and AQI API
export const searchTraffic = async (area, mode = 'traffic') => {
  try {
    const response = await api.post('/search_traffic', { area, mode });
    
    // Check if response.data exists and is not an error
    if (response.data && !response.data.error) {
      return response;
    } else {
      throw new Error(response.data?.error || 'Failed to fetch traffic data');
    }
  } catch (error) {
    console.error('Error searching traffic:', error);
    
    // Check if the error is related to API key issues
    if (error.response && error.response.status === 403) {
      throw new Error('API key error: The TomTom API key is invalid or has expired. Please update your API key.');
    } else if (error.response && error.response.data && error.response.data.error) {
      // If the backend provided a specific error message, use it
      throw new Error(error.response.data.error);
    } else if (error.message && error.message.includes('API key')) {
      // If the error message already contains API key information, use it
      throw error;
    } else {
      // Generic error message
      throw new Error('Failed to fetch traffic data. Please try again later.');
    }
  }
};

// Traffic API for Dashboard
export const getTraffic = async (location) => {
  try {
    // First get the coordinates for the location
    const locationResults = await searchLocation(location);
    if (!locationResults.length) {
      throw new Error('Location not found');
    }

    const { latitude, longitude } = locationResults[0];

    // Get real traffic data from TomTom API
    if (TOMTOM_API_KEY) {
      try {
        const response = await axios.get(`${TOMTOM_API_BASE_URL}/flowSegmentData/relative/10/json`, {
          params: {
            point: `${latitude},${longitude}`,
            unit: 'KMPH',
            key: TOMTOM_API_KEY
          },
          timeout: 5000 // 5 second timeout
        });

        // Get traffic incidents
        const incidentsResponse = await axios.get(`${TOMTOM_API_BASE_URL}/incidentDetails/s3/${latitude},${longitude}/10/json`, {
          params: {
            key: TOMTOM_API_KEY
          },
          timeout: 5000 // 5 second timeout
        });

        return {
          latitude,
          longitude,
          location,
          congestionLevel: response.data.flowSegmentData.currentSpeed < response.data.flowSegmentData.freeFlowSpeed * 0.7 ? 'High' : 'Low',
          averageSpeed: Math.round(response.data.flowSegmentData.currentSpeed),
          freeFlowSpeed: Math.round(response.data.flowSegmentData.freeFlowSpeed),
          confidence: response.data.flowSegmentData.confidence,
          incidents: incidentsResponse.data.incidents.map(incident => ({
            type: incident.type,
            description: incident.description,
            severity: incident.severity,
            location: {
              latitude: incident.point.latitude,
              longitude: incident.point.longitude
            },
            start_time: incident.startTime,
            end_time: incident.endTime
          })),
          timestamp: new Date().toISOString(),
          alerts: incidentsResponse.data.incidents
            .filter(incident => incident.severity === 'SERIOUS' || incident.severity === 'SEVERE')
            .map(incident => incident.description)
        };
      } catch (error) {
        console.warn('Failed to fetch TomTom traffic data:', error);
        // Fall back to simulated data
      }
    }

    // Fallback to simulated data if TomTom API is not available or fails
    return {
      latitude,
      longitude,
      location,
      congestionLevel: Math.random() > 0.5 ? 'High' : 'Low',
      averageSpeed: Math.floor(Math.random() * 60) + 20,
      freeFlowSpeed: 60,
      confidence: 0.8,
      incidents: [
        'Road work on main street',
        'Heavy traffic on highway',
      ].filter(() => Math.random() > 0.5),
      timestamp: new Date().toISOString(),
      alerts: [
        'Construction ahead',
        'Heavy congestion reported'
      ].filter(() => Math.random() > 0.5)
    };
  } catch (error) {
    console.error('Error getting traffic data:', error);
    
    // Handle specific error cases
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      throw new Error('Request timed out. Please try again.');
    } else if (error.response) {
      if (error.response.status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      } else if (error.response.status === 403) {
        throw new Error('API key error. Please check your configuration.');
      } else {
        throw new Error(`Server error: ${error.response.status}`);
      }
    } else if (error.request) {
      throw new Error('Network error. Please check your internet connection.');
    } else {
      throw new Error('Failed to get traffic data. Please try again.');
    }
  }
};


// Weather API
export const getWeather = async (city) => {
  try {
    if (!city) {
      throw new Error('City name is required');
    }

    const response = await api.get(`/weather?city=${encodeURIComponent(city)}`);
    
    if (response.data.error) {
      throw new Error(response.data.error);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    
    // Handle specific error cases
    if (error.response) {
      if (error.response.status === 404) {
        throw new Error(`City "${city}" not found. Please check the spelling and try again.`);
      } else if (error.response.status === 401) {
        throw new Error('Weather API key is invalid. Please check your configuration.');
      } else if (error.response.status === 502) {
        throw new Error('Weather service is temporarily unavailable. Please try again later.');
      } else if (error.response.data && error.response.data.error) {
        throw new Error(error.response.data.error);
      }
    }
    
    // Handle network errors
    if (error.message === 'Network Error') {
      throw new Error('Unable to connect to the weather service. Please check your internet connection.');
    }
    
    // Handle timeout
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. Please try again.');
    }
    
    // Default error message
    throw new Error('Failed to fetch weather data. Please try again later.');
  }
};

export const getCityInfo = async (city) => {
  try {
    const response = await api.get(`/city-info/${city}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching city info:', error);
    throw error;
  }
};

// Get real-time traffic data for a city
export const getTrafficData = async (city) => {
  try {
    const response = await api.get(`/traffic-data/${city}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching traffic data:', error);
    throw error;
  }
};

// Location Search API using OpenStreetMap Nominatim
export const searchLocation = async (query) => {
  try {
    // Add proper headers as per Nominatim usage policy
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'TrafficApp/1.0 (https://github.com/yourusername/traffic-app; your@email.com)'
    };

    // Add delay between requests to respect rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));

    const response = await axios.get(`${NOMINATIM_BASE_URL}/search`, {
      params: {
        q: query,
        format: 'json',
        addressdetails: 1,
        limit: 10
      },
      headers,
      timeout: 5000 // 5 second timeout
    });

    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('Invalid response format from Nominatim');
    }

    return response.data.map(result => ({
      id: result.place_id,
      name: result.display_name,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      type: result.type,
      importance: result.importance,
      address: result.address,
      boundingbox: result.boundingbox
    }));
  } catch (error) {
    console.error('Error searching location:', error);
    
    // Handle specific error cases
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      throw new Error('Request timed out. Please try again.');
    } else if (error.response) {
      // Handle HTTP error responses
      if (error.response.status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      } else if (error.response.status === 403) {
        throw new Error('Access denied. Please check your API configuration.');
      } else {
        throw new Error(`Server error: ${error.response.status}`);
      }
    } else if (error.request) {
      // Handle network errors
      throw new Error('Network error. Please check your internet connection.');
    } else {
      throw new Error('Failed to search location. Please try again.');
    }
  }
};

// Route Planning API using OSRM
export const getRoute = async (start, end, mode = 'car') => {
  try {
    // First, get coordinates for start and end locations
    const [startResults, endResults] = await Promise.all([
      searchLocation(start),
      searchLocation(end)
    ]);

    if (!startResults.length || !endResults.length) {
      throw new Error('Could not find coordinates for one or both locations');
    }

    const startPoint = [startResults[0].longitude, startResults[0].latitude];
    const endPoint = [endResults[0].longitude, endResults[0].latitude];

    // Helper function to format duration
    const formatDuration = (minutes) => {
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      if (hours === 0) {
        return `${mins} min`;
      }
      return `${hours} hr ${mins} min`;
    };

    // Try to get route from TomTom API first for more accurate traffic-aware routing
    if (TOMTOM_API_KEY) {
      try {
        const response = await axios.get(`https://api.tomtom.com/routing/1/calculateRoute/${startPoint[1]},${startPoint[0]}:${endPoint[1]},${endPoint[0]}/json`, {
          params: {
            key: TOMTOM_API_KEY,
            traffic: true,
            travelMode: mode.toUpperCase(),
            routeType: 'fastest'
          },
          timeout: 10000 // 10 second timeout for route calculation
        });

        if (!response.data.routes || !response.data.routes.length) {
          throw new Error('No route found');
        }

        const route = response.data.routes[0];
        const points = route.legs[0].points;
        const durationMinutes = route.summary.travelTimeInSeconds / 60;
        const trafficDelayMinutes = (route.summary.trafficDelayInSeconds || 0) / 60;

        return {
          coordinates: points.map(point => [point.latitude, point.longitude]),
          distance: route.summary.lengthInMeters / 1000, // Convert to km
          duration: durationMinutes,
          formattedDuration: formatDuration(durationMinutes),
          trafficDelay: trafficDelayMinutes,
          formattedTrafficDelay: formatDuration(trafficDelayMinutes),
          steps: route.guidance.instructions.map(instruction => ({
            instruction: instruction.message,
            distance: instruction.routeOffsetInMeters / 1000,
            duration: instruction.travelTimeInSeconds / 60,
            formattedDuration: formatDuration(instruction.travelTimeInSeconds / 60),
            type: instruction.type,
            modifier: instruction.modifier
          })),
          startLocation: {
            name: start,
            coordinates: startPoint
          },
          endLocation: {
            name: end,
            coordinates: endPoint
          }
        };
      } catch (error) {
        console.warn('Failed to fetch TomTom route:', error);
        // Fall back to OSRM if TomTom fails
      }
    }

    // Fallback to OSRM
    const profile = mode === 'car' ? 'driving' : mode === 'bicycle' ? 'cycling' : 'walking';
    const coordinates = `${startPoint.join(',')};${endPoint.join(',')}`;
    
    const response = await axios.get(`${OSRM_BASE_URL}/${profile}/${coordinates}`, {
      params: {
        overview: 'full',
        geometries: 'geojson',
        steps: true,
        annotations: true
      },
      timeout: 10000 // 10 second timeout for route calculation
    });

    if (!response.data.routes || !response.data.routes.length) {
      throw new Error('No route found');
    }

    const route = response.data.routes[0];
    const durationMinutes = route.duration / 60;

    return {
      coordinates: route.geometry.coordinates.map(coord => [coord[1], coord[0]]),
      distance: route.distance / 1000, // Convert to km
      duration: durationMinutes,
      formattedDuration: formatDuration(durationMinutes),
      steps: route.legs[0].steps.map(step => ({
        instruction: step.maneuver.instruction,
        distance: step.distance / 1000,
        duration: step.duration / 60,
        formattedDuration: formatDuration(step.duration / 60),
        type: step.maneuver.type,
        modifier: step.maneuver.modifier
      })),
      startLocation: {
        name: start,
        coordinates: startPoint
      },
      endLocation: {
        name: end,
        coordinates: endPoint
      }
    };
  } catch (error) {
    console.error('Error getting route:', error);
    if (error.code === 'ECONNABORTED') {
      throw new Error('Route calculation timed out. Please try again.');
    } else if (error.response) {
      if (error.response.status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      } else if (error.response.status === 403) {
        throw new Error('API key error. Please check your configuration.');
      } else {
        throw new Error(`Server error: ${error.response.status}`);
      }
    } else if (error.request) {
      throw new Error('Network error. Please check your internet connection.');
    } else {
      throw new Error('Failed to get route. Please try again.');
    }
  }
};

// Add error interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
    });
    return Promise.reject(error);
  }
);

export default api; 