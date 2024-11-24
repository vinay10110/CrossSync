import { Card, Image, Text, Badge, Button, Group, SimpleGrid } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import useStore from '../../components/Zustand'
function MyShipments() {
  const navigate = useNavigate();
   let {shipments,userDoc}=useStore();
   const data=shipments.filter((shipment)=>shipment.takenBy==userDoc?._id)

  const handleCardClick = (shipment) => {
    navigate(`/dashboard/myshipment/${shipment._id}`, { state: { shipmentData: shipment } });
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
            <Badge color="pink">{item.badge}</Badge>
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

export default MyShipments;
