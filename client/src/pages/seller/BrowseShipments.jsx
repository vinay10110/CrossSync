import { Card, Image, Text,  Button, SimpleGrid } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import img from '../../assets/ships.jpeg'
function BrowseShipments() {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/dashboard/createshipment`);
  };

  return (
    <SimpleGrid cols={3} spacing="lg" breakpoints={[{ maxWidth: 'sm', cols: 1 }]}>
    
        <Card
          shadow="sm"
          padding="lg"
          radius="md"
          withBorder
          onClick={() => handleCardClick()} 
          style={{ cursor: 'pointer' }}
        >
          <Card.Section>
          <Image
              src={img}
              height={160}
              alt="Norway"
            />
          </Card.Section>
          <Text size="sm" color="dimmed">
            
          </Text>

          <Button color="blue" fullWidth mt="md" radius="md">
            Create Custom Request
          </Button>
        </Card>
    </SimpleGrid>
  );
}

export default BrowseShipments;
