/* eslint-disable no-unused-vars */
import { useState } from 'react';
import { FileInput, Stepper, Button, Group, TextInput, NumberInput,LoadingOverlay,Box } from '@mantine/core';
import { useForm } from '@mantine/form';
import { supabase } from '../../components/Supabase';
import useStore from '../../components/Zustand';
import {useNavigate} from 'react-router-dom';
function CreateShipmentStepper() {
  const navigate=useNavigate();
  const [active, setActive] = useState(0);
const {user,addShipment} =useStore();
const [visible, setVisible] = useState(false);
 
  const form = useForm({
    initialValues: {
     
      productName: '',
      productType: '',
      category: '',
      subCategory: '',
      dimensions: '',
      weight: 0,
      quantity: 0,
      origin: '',
      destination: '',
      price: 0,
      estimatedDeliveryDate: '',
      images: [],
      commercialInvoice:'',
      packingList:'',
      certificateOfOrigin: '',
    },
    validate: {
      productName: (value) => (value ? null : 'Product Name is required'),
      productType: (value) => (value ? null : 'Product Type is required'),
      category: (value) => (value ? null : 'Category is required'),
      subCategory: (value) => (value ? null : 'Sub Category is required'),
      dimensions: (value) => (/^\d+x\d+x\d+$/.test(value) ? null : 'Invalid dimensions format (e.g., 10x20x15)'),
      weight: (value) => (value > 0 ? null : 'Weight must be greater than 0'),
      quantity: (value) => (value > 0 ? null : 'Quantity must be greater than 0'),
      origin: (value) => (value ? null : 'Origin is required'),
      destination: (value) => (value ? null : 'Destination is required'),
      price: (value) => (value > 0 ? null : 'Price must be greater than 0'),
      estimatedDeliveryDate: (value) => (/\d{4}-\d{2}-\d{2}/.test(value) ? null : 'Invalid date format (YYYY-MM-DD)'),
    },
  });

  const prevStep = () => setActive((current) => (current > 0 ? current - 1 : current));
  
   const handleCancel=()=>{
    navigate('/dashboard/browseshipment')
   }
  
  const handleSubmit = async () => {
    const shipmentData = form.values;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/shipments/createshipment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({shipmentData,email:user.email}),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(data);
        addShipment((data.shipment));
      } else {
        const errorData = await response.json();
        console.error('Backend Error:', errorData);
      }
    } catch (error) {
      console.error('Error during shipment creation:', error);
    }
  };

  const handleNext = async () => {
    if (active === 0) {
      if (form.validate().hasErrors) return; 
      setActive(1);
    } else if (active === 1) {
      if (form.validate().hasErrors) return; 

      try {
        setVisible(true);
        const imageUrls = [];
        let commercialInvoiceUrls ='';
        let packingListUrls = '';
        let certificateOfOriginUrls = '';

        
        for (const image of form.values.images) {
          const url = await uploadFile(image);
          if (url) imageUrls.push(url);
        }

       
        for (const invoice of form.values.commercialInvoice) {
          const url = await uploadFile(invoice);
          if (url) commercialInvoiceUrls=url;
        }

    
        for (const list of form.values.packingList) {
          const url = await uploadFile(list);
          if (url) packingListUrls=url;
        }

       
        for (const certificate of form.values.certificateOfOrigin) {
          const url = await uploadFile(certificate);
          if (url) certificateOfOriginUrls=url;
        }

       
        form.setFieldValue('images', imageUrls);
        form.setFieldValue('commercialInvoice', commercialInvoiceUrls);
        form.setFieldValue('packingList', packingListUrls);
        form.setFieldValue('certificateOfOrigin', certificateOfOriginUrls);

        setActive(2);
        
      } catch (error) {
        console.error('Error uploading files:', error);
      }
      finally{
        setVisible(false);
      }
    } 
    else if(active==2){
      handleSubmit();

      navigate('/dashboard/browseshipments');
    }
  };

  async function uploadFile(file) {  
    const uniqueFileName = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage.from('filesStore').upload(`files/${uniqueFileName}`, file);
    if (error) {
      console.error(error);
      return null;
    }
   const publicURL=`https://usogemhitjxzpmcfxvap.supabase.co/storage/v1/object/public/filesStore/files/${uniqueFileName}`
    console.log(publicURL);
    return publicURL; 
  }

  const validateFile = (file, type) => {
    return file.type.startsWith('image/');
  };

  return (
    <>
    
    <Box pos="relative">
        <LoadingOverlay visible={visible} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
        <Stepper active={active} onStepClick={setActive} allowNextStepsSelect={false}>
        <Stepper.Step label="Enter product details" description="Enter product details">
          <form>
            <TextInput label="Product Name" placeholder="Enter product name" withAsterisk {...form.getInputProps('productName')} />
            <TextInput label="Product Type" placeholder="Enter product type" withAsterisk {...form.getInputProps('productType')} />
            <TextInput label="Category" placeholder="Enter product category" withAsterisk {...form.getInputProps('category')} />
            <TextInput label="Sub Category" placeholder="Enter sub category" withAsterisk {...form.getInputProps('subCategory')} />
            <TextInput
              label="Dimensions"
              placeholder="Enter dimensions (e.g., 10x20x15 cm)"
              withAsterisk
              {...form.getInputProps('dimensions')}
            />
            <NumberInput label="Weight" placeholder="Enter weight (kg)" withAsterisk {...form.getInputProps('weight')} />
            <NumberInput label="Quantity" placeholder="Enter quantity" withAsterisk {...form.getInputProps('quantity')} />
            <TextInput label="Origin" placeholder="Enter origin location" withAsterisk {...form.getInputProps('origin')} />
            <TextInput label="Destination" placeholder="Enter destination location" withAsterisk {...form.getInputProps('destination')} />
            <NumberInput label="Price" placeholder="Enter price" withAsterisk {...form.getInputProps('price')} />
            <TextInput
              label="Estimated Delivery Date"
              placeholder="Enter estimated delivery date (YYYY-MM-DD)"
              withAsterisk
              {...form.getInputProps('estimatedDeliveryDate')}
            />
          </form>
        </Stepper.Step>

        <Stepper.Step label="Upload Files" description="Upload images and documents">
         
          <FileInput
            label="Upload Images"
            multiple
            onChange={(files) => {
              const validFiles = Array.from(files).filter((file) => validateFile(file, 'image'));
              form.setFieldValue('images', validFiles);
            }}
            error={form.errors.images}
          />

          
          <FileInput
            label="Upload Commercial Invoice"
           multiple
            onChange={(files) => {
              const validFiles = Array.from(files).filter((file) => validateFile(file, 'commercialInvoice'));
              form.setFieldValue('commercialInvoice', validFiles);
            }}
            error={form.errors.commercialInvoice}
          />

         
          <FileInput
            label="Upload Packing List"
            multiple
            onChange={(files) => {
              const validFiles = Array.from(files).filter((file) => validateFile(file, 'packingList'));
              form.setFieldValue('packingList', validFiles);
            }}
            error={form.errors.packingList}
          />

          
          <FileInput
            label="Upload Certificate of Origin"
            multiple
            onChange={(files) => {
              const validFiles = Array.from(files).filter((file) => validateFile(file, 'certificateOfOrigin'));
              form.setFieldValue('certificateOfOrigin', validFiles);
            }}
            error={form.errors.certificateOfOrigin}
          />
        </Stepper.Step>

        <Stepper.Completed>Click Next to submit the shipment</Stepper.Completed>
      </Stepper>

      <Group justify="center" mt="xl">
        <Button color="red" onClick={handleCancel}>
          Cancel
        </Button>
        <Button variant="default" onClick={prevStep}>
          Back
        </Button>
        <Button onClick={handleNext}>Next step</Button>
      </Group>
      </Box>



      
    </>
  );
}

export default CreateShipmentStepper;
