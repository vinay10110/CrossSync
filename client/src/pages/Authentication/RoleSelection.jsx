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
      // First update Clerk user metadata
      await user.update({
        unsafeMetadata: {
          role: role
        }
      });

      // Then create user in MongoDB
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullUser: {
            id: user.id,
            email: user.emailAddresses[0].emailAddress,
            firstName: user.firstName,
            lastName: user.lastName,
            imageUrl: user.imageUrl,
          },
          userRole: role
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create user profile');
      }

      const userData = await response.json();
      console.log('User created:', userData);

      notifications.show({
        title: 'Success',
        message: `Role set successfully as ${role}`,
        color: 'green'
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating user:', error);
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to set up user profile. Please try again.',
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