import { Card, Image, Text, Button, SimpleGrid, Group, Stack, Badge, Container, Title } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import img from '../../assets/ships.jpeg';
import { useUser } from "@clerk/clerk-react";
import { notifications } from '@mantine/notifications';
import { IconPackage, IconRuler, IconWeight } from '@tabler/icons-react';

function BrowseShipments() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [savedProducts, setSavedProducts] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    if (user?.emailAddresses?.[0]?.emailAddress) {
      fetchSavedProducts();
    }
  }, [user]);

  const fetchSavedProducts = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/seller/products/${user.emailAddresses[0].emailAddress}`);
      if (response.ok) {
        const data = await response.json();
        setSavedProducts(data.products);
      }
    } catch (error) {
      console.error('Error fetching saved products:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to fetch product templates',
        color: 'red'
      });
    }
  };

  const handleCustomShipment = () => {
    navigate('/dashboard/createshipment');
  };

  const handleInstantShipment = () => {
    setShowTemplates(true);
  };

  const handleSelectTemplate = (product) => {
    navigate('/dashboard/createshipment', {
      state: {
        productTemplate: product,
        isInstantShipment: true
      }
    });
  };

  const handleBack = () => {
    setShowTemplates(false);
  };

  if (showTemplates) {
    return (
      <Container size="xl">
        <Group position="apart" mb="xl">
          <Title order={2}>Select Product Template</Title>
          <Button variant="light" onClick={handleBack}>Back</Button>
        </Group>

        <SimpleGrid cols={3} spacing="lg" breakpoints={[
          { maxWidth: 'md', cols: 2 },
          { maxWidth: 'sm', cols: 1 }
        ]}>
          {savedProducts.map((product) => (
            <Card 
              key={product._id}
              shadow="sm" 
              padding="lg" 
              radius="md" 
              withBorder
              style={{ cursor: 'pointer' }}
              onClick={() => handleSelectTemplate(product)}
            >
              {product.images && product.images.length > 0 && (
                <Card.Section>
                  <Image
                    src={product.images[0]}
                    height={160}
                    alt={product.name}
                  />
                </Card.Section>
              )}
              <Stack mt="md" spacing="sm">
                <Text weight={500} size="lg">{product.name}</Text>
                <Badge color="blue">{product.type}</Badge>
                
                <Group spacing="xs">
                  <Group spacing={4}>
                    <IconRuler size={16} color="#666" />
                    <Text size="sm" color="dimmed">
                      {product.dimensions || 'No dimensions'}
                    </Text>
                  </Group>
                  <Group spacing={4}>
                    <IconWeight size={16} color="#666" />
                    <Text size="sm" color="dimmed">
                      {product.weight ? `${product.weight} kg` : 'No weight'}
                    </Text>
                  </Group>
                </Group>

                {product.category && (
                  <Group mt="xs" spacing={4}>
                    {product.category.map((cat) => (
                      <Badge 
                        key={cat} 
                        size="sm" 
                        variant="dot" 
                        color="gray"
                      >
                        {cat}
                      </Badge>
                    ))}
                  </Group>
                )}

                <Button 
                  variant="light" 
                  color="green" 
                  fullWidth 
                  mt="md"
                >
                  Use This Template
                </Button>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      </Container>
    );
  }

  return (
    <SimpleGrid cols={2} spacing="lg" breakpoints={[{ maxWidth: 'sm', cols: 1 }]}>
      {/* Custom Shipment Card */}
      <Card
        shadow="sm"
        padding="lg"
        radius="md"
        withBorder
        onClick={handleCustomShipment}
        style={{ cursor: 'pointer' }}
      >
        <Card.Section>
          <Image
            src={img}
            height={160}
            alt="Custom Shipment"
          />
        </Card.Section>
        <Stack mt="md" spacing="sm">
          <Text weight={500} size="lg">Custom Shipment</Text>
          <Text size="sm" color="dimmed">
            Create a new shipment request with custom product details and requirements
          </Text>
          <Button color="blue" fullWidth mt="md" radius="md">
            Create Custom Request
          </Button>
        </Stack>
      </Card>

      {/* Instant Shipment Card */}
      <Card
        shadow="sm"
        padding="lg"
        radius="md"
        withBorder
        onClick={handleInstantShipment}
        style={{ cursor: 'pointer' }}
      >
        <Card.Section>
          <Image
            src={img}
            height={160}
            alt="Instant Shipment"
          />
        </Card.Section>
        <Stack mt="md" spacing="sm">
          <Text weight={500} size="lg">Instant Shipment</Text>
          <Text size="sm" color="dimmed">
            Quick shipment creation using your saved product templates
          </Text>
          <Button color="green" fullWidth mt="md" radius="md">
            Create Instant Request
          </Button>
        </Stack>
      </Card>
    </SimpleGrid>
  );
}

export default BrowseShipments;
