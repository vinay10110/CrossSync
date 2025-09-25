/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextInput,
  
  Button,
  Stack,
  Title,
  Grid,
  MultiSelect,
  
  Tabs,
  Badge,
  ActionIcon,
  Group,
  Text,
  Card,
  Select,
  FileInput,
  Image,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconTrash, IconPlus, IconUpload } from '@tabler/icons-react';
import { useUser } from '@clerk/clerk-react';
import { getCarrierProfile, updateCarrierProfile } from '../../utils/api';


// Predefined options for dropdowns
const transportModes = [
  { value: 'truck', label: 'Truck' },
  { value: 'van', label: 'Van' },
  { value: 'container', label: 'Container' },
  { value: 'ship', label: 'Ship' },
  { value: 'plane', label: 'Plane' },
  { value: 'train', label: 'Train' },
];

const serviceAreas = [
  { value: 'local', label: 'Local' },
  { value: 'regional', label: 'Regional' },
  { value: 'national', label: 'National' },
  { value: 'international', label: 'International' },
];

const certificationTypes = [
  { value: 'hazmat', label: 'Hazardous Materials' },
  { value: 'refrigerated', label: 'Refrigerated Transport' },
  { value: 'oversized', label: 'Oversized Load' },
  { value: 'livestock', label: 'Livestock Transport' },
  { value: 'medical', label: 'Medical Supply Transport' },
  { value: 'iso9001', label: 'ISO 9001' },
];

const Profile = () => {
  const { user } = useUser();

  const [activeTab, setActiveTab] = useState('business');
  const [isEditing, setIsEditing] = useState(false);
  const [savedVehicles, setSavedVehicles] = useState([]);
  const [newVehicle, setNewVehicle] = useState(null);

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
    transportModes: [],
    serviceAreas: [],
    certifications: [],
    insuranceInfo: {
      provider: '',
      policyNumber: '',
      coverage: '',
      expiryDate: '',
    },
    operatingHours: {
      weekdays: '',
      weekends: '',
      holidays: '',
    },
  });

  // Vehicle Template State
  const [vehicleTemplate, setVehicleTemplate] = useState({
    name: '',
    type: '',
    registrationNumber: '',
    capacity: '',
    dimensions: '',
    features: [],
    maintenanceStatus: 'operational',
    images: [],
    documents: [],
  });

  useEffect(() => {
    if (user) {
      fetchBusinessProfile();
      fetchSavedVehicles();
    }
  }, [user]);

  const fetchBusinessProfile = async () => {
    if (!user) return;

    try {
      const profile = await getCarrierProfile(user.id);
      
      // Transform flat structure to nested structure for the form
      setBusinessProfile({
        companyName: profile.companyName || '',
        businessType: profile.businessType || '',
        registrationNumber: profile.registrationNumber || '',
        taxId: profile.taxId || '',
        description: profile.description || '',
        address: {
          street: profile.address || '',
          city: profile.city || '',
          state: profile.state || '',
          country: profile.country || '',
          zipCode: profile.postalCode || '',
        },
        contact: {
          email: profile.email || '',
          phone: profile.phone || '',
          website: profile.website || '',
        },
        transportModes: profile.vehicleTypes || [],
        serviceAreas: profile.specializations || [],
        certifications: profile.certifications || [],
        insuranceInfo: {
          provider: profile.insuranceProvider || '',
          policyNumber: profile.insuranceNumber || '',
          coverage: profile.insuranceCoverage || '',
          expiryDate: profile.insuranceExpiry || '',
        },
        operatingHours: {
          weekdays: profile.operatingHoursWeekdays || '',
          weekends: profile.operatingHoursWeekends || '',
          holidays: profile.operatingHoursHolidays || '',
        },
      });
    } catch (error) {
      console.error('Error fetching business profile:', error);
    }
  };

  const fetchSavedVehicles = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/carrier/vehicles/${user.email}`);
      if (response.ok) {
        const data = await response.json();
        setSavedVehicles(data.vehicles);
      }
    } catch (error) {
      console.error('Error fetching saved vehicles:', error);
    }
  };

  const handleBusinessProfileUpdate = async () => {
    if (!user) {
      notifications.show({
        title: 'Error',
        message: 'User not authenticated',
        color: 'red',
      });
      return;
    }

    try {
      // Transform the nested data structure to match our backend
      const profileData = {
        companyName: businessProfile.companyName,
        registrationNumber: businessProfile.registrationNumber,
        taxId: businessProfile.taxId,
        description: businessProfile.description,
        // Flatten address
        address: businessProfile.address.street,
        city: businessProfile.address.city,
        state: businessProfile.address.state,
        country: businessProfile.address.country,
        postalCode: businessProfile.address.zipCode,
        // Flatten contact
        email: businessProfile.contact.email,
        phone: businessProfile.contact.phone,
        website: businessProfile.contact.website,
        // Arrays
        vehicleTypes: businessProfile.transportModes,
        specializations: businessProfile.serviceAreas,
        certifications: businessProfile.certifications,
        // Insurance (flatten)
        insuranceProvider: businessProfile.insuranceInfo.provider,
        insuranceNumber: businessProfile.insuranceInfo.policyNumber,
        insuranceExpiry: businessProfile.insuranceInfo.expiryDate,
      };

      await updateCarrierProfile({
        ...profileData,
        userId: user.id,
      });

      notifications.show({
        title: 'Success',
        message: 'Business profile updated successfully',
        color: 'green',
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating business profile:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update business profile',
        color: 'red',
      });
    }
  };

  const handleAddVehicle = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/carrier/vehicles/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          vehicle: vehicleTemplate,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSavedVehicles([...savedVehicles, data.vehicle]);
        setVehicleTemplate({
          name: '',
          type: '',
          registrationNumber: '',
          capacity: '',
          dimensions: '',
          features: [],
          maintenanceStatus: 'operational',
          images: [],
          documents: [],
        });
        notifications.show({
          title: 'Success',
          message: 'Vehicle added successfully',
          color: 'green',
        });
      }
    } catch (error) {
      console.error('Error adding vehicle:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to add vehicle',
        color: 'red',
      });
    }
  };

  const handleDeleteVehicle = async (vehicleId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/carrier/vehicles/delete/${vehicleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSavedVehicles(savedVehicles.filter(vehicle => vehicle.id !== vehicleId));
        notifications.show({
          title: 'Success',
          message: 'Vehicle deleted successfully',
          color: 'green',
        });
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to delete vehicle',
        color: 'red',
      });
    }
  };

  const handleEditVehicle = (vehicle) => {
    setVehicleTemplate(vehicle);
    setNewVehicle(null);
  };

  return (
    <Box p="md">
      <Paper shadow="sm" p="md">
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="business">Business Profile</Tabs.Tab>
            <Tabs.Tab value="vehicles">Vehicles & Equipment</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="business" pt="xs">
            <Stack spacing="md">
              <Group position="apart">
                <Title order={2}>Carrier Information</Title>
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
                  <MultiSelect
                    label="Transport Modes"
                    data={transportModes}
                    value={businessProfile.transportModes}
                    onChange={(value) => setBusinessProfile({
                      ...businessProfile,
                      transportModes: value
                    })}
                    disabled={!isEditing}
                    searchable
                    clearable
                  />
                </Grid.Col>

                <Grid.Col span={12}>
                  <MultiSelect
                    label="Service Areas"
                    data={serviceAreas}
                    value={businessProfile.serviceAreas}
                    onChange={(value) => setBusinessProfile({
                      ...businessProfile,
                      serviceAreas: value
                    })}
                    disabled={!isEditing}
                    searchable
                    clearable
                  />
                </Grid.Col>

                <Grid.Col span={12}>
                  <MultiSelect
                    label="Certifications"
                    data={certificationTypes}
                    value={businessProfile.certifications}
                    onChange={(value) => setBusinessProfile({
                      ...businessProfile,
                      certifications: value
                    })}
                    disabled={!isEditing}
                    searchable
                    clearable
                  />
                </Grid.Col>

                <Grid.Col span={12}>
                  <Title order={4}>Insurance Information</Title>
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label="Insurance Provider"
                    value={businessProfile.insuranceInfo.provider}
                    onChange={(e) => setBusinessProfile({
                      ...businessProfile,
                      insuranceInfo: { ...businessProfile.insuranceInfo, provider: e.currentTarget.value }
                    })}
                    disabled={!isEditing}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label="Policy Number"
                    value={businessProfile.insuranceInfo.policyNumber}
                    onChange={(e) => setBusinessProfile({
                      ...businessProfile,
                      insuranceInfo: { ...businessProfile.insuranceInfo, policyNumber: e.currentTarget.value }
                    })}
                    disabled={!isEditing}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label="Coverage Details"
                    value={businessProfile.insuranceInfo.coverage}
                    onChange={(e) => setBusinessProfile({
                      ...businessProfile,
                      insuranceInfo: { ...businessProfile.insuranceInfo, coverage: e.currentTarget.value }
                    })}
                    disabled={!isEditing}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label="Expiry Date"
                    type="date"
                    value={businessProfile.insuranceInfo.expiryDate}
                    onChange={(e) => setBusinessProfile({
                      ...businessProfile,
                      insuranceInfo: { ...businessProfile.insuranceInfo, expiryDate: e.currentTarget.value }
                    })}
                    disabled={!isEditing}
                  />
                </Grid.Col>

                <Grid.Col span={12}>
                  <Title order={4}>Operating Hours</Title>
                </Grid.Col>
                <Grid.Col span={4}>
                  <TextInput
                    label="Weekdays"
                    placeholder="e.g., 9:00 AM - 6:00 PM"
                    value={businessProfile.operatingHours.weekdays}
                    onChange={(e) => setBusinessProfile({
                      ...businessProfile,
                      operatingHours: { ...businessProfile.operatingHours, weekdays: e.currentTarget.value }
                    })}
                    disabled={!isEditing}
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <TextInput
                    label="Weekends"
                    placeholder="e.g., 10:00 AM - 4:00 PM"
                    value={businessProfile.operatingHours.weekends}
                    onChange={(e) => setBusinessProfile({
                      ...businessProfile,
                      operatingHours: { ...businessProfile.operatingHours, weekends: e.currentTarget.value }
                    })}
                    disabled={!isEditing}
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <TextInput
                    label="Holidays"
                    placeholder="e.g., Closed"
                    value={businessProfile.operatingHours.holidays}
                    onChange={(e) => setBusinessProfile({
                      ...businessProfile,
                      operatingHours: { ...businessProfile.operatingHours, holidays: e.currentTarget.value }
                    })}
                    disabled={!isEditing}
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

          <Tabs.Panel value="vehicles" pt="xs">
            <Stack spacing="md">
              <Title order={2}>Vehicles & Equipment</Title>

              {/* Add New Vehicle Form */}
              <Paper shadow="xs" p="md" withBorder>
                <Stack spacing="md">
                  <Title order={4}>Add New Vehicle</Title>
                  <Grid>
                    <Grid.Col span={6}>
                      <TextInput
                        label="Vehicle Name"
                        value={vehicleTemplate.name}
                        onChange={(e) => setVehicleTemplate({
                          ...vehicleTemplate,
                          name: e.currentTarget.value
                        })}
                      />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Select
                        label="Vehicle Type"
                        value={vehicleTemplate.type}
                        onChange={(value) => setVehicleTemplate({
                          ...vehicleTemplate,
                          type: value
                        })}
                        data={transportModes}
                      />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <TextInput
                        label="Registration Number"
                        value={vehicleTemplate.registrationNumber}
                        onChange={(e) => setVehicleTemplate({
                          ...vehicleTemplate,
                          registrationNumber: e.currentTarget.value
                        })}
                      />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <TextInput
                        label="Capacity"
                        value={vehicleTemplate.capacity}
                        onChange={(e) => setVehicleTemplate({
                          ...vehicleTemplate,
                          capacity: e.currentTarget.value
                        })}
                        placeholder="e.g., 20 tons"
                      />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <TextInput
                        label="Dimensions (LxWxH)"
                        value={vehicleTemplate.dimensions}
                        onChange={(e) => setVehicleTemplate({
                          ...vehicleTemplate,
                          dimensions: e.currentTarget.value
                        })}
                        placeholder="e.g., 40x8x8 ft"
                      />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Select
                        label="Maintenance Status"
                        value={vehicleTemplate.maintenanceStatus}
                        onChange={(value) => setVehicleTemplate({
                          ...vehicleTemplate,
                          maintenanceStatus: value
                        })}
                        data={[
                          { value: 'operational', label: 'Operational' },
                          { value: 'maintenance', label: 'Under Maintenance' },
                          { value: 'repair', label: 'Needs Repair' },
                        ]}
                      />
                    </Grid.Col>
                    <Grid.Col span={12}>
                      <MultiSelect
                        label="Features"
                        data={[
                          { value: 'gps', label: 'GPS Tracking' },
                          { value: 'refrigeration', label: 'Refrigeration' },
                          { value: 'liftgate', label: 'Liftgate' },
                          { value: 'security', label: 'Security System' },
                        ]}
                        value={vehicleTemplate.features}
                        onChange={(value) => setVehicleTemplate({
                          ...vehicleTemplate,
                          features: value
                        })}
                        searchable
                        clearable
                      />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <FileInput
                        label="Vehicle Images"
                        placeholder="Upload images"
                        multiple
                        accept="image/*"
                        icon={<IconUpload size={14} />}
                        onChange={(files) => setVehicleTemplate({
                          ...vehicleTemplate,
                          images: files
                        })}
                      />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <FileInput
                        label="Vehicle Documents"
                        placeholder="Upload documents"
                        multiple
                        accept=".pdf,.doc,.docx"
                        icon={<IconUpload size={14} />}
                        onChange={(files) => setVehicleTemplate({
                          ...vehicleTemplate,
                          documents: files
                        })}
                      />
                    </Grid.Col>
                  </Grid>
                  <Group position="right">
                    <Button onClick={handleAddVehicle} leftIcon={<IconPlus size={16} />}>
                      Add Vehicle
                    </Button>
                  </Group>
                </Stack>
              </Paper>

              {/* Saved Vehicles List */}
              <Grid>
                {savedVehicles.map((vehicle) => (
                  <Grid.Col key={vehicle.id} span={4}>
                    <Card shadow="sm" p="lg" withBorder>
                      <Card.Section>
                        {vehicle.images?.[0] && (
                          <Image
                            src={vehicle.images[0]}
                            height={160}
                            alt={vehicle.name}
                          />
                        )}
                      </Card.Section>
                      <Stack spacing="xs">
                        <Group position="apart">
                          <Text weight={500}>{vehicle.name}</Text>
                          <Group spacing={5}>
                            <ActionIcon color="blue" onClick={() => handleEditVehicle(vehicle)}>
                              <IconEdit size={16} />
                            </ActionIcon>
                            <ActionIcon color="red" onClick={() => handleDeleteVehicle(vehicle.id)}>
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Group>
                        </Group>
                        <Badge>{vehicle.type}</Badge>
                        <Text size="sm" color="dimmed">
                          Registration: {vehicle.registrationNumber}
                        </Text>
                        <Text size="sm" color="dimmed">
                          Capacity: {vehicle.capacity}
                        </Text>
                        <Text size="sm" color="dimmed">
                          Status: {vehicle.maintenanceStatus}
                        </Text>
                        {vehicle.features?.length > 0 && (
                          <Group spacing={5}>
                            {vehicle.features.map((feature) => (
                              <Badge key={feature} size="sm" variant="outline">
                                {feature}
                              </Badge>
                            ))}
                          </Group>
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