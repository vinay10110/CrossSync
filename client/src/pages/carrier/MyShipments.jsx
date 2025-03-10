import { Card, Image, Text, Badge, Button, Group, SimpleGrid, Container, LoadingOverlay, Stack, Divider } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { IconTruck, IconPackage, IconCalendar, IconWeight } from '@tabler/icons-react';

function MyShipments() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.emailAddresses?.[0]?.emailAddress) {
      fetchMyShipments();
    }
  }, [user?.emailAddresses]);

  const fetchMyShipments = async () => {
    if (!user?.emailAddresses?.[0]?.emailAddress) {
      console.log('No user email available');
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching accepted bids for user:', {
        id: user.id,
        email: user.emailAddresses[0].emailAddress
      });

      // First try to fetch accepted bids
      const acceptedBidsResponse = await fetch(`${import.meta.env.VITE_API_URL}/shipments/accepted-bids`, {
        headers: {
          'Authorization': `Bearer ${user.id}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!acceptedBidsResponse.ok) {
        const errorData = await acceptedBidsResponse.json().catch(() => ({}));
        console.error('Failed to fetch accepted bids:', {
          status: acceptedBidsResponse.status,
          statusText: acceptedBidsResponse.statusText,
          error: errorData
        });
        throw new Error(`Failed to fetch accepted bids: ${errorData.message || acceptedBidsResponse.statusText}`);
      }

      const acceptedBidsData = await acceptedBidsResponse.json();
      console.log('Received accepted bids data:', acceptedBidsData);

      if (acceptedBidsData.acceptedBids?.length > 0) {
        const formattedShipments = acceptedBidsData.acceptedBids.map(bid => {
          const shipment = bid.shipment || {};
          const products = shipment.products || [];
          const firstProduct = products[0] || {};
          
          const formatted = {
            _id: shipment._id,
            products: products.map(p => ({
              ...p,
              productImages: p.productImages || [],
              dimensions: p.dimensions || { length: 0, width: 0, height: 0, unit: 'cm' }
            })),
            origin: shipment.origin || {},
            destination: shipment.destination || {},
            totalWeight: shipment.totalWeight || 0,
            estimatedDeliveryDate: shipment.estimatedDeliveryDate,
            isCompleted: shipment.isCompleted || false,
            dispatched: shipment.dispatched || false,
            verifiedShipment: shipment.verifiedShipment || false,
            shippingStatus: shipment.shippingStatus || 'pending',
            bidAmount: bid.amount,
            bidCurrency: bid.currency,
            bidStatus: bid.status,
            seller: bid.seller || {}
          };
          
          console.log('Formatted shipment:', {
            id: formatted._id,
            productCount: formatted.products.length,
            firstProductName: firstProduct.productName
          });
          
          return formatted;
        });
        
        console.log(`Setting ${formattedShipments.length} shipments`);
        setShipments(formattedShipments);
      } else {
        console.log('No accepted bids found in response');
        setShipments([]);
      }
    } catch (error) {
      console.error('Error in fetchMyShipments:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to fetch your shipments. ' + error.message,
        color: 'red',
        autoClose: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (shipment) => {
    navigate(`/dashboard/myshipment/${shipment._id}`, { 
      state: { shipmentData: shipment } 
    });
  };

  const getStatusColor = (shipment) => {
    if (shipment.isCompleted) return 'green';
    if (shipment.dispatched) return 'blue';
    if (shipment.verifiedShipment) return 'yellow';
    return 'gray';
  };

  const getStatusText = (shipment) => {
    if (shipment.isCompleted) return 'Completed';
    if (shipment.dispatched) return 'In Transit';
    if (shipment.verifiedShipment) return 'Verified';
    return 'Pending';
  };

  if (loading) {
    return (
      <Container style={{ height: '200px', position: 'relative' }}>
        <LoadingOverlay visible={true} />
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Stack spacing="md">
        <Group position="apart">
          <Text size="xl" weight={700}>My Shipments</Text>
          <Badge size="lg">
            Total Shipments: {shipments.length}
          </Badge>
        </Group>

        {shipments.length === 0 ? (
          <Text align="center" size="lg" color="dimmed" mt="xl">
            You haven't accepted any shipments yet. Browse available shipments to get started.
          </Text>
        ) : (
          <SimpleGrid cols={3} spacing="lg" breakpoints={[{ maxWidth: 'sm', cols: 1 }]}>
            {shipments.map((shipment) => (
              <Card
                key={shipment._id}
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
                onClick={() => handleCardClick(shipment)} 
                style={{ cursor: 'pointer' }}
              >
                <Card.Section>
                  <Image
                    src={shipment.products?.[0]?.productImages?.[0] || 'https://placehold.co/600x400?text=No+Image'}
                    height={160}
                    alt="Shipment"
                  />
                </Card.Section>

                <Stack spacing="xs" mt="md">
                  <Group position="apart">
                    <Text weight={500} size="lg">{shipment.products?.[0]?.productName || 'Unnamed Product'}</Text>
                    <Badge color={getStatusColor(shipment)}>
                      {getStatusText(shipment)}
                    </Badge>
                  </Group>

                  <Group spacing="xs">
                    <IconPackage size={16} />
                    <Text size="sm" color="dimmed">
                      {shipment.products?.length || 0} product(s)
                    </Text>
                  </Group>

                  <Group spacing="xs">
                    <IconTruck size={16} />
                    <Text size="sm" color="dimmed">
                      From: {typeof shipment.origin === 'object' 
                        ? `${shipment.origin.city || ''}, ${shipment.origin.country || ''}` 
                        : shipment.origin || ''} 
                      → To: {typeof shipment.destination === 'object'
                        ? `${shipment.destination.city || ''}, ${shipment.destination.country || ''}`
                        : shipment.destination || ''}
                    </Text>
                  </Group>

                  <Group spacing="xs">
                    <IconWeight size={16} />
                    <Text size="sm" color="dimmed">
                      Total Weight: {shipment.totalWeight}kg
                    </Text>
                  </Group>

                  <Group spacing="xs">
                    <IconCalendar size={16} />
                    <Text size="sm" color="dimmed">
                      Delivery: {new Date(shipment.estimatedDeliveryDate).toLocaleDateString()}
                    </Text>
                  </Group>

                  <Divider my="sm" />

                  <Group position="apart">
                    <Text size="sm" weight={500}>Bid Amount:</Text>
                    <Text size="sm" weight={700} color="blue">
                      {shipment.bidAmount} {shipment.bidCurrency}
                    </Text>
                  </Group>

                  <Button 
                    color="blue" 
                    fullWidth 
                    mt="md" 
                    radius="md"
                    leftIcon={<IconTruck size={16} />}
                  >
                    View Status
                  </Button>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Container>
  );
}

export default MyShipments;
