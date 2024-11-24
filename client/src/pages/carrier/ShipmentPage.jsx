import { useLocation } from 'react-router-dom';
import { Timeline, Text, Avatar, ThemeIcon, Card, Grid, Title, Button, Flex } from '@mantine/core';
import { IconSun, IconVideo } from '@tabler/icons-react';

const ShipmentStatus = () => {
  
  const location = useLocation();
  const shipmentData = location.state?.shipmentData; 

  if (!shipmentData) {
    return <Text>Loading...</Text>;
  }

  return (
    <Grid>
      <Grid.Col span={4}>
        <Title order={3} mb="md">Shipment Status</Title>
        <Timeline bulletSize={24}>
          <Timeline.Item title="Request pending">
            <Text color="dimmed" size="sm">
              Default bullet without anything
            </Text>
          </Timeline.Item>

          <Timeline.Item
            title="Document verification"
            bullet={
              <Avatar
                size={22}
                radius="xl"
                src="https://avatars0.githubusercontent.com/u/10353856?s=460&u=88394dfd67727327c1f7670a1764dc38a8a24831&v=4"
              />
            }
          >
            <Text color="dimmed" size="sm">
              Timeline bullet as avatar image
            </Text>
          </Timeline.Item>

          <Timeline.Item title="Dispatched" bullet={<IconSun size="0.8rem" />}>
            <Text color="dimmed" size="sm">
              Timeline bullet as icon
            </Text>
          </Timeline.Item>

          <Timeline.Item
            title="Delivery"
            bullet={
              <ThemeIcon
                size={22}
                variant="gradient"
                gradient={{ from: 'lime', to: 'cyan' }}
                radius="xl"
              >
                <IconVideo size="0.8rem" />
              </ThemeIcon>
            }
          >
            <Text color="dimmed" size="sm">
              Timeline bullet as ThemeIcon component
            </Text>
          </Timeline.Item>
        </Timeline>
      </Grid.Col>

      <Grid.Col span={8}>
        <Title order={3} mb="md">Shipment Details</Title>
        <Card shadow="sm" padding="lg">
          <Flex  mih={50}
      gap="md"
      justify="center"
      align="center"
      direction="row"
      wrap="wrap"> <Button color="red">
            Cancel shipment
          </Button>
          <Button>
            Update
          </Button></Flex>
          
          <Text>
            <strong>Product Name:</strong> {shipmentData.productName}
          </Text>
          <Text>
            <strong>Status:</strong> {shipmentData.status}
          </Text>
          <Text>
            <strong>Expected Delivery:</strong> {shipmentData.expectedDelivery}
          </Text>
          <Text>
            <strong>Courier Service:</strong> {shipmentData.courierService}
          </Text>
          <Text>
            <strong>Current Location:</strong> {shipmentData.currentLocation}
          </Text>
          <Text>
            <strong>Recipient Name:</strong> {shipmentData.recipientName}
          </Text>
        </Card>
      </Grid.Col>
    </Grid>
  );
};

export default ShipmentStatus;
