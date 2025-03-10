import { Card, Image, Text, Button, Group, SimpleGrid, Badge, Stack } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useUser } from "@clerk/clerk-react";
import { useEffect, useState } from 'react';
import { IconArrowLeft, IconListDetails } from '@tabler/icons-react';

const formatLocation = (location) => {
  if (!location) return '';
  if (typeof location === 'object') {
    return `${location.city}, ${location.country} (${location.name})`;
  }
  return location;
};

function AllShipmentsSeller() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [shipments, setShipments] = useState([]);

  useEffect(() => {
    const fetchUserShipments = async () => {
      if (!user?.emailAddresses?.[0]?.emailAddress) return;

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/shipments/user/${user.emailAddresses[0].emailAddress}`);
        if (!response.ok) {
          throw new Error('Failed to fetch shipments');
        }
        const data = await response.json();
        setShipments(data.shipments);
      } catch (error) {
        console.error('Error fetching shipments:', error);
      }
    };

    fetchUserShipments();
  }, [user]);

  const handleCardClick = (shipment) => {
    navigate(`/dashboard/shipment/${shipment._id}`, { state: { shipmentData: shipment } });
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <>
      <Group position="apart" mb="xl">
        <Button 
          variant="light" 
          leftIcon={<IconArrowLeft size={16} />}
          onClick={handleBack}
        >
          Back
        </Button>
      </Group>

      <SimpleGrid cols={3} spacing="lg" breakpoints={[{ maxWidth: 'sm', cols: 1 }]}>
        {shipments.map((item, index) => (
          <Card
            shadow="sm"
            padding="lg"
            radius="md"
            withBorder
            key={index}
            style={{ cursor: 'pointer' }}
          >
            <Card.Section>
              {item.products?.[0]?.productImages?.[0] && (
                <Image
                  src={item.products[0].productImages[0]}
                  height={160}
                  alt="Product"
                />
              )}
            </Card.Section>

            <Stack mt="md" spacing="sm">
              <Group position="apart">
                <Text fw={500}>{item.products?.[0]?.productName || 'Untitled Product'}</Text>
                <Badge 
                  color={
                    item.isCompleted ? 'green' : 
                    item.dispatched ? 'blue' : 
                    item.verifiedShipment ? 'yellow' : 
                    'gray'
                  }
                >
                  {item.isCompleted ? 'Completed' : 
                   item.dispatched ? 'In Transit' : 
                   item.verifiedShipment ? 'Verified' : 
                   'Pending'}
                </Badge>
              </Group>

              <Text size="sm" color="dimmed">
                From: {formatLocation(item.origin)}
              </Text>
              <Text size="sm" color="dimmed">
                To: {formatLocation(item.destination)}
              </Text>

              {item.bids && item.bids.length > 0 && (
                <Group spacing="xs">
                  <Badge variant="dot" size="sm">
                    {item.bids.length} {item.bids.length === 1 ? 'Bid' : 'Bids'}
                  </Badge>
                  {item.bids.some(bid => bid.status === 'accepted') && (
                    <Badge variant="dot" color="green" size="sm">
                      Carrier Selected
                    </Badge>
                  )}
                </Group>
              )}

              <Button 
                color="blue" 
                fullWidth 
                mt="md" 
                radius="md"
                leftIcon={<IconListDetails size={16} />}
                onClick={() => handleCardClick(item)}
              >
                {item.bids && item.bids.length > 0 ? 'View Bids' : 'View Status'}
              </Button>
            </Stack>
          </Card>
        ))}
        {shipments.length === 0 && (
          <Text align="center" size="lg" color="dimmed">
            No shipments found. Create a new shipment to get started.
          </Text>
        )}
      </SimpleGrid>
    </>
  );
}

export default AllShipmentsSeller;
