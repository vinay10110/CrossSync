import { useState, useEffect } from 'react';
import { Paper, Text, Stack, Select, Group, LoadingOverlay, Alert } from '@mantine/core';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { IconAlertCircle } from '@tabler/icons-react';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map center updates
function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, map, zoom]);
  return null;
}

const RouteSelection = ({ originPort, destinationPort, onRouteSelect }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [mapCenter, setMapCenter] = useState([0, 0]);
  const [mapZoom, setMapZoom] = useState(2);

  // Validate port coordinates
  const validatePorts = () => {
    console.log('Validating ports with coordinates:', {
      origin: originPort?.coordinates,
      destination: destinationPort?.coordinates
    });

    if (!originPort?.coordinates) {
      setError('Origin port is missing coordinates');
      return false;
    }

    if (!Array.isArray(originPort.coordinates)) {
      setError('Origin port coordinates are not in the correct format');
      return false;
    }

    if (!destinationPort?.coordinates) {
      setError('Destination port is missing coordinates');
      return false;
    }

    if (!Array.isArray(destinationPort.coordinates)) {
      setError('Destination port coordinates are not in the correct format');
      return false;
    }

    // Ensure coordinates are numbers and within valid ranges
    const [origLong, origLat] = originPort.coordinates;
    const [destLong, destLat] = destinationPort.coordinates;

    if (!isFinite(origLong) || !isFinite(origLat)) {
      setError('Origin port coordinates are not valid numbers');
      return false;
    }

    if (!isFinite(destLong) || !isFinite(destLat)) {
      setError('Destination port coordinates are not valid numbers');
      return false;
    }

    if (origLong < -180 || origLong > 180 || origLat < -90 || origLat > 90) {
      setError('Origin port coordinates are out of valid range');
      return false;
    }

    if (destLong < -180 || destLong > 180 || destLat < -90 || destLat > 90) {
      setError('Destination port coordinates are out of valid range');
      return false;
    }

    setError(null);
    return true;
  };

  useEffect(() => {
    if (originPort && destinationPort) {
      console.log('Origin Port:', originPort);
      console.log('Destination Port:', destinationPort);
      if (validatePorts()) {
        fetchRoutes();
      }
    }
  }, [originPort, destinationPort]);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Format coordinates for API call - Searoutes expects "longitude,latitude"
      const originCoords = `${originPort.coordinates[0]},${originPort.coordinates[1]}`;
      const destCoords = `${destinationPort.coordinates[0]},${destinationPort.coordinates[1]}`;
      
      console.log('Formatted coordinates for API:', {
        origin: originCoords,
        destination: destCoords
      });

      const apiUrl = `https://api.searoutes.com/route/v2/sea/${originCoords};${destCoords}/plan`;
      console.log('API URL:', apiUrl);

      const response = await fetch(apiUrl, {
        headers: {
          'accept-version': '2.0',
          'x-api-key': import.meta.env.VITE_SEAROUTES_API_KEY
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('API Error Response:', errorData);
        throw new Error(`Failed to fetch routes: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('API Response:', data);
      
      if (!data.features || data.features.length === 0) {
        setError('No routes found between these ports');
        return;
      }

      // Process routes data - Leaflet expects [latitude, longitude]
      const processedRoutes = data.features.map((feature, index) => ({
        id: index,
        path: feature.geometry.coordinates.map(coord => [coord[1], coord[0]]), // Convert to [lat, lng] for Leaflet
        distance: feature.properties.distance / 1000, // Convert to km
        duration: feature.properties.duration / (1000 * 60 * 60), // Convert to hours
        waypoints: feature.properties.waypoints
      }));

      setRoutes(processedRoutes);
      
      // Center map between origin and destination - Leaflet expects [latitude, longitude]
      setMapCenter([
        (originPort.coordinates[1] + destinationPort.coordinates[1]) / 2,
        (originPort.coordinates[0] + destinationPort.coordinates[0]) / 2
      ]);

      // Calculate appropriate zoom level
      const bounds = L.latLngBounds(
        [originPort.coordinates[1], originPort.coordinates[0]], // [lat, lng] for Leaflet
        [destinationPort.coordinates[1], destinationPort.coordinates[0]]
      );
      const zoom = Math.min(3, getBoundsZoomLevel(bounds));
      setMapZoom(zoom);

      if (processedRoutes.length > 0) {
        setSelectedRoute(processedRoutes[0]);
        onRouteSelect(processedRoutes[0]);
      }

    } catch (error) {
      console.error('Error fetching routes:', error);
      setError(error.message || 'Failed to fetch routes');
    } finally {
      setLoading(false);
    }
  };

  const handleRouteSelect = (routeId) => {
    const route = routes.find(r => r.id === parseInt(routeId));
    setSelectedRoute(route);
    onRouteSelect(route);
  };

  // Helper function to calculate appropriate zoom level
  const getBoundsZoomLevel = (bounds) => {
    const WORLD_DIM = { height: 256, width: 256 };
    const ZOOM_MAX = 3;
    
    const latRad = (lat) => {
      const sin = Math.sin(lat * Math.PI / 180);
      const radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
      return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
    };

    const zoom = (mapDim) => {
      const latFraction = (latRad(bounds.getNorth()) - latRad(bounds.getSouth())) / Math.PI;
      const lngDiff = bounds.getEast() - bounds.getWest();
      const lngFraction = ((lngDiff < 0) ? (lngDiff + 360) : lngDiff) / 360;
      const latZoom = Math.floor(Math.log(mapDim.height / WORLD_DIM.height / latFraction) / Math.LN2);
      const lngZoom = Math.floor(Math.log(mapDim.width / WORLD_DIM.width / lngFraction) / Math.LN2);
      return Math.min(Math.min(latZoom, lngZoom), ZOOM_MAX);
    };

    return zoom({ height: 400, width: 800 });
  };

  return (
    <Paper withBorder p="md" radius="md" pos="relative">
      <LoadingOverlay visible={loading} />
      <Stack spacing="md">
        <Text size="lg" weight={500}>Select Shipping Route</Text>

        {error && (
          <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red">
            {error}
          </Alert>
        )}
        
        {routes.length > 0 && (
          <Select
            label="Available Routes"
            placeholder="Select a route"
            data={routes.map(route => ({
              value: route.id.toString(),
              label: `Route ${route.id + 1} - Distance: ${route.distance.toFixed(2)}km, Duration: ${route.duration.toFixed(1)}h`
            }))}
            value={selectedRoute?.id.toString()}
            onChange={handleRouteSelect}
          />
        )}

        <div style={{ height: '400px', width: '100%' }}>
          <MapContainer
            style={{ height: '100%', width: '100%' }}
            center={mapCenter}
            zoom={mapZoom}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapUpdater center={mapCenter} zoom={mapZoom} />
            
            {originPort?.coordinates && (
              <Marker 
                position={[originPort.coordinates[1], originPort.coordinates[0]]} // [lat, lng] for Leaflet
                title="Origin"
              />
            )}
            
            {destinationPort?.coordinates && (
              <Marker 
                position={[destinationPort.coordinates[1], destinationPort.coordinates[0]]} // [lat, lng] for Leaflet
                title="Destination"
              />
            )}
            
            {selectedRoute && (
              <Polyline
                positions={selectedRoute.path}
                color="#2196F3"
                weight={3}
              />
            )}
          </MapContainer>
        </div>

        {selectedRoute && (
          <Stack spacing="xs">
            <Text size="sm" weight={500}>Route Details:</Text>
            <Text size="sm">Distance: {selectedRoute.distance.toFixed(2)} km</Text>
            <Text size="sm">Estimated Duration: {selectedRoute.duration.toFixed(1)} hours</Text>
            {selectedRoute.waypoints?.length > 0 && (
              <Text size="sm">
                Waypoints: {selectedRoute.waypoints.map(wp => wp.name).join(' → ')}
              </Text>
            )}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
};

export default RouteSelection; 