import axios from 'axios';

const TOMTOM_API_KEY = process.env.REACT_APP_TOMTOM_API_KEY;
const TOMTOM_BASE_URL = 'https://api.tomtom.com';

export const getTrafficData = async (lat, lon, radius = 5000) => {
  try {
    const response = await axios.get(`${TOMTOM_BASE_URL}/traffic/services/4/flowSegmentData/absolute/10/json`, {
      params: {
        point: `${lat},${lon}`,
        unit: 'KMPH',
        openLr: false,
        key: TOMTOM_API_KEY
      }
    });

    return {
      flow: [{
        lat,
        lon,
        speed: response.data.flowSegmentData.currentSpeed,
        freeFlowSpeed: response.data.flowSegmentData.freeFlowSpeed,
        confidence: response.data.flowSegmentData.confidence,
        congestion: getCongestionLevel(
          response.data.flowSegmentData.currentSpeed,
          response.data.flowSegmentData.freeFlowSpeed
        )
      }]
    };
  } catch (error) {
    console.error('Error fetching traffic data:', error);
    throw error;
  }
};

export const getTrafficIncidents = async (lat, lon, radius = 5000) => {
  try {
    const response = await axios.get(`${TOMTOM_BASE_URL}/traffic/services/4/incidentDetails`, {
      params: {
        point: `${lat},${lon}`,
        radius,
        language: 'en-GB',
        key: TOMTOM_API_KEY
      }
    });

    return {
      incidents: response.data.incidents.map(incident => ({
        lat: incident.point.lat,
        lon: incident.point.lon,
        type: incident.type,
        description: incident.description,
        severity: incident.severity.toLowerCase(),
        startTime: incident.startTime,
        endTime: incident.endTime
      }))
    };
  } catch (error) {
    console.error('Error fetching traffic incidents:', error);
    throw error;
  }
};

export const getRouteTraffic = async (startLat, startLon, endLat, endLon, mode = 'car') => {
  try {
    const response = await axios.get(`${TOMTOM_BASE_URL}/routing/1/calculateRoute/${startLat},${startLon}:${endLat},${endLon}/json`, {
      params: {
        key: TOMTOM_API_KEY,
        traffic: true,
        travelMode: mode,
        routeType: 'fastest'
      }
    });

    const route = response.data.routes[0];
    return {
      coordinates: route.legs[0].points.map(point => [point.latitude, point.longitude]),
      summary: {
        lengthInMeters: route.summary.lengthInMeters,
        travelTimeInSeconds: route.summary.travelTimeInSeconds,
        trafficDelayInSeconds: route.summary.trafficDelayInSeconds
      }
    };
  } catch (error) {
    console.error('Error fetching route traffic:', error);
    throw error;
  }
};

const getCongestionLevel = (currentSpeed, freeFlowSpeed) => {
  const ratio = currentSpeed / freeFlowSpeed;
  if (ratio < 0.3) return 'heavy';
  if (ratio < 0.7) return 'moderate';
  return 'light';
};