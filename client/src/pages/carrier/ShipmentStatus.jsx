/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Timeline, Text,  Title, Container, Grid, Flex, Fieldset, TextInput, Modal, Tabs, Button,Breadcrumbs,Space,ScrollArea,Image,RingProgress,Alert } from '@mantine/core';
import {  IconPhoto, IconMessageCircle, IconSettings,IconClock,IconFileCheck,IconTruck,IconPackage } from '@tabler/icons-react';
import { rem } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {Link} from 'react-router-dom';
import { IconInfoCircle } from '@tabler/icons-react';
const ShipmentStatus = () => {
  const icon = <IconInfoCircle />;
  const location = useLocation();
  const shipmentData = location.state?.shipmentData;
  const [activeSteps, setActiveSteps] = useState(0);
  const [opened, { open, close }] = useDisclosure(false);
  const [url, setUrl] = useState(null);
  const iconStyle = { width: rem(12), height: rem(12) };
  const [progressCertificate, setProgressCertificate] = useState(0);
  const [progressInvoice, setProgressInvoice] = useState(0);
  const [progressPackingList, setProgressPackingList] = useState(0);
  const [isVerfied,setisVerfied]=useState(shipmentData.verifiedShipment);
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

  
  const handleDocuments = async (url) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/google/analyzedoc`, {
      method: 'POST',
      body: JSON.stringify({imageUrl:url}),
      headers: { 'Content-Type': 'application/json' }
    });
    const data=await response.json();
    if (data.documentType=='commercial_invoice') {
      setProgressInvoice(100);
    }
    else if(data.documentType=='packing_list'){
setProgressPackingList(100);
    }
    else if(data.documentType=='certificate_of_origin'){
setProgressCertificate(100);
    }
  };

const handleVerified=async()=>{
  const response=await fetch(`${import.meta.env.VITE_API_URL}/shipments/updateshipment/${shipmentData._id}`,{
    method:'PUT',
    body: JSON.stringify({updatedDoc:{verifiedShipment:true}}),
    headers:{
      'content-type':'application/json'
    }
  });
  const result=await response.json();
  console.log(result);

}
  const renderShipmentDetails = () => {
    const formatLocation = (location) => {
      if (typeof location === 'object') {
        const { name, city, country } = location;
        return `${city}, ${country} (${name})`;
      }
      return location || '';
    };

    const formatDimensions = (dimensions) => {
      if (typeof dimensions === 'object') {
        const { length, width, height, unit } = dimensions;
        return `${length}x${width}x${height} ${unit}`;
      }
      return dimensions || '';
    };

    const fields = [
      { label: 'Company Name', value: shipmentData.companyName || '' },
      { label: 'Origin', value: formatLocation(shipmentData.origin) },
      { label: 'Destination', value: formatLocation(shipmentData.destination) },
      { label: 'Total Weight', value: `${shipmentData.totalWeight || 0} kg` },
      { label: 'Estimated Delivery', value: new Date(shipmentData.estimatedDeliveryDate).toLocaleDateString() },
    ];

    // Add product details if available
    if (shipmentData.products && shipmentData.products.length > 0) {
      const product = shipmentData.products[0]; // Display first product for now
      fields.push(
        { label: 'Product Name', value: product.productName || '' },
        { label: 'Category', value: product.category || '' },
        { label: 'Sub Category', value: product.subCategory || '' },
        { label: 'Product Type', value: product.productType || '' },
        { label: 'Weight', value: `${product.weight || 0} kg` },
        { label: 'Quantity', value: product.quantity || 0 },
        { label: 'Price', value: `$${product.price || 0}` },
        { label: 'Dimensions', value: formatDimensions(product.dimensions) },
        { label: 'Handling Instructions', value: product.handlingInstructions || '' }
      );
    }

    return (
      <Grid>
        {fields.map((field, index) => (
          <Grid.Col span={6} key={index}>
            <TextInput
              label={field.label}
              value={field.value}
              readOnly
            />
          </Grid.Col>
        ))}
      </Grid>
    );
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

       
        <Grid justify="center" align="center" gutter="lg" style={{ flex: 1 }}>
          <Grid.Col xs={12} sm={6} md={5}>
            <Tabs defaultValue="Details">
              <Tabs.List>
                <Tabs.Tab value="Details" leftSection={<IconPhoto style={iconStyle} />}>Shipment Details</Tabs.Tab>
                <Tabs.Tab value="Documents" leftSection={<IconMessageCircle style={iconStyle} />}>Documents</Tabs.Tab>
                <Tabs.Tab value="Profile" leftSection={<IconSettings style={iconStyle} />}>Seller Profile</Tabs.Tab>
                <Tabs.Tab value="Updates" leftSection={<IconSettings style={iconStyle} />}>Updates</Tabs.Tab>
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
               
               
              <Modal opened={opened} onClose={close} title="Document Preview">
                  <Image src={url} />
                </Modal>
                <Space h="xl" />
                <Flex align="center" justify="center" gap="xl">
                  <Text>
                    Certificate of origin:
                  </Text>
                  <Button onClick={()=>{handlePDF(shipmentData.certificateOfOrigin)}}>Preview Document</Button>
                  {
                    progressCertificate==100 ?<>
                    <RingProgress
        sections={[{ progressCertificate, color: 'blue' }]}
        transitionDuration={250}
        label={<Text ta="center">{progressCertificate}%</Text>}
      />
                    </>:
                    <>
                     <Button variant='outline' onClick={()=>{handleDocuments(shipmentData.certificateOfOrigin)}}>Validate</Button>
                    </>
                  }
                 
                </Flex>
                <Space h="xl" />
                <Flex align="center" justify="center" gap="xl">
                <Text>
                    Commercial Invoice:
                  </Text>
                  <Button onClick={()=>{handlePDF(shipmentData.commercialInvoice)}}>Preview Document</Button>
                  {
                    progressInvoice==100 ?<>
                    <RingProgress
        sections={[{ progressInvoice, color: 'blue' }]}
        transitionDuration={250}
        label={<Text ta="center">{progressInvoice}%</Text>}
      />
                    </>:
                    <>
                     <Button variant='outline' onClick={()=>{handleDocuments(shipmentData.commercialInvoice)}}>Validate</Button>
                    </>
                  }
                </Flex>
                <Space h="xl" />
                <Flex align="center" justify="center" gap="xl">
                <Text>
                    Packing List:
                  </Text>
                  <Button onClick={()=>{handlePDF(shipmentData.packingList)}}>Preview Document</Button>
                  {
                    progressPackingList==100 ?<>
                    <RingProgress
        sections={[{ progressPackingList, color: 'blue' }]}
        transitionDuration={250}
        label={<Text ta="center">{progressPackingList}%</Text>}
      />
                    </>:
                    <>
                     <Button variant='outline' onClick={()=>{handleDocuments(shipmentData.packingList)}}>Validate</Button>
                    </>
                  }
                </Flex>
                
              </Tabs.Panel>

              <Tabs.Panel value="Seller Profile">
                
                
              </Tabs.Panel>

              <Tabs.Panel value="Updates">
              <Space h="xl" />
                <Flex
                mih={50}
                gap="xl"
                justify="center"
                align="center"
                direction="column"
                wrap="wrap"
                >
                
<Button onClick={(()=>{handleVerified()})} disabled={!isVerfied}>documents verfied</Button>
               <Button>request documents reupload</Button>
               <Button color='red'> Cancel Shipment</Button>
                </Flex>
                <Space h="xl" />
                <Alert variant="light" color="blue" title="Alert title" icon={icon}>
      Canceling shipment may not return 100% money
    </Alert>
              </Tabs.Panel>
            </Tabs>
          </Grid.Col>
        </Grid>
      </Flex>
    </Container>
  );
};

export default ShipmentStatus;
