/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
// Optimize Mantine core imports by grouping them
import { MantineProvider } from '@mantine/core';
import {
  Box,
  Group,
  Stack,
  Paper,
  Container,
  TextInput,
  NumberInput,
  FileInput,
  LoadingOverlay,
  Card,
  Image,
  Text,
  Button,
  SimpleGrid,
  Title,
  Select,
  ActionIcon,
  Divider
} from '@mantine/core';

// Group all layout components
import { Grid } from '@mantine/core';

// Keep other imports separate as they're from different packages
import { notifications } from '@mantine/notifications';
import { useForm } from '@mantine/form';
import { supabase } from '../../components/Supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import { uploadImageToSupabase } from '../../utils/supabase';
import { IconTrash, IconPlus } from '@tabler/icons-react';
import { useUser } from "@clerk/clerk-react";
import PortSelect from '../../components/PortSelect';

const emptyProduct = {
  productName: '',
  productType: '',
  category: '',
  subCategory: '',
  dimensions: {
    length: 0,
    width: 0,
    height: 0,
    unit: 'cm'
  },
  weight: 0,
  quantity: 0,
  price: 0,
  productImages: [],
  handlingInstructions: '',
};

const validateProduct = (product) => {
  const errors = {};
  if (!product.productName) errors.productName = 'Product name is required';
  if (!product.productType) errors.productType = 'Product type is required';
  if (!product.category) errors.category = 'Category is required';
  if (!product.subCategory) errors.subCategory = 'Sub category is required';
  if (!product.dimensions.length || product.dimensions.length <= 0) errors.dimensions = 'Length must be greater than 0';
  if (!product.dimensions.width || product.dimensions.width <= 0) errors.dimensions = 'Width must be greater than 0';
  if (!product.dimensions.height || product.dimensions.height <= 0) errors.dimensions = 'Height must be greater than 0';
  if (!product.weight || product.weight <= 0) errors.weight = 'Weight must be greater than 0';
  if (!product.quantity || product.quantity <= 0) errors.quantity = 'Quantity must be greater than 0';
  if (!product.price || product.price <= 0) errors.price = 'Price must be greater than 0';
  return errors;
};

export default function CreateShipment() {
  const navigate = useNavigate();
  const location = useLocation();
  const productTemplate = location.state?.productTemplate;
  const isInstantShipment = location.state?.isInstantShipment;
  const { user } = useUser();

  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [productImagesList, setProductImagesList] = useState([]);

  const form = useForm({
    initialValues: {
      companyName: '',
      origin: null,
      destination: null,
      estimatedDeliveryDate: '',
      products: [{ ...emptyProduct }]
    },
    validate: {
      companyName: (value) => (!value ? 'Company name is required' : null),
      origin: (value) => (!value ? 'Origin port is required' : null),
      destination: (value) => (!value ? 'Destination port is required' : null),
      estimatedDeliveryDate: (value) => {
        if (!value) return 'Delivery date is required';
        const date = new Date(value);
        if (isNaN(date.getTime())) return 'Invalid date';
        if (date < new Date()) return 'Date must be in the future';
        return null;
      },
      products: {
        productName: (value) => (!value ? 'Product name is required' : null),
        productType: (value) => (!value ? 'Product type is required' : null),
        category: (value) => (!value ? 'Category is required' : null),
        subCategory: (value) => (!value ? 'Sub category is required' : null),
        weight: (value) => (value <= 0 ? 'Weight must be greater than 0' : null),
        quantity: (value) => (value <= 0 ? 'Quantity must be greater than 0' : null),
        price: (value) => (value <= 0 ? 'Price must be greater than 0' : null),
        'dimensions.length': (value) => (value <= 0 ? 'Length must be greater than 0' : null),
        'dimensions.width': (value) => (value <= 0 ? 'Width must be greater than 0' : null),
        'dimensions.height': (value) => (value <= 0 ? 'Height must be greater than 0' : null),
      }
    },
  });

  useEffect(() => {
    if (user?.emailAddresses?.[0]?.emailAddress) {
      fetchCompanyProfile();
    }
  }, [user]);

  const fetchCompanyProfile = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/seller/profile/${user.emailAddresses[0].emailAddress}`);
      if (response.ok) {
        const data = await response.json();
        if (data.profile?.companyName) {
          form.setFieldValue('companyName', data.profile.companyName);
        }
      }
    } catch (error) {
      console.error('Error fetching company profile:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to fetch company profile. Please enter company name manually.',
        color: 'red'
      });
    }
  };

  const handleImageUpload = async (files, productIndex) => {
    if (!files || files.length === 0) return;
    if (files.length > 5) {
      notifications.show({
        title: 'Error',
        message: 'You can only upload up to 5 images per product',
        color: 'red'
      });
      return;
    }

    setIsUploading(true);
    const uploadedUrls = [];

    try {
      for (const file of files) {
        if (!file.type.match(/^image\/(jpeg|png)$/)) {
          notifications.show({
            title: 'Error',
            message: 'Only JPEG and PNG images are allowed',
            color: 'red'
          });
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          notifications.show({
            title: 'Error',
            message: 'Image size should not exceed 5MB',
            color: 'red'
          });
          continue;
        }

        const publicUrl = await uploadImageToSupabase(file, 'shipment-images');
        if (publicUrl) {
          uploadedUrls.push(publicUrl);
        }
      }

      if (uploadedUrls.length > 0) {
        const newProductImagesList = [...productImagesList];
        newProductImagesList[productIndex] = [
          ...(newProductImagesList[productIndex] || []),
          ...uploadedUrls
        ];
        setProductImagesList(newProductImagesList);
        
        notifications.show({
          title: 'Success',
          message: `Successfully uploaded ${uploadedUrls.length} image(s)`,
          color: 'green'
        });
      }
    } catch (error) {
      console.error('Error handling image upload:', error);
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to process images',
        color: 'red'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    const validation = form.validate();
    if (validation.hasErrors) {
      notifications.show({
        title: 'Error',
        message: 'Please fix all errors before submitting',
        color: 'red'
      });
      return;
    }

    try {
      setLoading(true);

      const products = form.values.products.map((product, index) => ({
        ...product,
        productImages: productImagesList[index] || []
      }));

      const totalWeight = products.reduce((sum, product) => 
        sum + (product.weight * product.quantity), 0);

      const shipmentData = {
        userId: user.id,
        email: user.emailAddresses[0].emailAddress,
        companyName: form.values.companyName,
        products,
        origin: form.values.origin,
        destination: form.values.destination,
        transportModes: ['sea'],
        estimatedDeliveryDate: form.values.estimatedDeliveryDate,
        totalWeight
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/shipments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shipmentData),
      });

      if (!response.ok) {
const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create shipment');
      }

      notifications.show({
        title: 'Success',
        message: 'Shipment created successfully',
        color: 'green',
      });

      navigate('/dashboard/shipments');
    } catch (error) {
      console.error('Error creating shipment:', error);
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to create shipment',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productTemplate && isInstantShipment) {
      form.setValues({
        ...form.values,
        products: [{
          ...emptyProduct,
          productName: productTemplate.name || '',
          productType: productTemplate.type || '',
          category: productTemplate.category?.[0] || '',
          subCategory: productTemplate.subCategory || '',
          dimensions: productTemplate.dimensions,  // Use dimensions directly from template
          weight: productTemplate.weight || 0,
          quantity: 1,
          price: productTemplate.price || 0,
          handlingInstructions: productTemplate.handlingInstructions || '',
        }],
        origin: productTemplate.origin || null,
        destination: productTemplate.destination || null
      });
      setProductImagesList([productTemplate.images || []]);
    }
  }, [productTemplate, isInstantShipment]);

  const addProduct = () => {
    form.insertListItem('products', { ...emptyProduct });
  };

  const removeProduct = (index) => {
    form.removeListItem('products', index);
    const newProductImagesList = [...productImagesList];
    newProductImagesList.splice(index, 1);
    setProductImagesList(newProductImagesList);
  };

  const renderProductForm = (productIndex) => {
    const product = form.values.products[productIndex];
    
    return (
      <Stack key={productIndex} spacing="md">
        <Group position="apart">
          <Title order={4}>Product {productIndex + 1}</Title>
          {form.values.products.length > 1 && (
            <ActionIcon color="red" onClick={() => removeProduct(productIndex)}>
              <IconTrash size={16} />
            </ActionIcon>
          )}
        </Group>

        <TextInput
          required
          label="Product Name"
          {...form.getInputProps(`products.${productIndex}.productName`)}
        />

        <TextInput
          required
          label="Product Type"
          {...form.getInputProps(`products.${productIndex}.productType`)}
        />

        <TextInput
          required
          label="Category"
          {...form.getInputProps(`products.${productIndex}.category`)}
        />

        <TextInput
          required
          label="Sub Category"
          {...form.getInputProps(`products.${productIndex}.subCategory`)}
        />

        {/* Only show dimensions input if not using product template */}
        {!isInstantShipment ? (
          <>
            <Title order={6}>Dimensions</Title>
            <Group grow>
              <NumberInput
                required
                label="Length"
                {...form.getInputProps(`products.${productIndex}.dimensions.length`)}
                min={0}
              />
              <NumberInput
                required
                label="Width"
                {...form.getInputProps(`products.${productIndex}.dimensions.width`)}
                min={0}
              />
              <NumberInput
                required
                label="Height"
                {...form.getInputProps(`products.${productIndex}.dimensions.height`)}
                min={0}
              />
              <Select
                label="Unit"
                {...form.getInputProps(`products.${productIndex}.dimensions.unit`)}
                data={[
                  { value: 'cm', label: 'Centimeters' },
                  { value: 'in', label: 'Inches' },
                  { value: 'm', label: 'Meters' }
                ]}
              />
            </Group>
          </>
        ) : (
          // Show dimensions from template as read-only
          <Stack>
            <Title order={6}>Product Dimensions (from template)</Title>
            <Text>
              {`${product.dimensions.length} × ${product.dimensions.width} × ${product.dimensions.height} ${product.dimensions.unit}`}
            </Text>
          </Stack>
        )}

        <Group grow>
          {/* Show weight as read-only if using template */}
          {isInstantShipment ? (
            <TextInput
              label="Weight (kg)"
              value={`${product.weight} kg`}
              readOnly
            />
          ) : (
            <NumberInput
              required
              label="Weight (kg)"
              {...form.getInputProps(`products.${productIndex}.weight`)}
              min={0}
            />
          )}

          <NumberInput
            required
            label="Quantity"
            {...form.getInputProps(`products.${productIndex}.quantity`)}
            min={1}
          />

          <NumberInput
            required
            label="Price"
            {...form.getInputProps(`products.${productIndex}.price`)}
            min={0}
          />
        </Group>

        <TextInput
          label="Handling Instructions"
          {...form.getInputProps(`products.${productIndex}.handlingInstructions`)}
        />

        {/* Only show image upload if not using a product template */}
        {!isInstantShipment && (
          <>
            <FileInput
              label="Product Images"
              accept="image/png,image/jpeg"
              multiple
              onChange={(files) => handleImageUpload(files, productIndex)}
            />

            {productImagesList[productIndex]?.length > 0 && (
              <SimpleGrid cols={4} spacing="xs">
                {productImagesList[productIndex].map((image, imgIndex) => (
                  <Card key={imgIndex}>
                    <Card.Section>
                      <Image
                        src={image}
                        height={80}
                        alt={`Product ${productIndex + 1} image ${imgIndex + 1}`}
                      />
                    </Card.Section>
                    <ActionIcon
                      color="red"
                      variant="subtle"
                      onClick={() => {
                        const newProductImagesList = [...productImagesList];
                        newProductImagesList[productIndex] = newProductImagesList[productIndex].filter((_, i) => i !== imgIndex);
                        setProductImagesList(newProductImagesList);
                      }}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Card>
                ))}
              </SimpleGrid>
            )}
          </>
        )}

        {/* Show template images if using a product template */}
        {isInstantShipment && productImagesList[productIndex]?.length > 0 && (
          <>
            <Text size="sm" weight={500}>Product Images from Template</Text>
            <SimpleGrid cols={4} spacing="xs">
              {productImagesList[productIndex].map((image, imgIndex) => (
                <Card key={imgIndex}>
                  <Card.Section>
                    <Image
                      src={image}
                      height={80}
                      alt={`Product ${productIndex + 1} image ${imgIndex + 1}`}
                    />
                  </Card.Section>
                </Card>
              ))}
            </SimpleGrid>
          </>
        )}

        {productIndex < form.values.products.length - 1 && <Divider my="xl" />}
      </Stack>
    );
  };

  return (
    <Box pos="relative">
      <LoadingOverlay visible={visible || isUploading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
      <Container size="xl">
        <Paper shadow="xs" p="md">
          <form onSubmit={(e) => e.preventDefault()}>
            <Stack spacing="md">
              <TextInput
                required
                label="Company Name"
                {...form.getInputProps('companyName')}
              />

              <Group grow>
                <PortSelect
                  label="Origin"
                  required
                  value={form.values.origin}
                  onChange={(value) => form.setFieldValue('origin', value)}
                />
                <PortSelect
                  label="Destination"
                  required
                  value={form.values.destination}
                  onChange={(value) => form.setFieldValue('destination', value)}
                />
              </Group>

              <TextInput
                required
                type="date"
                label="Estimated Delivery Date"
                {...form.getInputProps('estimatedDeliveryDate')}
              />

              {form.values.products.map((_, index) => renderProductForm(index))}

              <Group position="center">
                <Button
                  variant="outline"
                  onClick={addProduct}
                  leftIcon={<IconPlus size={16} />}
                >
                  Add Another Product
                </Button>
              </Group>

              <Group position="center">
                <Button
                  onClick={handleSubmit}
                  loading={loading}
                >
                  Create Shipment
                </Button>
              </Group>
            </Stack>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}
