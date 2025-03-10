import portsData from '../assets/ports.json';

// Helper function to validate coordinates
const hasValidCoordinates = (port) => {
  // Log the port data for debugging
  console.log('Validating coordinates for port:', {
    name: port.name,
    coordinates: port.coordinates
  });

  if (!Array.isArray(port.coordinates)) {
    console.log('Port coordinates are not an array');
    return false;
  }

  if (port.coordinates.length !== 2) {
    console.log('Port coordinates array length is not 2');
    return false;
  }

  const [long, lat] = port.coordinates.map(coord => parseFloat(coord));

  if (!isFinite(long) || !isFinite(lat)) {
    console.log('Port coordinates are not valid numbers');
    return false;
  }

  if (long < -180 || long > 180) {
    console.log('Port longitude out of range:', long);
    return false;
  }

  if (lat < -90 || lat > 90) {
    console.log('Port latitude out of range:', lat);
    return false;
  }

  return true;
};

// Helper function to format coordinates
const formatCoordinates = (coordinates) => {
  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    console.error('Invalid coordinates format:', coordinates);
    return null;
  }

  const [long, lat] = coordinates.map(coord => parseFloat(coord));
  
  if (!isFinite(long) || !isFinite(lat)) {
    console.error('Invalid coordinate values:', { long, lat });
    return null;
  }

  return [long, lat];
};

// Get all unique countries with their ports
export const getCountriesWithPorts = () => {
  const countries = new Set();

  Object.values(portsData)
    .filter(hasValidCoordinates)
    .forEach(port => {
      countries.add(port.country);
    });

  return Array.from(countries).sort();
};

// Get ports for a specific country
export const getPortsByCountry = (country) => {
  if (!country) return [];
  
  return Object.values(portsData)
    .filter(port => port.country === country && hasValidCoordinates(port))
    .map(port => {
      const coordinates = formatCoordinates(port.coordinates);
      if (!coordinates) {
        console.error('Failed to format coordinates for port:', port.name);
        return null;
      }

      return {
        value: port.unlocs[0],
        label: `${port.name}, ${port.province || ''}`.trim(),
        coordinates
      };
    })
    .filter(Boolean) // Remove null entries
    .sort((a, b) => a.label.localeCompare(b.label));
};

// Get port details by UNLOC code
export const getPortByCode = (code) => {
  const port = portsData[code];
  if (!port || !hasValidCoordinates(port)) return null;

  const coordinates = formatCoordinates(port.coordinates);
  if (!coordinates) {
    console.error('Failed to format coordinates for port:', port.name);
    return null;
  }
  
  return {
    code: port.unlocs[0],
    name: port.name,
    city: port.city,
    country: port.country,
    province: port.province,
    coordinates
  };
};

// Search ports by name, city, or country
export const searchPorts = (query) => {
  if (!query) return [];
  
  const searchTerm = query.toLowerCase();
  return Object.values(portsData)
    .filter(port => 
      hasValidCoordinates(port) && (
        port.name.toLowerCase().includes(searchTerm) ||
        port.city.toLowerCase().includes(searchTerm) ||
        port.country.toLowerCase().includes(searchTerm) ||
        (port.province && port.province.toLowerCase().includes(searchTerm))
      )
    )
    .map(port => {
      const coordinates = formatCoordinates(port.coordinates);
      if (!coordinates) {
        console.error('Failed to format coordinates for port:', port.name);
        return null;
      }

      return {
        value: port.unlocs[0],
        label: `${port.name}, ${port.country}`,
        coordinates
      };
    })
    .filter(Boolean) // Remove null entries
    .slice(0, 20);
}; 