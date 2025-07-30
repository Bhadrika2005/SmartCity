import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import { Icon } from 'leaflet';
import { FaCar, FaTrafficLight, FaExclamationTriangle } from 'react-icons/fa';
import { getTrafficData, getTrafficIncidents, getRouteTraffic } from '../services/trafficService';
import 'leaflet/dist/leaflet.css';

const TrafficMap = () => {
  const [position, setPosition] = useState([51.505, -0.09]);
  const [trafficData, setTrafficData] = useState({ flow: [], incidents: [] });
  const [route, setRoute] = useState(null);
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [mode, setMode] = useState('car');
  const mapRef = useRef();

  useEffect(() => {
    const fetchTrafficData = async () => {
      try {
        const [flowData, incidentsData] = await Promise.all([
          getTrafficData(position[0], position[1]),
          getTrafficIncidents(position[0], position[1])
        ]);
        setTrafficData({
          flow: flowData.flow,
          incidents: incidentsData.incidents
        });
      } catch (error) {
        console.error('Error fetching traffic data:', error);
      }
    };

    fetchTrafficData();
    const interval = setInterval(fetchTrafficData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [position]);

  useEffect(() => {
    if (startPoint && endPoint) {
      const fetchRoute = async () => {
        try {
          const routeData = await getRouteTraffic(
            startPoint[0],
            startPoint[1],
            endPoint[0],
            endPoint[1],
            mode
          );
          setRoute(routeData);
        } catch (error) {
          console.error('Error fetching route:', error);
        }
      };
      fetchRoute();
    }
  }, [startPoint, endPoint, mode]);

  const MapEvents = () => {
    useMapEvents({
      click: (e) => {
        if (!startPoint) {
          setStartPoint([e.latlng.lat, e.latlng.lng]);
        } else if (!endPoint) {
          setEndPoint([e.latlng.lat, e.latlng.lng]);
        } else {
          setStartPoint([e.latlng.lat, e.latlng.lng]);
          setEndPoint(null);
          setRoute(null);
        }
      }
    });
    return null;
  };

  const getTrafficColor = (congestion) => {
    switch (congestion) {
      case 'heavy': return 'red';
      case 'moderate': return 'orange';
      default: return 'green';
    }
  };

  const getIncidentIcon = (severity) => {
    return new Icon({
      iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${severity === 'high' ? 'red' : severity === 'medium' ? 'orange' : 'yellow'}.png`,
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  };

  return (
    <div className="traffic-map-container">
      <div className="map-controls">
        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="car">Car</option>
          <option value="pedestrian">Walking</option>
          <option value="bicycle">Bicycle</option>
        </select>
        <button onClick={() => {
          setStartPoint(null);
          setEndPoint(null);
          setRoute(null);
        }}>
          Clear Route
        </button>
      </div>
      
      <MapContainer
        center={position}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <MapEvents />
        
        {trafficData.flow.map((flow, index) => (
          <Marker
            key={`flow-${index}`}
            position={[flow.lat, flow.lon]}
            icon={new Icon({
              iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${getTrafficColor(flow.congestion)}.png`,
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            })}
          >
            <Popup>
              <div>
                <h3>Traffic Flow</h3>
                <p>Speed: {flow.speed} km/h</p>
                <p>Free Flow Speed: {flow.freeFlowSpeed} km/h</p>
                <p>Confidence: {flow.confidence}%</p>
                <p>Congestion: {flow.congestion}</p>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {trafficData.incidents.map((incident, index) => (
          <Marker
            key={`incident-${index}`}
            position={[incident.lat, incident.lon]}
            icon={getIncidentIcon(incident.severity)}
          >
            <Popup>
              <div>
                <h3>{incident.type}</h3>
                <p>{incident.description}</p>
                <p>Severity: {incident.severity}</p>
                <p>Start: {new Date(incident.startTime).toLocaleString()}</p>
                {incident.endTime && (
                  <p>End: {new Date(incident.endTime).toLocaleString()}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
        
        {startPoint && (
          <Marker
            position={startPoint}
            icon={new Icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            })}
          >
            <Popup>Start Point</Popup>
          </Marker>
        )}
        
        {endPoint && (
          <Marker
            position={endPoint}
            icon={new Icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            })}
          >
            <Popup>End Point</Popup>
          </Marker>
        )}
        
        {route && (
          <>
            <Polyline
              positions={route.coordinates}
              color="blue"
              weight={5}
              opacity={0.7}
            />
            <Popup position={route.coordinates[Math.floor(route.coordinates.length / 2)]}>
              <div>
                <h3>Route Information</h3>
                <p>Distance: {(route.summary.lengthInMeters / 1000).toFixed(1)} km</p>
                <p>Travel Time: {Math.floor(route.summary.travelTimeInSeconds / 60)} minutes</p>
                <p>Traffic Delay: {Math.floor(route.summary.trafficDelayInSeconds / 60)} minutes</p>
              </div>
            </Popup>
          </>
        )}
      </MapContainer>
    </div>
  );
};

export default TrafficMap;