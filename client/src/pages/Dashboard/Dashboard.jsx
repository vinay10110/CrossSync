/* eslint-disable no-unused-vars */
import React, { useState, useMemo } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Profile from '../profile/Profile';
import {supabase} from '../../components/Supabase';
import {
  AppShell,
  Burger,
  Group,
  Button,
  Modal,
  Select,
  NavLink,
  Container,
  Center,
  Text,
  Avatar,
  Menu,
  rem,
  Flex,
  Title,
  Space
} from '@mantine/core';
import {
  IconSettings,
  IconPackage,
  IconTruckDelivery,
  IconUser,
  IconChevronRight,
  IconActivity,
  IconTrash,
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


import { useUserData } from '../../components/hooks/useUserData';
import { useFetchShipments } from '../../components/hooks/useFetchShipment';


import useStore from '../../components/Zustand';

const LINKS = {
  SELLER: [
    { to: '/dashboard/browseshipment', label: 'Request Shipment', icon: IconTruckDelivery },
    { to: '/dashboard/allshipmentsseller', label: 'Shipment Status', icon: IconPackage },
    { to: '/dashboard/profile', label: 'Profile', icon: IconUser },
    { to: '', label: 'Settings', icon: IconSettings },
  ],
  CARRIER: [
    { to: '/dashboard/allshipmentscarrier', label: 'Browse Shipments', icon: IconTruckDelivery },
    { to: '/dashboard/myshipments', label: 'My Shipments', icon: IconActivity },
    { to: '/dashboard/profile', label: 'Profile', icon: IconUser },
    { to: '', label: 'Settings', icon: IconSettings },
  ],
};

export function Dashboard() {
  const navigate = useNavigate();
  const { setAuth, userDoc, setShipments } = useStore();
  const {  fullUser, token, isFirstLogin, setIsFirstLogin } = useUserData(setAuth);
  useFetchShipments(setShipments);

  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
  const [userRole, setUserRole] = useState(null);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) navigate('/');
  };

  const handleFirstTimeLogin = async () => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({fullUser,userRole}),
      headers: { 'Content-Type': 'application/json' },
    });
    const result = await response.json();
    setAuth(token, result, fullUser);
    setIsFirstLogin(false);
  };
  const renderLinks = useMemo(() => {
    const links = userDoc?.role === 'Seller' ? LINKS.SELLER : LINKS.CARRIER;
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
  }, [userDoc]);

  return (
    <>
     
      <Modal opened={isFirstLogin} title="Select a role" centered withCloseButton={false}>
        <Select
          label="Roles"
          placeholder="Pick Your Role"
          data={['Seller', 'Carrier']}
          onChange={setUserRole}
        />
        <Space h="md" />
        <Button onClick={handleFirstTimeLogin} disabled={!userRole}>
          Confirm
        </Button>
      </Modal>

    
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
            
            <Flex justify="flex-end" align="center">
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <Avatar
                  src={fullUser?.identities[0]?.identity_data?.avatar_url}
                  alt="User Avatar"
                  style={{ cursor: 'pointer' }}
                />
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Application</Menu.Label>
                <Menu.Item leftSection={<IconSettings style={{ width: rem(14), height: rem(14) }} />}>
                  Profile Settings
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
            {userDoc?.role === 'Seller' ? (
              <>
                <Route path="/createshipment" element={<CreateShipment />} />
                <Route path="/browseshipment" element={<BrowseShipments />} />
                <Route path="/allshipmentsseller" element={<AllShipmentsSeller />} />
                <Route path="/shipment/:id" element={<ShipmentSellerView />} />
                <Route path="/profile" element={<Profile />} />
              </>
            ) : (
              <>
                <Route path="/shipmentcarrier" element={<ShipmentCarrierView />} />
                <Route path="/allshipmentscarrier" element={<AllShipmentsCarrier />} />
                <Route path="/shipment/:id" element={<ShipmentCarrierView />} />
                <Route path="/myshipments" element={<MyShipments />} />
                <Route path="/myshipment/:id" element={<ShipmentStatus />} />
                <Route path="/profile" element={<Profile />} />
              </>
            )}
            <Route
              path="*"
              element={
                <Container>
                  <Center>
                    <Text align="center" size="xl" weight={600}>
                      Welcome to Cross Sync
                    </Text>
                  </Center>
                </Container>
              }
            />
          </Routes>
        </AppShell.Main>
      </AppShell>
    </>
  );
}

export default Dashboard;
