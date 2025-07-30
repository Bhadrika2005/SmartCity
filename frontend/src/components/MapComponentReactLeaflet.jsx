import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import { FaTrafficLight, FaStopSign } from 'react-icons/fa';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom icons for traffic signals
const trafficLightIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const stopSignIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};

const TrafficOverlay = ({ trafficData, route, trafficSignals }) => {
  if (!trafficData) return null;

  return (
    <>
      {/* Traffic Incidents */}
      {trafficData.incidents?.map((incident, index) => (
        <Circle
          key={`incident-${index}`}
          center={[incident.lat, incident.lon]}
          radius={100}
          pathOptions={{
            color: incident.severity === 'high' ? 'red' : 'orange',
            fillColor: incident.severity === 'high' ? 'red' : 'orange',
            fillOpacity: 0.2
          }}
        >
          <Popup>
            <div>
              <h3>{incident.type}</h3>
              <p>{incident.description}</p>
              {incident.startTime && (
                <p>Start: {new Date(incident.startTime).toLocaleString()}</p>
              )}
              {incident.endTime && (
                <p>End: {new Date(incident.endTime).toLocaleString()}</p>
              )}
            </div>
          </Popup>
        </Circle>
      ))}

      {/* Traffic Flow */}
      {trafficData.flow?.map((flow, index) => (
        <Circle
          key={`flow-${index}`}
          center={[flow.lat, flow.lon]}
          radius={50}
          pathOptions={{
            color: flow.congestion === 'heavy' ? 'red' : flow.congestion === 'moderate' ? 'orange' : 'green',
            fillColor: flow.congestion === 'heavy' ? 'red' : flow.congestion === 'moderate' ? 'orange' : 'green',
            fillOpacity: 0.2
          }}
        >
          <Popup>
            <div>
              <h3>Traffic Flow</h3>
              <p>Speed: {flow.speed} km/h</p>
              <p>Free Flow: {flow.freeFlowSpeed} km/h</p>
              <p>Confidence: {flow.confidence}%</p>
            </div>
          </Popup>
        </Circle>
      ))}

      {/* Route Display */}
      {route && (
        <>
          {/* Start Marker */}
          <Marker
            position={[route.start.latitude, route.start.longitude]}
            icon={new L.Icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            })}
          >
            <Popup>
              <div>
                <h3>Start: {route.start.name}</h3>
                <p>{route.start.address}</p>
              </div>
            </Popup>
          </Marker>

          {/* End Marker */}
          <Marker
            position={[route.end.latitude, route.end.longitude]}
            icon={new L.Icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            })}
          >
            <Popup>
              <div>
                <h3>End: {route.end.name}</h3>
                <p>{route.end.address}</p>
              </div>
            </Popup>
          </Marker>

          {/* Route Line */}
          <Polyline
            positions={route.coordinates.map(coord => [coord.latitude, coord.longitude])}
            pathOptions={{
              color: '#1976d2',
              weight: 5,
              opacity: 0.7
            }}
          />
        </>
      )}

      {/* Traffic Signals */}
      {trafficSignals?.map((signal, index) => (
        <Marker
          key={`signal-${index}`}
          position={[signal.position.latitude, signal.position.longitude]}
          icon={signal.type === 'traffic_light' ? trafficLightIcon : stopSignIcon}
        >
          <Popup>
            <div>
              <h3>{signal.type === 'traffic_light' ? 'Traffic Light' : 'Stop Sign'}</h3>
              <p>Status: {signal.status}</p>
              {signal.timing && (
                <p>Timing: {signal.timing} seconds</p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};

const MapComponentReactLeaflet = React.forwardRef(({ 
  center = [0, 0], 
  zoom = 13, 
  mapType = 'roadmap',
  showTraffic = false,
  onMove,
  trafficData,
  route,
  searchResults,
  selectedResult,
  onMarkerClick,
  trafficSignals = []
}, ref) => {
  const mapRef = useRef(null);

  useEffect(() => {
    if (ref) {
      ref.current = mapRef.current;
    }
  }, [ref]);

  const tileUrl = mapType === 'satellite' 
    ? 'https://maps.geoapify.com/v1/tile/satellite/{z}/{x}/{y}.png?&apiKey=06e6cff441d040088d3638d045868182'
    : mapType === 'terrain'
    ? 'https://maps.geoapify.com/v1/tile/terrain/{z}/{x}/{y}.png?&apiKey=06e6cff441d040088d3638d045868182'
    : 'https://maps.geoapify.com/v1/tile/carto/{z}/{x}/{y}.png?&apiKey=06e6cff441d040088d3638d045868182';

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        whenCreated={(map) => {
          mapRef.current = map;
          if (onMove) {
            map.on('moveend', () => {
              const center = map.getCenter();
              const zoom = map.getZoom();
              onMove([center.lat, center.lng], zoom);
            });
          }
        }}
      >
        <TileLayer
          url={tileUrl}
          attribution='&copy; <a href="https://www.geoapify.com/">Geoapify</a>'
        />
        <MapUpdater center={center} zoom={zoom} />
        {showTraffic && (
          <TrafficOverlay 
            trafficData={trafficData} 
            route={route}
            trafficSignals={trafficSignals}
          />
        )}
      </MapContainer>
    </div>
  );
});

export default MapComponentReactLeaflet;