import React, { useEffect, useState, memo, useRef } from "react";
import L from 'leaflet';
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, LayersControl, ZoomControl, AttributionControl, Polyline } from 'react-leaflet';
import { FaMapMarkerAlt, FaCar, FaWalking, FaBicycle, FaBus, FaExclamationTriangle } from 'react-icons/fa';

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom traffic layer style
const trafficLayerStyle = {
  color: '#ff0000',
  weight: 3,
  opacity: 0.7
};

// Create a custom marker icon with animation
const createMarkerIcon = (color = '#1976d2', isSelected = false) => {
  const markerHtml = `
    <div class="custom-marker ${isSelected ? 'selected' : ''}" style="
      width: 30px;
      height: 40px;
      position: relative;
      animation: bounce 0.5s ease infinite alternate;
    ">
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 0 50%;
        transform: rotate(45deg);
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        border: 2px solid white;
        position: absolute;
        top: 0;
      "></div>
      <div style="
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 4px;
        height: 10px;
        background: rgba(0,0,0,0.3);
        border-radius: 50%;
      "></div>
    </div>
    <style>
      @keyframes bounce {
        from { transform: translateY(0); }
        to { transform: translateY(-5px); }
      }
      .custom-marker {
        transition: all 0.3s ease;
      }
      .custom-marker.selected {
        transform: scale(1.2);
      }
    </style>
  `;

  return L.divIcon({
    html: markerHtml,
    className: 'custom-marker-container',
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -40]
  });
};

// Route styling based on transport mode
const getRouteStyle = (mode) => {
  switch (mode) {
    case 'car':
      return { color: '#1976d2', weight: 5, opacity: 0.8, dashArray: null };
    case 'walking':
      return { color: '#4CAF50', weight: 5, opacity: 0.8, dashArray: '10, 10' };
    case 'bicycle':
      return { color: '#FF9800', weight: 5, opacity: 0.8, dashArray: '15, 10' };
    case 'transit':
      return { color: '#9C27B0', weight: 5, opacity: 0.8, dashArray: '20, 10, 5, 10' };
    default:
      return { color: '#1976d2', weight: 5, opacity: 0.8 };
  }
};

// Route steps component
const RouteSteps = ({ steps, mode }) => {
  const getIcon = () => {
    switch (mode) {
      case 'car': return <FaCar />;
      case 'walking': return <FaWalking />;
      case 'bicycle': return <FaBicycle />;
      case 'transit': return <FaBus />;
      default: return <FaCar />;
    }
  };

  return (
    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
      {steps.map((step, index) => (
        <div key={index} style={{ 
          padding: '8px', 
          borderBottom: '1px solid #eee',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {getIcon()}
          <span>{step.instruction}</span>
        </div>
      ))}
    </div>
  );
};

// Enhanced route layer
const RouteLayer = ({ route, mode }) => {
  if (!route || !route.coordinates) return null;

  const routeStyle = getRouteStyle(mode);

  return (
    <>
      <Polyline
        positions={route.coordinates}
        pathOptions={routeStyle}
      >
        <Popup>
          <div style={{ minWidth: '250px' }}>
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: 'bold', 
              marginBottom: '12px',
              color: routeStyle.color 
            }}>Route Information</h3>
            <div style={{ marginBottom: '12px' }}>
              <div><strong>Distance:</strong> {route.distance} km</div>
              <div><strong>Duration:</strong> {route.duration} min</div>
              {route.trafficDelay > 0 && (
                <div style={{ color: 'red' }}>
                  <strong>Delay:</strong> {route.trafficDelay} min
                </div>
              )}
            </div>
            {route.steps && route.steps.length > 0 && (
              <RouteSteps steps={route.steps} mode={mode} />
            )}
          </div>
        </Popup>
      </Polyline>
      
      {/* Start and end markers */}
      <Marker 
        position={route.coordinates[0]} 
        icon={createMarkerIcon('#4CAF50')}
      >
        <Popup>Starting Point</Popup>
      </Marker>
      <Marker 
        position={route.coordinates[route.coordinates.length - 1]} 
        icon={createMarkerIcon('#F44336')}
      >
        <Popup>Destination</Popup>
      </Marker>
    </>
  );
};

// Map content component
const MapContent = ({ traffic, mode, route, searchResults = [], selectedResult, onMarkerClick }) => {
  const map = useMap();
  
  // Early return if no data to display
  if (!traffic && !searchResults.length && !route) return null;
  
  return (
    <>
      {/* Search Result Markers */}
      {searchResults.map((result, index) => (
        result.latitude && result.longitude ? (
          <Marker
            key={`search-${index}`}
            position={[result.latitude, result.longitude]}
            icon={createMarkerIcon('#1976d2', selectedResult === result)}
          >
            <Popup>
              <div style={{ minWidth: '200px' }}>
                <h3 style={{ 
                  fontSize: '16px', 
                  fontWeight: 'bold', 
                  marginBottom: '8px',
                  color: '#1976d2'
                }}>
                  {result.name}
                </h3>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  <p><strong>Type:</strong> {result.type}</p>
                  {result.address && (
                    <p style={{ marginTop: '4px' }}>{result.address}</p>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ) : null
      ))}

      {/* Traffic Data */}
      {traffic && traffic.latitude && traffic.longitude && (
        <>
          <Marker 
            position={[traffic.latitude, traffic.longitude]}
            icon={createMarkerIcon('#4CAF50')}
          >
            <Popup>
              <div style={{ minWidth: '200px' }}>
                <h3 style={{ 
                  fontSize: '16px', 
                  fontWeight: 'bold', 
                  marginBottom: '8px',
                  color: '#4CAF50'
                }}>
                  {traffic.location || 'Current Location'}
                </h3>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  <p><strong>Traffic Status:</strong> {traffic.congestionLevel}</p>
                  <p><strong>Average Speed:</strong> {traffic.averageSpeed} km/h</p>
                  {traffic.alerts && traffic.alerts.length > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      <strong>Alerts:</strong>
                      <ul style={{ marginTop: '4px', paddingLeft: '16px' }}>
                        {traffic.alerts.slice(0, 3).map((alert, idx) => (
                          <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FaExclamationTriangle color="orange" />
                            {alert}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
          
          {/* Display traffic incidents */}
          {traffic.incidents && traffic.incidents.map((incident, index) => {
            if (!incident.location || !incident.location.latitude || !incident.location.longitude) return null;
            
            return (
              <Marker 
                key={`incident-${index}`}
                position={[incident.location.latitude, incident.location.longitude]}
                icon={L.divIcon({
                  className: 'custom-div-icon',
                  html: `<div style="background-color: ${incident.severity === 'HIGH' ? '#F44336' : incident.severity === 'MEDIUM' ? '#FFC107' : '#4CAF50'}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
                  iconSize: [16, 16],
                  iconAnchor: [8, 8]
                })}
              >
                <Popup>
                  <div style={{ minWidth: '250px' }}>
                    <h3 style={{ marginBottom: '8px', color: incident.severity === 'HIGH' ? '#F44336' : incident.severity === 'MEDIUM' ? '#FFC107' : '#4CAF50' }}>
                      {incident.type}
                    </h3>
                    <p style={{ marginBottom: '8px' }}>{incident.description}</p>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Severity:</strong> 
                      <span style={{ 
                        color: incident.severity === 'HIGH' ? '#F44336' : 
                               incident.severity === 'MEDIUM' ? '#FFC107' : '#4CAF50',
                        marginLeft: '5px'
                      }}>
                        {incident.severity}
                      </span>
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Start Time:</strong> {new Date(incident.start_time).toLocaleString()}
                    </div>
                    {incident.end_time && (
                      <div style={{ marginBottom: '8px' }}>
                        <strong>End Time:</strong> {new Date(incident.end_time).toLocaleString()}
                      </div>
                    )}
                    <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                      Last updated: {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </>
      )}

      {/* Route Display */}
      {route && route.coordinates && route.coordinates.length > 0 && (
        <RouteLayer route={route} mode={mode} />
      )}
    </>
  );
};

// Component to fly to location when traffic data changes
const FlyToLocation = ({ lat, lon }) => {
  const map = useMap();
  
  React.useEffect(() => {
    if (lat && lon) {
      map.flyTo([lat, lon], 13);
    }
  }, [lat, lon, map]);
  
  return null;
};

// Main map component
const MapComponentReactLeaflet = ({ traffic, mode, route, searchResults = [], selectedResult, onMarkerClick }) => {
  const defaultCenter = [0, 0];
  const defaultZoom = 2;

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl position="bottomright" />
      <AttributionControl position="bottomleft" />
      
      <MapContent
        traffic={traffic}
        mode={mode}
        route={route}
        searchResults={searchResults}
        selectedResult={selectedResult}
        onMarkerClick={onMarkerClick}
      />
    </MapContainer>
  );
};

export default MapComponentReactLeaflet;