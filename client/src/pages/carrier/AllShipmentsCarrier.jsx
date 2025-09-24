import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Image, Text, Badge, Button, Group, SimpleGrid } from '@mantine/core';

const AllShipmentsCarrier = () => {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState([]);

  useEffect(() => {
    fetchAvailableShipments();
    console.log("hello")
  }, []);

  const fetchAvailableShipments = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/shipments/available`);
      if (!response.ok) {
        throw new Error('Failed to fetch shipments');
      }
      const data = await response.json();
      console.log('Fetched shipments:', data.shipments);
      setShipments(data.shipments);
    } catch (error) {
      console.error('Error fetching available shipments:', error);
    }
  };

  const handleCardClick = (shipment) => {
    console.log('Shipment data before navigation:', shipment);
    navigate(`/dashboard/shipment/${shipment._id}`, { 
      state: { 
        shipmentData: shipment
      }
    });
  };

  return (
    <SimpleGrid cols={3} spacing="lg" breakpoints={[{ maxWidth: 'sm', cols: 1 }]}>
      {shipments.map((item, index) => (
        <Card
          shadow="sm"
          padding="lg"
          radius="md"
          key={index}
          onClick={() => handleCardClick(item)} 
          style={{ cursor: 'pointer' }}
        >
          <Card.Section>
            {item.products?.[0]?.productImages?.[0] && (
              <Image
                src={item.products[0].productImages[0]}
                height={160}
                alt="Product"
                fallbackSrc="https://placehold.co/600x400?text=No+Image"
              />
            )}
            {!item.products?.[0]?.productImages?.[0] && (
              <Image
                src="https://placehold.co/600x400?text=No+Image"
                height={160}
                alt="No Image"
              />
            )}
          </Card.Section>

          <Group justify="space-between" mt="md" mb="xs">
            <Text fw={500}>{item.products?.[0]?.productName || 'Untitled Product'}</Text>
            <Badge color="blue">{item.products?.[0]?.category || 'General'}</Badge>
          </Group>

          <Text size="sm" color="dimmed" mb="md">
            From: {typeof item.origin === 'object' 
              ? `${item.origin.city || ''}, ${item.origin.country || ''}` 
              : item.origin || ''} 
            → To: {typeof item.destination === 'object'
              ? `${item.destination.city || ''}, ${item.destination.country || ''}`
              : item.destination || ''}
          </Text>

          <Group justify="space-between" mt="xs">
            <Text size="sm" c="dimmed">
              Weight: {item.products?.[0]?.weight || 0} kg
            </Text>
            <Text size="sm" c="dimmed">
              Quantity: {item.products?.[0]?.quantity || 0}
            </Text>
          </Group>

          <Button color="blue" fullWidth mt="md" radius="md">
            View Details & Place Bid
          </Button>
        </Card>
      ))}
      {shipments.length === 0 && (
        <Text align="center" size="lg" color="dimmed" style={{ gridColumn: '1 / -1' }}>
          No available shipments at the moment.
        </Text>
      )}
    </SimpleGrid>
  );
};

export default AllShipmentsCarrier; 