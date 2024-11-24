import { Card, Image, Text, Badge, Button, Group, SimpleGrid } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import useStore from '../../components/Zustand'
function AllShipmentsCarrier() {
  const navigate = useNavigate();
   let {shipments}=useStore();
 shipments=shipments.filter((shipment)=>shipment.isTaken==false)
  const handleCardClick = (shipment) => {
    navigate(`/dashboard/shipment/${shipment._id}`, { state: { shipmentData: shipment } });
  };

  return (
    <SimpleGrid cols={3} spacing="lg" breakpoints={[{ maxWidth: 'sm', cols: 1 }]}>
      {shipments.map((item, index) => (
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
            <Badge color="pink">{item.badge}</Badge>
          </Group>

          <Text size="sm" color="dimmed">
            {item.description}
          </Text>

          <Button color="blue" fullWidth mt="md" radius="md">
            see details
          </Button>
        </Card>
      ))}
    </SimpleGrid>
  );
}

export default AllShipmentsCarrier;
