import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { 
  Container, 
  Paper, 
  Title, 
  Text, 
  
  Group,
  Card,
  Stack,
  rem,
  LoadingOverlay
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconBuildingStore, IconTruck } from '@tabler/icons-react';
import { useState, useEffect } from 'react';

const RoleSelection = () => {
  const navigate = useNavigate();
  const { user, isLoaded, isSignedIn } = useUser();
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate('/auth/signin', { replace: true });
    }
    
    // Check if user already has a role
    if (isLoaded && isSignedIn && user?.unsafeMetadata?.role) {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoaded, isSignedIn, navigate, user]);

  const handleRoleSelect = async (role) => {
    if (!user) {
      notifications.show({
        title: 'Error',
        message: 'User not found. Please sign in again.',
        color: 'red'
      });
      return;
    }

    setIsUpdating(true);
    try {
      const updatedUser = await user.update({
        unsafeMetadata: {
          role: role
        }
      });

      console.log('Updated user:', updatedUser);
      
      notifications.show({
        title: 'Success',
        message: `Role set successfully as ${role}`,
        color: 'green'
      });

      // Redirect immediately after success
      navigate('/dashboard');

    } catch (error) {
      console.error('Error updating user role:', error);
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to update role. Please try again.',
        color: 'red'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isLoaded) {
    return (
      <Container size="sm" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <LoadingOverlay visible={true} />
      </Container>
    );
  }

  return (
    <Container size="sm" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <Paper shadow="md" p="xl" style={{ width: '100%', position: 'relative' }}>
        <LoadingOverlay visible={isUpdating} />
        <Stack align="center" mb={30}>
          <Title order={2}>Choose Your Role</Title>
          <Text c="dimmed" ta="center">
            Select how you want to use CrossSync. You cant change this later.
          </Text>
        </Stack>

        <Group justify="center" gap={30}>
          <Card
            shadow="sm"
            padding="lg"
            radius="md"
            withBorder
            style={{ 
              width: rem(240),
              cursor: isUpdating ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s ease',
              opacity: isUpdating ? 0.7 : 1
            }}
            onClick={() => !isUpdating && handleRoleSelect('seller')}
            onMouseEnter={(e) => !isUpdating && (e.currentTarget.style.transform = 'translateY(-5px)')}
            onMouseLeave={(e) => !isUpdating && (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <Stack align="center">
              <IconBuildingStore size={48} stroke={1.5} />
              <Title order={3}>Seller</Title>
              <Text size="sm" c="dimmed" ta="center">
                I want to manage and track my shipments
              </Text>
            </Stack>
          </Card>

          <Card
            shadow="sm"
            padding="lg"
            radius="md"
            withBorder
            style={{ 
              width: rem(240),
              cursor: isUpdating ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s ease',
              opacity: isUpdating ? 0.7 : 1
            }}
            onClick={() => !isUpdating && handleRoleSelect('carrier')}
            onMouseEnter={(e) => !isUpdating && (e.currentTarget.style.transform = 'translateY(-5px)')}
            onMouseLeave={(e) => !isUpdating && (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <Stack align="center">
              <IconTruck size={48} stroke={1.5} />
              <Title order={3}>Carrier</Title>
              <Text size="sm" c="dimmed" ta="center">
                I want to deliver shipments and manage routes
              </Text>
            </Stack>
          </Card>
        </Group>
      </Paper>
    </Container>
  );
};

export default RoleSelection;