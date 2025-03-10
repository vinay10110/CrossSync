/* eslint-disable no-unused-vars */
import React, { useState, useMemo, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/clerk-react';
import SellerProfile from '../seller/Profile';
import CarrierProfile from '../carrier/Profile';
import {
  AppShell,
  Burger,
  Group,
  Button,
  NavLink,
  Container,
  Center,
  Text,
  Avatar,
  Menu,
  rem,
  Flex,
  Title,
  Space,
  LoadingOverlay,
  Box,
  Divider
} from '@mantine/core';
import {
  IconSettings,
  IconPackage,
  IconTruckDelivery,
  IconUser,
  IconChevronRight,
  IconActivity,
  IconTrash,
  IconMessages,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';

import CreateShipment from '../seller/CreateShipment';
import AllShipmentsCarrier from '../carrier/AllShipments';
import AllShipmentsSeller from '../seller/AllShipments';
import MyShipments from '../carrier/MyShipments';
import ShipmentCarrierView from '../carrier/ShipmentCarrierView';
import ShipmentSellerView from '../seller/ShipmentSellerView';
import ShipmentStatus from '../carrier/ShipmentStatus';
import BrowseShipments from '../seller/BrowseShipments';
import Settings from '../Settings';
import Chats from '../Chats';

const LINKS = {
  seller: [
    { to: '/dashboard/browseshipment', label: 'Request Shipment', icon: IconTruckDelivery },
    { to: '/dashboard/allshipmentsseller', label: 'Shipment Status', icon: IconPackage },
    { to: '/dashboard/chats', label: 'Messages', icon: IconMessages },
    { to: '/dashboard/profile', label: 'Profile', icon: IconUser },
    { to: '/dashboard/settings', label: 'Settings', icon: IconSettings },
  ],
  carrier: [
    { to: '/dashboard/allshipmentscarrier', label: 'Browse Shipments', icon: IconTruckDelivery },
    { to: '/dashboard/myshipments', label: 'My Shipments', icon: IconActivity },
    { to: '/dashboard/chats', label: 'Messages', icon: IconMessages },
    { to: '/dashboard/profile', label: 'Profile', icon: IconUser },
    { to: '/dashboard/settings', label: 'Settings', icon: IconSettings },
  ],
};

export function Dashboard() {
  const navigate = useNavigate();
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
  const [userRole, setUserRole] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isLoaded) {
      if (!isSignedIn) {
        navigate('/auth/signin');
        return;
      }

      // Get role from metadata
      const role = user?.unsafeMetadata?.role;
      if (!role) {
        navigate('/auth/role-selection');
        return;
      }
      setUserRole(role);
    }
  }, [isLoaded, isSignedIn, user, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.emailAddresses?.[0]?.emailAddress) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/shipments/seller/profile/${user.emailAddresses[0].emailAddress}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          if (response.ok) {
            const data = await response.json();
            setUserProfile(data.user);
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      }
    };

    if (isLoaded && isSignedIn) {
      fetchProfile();
    }
  }, [isLoaded, isSignedIn, user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const renderLinks = useMemo(() => {
    const links = LINKS[userRole] || [];
    return links.map((link) => (
      <NavLink
        key={link.label}
        component={Link}
        to={link.to}
        label={link.label}
        leftSection={<link.icon size="1rem" stroke={1.5} />}
        rightSection={<IconChevronRight size="0.8rem" stroke={1.5} className="mantine-rotate-rtl" />}
        variant="subtle"
        active
      />
    ));
  }, [userRole]);

  const fetchSellerProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/shipments/seller/profile/${user.emailAddresses[0].emailAddress}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Seller profile data:', data);
      setUserProfile(data.user);
    } catch (error) {
      console.error('Error fetching seller profile:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || !userRole) {
    return (
      <Container style={{ height: '100vh' }}>
        <LoadingOverlay visible={true} />
      </Container>
    );
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify='space-between' align="center">
          <div>
            <Flex justify="center" align="center" direction="row" gap="xl">
              <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="sm" />
              <Burger opened={desktopOpened} onClick={toggleDesktop} visibleFrom="sm" size="sm" />
              <Title order={1}>Cross Sync</Title>
            </Flex>
          </div>
          
          <Flex justify="flex-end" align="center" gap="md">
            {userProfile && (
              <Box mr="md">
                <Text size="sm" weight={500}>{userProfile.companyName || 'Company Name'}</Text>
                <Text size="xs" color="dimmed">{userRole.charAt(0).toUpperCase() + userRole.slice(1)}</Text>
              </Box>
            )}
            <Menu shadow="md" width={280}>
              <Menu.Target>
                <Avatar
                  src={user?.imageUrl}
                  alt="User Avatar"
                  style={{ cursor: 'pointer' }}
                />
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Profile</Menu.Label>
                <Box p="xs">
                  <Text size="sm" weight={500}>{user?.fullName}</Text>
                  <Text size="xs" color="dimmed">{user?.emailAddresses?.[0]?.emailAddress}</Text>
                </Box>
                <Divider />
                <Menu.Label>Settings</Menu.Label>
                <Menu.Item
                  component={Link}
                  to="/dashboard/profile"
                  leftSection={<IconUser style={{ width: rem(14), height: rem(14) }} />}
                >
                  View Full Profile
                </Menu.Item>
                <Menu.Item leftSection={<IconSettings style={{ width: rem(14), height: rem(14) }} />}>
                  Account Settings
                </Menu.Item>
                <Menu.Item leftSection={<IconActivity style={{ width: rem(14), height: rem(14) }} />}>
                  Notifications
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  color="red"
                  leftSection={<IconTrash style={{ width: rem(14), height: rem(14) }} />}
                  onClick={handleSignOut}
                >
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Flex>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">{renderLinks}</AppShell.Navbar>

      <AppShell.Main>
        <Routes>
          {userRole === 'seller' ? (
            <>
              <Route path="/createshipment" element={<CreateShipment />} />
              <Route path="/browseshipment" element={<BrowseShipments />} />
              <Route path="/allshipmentsseller" element={<AllShipmentsSeller />} />
              <Route path="/shipment/:id" element={<ShipmentSellerView />} />
              <Route path="/profile" element={<SellerProfile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/chats" element={<Chats />} />
            </>
          ) : (
            <>
              <Route path="/shipmentcarrier" element={<ShipmentCarrierView />} />
              <Route path="/allshipmentscarrier" element={<AllShipmentsCarrier />} />
              <Route path="/shipment/:id" element={<ShipmentCarrierView />} />
              <Route path="/myshipments" element={<MyShipments />} />
              <Route path="/myshipment/:id" element={<ShipmentStatus />} />
              <Route path="/profile" element={<CarrierProfile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/chats" element={<Chats />} />
            </>
          )}
          <Route
            path="*"
            element={
              <Container>
                <Center>
                  <Text align="center" size="xl" weight={600}>
                    Welcome to Cross Sync - {userRole?.charAt(0).toUpperCase() + userRole?.slice(1)} Dashboard
                  </Text>
                </Center>
              </Container>
            }
          />
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}

export default Dashboard;
