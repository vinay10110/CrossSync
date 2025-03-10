import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Flex, 
  Paper, 
  Box, 
  Title, 
  Text, 
  Button, 
  AppShell, 
  Group,
  useMantineTheme,
  Stack
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import img from "../../assets/image1.jpeg";

const Authentication = () => {
  const navigate = useNavigate();
  const [opened, { toggle }] = useDisclosure();
  const theme = useMantineTheme();

  const handleSignIn = () => {
    navigate('/auth/signin');
  };

  const handleSignUp = () => {
    navigate('/auth/signup');
  };

  return (
    <AppShell
      header={{ height: 70 }}
      padding="md"
      styles={{
        main: {
          background: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0],
        },
      }}
    >
      <AppShell.Header>
        <Container size="lg" h="100%">
          <Group h="100%" px="md" justify="space-between">
            <Title 
              order={3} 
              c={theme.primaryColor}
              style={{ 
                fontWeight: 800,
                letterSpacing: '-0.5px'
              }}
            >
              CrossSync
            </Title>
            <Group gap={40}>
              <Group gap={40} visibleFrom="sm">
                <Text 
                  fw={500} 
                  style={{ cursor: 'pointer' }}
                  c="dimmed"
                  component="a"
                  href="#features"
                >
                  Features
                </Text>
                <Text 
                  fw={500} 
                  style={{ cursor: 'pointer' }}
                  c="dimmed"
                  component="a"
                  href="#about"
                >
                  About
                </Text>
                <Text 
                  fw={500} 
                  style={{ cursor: 'pointer' }}
                  c="dimmed"
                  component="a"
                  href="#contact"
                >
                  Contact
                </Text>
              </Group>
              <Group>
                <Button 
                  variant="subtle" 
                  onClick={handleSignIn}
                  radius="md"
                >
                  Sign In
                </Button>
                <Button 
                  onClick={handleSignUp}
                  radius="md"
                  gradient={{ from: theme.primaryColor, to: 'cyan' }}
                  variant="gradient"
                >
                  Sign Up
                </Button>
              </Group>
            </Group>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="lg" mt={100}>
          <Flex
            direction={{ base: 'column', md: 'row' }}
            gap={{ base: 40, md: 80 }}
            align="center"
            justify="space-between"
          >
            {/* Hero Content */}
            <Stack spacing="xl" style={{ flex: 1, maxWidth: 600 }}>
              <Title
                order={1}
                size={50}
                fw={900}
                lh={1.1}
                variant="gradient"
                gradient={{ from: theme.primaryColor, to: 'cyan', deg: 45 }}
              >
                Streamline Your{' '}
                <Text
                  component="span"
                  variant="gradient"
                  gradient={{ from: 'cyan', to: theme.primaryColor, deg: 45 }}
                  inherit
                >
                  Shipment Management
                </Text>
              </Title>
              
              <Text size="xl" c="dimmed" maw={520}>
                Track, manage, and optimize your shipments with our powerful platform. 
                Get real-time updates and seamless collaboration tools.
              </Text>
              
              <Group mt="xl">
                <Button 
                  size="xl" 
                  radius="md"
                  onClick={handleSignUp}
                  gradient={{ from: theme.primaryColor, to: 'cyan' }}
                  variant="gradient"
                >
                  Get Started
                </Button>
                <Button 
                  size="xl" 
                  variant="light" 
                  radius="md"
                  onClick={handleSignIn}
                  color={theme.primaryColor}
                >
                  Learn More
                </Button>
              </Group>
            </Stack>

            {/* Hero Image */}
            <Box 
              style={{ 
                flex: 1,
                maxWidth: '100%',
                position: 'relative'
              }}
            >
              <Paper
                shadow="xl"
                radius="xl"
                style={{
                  overflow: 'hidden',
                  aspectRatio: '4/3',
                  border: `1px solid ${theme.colors.gray[2]}`,
                  background: theme.white,
                }}
              >
                <img
                  src={img}
                  alt="Shipment Management"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              </Paper>
            </Box>
          </Flex>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
};

export default Authentication;
