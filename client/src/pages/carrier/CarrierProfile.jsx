import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextInput,
  Button,
  Title,
  Stack,
  Group,
  Select,
  MultiSelect,
  Textarea,
  FileInput,
  Image,
  Text,
  Badge,
  Alert
} from '@mantine/core';
import { useUser } from '@clerk/clerk-react';
import { notifications } from '@mantine/notifications';
import { IconUpload, IconAlertCircle } from '@tabler/icons-react';
import { getCarrierProfile, updateCarrierProfile } from '../../utils/api';

const CarrierProfile = () => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    companyName: '',
    registrationNumber: '',
    taxId: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    phone: '',
    email: '',
    website: '',
    description: '',
    fleetSize: '',
    vehicleTypes: [],
    specializations: [],
    certifications: [],
    operatingRegions: [],
    insuranceProvider: '',
    insuranceNumber: '',
    insuranceExpiry: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    logo: null,
    documents: []
  });

  // Vehicle types options
  const vehicleTypeOptions = [
    'Box Truck',
    'Flatbed',
    'Refrigerated',
    'Van',
    'Container',
    'Tanker',
    'Car Carrier',
    'Dump Truck'
  ];

  // Specialization options
  const specializationOptions = [
    'General Freight',
    'Heavy Haul',
    'Hazmat',
    'Perishables',
    'Express Delivery',
    'International',
    'Cross Border',
    'Last Mile'
  ];

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const data = await getCarrierProfile(user.id);
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to fetch profile',
        color: 'red'
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // For now, skip logo upload and just save the profile data
      let logoUrl = profile.logo;
      if (profile.logo instanceof File) {
        console.log('Logo upload not implemented yet, skipping...');
        logoUrl = null; // Set to null for now
      }

      // Save profile
      await updateCarrierProfile({
        ...profile,
        userId: user.id,
        logo: logoUrl
      });

      notifications.show({
        title: 'Success',
        message: 'Profile saved successfully',
        color: 'green'
      });

      // Update Clerk user metadata
      await user.update({
        publicMetadata: {
          companyName: profile.companyName,
          role: 'carrier',
          specializations: profile.specializations,
          certifications: profile.certifications
        }
      });

    } catch (error) {
      console.error('Error saving profile:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to save profile',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="md" py="xl">
      <Paper shadow="sm" radius="md" p="xl">
        <form onSubmit={handleSubmit}>
          <Stack spacing="lg">
            <Title order={2}>Carrier Profile</Title>

            <Alert icon={<IconAlertCircle size={16} />} title="Important" color="blue">
              Complete your profile to start accepting shipments. Make sure to provide accurate information.
            </Alert>

            {/* Company Information */}
            <Title order={3}>Company Information</Title>
            <TextInput
              required
              label="Company Name"
              value={profile.companyName}
              onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
            />
            <Group grow>
              <TextInput
                required
                label="Registration Number"
                value={profile.registrationNumber}
                onChange={(e) => setProfile({ ...profile, registrationNumber: e.target.value })}
              />
              <TextInput
                required
                label="Tax ID"
                value={profile.taxId}
                onChange={(e) => setProfile({ ...profile, taxId: e.target.value })}
              />
            </Group>

            {/* Contact Information */}
            <Title order={3}>Contact Information</Title>
            <TextInput
              required
              label="Address"
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
            />
            <Group grow>
              <TextInput
                required
                label="City"
                value={profile.city}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
              />
              <TextInput
                required
                label="State"
                value={profile.state}
                onChange={(e) => setProfile({ ...profile, state: e.target.value })}
              />
              <TextInput
                required
                label="Postal Code"
                value={profile.postalCode}
                onChange={(e) => setProfile({ ...profile, postalCode: e.target.value })}
              />
            </Group>
            <TextInput
              required
              label="Country"
              value={profile.country}
              onChange={(e) => setProfile({ ...profile, country: e.target.value })}
            />
            <Group grow>
              <TextInput
                required
                label="Phone"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
              <TextInput
                required
                label="Email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            </Group>
            <TextInput
              label="Website"
              value={profile.website}
              onChange={(e) => setProfile({ ...profile, website: e.target.value })}
            />

            {/* Business Details */}
            <Title order={3}>Business Details</Title>
            <Textarea
              label="Company Description"
              value={profile.description}
              onChange={(e) => setProfile({ ...profile, description: e.target.value })}
              minRows={3}
            />
            <Group grow>
              <TextInput
                required
                label="Fleet Size"
                type="number"
                value={profile.fleetSize}
                onChange={(e) => setProfile({ ...profile, fleetSize: e.target.value })}
              />
              <MultiSelect
                required
                label="Vehicle Types"
                data={vehicleTypeOptions}
                value={profile.vehicleTypes}
                onChange={(value) => setProfile({ ...profile, vehicleTypes: value })}
                searchable
                clearable
              />
            </Group>
            <MultiSelect
              required
              label="Specializations"
              data={specializationOptions}
              value={profile.specializations}
              onChange={(value) => setProfile({ ...profile, specializations: value })}
              searchable
              clearable
            />
            <MultiSelect
              label="Certifications"
              data={profile.certifications}
              value={profile.certifications}
              onChange={(value) => setProfile({ ...profile, certifications: value })}
              searchable
              creatable
              getCreateLabel={(query) => `+ Add ${query}`}
            />
            <MultiSelect
              required
              label="Operating Regions"
              data={profile.operatingRegions}
              value={profile.operatingRegions}
              onChange={(value) => setProfile({ ...profile, operatingRegions: value })}
              searchable
              creatable
              getCreateLabel={(query) => `+ Add ${query}`}
            />

            {/* Insurance Information */}
            <Title order={3}>Insurance Information</Title>
            <Group grow>
              <TextInput
                required
                label="Insurance Provider"
                value={profile.insuranceProvider}
                onChange={(e) => setProfile({ ...profile, insuranceProvider: e.target.value })}
              />
              <TextInput
                required
                label="Insurance Number"
                value={profile.insuranceNumber}
                onChange={(e) => setProfile({ ...profile, insuranceNumber: e.target.value })}
              />
              <TextInput
                required
                label="Insurance Expiry"
                type="date"
                value={profile.insuranceExpiry}
                onChange={(e) => setProfile({ ...profile, insuranceExpiry: e.target.value })}
              />
            </Group>

            {/* Banking Information */}
            <Title order={3}>Banking Information</Title>
            <Group grow>
              <TextInput
                required
                label="Bank Name"
                value={profile.bankName}
                onChange={(e) => setProfile({ ...profile, bankName: e.target.value })}
              />
              <TextInput
                required
                label="Account Number"
                value={profile.accountNumber}
                onChange={(e) => setProfile({ ...profile, accountNumber: e.target.value })}
              />
              <TextInput
                required
                label="IFSC Code"
                value={profile.ifscCode}
                onChange={(e) => setProfile({ ...profile, ifscCode: e.target.value })}
              />
            </Group>

            {/* Logo Upload */}
            <Title order={3}>Company Logo</Title>
            <Group align="flex-start">
              {profile.logo && !(profile.logo instanceof File) && (
                <Image
                  src={profile.logo}
                  width={100}
                  height={100}
                  fit="contain"
                  alt="Company Logo"
                />
              )}
              <FileInput
                label="Upload Logo"
                accept="image/*"
                icon={<IconUpload size={14} />}
                onChange={(file) => setProfile({ ...profile, logo: file })}
              />
            </Group>

            <Button type="submit" loading={loading}>
              Save Profile
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
};

export default CarrierProfile; 