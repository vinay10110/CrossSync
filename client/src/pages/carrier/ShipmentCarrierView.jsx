import {useNavigate,useLocation} from 'react-router-dom';
import { Button, Tabs, rem,Fieldset,TextInput,Space,ScrollArea,Modal,Image,Text,Flex } from '@mantine/core';
import { IconPhoto, IconMessageCircle } from '@tabler/icons-react';
import useStore from '../../components/Zustand';
import { useDisclosure } from '@mantine/hooks';
import { useState } from 'react';
const ShipmentTimeline = () => {
  const {removeShipment,addShipment,userDoc}=useStore();
  const [url,setUrl]=useState(null);
  const location = useLocation(); 
  const [opened, { open, close }] = useDisclosure(false);
  const shipmentData = location.state?.shipmentData; 
  const navigate=useNavigate();
  const iconStyle = { width: rem(12), height: rem(12) };
  const handleCancel=()=>{
    navigate('/dashboard/allshipmentscarrier');
  }
  const handleShipment=async()=>{
    const response=await fetch(`${import.meta.env.VITE_API_URL}/shipments/updateshipment/${shipmentData._id}`,{
      method:'PUT',
      body: JSON.stringify({updatedDoc:{isTaken:true,takenBy:userDoc._id}}),
      headers:{
        'content-type':'application/json'
      }
    });
    const result=await response.json();
    removeShipment(shipmentData._id);
    addShipment(result);
    navigate('/dashboard/allshipmentscarrier');
  }
  const handlePDF = (url) => {
    setUrl(url); 
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
  return (
  <>
  <Flex justify="flex-start" gap="xl" align="center" wrap="row" direction="row">
  <Button color='blue' onClick={handleShipment}>
Take Shipment
  </Button>
  <Button variant='light' onClick={handleCancel}>
    Back
  </Button>
  </Flex>
  
  <Space h="xl" />
  <Tabs defaultValue="gallery">
      <Tabs.List>
        <Tabs.Tab value="Details" leftSection={<IconPhoto style={iconStyle} />}>
          Product Details
        </Tabs.Tab>
        <Tabs.Tab value="Images" leftSection={<IconPhoto style={iconStyle} />}>
          Images
        </Tabs.Tab>
        <Tabs.Tab value="Documents" leftSection={<IconMessageCircle style={iconStyle} />}>
          Documents
        </Tabs.Tab>
        
      </Tabs.List>

      <Tabs.Panel value="Details">
      <Fieldset style={{ cursor: 'none' }}>
                <ScrollArea h={500}>
                {renderShipmentDetails()}
              </ScrollArea>
                 
                </Fieldset>
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

      
    </Tabs>
  </>
  );
};

export default ShipmentTimeline;
