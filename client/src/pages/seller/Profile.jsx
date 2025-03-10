/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Box,
  Paper,
  TextInput,
  NumberInput,
  Button,
  Stack,
  Title,
  Grid,
  MultiSelect,
  Textarea,
  Tabs,
  Badge,
  ActionIcon,
  Group,
  Text,
  Card,
  LoadingOverlay,
  FileInput,
  Image,
  SimpleGrid,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconTrash, IconPlus, IconPackage, IconRuler, IconWeight, IconNotes, IconUpload, IconX, IconPhoto } from '@tabler/icons-react';
import { uploadImageToSupabase } from '../../utils/supabase';
import { supabase } from '../../components/Supabase';
// Predefined options for dropdowns
const productCategories = [
  { value: 'electronics', label: 'Electronics' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'food', label: 'Food & Beverages' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'toys', label: 'Toys & Games' },
  { value: 'sports', label: 'Sports Equipment' },
  { value: 'books', label: 'Books & Media' },
  { value: 'other', label: 'Other' }
];

const Profile = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('business');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [savedProducts, setSavedProducts] = useState([]);
  const [newProduct, setNewProduct] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);

  // Business Profile State
  const [businessProfile, setBusinessProfile] = useState({
    companyName: '',
    businessType: '',
    registrationNumber: '',
    taxId: '',
    description: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      zipCode: '',
    },
    contact: {
      email: '',
      phone: '',
      website: '',
    },
    categories: [],
  });

  // Product Template State
  const [productTemplate, setProductTemplate] = useState({
    name: '',
    type: '',
    category: [],
    subCategory: '',
    dimensions: '',
    weight: '',
    description: '',
    handlingInstructions: '',
    images: [],
  });

  useEffect(() => {
    if (user?.emailAddresses[0]?.emailAddress) {
      fetchBusinessProfile();
      fetchSavedProducts();
    }
  }, [user]);

  const fetchBusinessProfile = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/shipments/seller/profile/${user.emailAddresses[0].emailAddress}`);
      if (response.ok) {
        const data = await response.json();
        setBusinessProfile({
          ...data.user,
          companyName: data.user.companyName || '',
          businessType: data.user.businessType || '',
          registrationNumber: data.user.registrationNumber || '',
          taxId: data.user.taxId || '',
          description: data.user.description || '',
          address: data.user.address || {
            street: '',
            city: '',
            state: '',
            country: '',
            zipCode: '',
          },
          contact: {
            email: data.user.email || user.emailAddresses[0].emailAddress,
            phone: data.user.phone || '',
            website: data.user.website || '',
          },
          categories: data.user.categories || [],
        });
      }
    } catch (error) {
      console.error('Error fetching business profile:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to fetch business profile',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSavedProducts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/seller/products/${user.emailAddresses[0].emailAddress}`);
      if (response.ok) {
        const data = await response.json();
        setSavedProducts(data.products);
      }
    } catch (error) {
      console.error('Error fetching saved products:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to fetch saved products',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBusinessProfileUpdate = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/seller/profile/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.emailAddresses[0].emailAddress,
          profile: {
            ...businessProfile,
            contact: {
              ...businessProfile.contact,
              email: user.emailAddresses[0].emailAddress,
            },
          },
        }),
      });

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: 'Business profile updated successfully',
          color: 'green',
        });
        setIsEditing(false);
        await fetchBusinessProfile(); // Refresh the profile data
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating business profile:', error);
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to update business profile',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProduct = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/seller/products/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.emailAddresses[0].emailAddress,
          product: productTemplate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add product');
      }

      const data = await response.json();
      setSavedProducts([...savedProducts, data.product]);
      
      // Reset form
      setProductTemplate({
        name: '',
        type: '',
        category: [],
        subCategory: '',
        dimensions: '',
        weight: '',
        description: '',
        handlingInstructions: '',
        images: []
      });

      notifications.show({
        title: 'Success',
        message: 'Product template added successfully',
        color: 'green',
      });
    } catch (error) {
      console.error('Error adding product:', error);
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to add product template',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/seller/products/delete/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSavedProducts(savedProducts.filter(product => product._id !== productId));
        notifications.show({
          title: 'Success',
          message: 'Product template deleted successfully',
          color: 'green',
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product template:', error);
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to delete product template',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProduct = (product) => {
    setProductTemplate(product);
    setEditingProductId(product._id);
    setNewProduct(null);
  };

  const handleUpdateProduct = async (productData = productTemplate) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/seller/products/update/${editingProductId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.emailAddresses[0].emailAddress,
          product: productData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update product');
      }

      const data = await response.json();
      
      // Update the product in the list
      setSavedProducts(savedProducts.map(product => 
        product._id === editingProductId ? data.product : product
      ));

      // Only reset if we're not in the middle of an image operation
      if (productData === productTemplate) {
        // Reset form and editing state
        setProductTemplate({
          name: '',
          type: '',
          category: [],
          subCategory: '',
          dimensions: '',
          weight: '',
          description: '',
          handlingInstructions: '',
          images: []
        });
        setEditingProductId(null);
      }

      notifications.show({
        title: 'Success',
        message: 'Product template updated successfully',
        color: 'green',
      });
    } catch (error) {
      console.error('Error updating product:', error);
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to update product template',
        color: 'red',
      });
      throw error; // Re-throw to handle in calling functions
    } finally {
      if (productData === productTemplate) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (newProduct) {
      handleEditProduct(newProduct);
    }
  }, [newProduct]);

  const handleImageUpload = async (files) => {
    try {
      if (!files || files.length === 0) {
        notifications.show({
          title: 'Error',
          message: 'No files selected',
          color: 'red',
        });
        return;
      }

      // Validate file types
      const invalidFiles = files.filter(file => 
        !['image/jpeg', 'image/png'].includes(file.type)
      );

      if (invalidFiles.length > 0) {
        notifications.show({
          title: 'Error',
          message: 'Only JPEG and PNG images are allowed',
          color: 'red',
        });
        return;
      }

      // Check total number of images (existing + new)
      const currentImagesCount = productTemplate.images?.length || 0;
      if (currentImagesCount + files.length > 5) {
        notifications.show({
          title: 'Error',
          message: `You can only upload ${5 - currentImagesCount} more image(s). Maximum 5 images allowed.`,
          color: 'red',
        });
        return;
      }

      setIsLoading(true);
      const imageUrls = [];
      const errors = [];

      // Upload each file to Supabase
      for (const file of files) {
        try {
          const publicURL = await uploadImageToSupabase(file, 'product-templates');
          if (publicURL) {
            imageUrls.push(publicURL);
          }
        } catch (error) {
          console.error('Error uploading image:', error);
          errors.push(`${file.name}: ${error.message}`);
        }
      }

      if (errors.length > 0) {
        notifications.show({
          title: 'Upload Errors',
          message: errors.join('\n'),
          color: 'red',
          autoClose: 5000,
        });
      }

      if (imageUrls.length > 0) {
        // Update local state with new images
        const updatedImages = [...(productTemplate.images || []), ...imageUrls];
        setProductTemplate(prev => ({
          ...prev,
          images: updatedImages
        }));

        // If we're editing a product, update it in MongoDB
        if (editingProductId) {
          await handleUpdateProduct({
            ...productTemplate,
            images: updatedImages
          });
        }

        notifications.show({
          title: 'Success',
          message: `Successfully uploaded ${imageUrls.length} image(s)`,
          color: 'green',
        });
      }
    } catch (error) {
      console.error('Error handling image upload:', error);
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to process images',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveImage = async (imageUrl, index) => {
    try {
      setIsLoading(true);
      // Extract file path from URL
      const filePath = imageUrl.split('filesStore/')[1];
      
      // Delete from Supabase storage
      const { error } = await supabase.storage
        .from('filesStore')
        .remove([filePath]);

      if (error) throw error;

      // Update local state
      const updatedImages = productTemplate.images.filter((_, i) => i !== index);
      setProductTemplate(prev => ({
        ...prev,
        images: updatedImages
      }));

      // If we're editing a product, update it in MongoDB
      if (editingProductId) {
        await handleUpdateProduct({
          ...productTemplate,
          images: updatedImages
        });
      }

      notifications.show({
        title: 'Success',
        message: 'Image removed successfully',
        color: 'green',
      });
    } catch (error) {
      console.error('Error removing image:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to remove image',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearProductTemplate = () => {
    setProductTemplate({
      name: '',
      type: '',
      category: [],
      subCategory: '',
      dimensions: '',
      weight: '',
      description: '',
      handlingInstructions: '',
      images: []
    });
    setNewProduct(null);
    setEditingProductId(null);
    notifications.show({
      title: 'Success',
      message: 'Form cleared successfully',
      color: 'blue',
    });
  };

  return (
    <Box p="md" pos="relative">
      <LoadingOverlay visible={isLoading} overlayBlur={2} />
      <Paper shadow="sm" p="md">
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="business">Business Profile</Tabs.Tab>
            <Tabs.Tab value="products">Product Templates</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="business" pt="xs">
            <Stack spacing="md">
              <Group position="apart">
                <Title order={2}>Business Information</Title>
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  variant={isEditing ? "filled" : "light"}
                >
                  {isEditing ? "Cancel Editing" : "Edit Profile"}
                </Button>
              </Group>

              <Grid>
                <Grid.Col span={6}>
                  <TextInput
                    label="Company Name"
                    value={businessProfile.companyName}
                    onChange={(e) => setBusinessProfile({
                      ...businessProfile,
                      companyName: e.currentTarget.value
                    })}
                    disabled={!isEditing}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label="Business Type"
                    value={businessProfile.businessType}
                    onChange={(e) => setBusinessProfile({
                      ...businessProfile,
                      businessType: e.currentTarget.value
                    })}
                    disabled={!isEditing}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label="Registration Number"
                    value={businessProfile.registrationNumber}
                    onChange={(e) => setBusinessProfile({
                      ...businessProfile,
                      registrationNumber: e.currentTarget.value
                    })}
                    disabled={!isEditing}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label="Tax ID"
                    value={businessProfile.taxId}
                    onChange={(e) => setBusinessProfile({
                      ...businessProfile,
                      taxId: e.currentTarget.value
                    })}
                    disabled={!isEditing}
                  />
                </Grid.Col>
                <Grid.Col span={12}>
                  <Textarea
                    label="Business Description"
                    value={businessProfile.description}
                    onChange={(e) => setBusinessProfile({
                      ...businessProfile,
                      description: e.currentTarget.value
                    })}
                    disabled={!isEditing}
                    minRows={3}
                  />
                </Grid.Col>

                <Grid.Col span={12}>
                  <Title order={4}>Address</Title>
                </Grid.Col>
                <Grid.Col span={12}>
                  <TextInput
                    label="Street Address"
                    value={businessProfile.address.street}
                    onChange={(e) => setBusinessProfile({
                      ...businessProfile,
                      address: { ...businessProfile.address, street: e.currentTarget.value }
                    })}
                    disabled={!isEditing}
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <TextInput
                    label="City"
                    value={businessProfile.address.city}
                    onChange={(e) => setBusinessProfile({
                      ...businessProfile,
                      address: { ...businessProfile.address, city: e.currentTarget.value }
                    })}
                    disabled={!isEditing}
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <TextInput
                    label="State/Province"
                    value={businessProfile.address.state}
                    onChange={(e) => setBusinessProfile({
                      ...businessProfile,
                      address: { ...businessProfile.address, state: e.currentTarget.value }
                    })}
                    disabled={!isEditing}
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <TextInput
                    label="ZIP/Postal Code"
                    value={businessProfile.address.zipCode}
                    onChange={(e) => setBusinessProfile({
                      ...businessProfile,
                      address: { ...businessProfile.address, zipCode: e.currentTarget.value }
                    })}
                    disabled={!isEditing}
                  />
                </Grid.Col>

                <Grid.Col span={12}>
                  <Title order={4}>Contact Information</Title>
                </Grid.Col>
                <Grid.Col span={4}>
                  <TextInput
                    label="Email"
                    value={businessProfile.contact.email}
                    onChange={(e) => setBusinessProfile({
                      ...businessProfile,
                      contact: { ...businessProfile.contact, email: e.currentTarget.value }
                    })}
                    disabled={!isEditing}
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <TextInput
                    label="Phone"
                    value={businessProfile.contact.phone}
                    onChange={(e) => setBusinessProfile({
                      ...businessProfile,
                      contact: { ...businessProfile.contact, phone: e.currentTarget.value }
                    })}
                    disabled={!isEditing}
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <TextInput
                    label="Website"
                    value={businessProfile.contact.website}
                    onChange={(e) => setBusinessProfile({
                      ...businessProfile,
                      contact: { ...businessProfile.contact, website: e.currentTarget.value }
                    })}
                    disabled={!isEditing}
                  />
                </Grid.Col>

                <Grid.Col span={12}>
                  <MultiSelect
                    label="Business Categories"
                    data={productCategories}
                    value={businessProfile.categories}
                    onChange={(value) => setBusinessProfile({
                      ...businessProfile,
                      categories: value
                    })}
                    disabled={!isEditing}
                    searchable
                    clearable
                  />
                </Grid.Col>
              </Grid>

              {isEditing && (
                <Group position="right">
                  <Button onClick={handleBusinessProfileUpdate} color="blue">
                    Save Changes
                  </Button>
                </Group>
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="products" pt="xs">
            <Stack spacing="md">
              <Group position="apart">
                <Title order={2} style={{ color: '#1a75ff' }}>
                  <Group spacing="xs">
                    <IconPackage size={28} />
                    <Text>Product Templates</Text>
                  </Group>
                </Title>
              </Group>

              {/* Add New Product Form */}
              <Paper shadow="md" p="xl" withBorder radius="md" style={{ backgroundColor: '#f8f9fa' }}>
                <Stack spacing="md">
                  <Group position="apart">
                    <Title order={4} style={{ color: editingProductId ? '#1a75ff' : '#2C3E50' }}>
                      {editingProductId ? 'Edit Product Template' : 'Add New Product Template'}
                    </Title>
                  </Group>
                  <Grid>
                    <Grid.Col span={6}>
                      <TextInput
                        label="Product Name"
                        value={productTemplate.name}
                        onChange={(e) => setProductTemplate({
                          ...productTemplate,
                          name: e.currentTarget.value
                        })}
                      />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <TextInput
                        label="Product Type"
                        value={productTemplate.type}
                        onChange={(e) => setProductTemplate({
                          ...productTemplate,
                          type: e.currentTarget.value
                        })}
                      />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <MultiSelect
                        label="Category"
                        data={productCategories}
                        value={productTemplate.category || []}
                        onChange={(value) => setProductTemplate({
                          ...productTemplate,
                          category: value
                        })}
                        searchable
                        clearable
                      />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <TextInput
                        label="Sub Category"
                        value={productTemplate.subCategory}
                        onChange={(e) => setProductTemplate({
                          ...productTemplate,
                          subCategory: e.currentTarget.value
                        })}
                      />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <TextInput
                        label="Dimensions (LxWxH cm)"
                        value={productTemplate.dimensions}
                        onChange={(e) => setProductTemplate({
                          ...productTemplate,
                          dimensions: e.currentTarget.value
                        })}
                        placeholder="e.g., 20x15x10"
                      />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <NumberInput
                        label="Weight (kg)"
                        value={productTemplate.weight}
                        onChange={(value) => setProductTemplate({
                          ...productTemplate,
                          weight: value
                        })}
                        min={0}
                        precision={2}
                      />
                    </Grid.Col>
                    <Grid.Col span={12}>
                      <Textarea
                        label="Product Description"
                        value={productTemplate.description}
                        onChange={(e) => setProductTemplate({
                          ...productTemplate,
                          description: e.currentTarget.value
                        })}
                        minRows={2}
                      />
                    </Grid.Col>
                    <Grid.Col span={12}>
                      <Textarea
                        label="Handling Instructions"
                        value={productTemplate.handlingInstructions}
                        onChange={(e) => setProductTemplate({
                          ...productTemplate,
                          handlingInstructions: e.currentTarget.value
                        })}
                        minRows={2}
                      />
                    </Grid.Col>
                    <Grid.Col span={12}>
                      <Stack spacing="xs">
                        <Group position="apart">
                          <Text size="sm" weight={500}>Product Images (Max 5)</Text>
                          <Text size="xs" color="dimmed">
                            {productTemplate.images?.length || 0}/5 images uploaded
                          </Text>
                        </Group>
                        <FileInput
                          accept="image/png,image/jpeg"
                          multiple
                          placeholder="Upload product images"
                          icon={<IconUpload size={16} />}
                          onChange={handleImageUpload}
                          disabled={productTemplate.images?.length >= 5}
                        />
                        {productTemplate.images && productTemplate.images.length > 0 && (
                          <SimpleGrid cols={5} spacing="xs">
                            {productTemplate.images.map((url, index) => (
                              <Box key={index} style={{ position: 'relative' }}>
                                <Image
                                  src={url}
                                  radius="md"
                                  height={100}
                                  fit="cover"
                                  withPlaceholder
                                  placeholder={<IconPhoto size={24} />}
                                />
                                <ActionIcon
                                  color="red"
                                  variant="filled"
                                  size="sm"
                                  style={{
                                    position: 'absolute',
                                    top: 5,
                                    right: 5,
                                    zIndex: 1,
                                  }}
                                  onClick={() => handleRemoveImage(url, index)}
                                >
                                  <IconX size={14} />
                                </ActionIcon>
                              </Box>
                            ))}
                          </SimpleGrid>
                        )}
                      </Stack>
                    </Grid.Col>
                  </Grid>
                  <Group position="right" spacing="sm">
                    <Button 
                      variant="subtle" 
                      color="gray" 
                      onClick={handleClearProductTemplate}
                      leftIcon={<IconTrash size={16} />}
                    >
                      Clear
                    </Button>
                    <Button 
                      onClick={editingProductId ? handleUpdateProduct : handleAddProduct} 
                      leftIcon={editingProductId ? <IconEdit size={16} /> : <IconPlus size={16} />}
                      variant="filled"
                      gradient={{ from: '#1a75ff', to: '#4d94ff' }}
                      style={{ color: 'white' }}
                    >
                      {editingProductId ? 'Save Template' : 'Add Product Template'}
                    </Button>
                  </Group>
                </Stack>
              </Paper>

              {/* Saved Products List */}
              <Grid>
                {savedProducts.map((product) => (
                  <Grid.Col key={product._id} span={4}>
                    <Card 
                      shadow="sm" 
                      p="lg" 
                      radius="md" 
                      withBorder
                      style={{
                        backgroundColor: 'white',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-5px)',
                          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                        },
                      }}
                    >
                      <Stack spacing="xs">
                        {product.images && product.images.length > 0 && (
                          <Image
                            src={product.images[0]}
                            height={200}
                            radius="md"
                            fit="cover"
                            withPlaceholder
                            placeholder={<IconPhoto size={24} />}
                          />
                        )}
                        <Group position="apart" align="center">
                          <Text size="lg" weight={600} color="#2C3E50">
                            {product.name}
                          </Text>
                          <Group spacing={8}>
                            <ActionIcon 
                              color="blue" 
                              variant="light"
                              onClick={() => handleEditProduct(product)}
                              style={{ backgroundColor: '#e6f0ff' }}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                            <ActionIcon 
                              color="red" 
                              variant="light"
                              onClick={() => handleDeleteProduct(product._id)}
                              style={{ backgroundColor: '#ffe6e6' }}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Group>
                        </Group>
                        <Badge 
                          variant="gradient" 
                          gradient={{ from: '#1a75ff', to: '#4d94ff' }}
                          style={{ alignSelf: 'flex-start' }}
                        >
                          {product.type}
                        </Badge>
                        <Group spacing="xs" mt="xs">
                          <Group spacing={4}>
                            <IconRuler size={16} color="#666" />
                            <Text size="sm" color="dimmed">
                              {product.dimensions || 'No dimensions'}
                            </Text>
                          </Group>
                          <Group spacing={4}>
                            <IconWeight size={16} color="#666" />
                            <Text size="sm" color="dimmed">
                              {product.weight ? `${product.weight} kg` : 'No weight'}
                            </Text>
                          </Group>
                        </Group>
                        <Group spacing={4} mt="xs">
                          <IconNotes size={16} color="#666" />
                          <Text size="sm" color="dimmed" lineClamp={2}>
                            {product.description || 'No description'}
                          </Text>
                        </Group>
                        {product.category && product.category.length > 0 && (
                          <Group mt="xs" spacing={4}>
                            {product.category.map((cat) => (
                              <Badge 
                                key={cat} 
                                size="sm" 
                                variant="dot" 
                                color="blue"
                              >
                                {cat}
                              </Badge>
                            ))}
                          </Group>
                        )}
                        {product.images && product.images.length > 1 && (
                          <SimpleGrid cols={4} spacing="xs" mt="xs">
                            {product.images.slice(1).map((url, index) => (
                              <Image
                                key={index}
                                src={url}
                                height={50}
                                radius="sm"
                                fit="cover"
                                withPlaceholder
                                placeholder={<IconPhoto size={16} />}
                              />
                            ))}
                          </SimpleGrid>
                        )}
                      </Stack>
                    </Card>
                  </Grid.Col>
                ))}
              </Grid>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Paper>
    </Box>
  );
};

export default Profile; 