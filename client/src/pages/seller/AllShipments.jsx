import { Card, Image, Text, Button, Group, SimpleGrid } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import useStore from '../../components/Zustand'
function AllShipmentsSeller() {
  const navigate = useNavigate();
   const {shipments,userDoc}=useStore();
   const data=shipments.filter((shipment)=>shipment.user==userDoc._id)
  const handleCardClick = (shipment) => {
    navigate(`/dashboard/shipment/${shipment._id}`, { state: { shipmentData: shipment } });
  };

  return (
    <SimpleGrid cols={3} spacing="lg" breakpoints={[{ maxWidth: 'sm', cols: 1 }]}>
      {data.map((item, index) => (
        <Card
          shadow="sm"
          padding="lg"
          radius="md"
          withBorder
          key={index}
          onClick={() => handleCardClick(item)} 
          style={{ cursor: 'pointer' }}
        >
          <Card.Section>
          <Image
              src={item.images[0]}
              height={160}
              alt="Norway"
            />
          </Card.Section>

          <Group justify="space-between" mt="md" mb="xs">
            <Text fw={500}>{item.productName}</Text>
            <Text fw={200}>{item.shippingStatus}</Text>
          </Group>

          <Text size="sm" color="dimmed">
            {item.description}
          </Text>

          <Button color="blue" fullWidth mt="md" radius="md">
            see status
          </Button>
        </Card>
      ))}
    </SimpleGrid>
  );
}

export default AllShipmentsSeller;
