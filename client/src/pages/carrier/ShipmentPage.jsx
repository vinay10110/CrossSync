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
  NumberInput,
  Select,
  Textarea,
  Modal,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import BidsTable from '../../components/BidsTable';

const CURRENCIES = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'CNY', label: 'CNY - Chinese Yuan' },
  { value: 'INR', label: 'INR - Indian Rupee' },
];

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
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [bidAmount, setBidAmount] = useState(0);
  const [bidCurrency, setBidCurrency] = useState('USD');
  const [bidNotes, setBidNotes] = useState('');

  useEffect(() => {
    if (!shipment?._id) {
      // Extract shipment ID from URL if not passed through state
      const shipmentId = location.pathname.split('/').pop();
      fetchShipmentDetails(shipmentId);
    }
  }, [location]);

  // Add polling for bid updates
  useEffect(() => {
    if (shipment?._id) {
      const pollInterval = setInterval(() => {
        fetchShipmentDetails(shipment._id);
      }, 10000); // Poll every 10 seconds

      return () => clearInterval(pollInterval);
    }
  }, [shipment?._id]);

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

  const handlePlaceBid = async () => {
    try {
      setLoading(true);

      const bidData = {
        amount: bidAmount,
        currency: bidCurrency,
        notes: bidNotes,
        carrierId: user.id,
        carrierEmail: user.emailAddresses[0].emailAddress
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/shipments/${shipment._id}/bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bidData),
      });

      if (!response.ok) throw new Error('Failed to place bid');

      // Refresh shipment details to show new bid
      await fetchShipmentDetails(shipment._id);

      notifications.show({
        title: 'Success',
        message: 'Bid placed successfully',
        color: 'green',
      });

      // Reset bid form
      setBidAmount(0);
      setBidNotes('');
      setBidModalOpen(false);
    } catch (error) {
      console.error('Error placing bid:', error);
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to place bid',
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

  const isCarrier = user?.publicMetadata?.role === 'carrier';
  const hasPlacedBid = shipment.bids?.some(
    bid => bid.carrier.email === user?.emailAddresses?.[0]?.emailAddress
  );

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
            {isCarrier && !hasPlacedBid && !shipment.isCompleted && (
              <Button
                onClick={() => setBidModalOpen(true)}
                loading={loading}
              >
                Place Bid
              </Button>
            )}
          </Group>

          <Grid>
            <Grid.Col span={8}>
              <Stack spacing="md">
                <Card withBorder>
                  <Title order={4} mb="md">Route Information</Title>
                  <Group grow>
                    <Stack spacing="xs">
                      <Text size="sm" color="dimmed">Origin</Text>
                      <Text>{typeof shipment.origin === 'object' ? shipment.origin.name : shipment.origin}</Text>
                      <Text size="sm">
                        {typeof shipment.origin === 'object' 
                          ? `${shipment.origin.city || ''}, ${shipment.origin.country || ''}`
                          : ''}
                      </Text>
                    </Stack>
                    <Stack spacing="xs">
                      <Text size="sm" color="dimmed">Destination</Text>
                      <Text>{typeof shipment.destination === 'object' ? shipment.destination.name : shipment.destination}</Text>
                      <Text size="sm">
                        {typeof shipment.destination === 'object'
                          ? `${shipment.destination.city || ''}, ${shipment.destination.country || ''}`
                          : ''}
                      </Text>
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
                  bids={shipment.bids || []}
                  onAcceptBid={handleAcceptBid}
                  onRejectBid={handleRejectBid}
                  isOwner={isOwner}
                />
              </Stack>
            </Grid.Col>
          </Grid>
        </Stack>
      </Paper>

      {/* Bid Modal */}
      <Modal
        opened={bidModalOpen}
        onClose={() => setBidModalOpen(false)}
        title="Place a Bid"
      >
        <Stack spacing="md">
          <Group grow>
            <NumberInput
              label="Bid Amount"
              value={bidAmount}
              onChange={(value) => setBidAmount(value)}
              min={0}
              precision={2}
              required
            />
            <Select
              label="Currency"
              data={CURRENCIES}
              value={bidCurrency}
              onChange={setBidCurrency}
              required
            />
          </Group>
          
          <Textarea
            label="Notes"
            value={bidNotes}
            onChange={(e) => setBidNotes(e.target.value)}
            placeholder="Add any additional notes or terms..."
          />

          <Button
            onClick={handlePlaceBid}
            loading={loading}
            disabled={bidAmount <= 0}
          >
            Submit Bid
          </Button>
        </Stack>
      </Modal>
    </Container>
  );
}
