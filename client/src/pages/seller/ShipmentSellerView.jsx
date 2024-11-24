import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { IconClock,IconTruck,IconPackage,IconFileCheck } from '@tabler/icons-react';
import { Timeline, Text, Title, Container, Grid, Flex, Fieldset, TextInput, Modal, Tabs, Button,Breadcrumbs,Alert,Image,Space,ScrollArea,Divider } from '@mantine/core';
import {  IconPhoto, IconMessageCircle, IconSettings } from '@tabler/icons-react';
import { IconInfoCircle } from '@tabler/icons-react';
import { rem } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import {Link} from 'react-router-dom'
const ShipmentStatus = () => {
  const location = useLocation();
  const shipmentData = location.state?.shipmentData;
  const [activeSteps, setActiveSteps] = useState(0);
  const [opened, { open, close }] = useDisclosure(false);
  const icon = <IconInfoCircle />;
  const iconStyle = { width: rem(12), height: rem(12) };
  const [url, setUrl] = useState(null);
  
  useEffect(() => {
    if (shipmentData) {
      const { verifiedShipment, isTaken, dispatched, isCompleted } = shipmentData;
      if (verifiedShipment && isTaken && dispatched && isCompleted) {
        setActiveSteps(4);
      } else if (verifiedShipment && isTaken && dispatched) {
        setActiveSteps(3);
      } else if (verifiedShipment && isTaken) {
        setActiveSteps(2);
      } else if (isTaken) {
        setActiveSteps(1);
      }
    }
  }, [shipmentData]);

  if (!shipmentData) {
    return <Text color="red">No shipment data available. Take shipments to make progress</Text>;
  }

 
  const handlePDF = (url) => {
    setUrl(url);
    console.log(url)
    open(); 
  };

 
  const renderShipmentDetails = () => {
    const fields = [
      { label: 'Product Name', value: shipmentData.productName },
      { label: 'Category', value: shipmentData.category },
      { label: 'Sub Category', value: shipmentData.subCategory },
      { label: 'Origin', value: shipmentData.origin },
      { label: 'Destination', value: shipmentData.destination },
      { label: 'Quantity', value: shipmentData.quantity },
      { label: 'Price', value: shipmentData.price },
      { label: 'Weight', value: shipmentData.weight },
      { label: 'Dimensions', value: shipmentData.dimensions },
      { label: 'Estimated Delivery Date', value: shipmentData.estimatedDeliveryDate }
    ];

    return fields.map(({ label, value }, index) => (
      <TextInput key={index} label={label} placeholder={value} disabled styles={{ input: { cursor: 'default' } }} />
    ));
  };
  const items = [
    { title: 'Shipments', href: '/dashboard/myshipments' }, 
    { title: 'Shipmentdetails' }, 
  ].map((item, index) => (
    <Link to={item.href} key={index}>
      {item.title}
    </Link>
  ));
  return (
    <Container fluid>
      
      <Breadcrumbs>{items}</Breadcrumbs>
      <Space h="xl" />
      <Flex direction={{ base: 'column', sm: 'row' }} gap={{ base: 'sm', sm: 'lg' }} justify="center">
       
        <Grid justify="center" align="center" gutter="lg" style={{ flex: 1 }}>
          <Grid.Col xs={12} sm={6} md={5}>
          <Space h="xl" />
          <Space h="xl" />
            <Title order={3} mb="md">Shipment Status Timeline</Title>
            
            <Timeline bulletSize={24} active={activeSteps}>
              <Timeline.Item title="Request Pending" bullet={<IconClock size={24} />}>
                <Text color="dimmed" size="sm">Your request is currently pending, awaiting processing.</Text>
              </Timeline.Item>

              <Timeline.Item title="Document Verification" bullet={<IconFileCheck size={24} />}>
                <Text color="dimmed" size="sm">The shipment documents are being verified.</Text>
              </Timeline.Item>

              <Timeline.Item title="Dispatched" bullet={<IconTruck size={24} />}>
                <Text color="dimmed" size="sm">Your shipment has been dispatched and is on its way.</Text>
              </Timeline.Item>

              <Timeline.Item title="Delivery" bullet={<IconPackage size={24} />}>
                <Text color="dimmed" size="sm">Your shipment is now delivered to the destination.</Text>
              </Timeline.Item>
            </Timeline>
          </Grid.Col>
        </Grid>
        <Divider size="md" orientation="vertical" />
        
        <Grid justify="center" align="center" gutter="lg" style={{ flex: 1 }}>
          <Grid.Col xs={12} sm={6} md={5}>
            <Tabs defaultValue="Details">
              <Tabs.List>
                <Tabs.Tab value="Details" leftSection={<IconPhoto style={iconStyle} />}>Shipment Details</Tabs.Tab>
                <Tabs.Tab value="Documents" leftSection={<IconMessageCircle style={iconStyle} />}>Documents</Tabs.Tab>
                <Tabs.Tab value="Images" leftSection={<IconMessageCircle style={iconStyle} />}>Images</Tabs.Tab>
                <Tabs.Tab value="Updates" leftSection={<IconSettings style={iconStyle} />}>Shipment Settings</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="Details">
              <Space h="xl" />
                <Fieldset style={{ cursor: 'none' }}>
                <ScrollArea h={500}>
                {renderShipmentDetails()}
              </ScrollArea>
                 
                </Fieldset>
              </Tabs.Panel>

              <Tabs.Panel value="Documents">
              <Space h="xl" />
                <Modal opened={opened} onClose={close} title="Document Preview">
                  <Image src={url} />
                </Modal>
                <Flex align="center" justify="center" gap="xl">
                  <Text>
                    Certificate of origin:
                  </Text>
                  <Button onClick={()=>{handlePDF(shipmentData.certificateOfOrigin)}}>Preview Document</Button>
                </Flex>
                <Space h="xl" />
                <Flex align="center" justify="center" gap="xl">
                <Text>
                    Commercial Invoice:
                  </Text>
                  <Button onClick={()=>{handlePDF(shipmentData.commercialInvoice)}}>Preview Document</Button>
                </Flex>
                <Space h="xl" />
                <Flex align="center" justify="center" gap="xl">
                <Text>
                    Packing List:
                  </Text>
                  <Button onClick={()=>{handlePDF(shipmentData.packingList)}}>Preview Document</Button>
                </Flex>
              </Tabs.Panel>
              <Tabs.Panel value="Images">
              <Space h="xl" />  
  
  <Flex wrap="wrap" justify="center" gap="sm">
    {shipmentData.images && shipmentData.images.length > 0 ? (
      shipmentData.images.map((imageUrl, index) => (
        <Image
              src={imageUrl}
              height={160}
              alt="Norway"
              key={index}
            />
      ))
    ) : (
      <Text>No images available for this shipment.</Text>
    )}
  </Flex>
                
              </Tabs.Panel>
              <Tabs.Panel value="Updates">
              <Space h="xl" />
                <Text color="dimmed" size="sm">
                  <Flex 
                  justify="center"
                  align="center"
                  direction="column"
                  gap="lg"
                  >
                    <Flex
                    justify="center"
                    align="center"
                    direction="row"
                    gap="lg"
                    >
                    <Button color='red'>
                    Cancel
                  </Button>
                  <Alert variant="outline" color="red" radius="md" title="Note" icon={icon}>
      Cancelling shipment may cause unrefundable
    </Alert>
                    </Flex>
                 
                    <Flex
                    justify="center"
                    align="center"
                    direction="row"
                    gap="lg"
                    >
                    <Button>
                    Update 
                  </Button>
                  <Alert variant="default" color="red" radius="md" title="Note" icon={icon}>
      Once the shipment is dispatced updates are not possible
    </Alert>
                    </Flex>
                    <Flex
                    justify="center"
                    align="center"
                    direction="row"
                    gap="lg"
                    >
                    <Button>
                    Refund
                  </Button>
                  <Alert variant="default" color="red" radius="md" title="Note" icon={icon}>
      Refund is not 100%
    </Alert>
                    </Flex>
                  </Flex>
                  
                </Text>
              </Tabs.Panel>
            </Tabs>
          </Grid.Col>
        </Grid>
      </Flex>
    </Container>
  );
};

export default ShipmentStatus;
