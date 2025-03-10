/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useNavigate, useLocation } from 'react-router-dom';
import {  
  Button, 
  Space, 
  Tabs, 
  Text, 
  Fieldset, 
  ScrollArea,
  Image,
  Flex,
  TextInput,
  NumberInput,
  Select,
  Textarea,
  Group,
  Badge,
  Modal,
  Card,
  Grid,
  Avatar,
  Tooltip,
  Paper,
  Table,
  Loader,
  Stack,
  Title,
  SimpleGrid
} from '@mantine/core';
import { 
  IconPhoto, 
  IconCurrencyDollar, 
  IconListDetails, 
  IconPackage, 
  IconTruck, 
  IconStar,
  IconArrowsExchange,
  IconMessage,
  IconMessageOff
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useState, useEffect } from 'react';
import { useUser, useClerk } from "@clerk/clerk-react";
import { notifications } from '@mantine/notifications';
import Chat from '../../components/Chat';

const ShipmentCarrierView = () => {
  const [userData, setUserData] = useState(null);
  const location = useLocation();
  const [bidsModalOpened, { open: openBidsModal, close: closeBidsModal }] = useDisclosure(false);
  const { shipmentData } = location.state;
  const navigate = useNavigate();
  const iconStyle = { width: 16, height: 16 };
  const [bidAmount, setBidAmount] = useState('');
  const [bidCurrency, setBidCurrency] = useState('USD');
  const [bidNotes, setBidNotes] = useState('');
  const [bids, setBids] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [convertedAmount, setConvertedAmount] = useState(null);
  const [conversionRate, setConversionRate] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState(null);
  const [carrierStats, setCarrierStats] = useState({});
  const { user } = useUser();
  const { client } = useClerk();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedBidToAccept, setSelectedBidToAccept] = useState(null);

  // Add console log to check shipment data
  console.log('Shipment Data:', shipmentData);

  // Fetch user data from MongoDB when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/shipments/user/${user.emailAddresses[0].emailAddress}`);
        
        if (response.ok) {
          const data = await response.json();
          // Set user data from the shipments response
          const userInfo = {
            email: user.emailAddresses[0].emailAddress,
            role: user.publicMetadata?.role || 'carrier',
            // Add any other user data you need
          };
          setUserData(userInfo);
          console.log('Fetched user data:', userInfo);
        } else {
          console.error('Error fetching user data:', response.status);
          // If user not found, set default user data
          const defaultUserInfo = {
            email: user.emailAddresses[0].emailAddress,
            role: user.publicMetadata?.role || 'carrier'
          };
          setUserData(defaultUserInfo);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Set default user data on error
        const defaultUserInfo = {
          email: user.emailAddresses[0].emailAddress,
          role: user.publicMetadata?.role || 'carrier'
        };
        setUserData(defaultUserInfo);
      }
    };

    if (user) {
      fetchUserData();
    }
  }, [user]);

  useEffect(() => {
    fetchBids();
  }, [shipmentData._id]);

  useEffect(() => {
    if (bids.length > 0) {
      fetchCarrierStats();
    }
  }, [bids]);

  useEffect(() => {
    if (bidAmount && bidCurrency !== shipmentData.currency) {
      handleCurrencyConversion();
    } else {
      setConvertedAmount(null);
      setConversionRate(null);
    }
  }, [bidAmount, bidCurrency]);

  const fetchCarrierStats = async () => {
    const stats = {};
    for (const bid of bids) {
      if (!stats[bid.carrier?._id]) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/shipments/carrier-stats/${bid.carrier?._id}`);
          const data = await response.json();
          
          stats[bid.carrier?._id] = {
            completedShipments: data.completedShipments,
            totalShipments: data.totalShipments,
            rating: data.rating
          };
        } catch (error) {
          console.error('Error fetching carrier stats:', error);
        }
      }
    }
    setCarrierStats(stats);
  };

  const handleCurrencyConversion = async () => {
    if (!bidAmount) return;

    setIsConverting(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/shipments/convert-currency?amount=${bidAmount}&from=${bidCurrency}&to=${shipmentData.currency}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setConvertedAmount(data.amount);
        setConversionRate(data.rate);
      } else {
        console.error('Currency conversion failed');
        setConvertedAmount(null);
        setConversionRate(null);
      }
    } catch (error) {
      console.error('Error converting currency:', error);
    } finally {
      setIsConverting(false);
    }
  };

  const fetchBids = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/shipments/bids/${shipmentData._id}`);
      if (response.ok) {
        const data = await response.json();
        setBids(data.bids);
      }
    } catch (error) {
      console.error('Error fetching bids:', error);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handleBidSubmit = async () => {
    if (!user) {
      notifications.show({
        title: 'Error',
        message: 'Please log in to place a bid',
        color: 'red'
      });
      return;
    }

    if (!bidAmount) {
      notifications.show({
        title: 'Error',
        message: 'Please enter a bid amount',
        color: 'red'
      });
      return;
    }

    try {
      const bidData = {
        email: user.emailAddresses[0].emailAddress,
        amount: parseFloat(bidAmount),
        currency: bidCurrency,
        notes: bidNotes,
        convertedAmount,
        conversionRate
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/shipments/bid/${shipmentData._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bidData)
      });

      if (!response.ok) {
        throw new Error('Failed to place bid');
      }

      const result = await response.json();
      notifications.show({
        title: 'Success',
        message: 'Bid placed successfully',
        color: 'green'
      });

      // Clear form
      setBidAmount('');
      setBidNotes('');
      setConvertedAmount(null);
      setConversionRate(null);
    } catch (error) {
      console.error('Error placing bid:', error);
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to place bid',
        color: 'red'
      });
    }
  };

  const renderShipmentDetails = () => {
    const formatLocation = (location) => {
      if (typeof location === 'object') {
        const { name, city, country } = location;
        return [name, city, country].filter(Boolean).join(', ');
      }
      return location || '';
    };

    const formatDimensions = (dimensions) => {
      if (typeof dimensions === 'object') {
        const { length, width, height, unit } = dimensions;
        return `${length}x${width}x${height} ${unit}`;
      }
      return dimensions || '';
    };

    return (
      <Fieldset legend="Shipment Details">
        <Grid>
          <Grid.Col span={6}>
            <TextInput
              label="Origin"
              value={formatLocation(shipmentData?.origin)}
              readOnly
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              label="Destination"
              value={formatLocation(shipmentData?.destination)}
              readOnly
            />
          </Grid.Col>
        </Grid>

        <Title order={4} mt="xl">Products</Title>
        {shipmentData?.products?.map((product, index) => (
          <Card key={index} withBorder mt="md">
            <Stack spacing="md">
              <Group position="apart">
                <Title order={5}>Product {index + 1}</Title>
                <Badge>{product.quantity} units</Badge>
              </Group>

              <Grid>
                <Grid.Col span={6}>
                  <TextInput
                    label="Product Name"
                    value={product.productName || ''}
                    readOnly
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label="Product Type"
                    value={product.productType || ''}
                    readOnly
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label="Category"
                    value={product.category || ''}
                    readOnly
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label="Sub Category"
                    value={product.subCategory || ''}
                    readOnly
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <TextInput
                    label="Weight (kg)"
                    value={product.weight?.toString() || ''}
                    readOnly
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <TextInput
                    label="Price"
                    value={product.price?.toString() || ''}
                    readOnly
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <TextInput
                    label="Total Weight (kg)"
                    value={(product.weight * product.quantity)?.toString() || ''}
                    readOnly
                  />
                </Grid.Col>
                <Grid.Col span={12}>
                  <TextInput
                    label="Dimensions"
                    value={formatDimensions(product.dimensions)}
                    readOnly
                  />
                </Grid.Col>
              </Grid>

              {product.productImages?.length > 0 && (
                <>
                  <Text size="sm" weight={500}>Product Images</Text>
                  <SimpleGrid cols={4} spacing="xs">
                    {product.productImages.map((image, imgIndex) => (
                      <Image
                        key={imgIndex}
                        src={image}
                        height={80}
                        alt={`Product ${index + 1} image ${imgIndex + 1}`}
                      />
                    ))}
                  </SimpleGrid>
                </>
              )}

              {product.handlingInstructions && (
                <TextInput
                  label="Handling Instructions"
                  value={product.handlingInstructions}
                  readOnly
                />
              )}
            </Stack>
          </Card>
        ))}

        <Group position="apart" mt="xl">
          <Text size="sm" weight={500}>Total Products: {shipmentData?.products?.length || 0}</Text>
          <Text size="sm" weight={500}>Total Weight: {shipmentData?.totalWeight}kg</Text>
        </Group>
      </Fieldset>
    );
  };

  const handleAcceptBid = async (bid) => {
    setSelectedBidToAccept(bid);
    setShowConfirmModal(true);
  };

  const confirmAcceptBid = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/shipments/bid/${shipmentData._id}/accept/${selectedBidToAccept._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to accept bid');
      }

      notifications.show({
        title: 'Success',
        message: 'Bid accepted successfully',
        color: 'green'
      });

      // Refresh bids
      await fetchBids();
      setShowConfirmModal(false);
    } catch (error) {
      console.error('Error accepting bid:', error);
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to accept bid',
        color: 'red'
      });
    }
  };

  return (
    <>
      <Modal
        opened={bidsModalOpened}
        onClose={closeBidsModal}
        title={<Text size="lg" weight={600}>All Bids for Shipment</Text>}
        size="xl"
      >
        <Paper p="md">
          <Table>
            <thead>
              <tr>
                <th>Carrier</th>
                <th>Amount</th>
                <th>Converted Amount</th>
                <th>Status</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              {bids.map((bid, index) => (
                <tr key={index}>
                  <td>
                    <Group spacing="sm">
                      <div>
                        <Text weight={500}>{bid.carrier?.companyName || 'Unknown'}</Text>
                        <Text size="xs" color="dimmed">{bid.carrier?.email}</Text>
                      </div>
                    </Group>
                  </td>
                  <td>{bid.amount} {bid.currency}</td>
                  <td>
                    {bid.convertedAmount && bid.currency !== shipmentData.currency ?
                      `${bid.convertedAmount} ${shipmentData.currency}` : '-'}
                  </td>
                  <td>
                    <Badge color={bid.status === 'accepted' ? 'green' : bid.status === 'rejected' ? 'red' : 'blue'}>
                      {bid.status}
                    </Badge>
                  </td>
                  <td>
                    {carrierStats[bid.carrier?._id] && (
                      <Group spacing="xs">
                        <Tooltip label="Completed Shipments">
                          <Badge variant="dot">
                            {carrierStats[bid.carrier._id].completedShipments} / {carrierStats[bid.carrier._id].totalShipments}
                          </Badge>
                        </Tooltip>
                        <Tooltip label="Rating">
                          <Badge variant="dot" color="yellow">
                            {carrierStats[bid.carrier._id].rating.toFixed(1)}★
                          </Badge>
                        </Tooltip>
                      </Group>
                    )}
                  </td>
                </tr>
              ))}
              {bids.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <Text align="center" color="dimmed">No bids placed yet</Text>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Paper>
      </Modal>

      <Modal
        opened={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title={<Text size="lg" weight={600}>Confirm Accept Bid</Text>}
      >
        {selectedBidToAccept && (
          <Stack spacing="md">
            <Text>Are you sure you want to accept this bid?</Text>
            <Group>
              <Text weight={500}>Carrier:</Text>
              <Text>{selectedBidToAccept.carrier?.companyName}</Text>
            </Group>
            <Group>
              <Text weight={500}>Bid Amount:</Text>
              <Text>{selectedBidToAccept.amount} {selectedBidToAccept.currency}</Text>
            </Group>
            {selectedBidToAccept.convertedAmount && selectedBidToAccept.currency !== shipmentData.currency && (
              <Group>
                <Text weight={500}>Converted Amount:</Text>
                <Text>{selectedBidToAccept.convertedAmount} {shipmentData.currency}</Text>
              </Group>
            )}
            <Group position="apart" mt="xl">
              <Button variant="light" onClick={() => setShowConfirmModal(false)}>Cancel</Button>
              <Button color="green" onClick={confirmAcceptBid}>Confirm Accept</Button>
            </Group>
          </Stack>
        )}
      </Modal>

      <Grid gutter="md">
        <Grid.Col span={userData?.role === 'seller' ? 9 : 12}>
          <Flex justify="space-between" align="center" wrap="wrap">
            <Button variant='light' onClick={handleCancel}>
              Back
            </Button>
            <Button
              variant="outline"
              leftIcon={<IconListDetails size={16} />}
              onClick={openBidsModal}
            >
              View All Bids
            </Button>
          </Flex>

          <Space h="xl" />
          <Tabs defaultValue="Details">
            <Tabs.List>
              <Tabs.Tab value="Details" leftSection={<IconPhoto style={iconStyle} />}>
                Product Details
              </Tabs.Tab>
              <Tabs.Tab value="Images" leftSection={<IconPhoto style={iconStyle} />}>
                Images
              </Tabs.Tab>
              <Tabs.Tab value="Bidding" leftSection={<IconCurrencyDollar style={iconStyle} />}>
                Bidding
              </Tabs.Tab>
              <Tabs.Tab value="Chat" leftSection={<IconMessage style={iconStyle} />}>
                Chat
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="Details">
              <Fieldset style={{ cursor: 'none' }}>
                <ScrollArea h={500}>
                  {renderShipmentDetails()}
                </ScrollArea>
              </Fieldset>
            </Tabs.Panel>
            <Tabs.Panel value="Images">
              <Space h="xl" />
              <Flex wrap="wrap" justify="center" gap="md">
                {shipmentData.productImages && shipmentData.productImages.length > 0 ? (
                  shipmentData.productImages.map((imageUrl, index) => (
                    <Card key={index} shadow="sm" padding="xs" radius="md" withBorder>
                      <Card.Section>
                        <Image
                          src={imageUrl}
                          height={200}
                          width={300}
                          alt={`Product image ${index + 1}`}
                          fit="cover"
                          radius="md"
                        />
                      </Card.Section>
                    </Card>
                  ))
                ) : (
                  <Paper p="xl" withBorder>
                    <Flex direction="column" align="center" gap="md">
                      <IconPhoto size={48} color="gray" />
                      <Text size="lg" color="dimmed">No images available for this shipment.</Text>
                    </Flex>
                  </Paper>
                )}
              </Flex>
            </Tabs.Panel>
            <Tabs.Panel value="Bidding">
              <Space h="xl" />
              <Paper shadow="xs" p="md" withBorder>
                <Text size="lg" weight={500} mb="md">Place Your Bid</Text>
                <Flex direction="column" gap="md">
                  <Group grow>
                    <NumberInput
                      label="Bid Amount"
                      value={bidAmount}
                      onChange={setBidAmount}
                      min={0}
                      precision={2}
                      placeholder="Enter your bid amount"
                      required
                    />
                    <Select
                      label="Currency"
                      value={bidCurrency}
                      onChange={setBidCurrency}
                      data={[
                        { value: 'USD', label: 'USD' },
                        { value: 'EUR', label: 'EUR' },
                        { value: 'GBP', label: 'GBP' },
                        { value: 'INR', label: 'INR' }
                      ]}
                    />
                  </Group>
                  {isConverting ? (
                    <Flex align="center" gap="sm">
                      <Loader size="sm" />
                      <Text size="sm">Converting currency...</Text>
                    </Flex>
                  ) : convertedAmount && (
                    <Paper p="xs" bg="gray.0">
                      <Group spacing="xs">
                        <IconArrowsExchange size={16} />
                        <Text size="sm">
                          {bidAmount} {bidCurrency} = {convertedAmount.toFixed(2)} {shipmentData.currency}
                        </Text>
                        <Text size="xs" color="dimmed">
                          (Rate: 1 {bidCurrency} = {conversionRate} {shipmentData.currency})
                        </Text>
                      </Group>
                    </Paper>
                  )}
                  <Textarea
                    label="Notes"
                    value={bidNotes}
                    onChange={(event) => setBidNotes(event.currentTarget.value)}
                    placeholder="Add any notes or terms for your bid"
                    minRows={3}
                  />
                  <Button
                    onClick={handleBidSubmit}
                    loading={isLoading}
                    color="blue"
                    disabled={isConverting}
                  >
                    Place Bid
                  </Button>
                </Flex>
              </Paper>

              <Space h="xl" />
              <Paper shadow="xs" p="md" withBorder>
                <Group position="apart" mb="md">
                  <Text size="lg" weight={500}>Recent Bids</Text>
                  <Button variant="subtle" onClick={openBidsModal}>View All</Button>
                </Group>
                <ScrollArea h={300}>
                  {bids.slice(0, 5).map((bid, index) => (
                    <Paper key={index} p="sm" withBorder mb="sm">
                      <Group position="apart">
                        <Group>
                          <Text weight={500}>{bid.amount} {bid.currency}</Text>
                          {bid.convertedAmount && bid.currency !== shipmentData.currency && (
                            <Text size="sm" color="dimmed">
                              ({bid.convertedAmount} {shipmentData.currency})
                            </Text>
                          )}
                          <Badge color={bid.status === 'accepted' ? 'green' : bid.status === 'rejected' ? 'red' : 'blue'}>
                            {bid.status}
                          </Badge>
                        </Group>
                        <Text size="sm" color="dimmed">
                          {new Date(bid.createdAt).toLocaleDateString()}
                        </Text>
                      </Group>
                      {bid.notes && (
                        <Text size="sm" mt="xs" color="dimmed">
                          {bid.notes}
                        </Text>
                      )}
                    </Paper>
                  ))}
                  {bids.length === 0 && (
                    <Text color="dimmed" align="center">No bids placed yet</Text>
                  )}
                </ScrollArea>
              </Paper>
            </Tabs.Panel>
            <Tabs.Panel value="Chat">
              <Space h="xl" />
              {shipmentData.acceptedBid ? (
                <Chat
                  shipmentId={shipmentData._id}
                  otherUser={shipmentData.user}
                />
              ) : (
                <Paper p="xl" withBorder>
                  <Flex direction="column" align="center" gap="md">
                    <IconMessageOff size={48} color="gray" />
                    <Text size="lg" color="dimmed">Chat will be available after a bid is accepted.</Text>
                  </Flex>
                </Paper>
              )}
            </Tabs.Panel>
          </Tabs>
        </Grid.Col>

        {userData?.role === 'seller' && (
          <Grid.Col span={3}>
            <Paper shadow="sm" p="md" withBorder>
              <Text size="lg" weight={600} mb="md">Bid Management</Text>
              <Stack spacing="md">
                {bids.length === 0 ? (
                  <Text color="dimmed" align="center">No bids yet</Text>
                ) : (
                  bids.map((bid, index) => (
                    <Paper key={index} p="sm" withBorder>
                      <Stack spacing="xs">
                        <Group position="apart">
                          <Group spacing="xs">
                            <div>
                              <Text size="sm" weight={500}>{bid.carrier?.companyName}</Text>
                              <Text size="xs" color="dimmed">{bid.carrier?.email}</Text>
                            </div>
                          </Group>
                          <Badge color={bid.status === 'accepted' ? 'green' : bid.status === 'rejected' ? 'red' : 'blue'}>
                            {bid.status}
                          </Badge>
                        </Group>
                        
                        <Group position="apart">
                          <Text weight={500}>{bid.amount} {bid.currency}</Text>
                          {bid.convertedAmount && bid.currency !== shipmentData.currency && (
                            <Text size="sm" color="dimmed">
                              ({bid.convertedAmount} {shipmentData.currency})
                            </Text>
                          )}
                        </Group>

                        {carrierStats[bid.carrier?._id] && (
                          <Group spacing="xs">
                            <Badge variant="dot" size="sm">
                              {carrierStats[bid.carrier._id].completedShipments} / {carrierStats[bid.carrier._id].totalShipments} shipments
                            </Badge>
                            <Badge variant="dot" size="sm" color="yellow">
                              {carrierStats[bid.carrier._id].rating.toFixed(1)}★
                            </Badge>
                          </Group>
                        )}

                        {bid.notes && (
                          <Text size="xs" color="dimmed">{bid.notes}</Text>
                        )}

                        {bid.status === 'pending' && (
                          <Group position="right" mt="xs">
                            <Button
                              variant="light"
                              color="green"
                              compact
                              onClick={() => handleAcceptBid(bid)}
                            >
                              Accept Bid
                            </Button>
                          </Group>
                        )}
                      </Stack>
                    </Paper>
                  ))
                )}
              </Stack>
            </Paper>
          </Grid.Col>
        )}
      </Grid>
    </>
  );
};

export default ShipmentCarrierView;
