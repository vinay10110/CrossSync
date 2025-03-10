import { useEffect, useState } from 'react';
import { Select, Stack } from '@mantine/core';
import ports from '../assets/ports.json';

// Process ports data to create a structured format for dropdowns
const processedPorts = Object.entries(ports)
  .filter(([_, port]) => port.coordinates && port.coordinates.length === 2)
  .map(([code, port]) => ({
    code,
    name: port.name,
    city: port.city,
    country: port.country,
    coordinates: port.coordinates
  }));

// Get unique countries from processed ports
const countries = [...new Set(processedPorts.map(port => port.country))].sort();

export default function PortSelect({ label, value, onChange, required = false }) {
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [cities, setCities] = useState([]);

  // Update cities when country changes
  useEffect(() => {
    if (selectedCountry) {
      const countryCities = processedPorts
        .filter(port => port.country === selectedCountry)
        .map(port => ({
          value: JSON.stringify({ 
            code: port.code,
            name: port.name,
            city: port.city,
            country: port.country,
            coordinates: port.coordinates
          }),
          label: `${port.city} (${port.name})`
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
      setCities(countryCities);
    } else {
      setCities([]);
    }
  }, [selectedCountry]);

  // Initialize state based on incoming value
  useEffect(() => {
    if (value) {
      setSelectedCountry(value.country);
      setSelectedCity(JSON.stringify(value));
    } else {
      setSelectedCountry(null);
      setSelectedCity(null);
    }
  }, [value]);

  const handleCountryChange = (country) => {
    setSelectedCountry(country);
    setSelectedCity(null);
    onChange(null);
  };

  const handleCityChange = (cityJson) => {
    setSelectedCity(cityJson);
    if (cityJson) {
      onChange(JSON.parse(cityJson));
    } else {
      onChange(null);
    }
  };

  return (
    <Stack spacing="xs">
      <Select
        label={label}
        placeholder="Select country"
        data={countries}
        value={selectedCountry}
        onChange={handleCountryChange}
        searchable
        required={required}
        clearable
      />
      <Select
        label="City"
        placeholder="Select city"
        data={cities}
        value={selectedCity}
        onChange={handleCityChange}
        searchable
        disabled={!selectedCountry}
        required={required}
        clearable
      />
    </Stack>
  );
} 