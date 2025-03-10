import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from "@clerk/clerk-react";
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Badge,
  Button,
  Grid,
  Card,
  Image,
  SimpleGrid,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import BidsTable from '../../components/BidsTable';

const formatLocation = (location) => {
  if (!location) return '';
  if (typeof location === 'object') {
    return `${location.city}, ${location.country} (${location.name})`;
  }
  return location;
};

export default function ShipmentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const [shipment, setShipment] = useState(location.state?.shipmentData || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!shipment?._id) {
      // Extract shipment ID from URL if not passed through state
      const shipmentId = location.pathname.split('/').pop();
      fetchShipmentDetails(shipmentId);
    }
  }, [location]);

  const fetchShipmentDetails = async (shipmentId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/shipments/${shipmentId}`);
      if (!response.ok) throw new Error('Failed to fetch shipment details');
      const data = await response.json();
      setShipment(data.shipment);
    } catch (error) {
      console.error('Error fetching shipment:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load shipment details',
        color: 'red',
      });
    }
  };

  const handleAcceptBid = async (bidId) => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/shipments/${shipment._id}/bids/${bidId}/accept`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to accept bid');

      // Refresh shipment details
      await fetchShipmentDetails(shipment._id);

      notifications.show({
        title: 'Success',
        message: 'Bid accepted successfully',
        color: 'green',
      });
    } catch (error) {
      console.error('Error accepting bid:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to accept bid',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRejectBid = async (bidId) => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/shipments/${shipment._id}/bids/${bidId}/reject`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to reject bid');

      // Refresh shipment details
      await fetchShipmentDetails(shipment._id);

      notifications.show({
        title: 'Success',
        message: 'Bid rejected successfully',
        color: 'green',
      });
    } catch (error) {
      console.error('Error rejecting bid:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to reject bid',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!shipment) {
    return (
      <Container>
        <Text>Loading shipment details...</Text>
      </Container>
    );
  }

  const isOwner = user?.emailAddresses?.[0]?.emailAddress === shipment.email;

  return (
    <Container size="xl">
      <Paper shadow="xs" p="md">
        <Stack spacing="md">
          <Title order={2}>Shipment Details</Title>
          
          <Grid>
            <Grid.Col span={6}>
              <Text weight={500}>Origin:</Text>
              <Text>{formatLocation(shipment?.origin)}</Text>
            </Grid.Col>
            <Grid.Col span={6}>
              <Text weight={500}>Destination:</Text>
              <Text>{formatLocation(shipment?.destination)}</Text>
            </Grid.Col>
          </Grid>
          
          <Group position="apart">
            <Badge 
              size="lg"
              color={
                shipment.isCompleted ? 'green' : 
                shipment.dispatched ? 'blue' : 
                shipment.verifiedShipment ? 'yellow' : 
                'gray'
              }
            >
              {shipment.isCompleted ? 'Completed' : 
               shipment.dispatched ? 'In Transit' : 
               shipment.verifiedShipment ? 'Verified' : 
               'Pending'}
            </Badge>
          </Group>

          <Grid>
            <Grid.Col span={8}>
              <Stack spacing="md">
                <Card withBorder>
                  <Title order={4} mb="md">Route Information</Title>
                  <Group grow>
                    <Stack spacing="xs">
                      <Text size="sm" color="dimmed">Origin</Text>
                      <Text>{shipment.origin.name}</Text>
                      <Text size="sm">{shipment.origin.city}, {shipment.origin.country}</Text>
                    </Stack>
                    <Stack spacing="xs">
                      <Text size="sm" color="dimmed">Destination</Text>
                      <Text>{shipment.destination.name}</Text>
                      <Text size="sm">{shipment.destination.city}, {shipment.destination.country}</Text>
                    </Stack>
                  </Group>
                </Card>

                <SimpleGrid cols={2}>
                  {shipment.products.map((product, index) => (
                    <Card key={index} withBorder>
                      <Card.Section>
                        {product.productImages?.[0] && (
                          <Image
                            src={product.productImages[0]}
                            height={160}
                            alt={product.productName}
                          />
                        )}
                      </Card.Section>
                      <Stack mt="md" spacing="xs">
                        <Text weight={500}>{product.productName}</Text>
                        <Text size="sm" color="dimmed">Type: {product.productType}</Text>
                        <Text size="sm" color="dimmed">Category: {product.category}</Text>
                        <Group position="apart">
                          <Text size="sm">Quantity: {product.quantity}</Text>
                          <Text size="sm">Weight: {product.weight}kg</Text>
                        </Group>
                        <Text size="sm">Price: ${product.price}</Text>
                      </Stack>
                    </Card>
                  ))}
                </SimpleGrid>
              </Stack>
            </Grid.Col>

            <Grid.Col span={4}>
              <Stack spacing="md">
                <Card withBorder>
                  <Title order={4} mb="md">Shipping Details</Title>
                  <Stack spacing="xs">
                    <Text size="sm" color="dimmed">Company</Text>
                    <Text>{shipment.companyName}</Text>
                    <Text size="sm" color="dimmed">Total Weight</Text>
                    <Text>{shipment.totalWeight}kg</Text>
                    <Text size="sm" color="dimmed">Estimated Delivery</Text>
                    <Text>{new Date(shipment.estimatedDeliveryDate).toLocaleDateString()}</Text>
                  </Stack>
                </Card>

                <BidsTable
                  bids={shipment.bids}
                  onAcceptBid={handleAcceptBid}
                  onRejectBid={handleRejectBid}
                  isOwner={isOwner}
                />
              </Stack>
            </Grid.Col>
          </Grid>
        </Stack>
      </Paper>
    </Container>
  );
} 