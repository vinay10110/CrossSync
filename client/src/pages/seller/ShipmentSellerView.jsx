/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  IconClock, IconTruck, IconPackage, IconFileCheck, IconPhoto, 
  IconInfoCircle, IconArrowLeft, IconListDetails, IconStar,
  IconUpload, IconTrash, IconDownload, IconFile, IconCurrencyDollar,
  IconMessage
} from '@tabler/icons-react';
import { 
  Timeline, Text, Title, Container, Grid, Flex, Fieldset, 
  TextInput, Modal, Tabs, Button, Alert, Image, 
  Space, ScrollArea, Paper, Stack, Group, Badge, 
  Avatar, Tooltip, Table, Card, Progress, FileButton,
  ActionIcon, SimpleGrid, Select, NumberInput, Divider
} from '@mantine/core';
import { rem } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useUser } from "@clerk/clerk-react";
import { notifications } from '@mantine/notifications';
import Chat from '../../components/Chat';

const DOCUMENT_TYPES = [
  { value: 'commercial_invoice', label: 'Commercial Invoice', icon: IconFile },
  { value: 'packing_list', label: 'Packing List', icon: IconListDetails },
  { value: 'certificate_of_origin', label: 'Certificate of Origin', icon: IconFileCheck }
];

const CURRENCIES = [
  { value: 'USD', label: 'US Dollar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'GBP', label: 'British Pound (GBP)' },
  { value: 'JPY', label: 'Japanese Yen (JPY)' },
  { value: 'AUD', label: 'Australian Dollar (AUD)' },
  { value: 'CAD', label: 'Canadian Dollar (CAD)' },
  { value: 'INR', label: 'Indian Rupee (INR)' },
  { value: 'CNY', label: 'Chinese Yuan (CNY)' }
];

const ShipmentSellerView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const shipmentData = location.state?.shipmentData;
  const [activeSteps, setActiveSteps] = useState(0);
  const [bidsModalOpened, { open: openBidsModal, close: closeBidsModal }] = useDisclosure(false);
  const [carrierProfileOpened, { open: openCarrierProfile, close: closeCarrierProfile }] = useDisclosure(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedBidToAccept, setSelectedBidToAccept] = useState(null);
  const [selectedCarrier, setSelectedCarrier] = useState(null);
  const [bids, setBids] = useState([]);
  const [carrierStats, setCarrierStats] = useState({});
  const icon = <IconInfoCircle />;
  const iconStyle = { width: rem(12), height: rem(12) };
  const [url, setUrl] = useState(null);
  const [acceptedBid, setAcceptedBid] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const user = useUser();
  const [uploadType, setUploadType] = useState(null);
  const [uploadModalOpened, { open: openUploadModal, close: closeUploadModal }] = useDisclosure(false);
  const [preferredCurrency, setPreferredCurrency] = useState('USD');
  const [convertedBidAmounts, setConvertedBidAmounts] = useState({});
  const [isAcceptingBid, setIsAcceptingBid] = useState(false);
  const [chatOpened, { open: openChat, close: closeChat }] = useDisclosure(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  
  const fetchBids = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/shipments/bids/${shipmentData._id}`);
      if (!response.ok) throw new Error('Failed to fetch bids');
      const data = await response.json();
      setBids(data.bids);
      
      // Fetch carrier stats for each unique carrier
      const uniqueCarriers = [...new Set(data.bids.map(bid => bid.carrier?._id))].filter(Boolean);
      const statsPromises = uniqueCarriers.map(async (carrierId) => {
        const statsResponse = await fetch(`${import.meta.env.VITE_API_URL}/shipments/carrier-stats/${carrierId}`);
        if (!statsResponse.ok) throw new Error(`Failed to fetch stats for carrier ${carrierId}`);
        const statsData = await statsResponse.json();
        setCarrierStats(prev => ({
          ...prev,
          [carrierId]: statsData
        }));
      });
      await Promise.all(statsPromises);
    } catch (error) {
      console.error('Error fetching bids:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to fetch bids. Please try again later.',
        color: 'red'
      });
    }
  };

  useEffect(() => {
    if (shipmentData?._id) {
      fetchBids();
      fetchDocuments();
    }
  }, [shipmentData?._id]);

  useEffect(() => {
    if (shipmentData) {
      const { verifiedShipment, isTaken, dispatched, isCompleted } = shipmentData;
      if (verifiedShipment && isTaken && dispatched && isCompleted) {
        setActiveSteps(4);
      } else if (verifiedShipment && isTaken && dispatched) {
        setActiveSteps(3);
      } else if (verifiedShipment && isTaken) {
        setActiveSteps(2);
      } else if (isTaken) {
        setActiveSteps(1);
      }
    }
  }, [shipmentData]);

  useEffect(() => {
    if (bids.length > 0) {
      const accepted = bids.find(bid => bid.status === 'accepted');
      setAcceptedBid(accepted || null);
    }
  }, [bids]);

  const handleViewCarrierProfile = (carrier) => {
    setSelectedCarrier(carrier);
    openCarrierProfile();
  };

  const handleAcceptBid = async (bid) => {
    setSelectedBidToAccept(bid);
    setShowConfirmModal(true);
  };

  const confirmAcceptBid = async () => {
    try {
      setIsAcceptingBid(true);

      if (!selectedBidToAccept || !selectedBidToAccept._id || !shipmentData || !shipmentData._id) {
        throw new Error('Invalid bid or shipment data');
      }

      // Wait for user data to be loaded
      if (!user?.isLoaded) {
        throw new Error('Please wait for user data to load');
      }

      if (!user?.isSignedIn) {
        throw new Error('You must be signed in to accept bids');
      }

      // Update bid status in MongoDB
      const response = await fetch(`${import.meta.env.VITE_API_URL}/shipments/bid/${shipmentData._id}/accept/${selectedBidToAccept._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to accept bid');
      }

      const responseData = await response.json();

      notifications.show({
        title: 'Success',
        message: 'Bid accepted successfully',
        color: 'green'
      });

      // Refresh bids and close modals
      await fetchBids();
      setShowConfirmModal(false);
      openChat();

    } catch (error) {
      console.error('Error accepting bid:', error);
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to accept bid',
        color: 'red'
      });
    } finally {
      setIsAcceptingBid(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .storage
        .from('shipment-documents')
        .list(`${shipmentData._id}`);

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      
    }
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);

    try {
      const file = files[0];
      if (!file.type.match(/^application\/(pdf|msword|vnd.openxmlformats-officedocument.wordprocessingml.document)$/)) {
        throw new Error('Only PDF and Word documents are allowed');
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size should not exceed 10MB');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', uploadType);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/shipments/${shipmentData._id}/documents`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload document');
      }

      notifications.show({
        title: 'Success',
        message: 'Document uploaded successfully',
        color: 'green'
      });

      await fetchDocuments();
      closeUploadModal();
    } catch (error) {
      console.error('Error uploading file:', error);
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to upload document',
        color: 'red'
      });
    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }
  };

  const handleFileDelete = async (fileName) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/shipments/${shipmentData._id}/documents/${fileName}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      notifications.show({
        title: 'Success',
        message: 'File deleted successfully',
        color: 'green'
      });

      fetchDocuments();
    } catch (error) {
      console.error('Error deleting file:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to delete file',
        color: 'red'
      });
    }
  };

  const handleFileDownload = async (fileName) => {
    try {
      const { data, error } = await supabase
        .storage
        .from('shipment-documents')
        .download(`${shipmentData._id}/${fileName}`);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to download file',
        color: 'red'
      });
    }
  };

  const convertCurrency = async (amount, fromCurrency, toCurrency) => {
    try {
      if (fromCurrency === toCurrency) {
        return parseFloat(amount); // Return original amount if currencies are the same
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/currency/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          from: fromCurrency,
          to: toCurrency
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Currency conversion failed');
      }

      return data.convertedAmount;
    } catch (error) {
      console.error('Error converting currency:', error);
      notifications.show({
        title: 'Currency Conversion Error',
        message: error.message || 'Failed to convert currency. Using original amount.',
        color: 'red'
      });
      return parseFloat(amount); // Return original amount on error
    }
  };

  useEffect(() => {
    const updateConvertedAmounts = async () => {
      const newConvertedAmounts = {};
      for (const bid of bids) {
        if (bid.currency !== preferredCurrency) {
          const converted = await convertCurrency(bid.amount, bid.currency, preferredCurrency);
          if (converted) {
            newConvertedAmounts[bid._id] = converted;
          }
        }
      }
      setConvertedBidAmounts(newConvertedAmounts);
    };

    if (bids.length > 0) {
      updateConvertedAmounts();
    }
  }, [preferredCurrency, bids]);

  if (!shipmentData) {
    return <Text color="red">No shipment data available.</Text>;
  }

  const handlePDF = (url) => {
    setUrl(url);
    open(); 
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleCancelShipment = async () => {
    try {
      setIsCancelling(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/shipments/deleteshipment/${shipmentData._id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to cancel shipment');
      }

      notifications.show({
        title: 'Success',
        message: 'Shipment cancelled successfully',
        color: 'green'
      });

      navigate('/dashboard/shipments');
    } catch (error) {
      console.error('Error cancelling shipment:', error);
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to cancel shipment',
        color: 'red'
      });
    } finally {
      setIsCancelling(false);
      setShowCancelModal(false);
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

  const renderDocumentsTab = () => {
    if (!acceptedBid) {
      return (
        <Alert icon={<IconInfoCircle size="1.1rem" />} title="Documents Unavailable" color="blue">
          Document upload will be available after accepting a bid. Please review and accept a bid to proceed with document uploads.
        </Alert>
      );
    }

    return (
      <Stack spacing="xl">
        <Group position="apart">
          <Title order={4}>Required Documents</Title>
          <Button
            leftIcon={<IconUpload size={16} />}
            onClick={openUploadModal}
            disabled={isUploading}
          >
            Upload Document
          </Button>
        </Group>

        <SimpleGrid cols={3} spacing="lg">
          {DOCUMENT_TYPES.map((docType) => {
            const DocIcon = docType.icon;
            const isUploaded = documents[docType.value];
            
            return (
              <Card key={docType.value} withBorder padding="lg">
          <Stack spacing="md">
                  <Group position="apart">
            <Group>
                      <DocIcon size={24} />
                      <Text weight={500}>{docType.label}</Text>
            </Group>
                    <Badge color={isUploaded ? 'green' : 'gray'}>
                      {isUploaded ? 'Uploaded' : 'Pending'}
                    </Badge>
            </Group>

                  {isUploaded ? (
                    <Group spacing="xs">
                      <Button
                        variant="light"
                        size="sm"
                        leftIcon={<IconDownload size={16} />}
                        onClick={() => handleFileDownload(documents[docType.value])}
                        fullWidth
                      >
                        Download
                      </Button>
                      <ActionIcon
                        color="red"
                        variant="light"
                        onClick={() => handleFileDelete(docType.value)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
              </Group>
                  ) : (
                    <Button
                      variant="light"
                      size="sm"
                      leftIcon={<IconUpload size={16} />}
                      onClick={() => {
                        setUploadType(docType.value);
                        openUploadModal();
                      }}
                      fullWidth
                    >
                      Upload
                    </Button>
                  )}

                  {uploadProgress[docType.value] && (
                    <Progress 
                      value={uploadProgress[docType.value]} 
                      label={`${Math.round(uploadProgress[docType.value])}%`}
                      size="sm"
                      radius="xl"
                    />
                  )}
                </Stack>
              </Card>
            );
          })}
        </SimpleGrid>
      </Stack>
    );
  };

  const renderBidsTable = () => (
        <Paper p="md" radius="md">
      <Group position="apart" mb="md">
        <Title order={4}>All Bids</Title>
        <Select
          label="Preferred Currency"
          value={preferredCurrency}
          onChange={setPreferredCurrency}
          data={CURRENCIES}
          style={{ width: 200 }}
        />
      </Group>
      <Divider mb="md" />
          <Table horizontalSpacing="lg" verticalSpacing="md" striped highlightOnHover>
            <thead>
              <tr>
            <th>Carrier</th>
            <th>Original Amount</th>
            <th>Amount in {preferredCurrency}</th>
            <th>Status</th>
            <th>Performance</th>
            <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bids.map((bid, index) => (
                <tr key={index}>
                  <td>
                    <Group spacing="sm" noWrap>
                      <Avatar
                        src={carrierStats[bid.carrier?._id]?.clerkProfile?.imageUrl}
                        radius="xl"
                        size="md"
                      />
                  <Stack spacing={2}>
                        <Text size="sm" weight={500}>{bid.carrier?.companyName || 'Unknown'}</Text>
                        <Text size="xs" color="dimmed">{bid.carrier?.email}</Text>
                  </Stack>
                    </Group>
                  </td>
                  <td>
                <Text size="sm" weight={500}>
                  {bid.amount} {bid.currency}
                </Text>
                  </td>
                  <td>
                {bid.currency !== preferredCurrency ? (
                  <Text size="sm" weight={500} color="blue">
                    {convertedBidAmounts[bid._id]?.toFixed(2) || '...'} {preferredCurrency}
                  </Text>
                ) : (
                  <Text size="sm" color="dimmed">Same currency</Text>
                    )}
                  </td>
                  <td>
                    <Badge 
                      size="md"
                      color={bid.status === 'accepted' ? 'green' : bid.status === 'rejected' ? 'red' : 'blue'}
                      variant="light"
                    >
                      {bid.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td>
                    {carrierStats[bid.carrier?._id] && (
                      <Stack spacing={4}>
                        <Group spacing="xs" noWrap>
                          <IconTruck size={14} />
                          <Text size="sm">
                        {carrierStats[bid.carrier._id].completedShipments} / {carrierStats[bid.carrier._id].totalShipments}
                          </Text>
                        </Group>
                        <Group spacing="xs" noWrap>
                          <IconStar size={14} color="orange" />
                          <Text size="sm">
                        {carrierStats[bid.carrier._id].rating.toFixed(1)}
                          </Text>
                        </Group>
                      </Stack>
                    )}
                  </td>
                  <td>
                    <Group spacing={8} noWrap>
                      <Button
                        variant="subtle"
                        compact
                        onClick={() => handleViewCarrierProfile(bid.carrier)}
                      >
                    Profile
                      </Button>
                      {bid.status === 'pending' && (
                        <Button
                          variant="light"
                          color="green"
                          compact
                          onClick={() => handleAcceptBid(bid)}
                        >
                          Accept
                        </Button>
                      )}
                    </Group>
                  </td>
                </tr>
              ))}
              {bids.length === 0 && (
                <tr>
                  <td colSpan={6}>
                <Stack align="center" spacing="xs" py="xl">
                  <IconCurrencyDollar size={32} color="gray" />
                  <Text align="center" color="dimmed">No bids have been placed yet</Text>
                </Stack>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Paper>
  );

  const renderBidsModal = () => (
    <Modal
      opened={bidsModalOpened}
      onClose={closeBidsModal}
      title={<Title order={4}>All Bids for Shipment</Title>}
      size="xl"
    >
      {renderBidsTable()}
      </Modal>
  );

  const renderAcceptedBidCard = () => (
    <Paper shadow="sm" p="md" withBorder>
      <Stack spacing="md">
        <Group position="apart">
          <Title order={4}>Accepted Bid</Title>
          <Badge color="green" size="lg">ACCEPTED</Badge>
        </Group>
        <Divider />
        <Group position="apart">
          <Group spacing="sm">
            <Avatar
              src={carrierStats[acceptedBid.carrier?._id]?.clerkProfile?.imageUrl}
              radius="xl"
              size="lg"
            />
            <Stack spacing={2}>
              <Text size="lg" weight={500}>{acceptedBid.carrier?.companyName}</Text>
              <Text size="sm" color="dimmed">{acceptedBid.carrier?.email}</Text>
            </Stack>
          </Group>
        </Group>
        <Card withBorder>
          <Stack spacing="xs">
            <Group position="apart">
              <Text weight={500}>Original Amount:</Text>
              <Text>{acceptedBid.amount} {acceptedBid.currency}</Text>
            </Group>
            {acceptedBid.currency !== preferredCurrency && (
              <Group position="apart">
                <Text weight={500}>Amount in {preferredCurrency}:</Text>
                <Text color="blue">
                  {convertedBidAmounts[acceptedBid._id]?.toFixed(2) || '...'} {preferredCurrency}
                </Text>
              </Group>
            )}
          </Stack>
        </Card>
        <Group spacing="xs">
          <Button
            variant="light"
            leftIcon={<IconTruck size={16} />}
            onClick={() => handleViewCarrierProfile(acceptedBid.carrier)}
          >
            View Carrier Profile
          </Button>
          <Button
            variant="filled"
            leftIcon={<IconMessage size={16} />}
            onClick={openChat}
            color="blue"
          >
            Chat with Carrier
          </Button>
        </Group>
      </Stack>
    </Paper>
  );

  const renderCarrierProfile = () => {
    const carrierData = selectedCarrier && carrierStats[selectedCarrier._id];
    const clerkProfile = carrierData?.clerkProfile || {};
    const metadata = clerkProfile?.publicMetadata || {};

    return (
      <Modal
        opened={carrierProfileOpened}
        onClose={closeCarrierProfile}
        title={<Title order={3}>Carrier Profile</Title>}
        size="xl"
      >
        {selectedCarrier && carrierData && (
          <Stack spacing="xl">
            {/* Header Section */}
            <Paper shadow="sm" p="lg" radius="md" withBorder>
              <Grid>
                <Grid.Col span={4}>
                  <Stack align="center" spacing="sm">
                    <Avatar
                      src={clerkProfile.imageUrl}
                      size={150}
                      radius="md"
                    />
                    <Badge size="lg" variant="dot" color="green">Active</Badge>
                  </Stack>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Stack spacing="xs">
                    <Title order={4}>
                      {clerkProfile.firstName || ''} {clerkProfile.lastName || ''}
                    </Title>
                    <Group spacing="xs">
                      <IconTruck size={16} />
                      <Text size="sm" color="dimmed">{selectedCarrier.companyName}</Text>
                    </Group>
                    <Group spacing="xs">
                      <Text size="sm" weight={500}>Member since:</Text>
                      <Text size="sm" color="dimmed">
                        {clerkProfile.createdAt ? new Date(clerkProfile.createdAt).toLocaleDateString() : 'Not available'}
                      </Text>
                    </Group>
                  </Stack>

                  <Space h="md" />
                  
                  <Group>
                    <Tooltip label="Completed Shipments">
                      <Badge leftSection={<IconPackage size={14} />} size="lg">
                        {carrierData.completedShipments || 0} Completed
                      </Badge>
                    </Tooltip>
                    <Tooltip label="Total Shipments">
                      <Badge leftSection={<IconTruck size={14} />} size="lg">
                        {carrierData.totalShipments || 0} Total
                      </Badge>
                    </Tooltip>
                    <Tooltip label="Rating">
                      <Badge leftSection={<IconStar size={14} />} size="lg" color="yellow">
                        {(carrierData.rating || 0).toFixed(1)} / 5.0
                      </Badge>
                    </Tooltip>
                  </Group>
                </Grid.Col>
              </Grid>
            </Paper>

            <SimpleGrid cols={2} spacing="md">
              {/* Contact Information */}
              <Paper shadow="sm" p="md" radius="md" withBorder>
                <Stack spacing="md">
                  <Title order={5}>Contact Information</Title>
                  <Divider />
                  <Stack spacing="xs">
                    <Group position="apart">
                      <Text size="sm" weight={500}>Email:</Text>
                      <Text size="sm">{selectedCarrier.email}</Text>
                    </Group>
                    <Group position="apart">
                      <Text size="sm" weight={500}>Phone:</Text>
                      <Text size="sm">{selectedCarrier.phone || 'Not provided'}</Text>
                    </Group>
                    <Group position="apart">
                      <Text size="sm" weight={500}>Address:</Text>
                      <Text size="sm">{selectedCarrier.address || 'Not provided'}</Text>
                    </Group>
                  </Stack>
                </Stack>
              </Paper>

              {/* Business Details */}
              <Paper shadow="sm" p="md" radius="md" withBorder>
                <Stack spacing="md">
                  <Title order={5}>Business Details</Title>
                  <Divider />
                  <Stack spacing="xs">
                    <Group position="apart">
                      <Text size="sm" weight={500}>Business Type:</Text>
                      <Text size="sm">{selectedCarrier.businessType || 'Not specified'}</Text>
                    </Group>
                    <Group position="apart">
                      <Text size="sm" weight={500}>Registration Number:</Text>
                      <Text size="sm">{selectedCarrier.registrationNumber || 'Not provided'}</Text>
                    </Group>
                    <Group position="apart">
                      <Text size="sm" weight={500}>Tax ID:</Text>
                      <Text size="sm">{selectedCarrier.taxId || 'Not provided'}</Text>
                    </Group>
                  </Stack>
                </Stack>
              </Paper>

              {/* Fleet Information */}
              <Paper shadow="sm" p="md" radius="md" withBorder>
                <Stack spacing="md">
                  <Title order={5}>Fleet Information</Title>
                  <Divider />
                  <Stack spacing="xs">
                    {selectedCarrier.fleet?.map((vehicle, index) => (
                      <Card key={index} withBorder>
                        <Group position="apart">
                          <Stack spacing={4}>
                            <Text size="sm" weight={500}>{vehicle.type}</Text>
                            <Text size="xs" color="dimmed">
                              Capacity: {vehicle.capacity} {vehicle.capacityUnit}
                            </Text>
                          </Stack>
                          <Badge>{vehicle.count} units</Badge>
                        </Group>
                      </Card>
                    ))}
                    {(!selectedCarrier.fleet || selectedCarrier.fleet.length === 0) && (
                      <Text size="sm" color="dimmed">No fleet information available</Text>
                    )}
                  </Stack>
                </Stack>
              </Paper>

              {/* Certifications & Specializations */}
              <Paper shadow="sm" p="md" radius="md" withBorder>
                <Stack spacing="md">
                  <Title order={5}>Certifications & Specializations</Title>
                  <Divider />
                  {metadata.specialization && (
                    <>
                      <Text size="sm" weight={500}>Specializations:</Text>
                      <Group spacing="xs">
                        <Badge variant="dot">
                          {metadata.specialization}
                        </Badge>
                      </Group>
                    </>
                  )}
                  {metadata.certifications && metadata.certifications.length > 0 && (
                    <>
                      <Text size="sm" weight={500}>Certifications:</Text>
                      <Group spacing="xs">
                        {metadata.certifications.map((cert, index) => (
                          <Badge key={index} variant="outline">{cert}</Badge>
                        ))}
                      </Group>
                    </>
                  )}
                  {(!metadata.specialization && (!metadata.certifications || metadata.certifications.length === 0)) && (
                    <Text size="sm" color="dimmed">No certifications or specializations listed</Text>
                  )}
                </Stack>
              </Paper>
            </SimpleGrid>

            {/* Performance Metrics */}
            <Paper shadow="sm" p="md" radius="md" withBorder>
              <Stack spacing="md">
                <Title order={5}>Performance Metrics</Title>
                <Divider />
                <SimpleGrid cols={4}>
                  <Card withBorder>
                    <Stack align="center" spacing={0}>
                      <Text size="xl" weight={700} color="blue">
                        {carrierData.completedShipments || 0}
                      </Text>
                      <Text size="sm" color="dimmed">Completed Shipments</Text>
                    </Stack>
                  </Card>
                  <Card withBorder>
                    <Stack align="center" spacing={0}>
                      <Text size="xl" weight={700} color="green">
                        {carrierData.completedShipments && carrierData.totalShipments
                          ? ((carrierData.completedShipments / carrierData.totalShipments) * 100).toFixed(1)
                          : '0.0'}%
                      </Text>
                      <Text size="sm" color="dimmed">Completion Rate</Text>
                    </Stack>
                  </Card>
                  <Card withBorder>
                    <Stack align="center" spacing={0}>
                      <Text size="xl" weight={700} color="yellow">
                        {(carrierData.rating || 0).toFixed(1)}
                      </Text>
                      <Text size="sm" color="dimmed">Average Rating</Text>
                    </Stack>
                  </Card>
                  <Card withBorder>
                    <Stack align="center" spacing={0}>
                      <Text size="xl" weight={700} color="grape">
                        {carrierData.totalShipments || 0}
                      </Text>
                      <Text size="sm" color="dimmed">Total Shipments</Text>
                    </Stack>
                  </Card>
                </SimpleGrid>
              </Stack>
            </Paper>
          </Stack>
        )}
      </Modal>
    );
  };

  return (
    <Container size="xl">
      {renderBidsModal()}
      {renderCarrierProfile()}
      <Modal
        opened={showConfirmModal}
        onClose={() => !isAcceptingBid && setShowConfirmModal(false)}
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
              <Button 
                variant="light" 
                onClick={() => setShowConfirmModal(false)}
                disabled={isAcceptingBid}
              >
                Cancel
              </Button>
              <Button 
                color="green" 
                onClick={confirmAcceptBid}
                loading={isAcceptingBid}
              >
                {isAcceptingBid ? 'Accepting Bid...' : 'Confirm Accept'}
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      <Paper shadow="xs" p="md" mb="xl" withBorder>
        <Group position="apart">
          <Group>
        <Button 
          variant="light" 
          leftIcon={<IconArrowLeft size={16} />}
          onClick={handleBack}
        >
              Back to Shipments
        </Button>
            <Title order={3}>Shipment Details</Title>
          </Group>
        <Group>
          {bids.length > 0 && !acceptedBid && (
            <Button
              variant="filled"
              leftIcon={<IconListDetails size={16} />}
              onClick={openBidsModal}
            >
              View All Bids ({bids.length})
            </Button>
          )}
          <Button
            color="red"
            variant="outline"
            leftIcon={<IconTrash size={16} />}
            onClick={() => setShowCancelModal(true)}
            disabled={shipmentData.isCompleted || shipmentData.dispatched}
          >
            Cancel Shipment
          </Button>
        </Group>
      </Group>
      </Paper>

      <Grid>
        <Grid.Col span={acceptedBid ? 9 : 12}>
          <Stack spacing="xl">
          <Paper shadow="sm" p="md" withBorder>
            <Title order={3} mb="md">Shipment Status Timeline</Title>
            <Timeline bulletSize={24} active={activeSteps}>
              <Timeline.Item title="Request Pending" bullet={<IconClock size={24} />}>
                <Text color="dimmed" size="sm">Your request is currently pending, awaiting processing.</Text>
              </Timeline.Item>

              <Timeline.Item title="Document Verification" bullet={<IconFileCheck size={24} />}>
                <Text color="dimmed" size="sm">The shipment documents are being verified.</Text>
              </Timeline.Item>

              <Timeline.Item title="Dispatched" bullet={<IconTruck size={24} />}>
                <Text color="dimmed" size="sm">Your shipment has been dispatched and is on its way.</Text>
              </Timeline.Item>

              <Timeline.Item title="Delivery" bullet={<IconPackage size={24} />}>
                <Text color="dimmed" size="sm">Your shipment is now delivered to the destination.</Text>
              </Timeline.Item>
            </Timeline>
          </Paper>

          <Tabs defaultValue="Details">
              <Tabs.List grow>
              <Tabs.Tab value="Details" leftSection={<IconListDetails style={iconStyle} />}>
                Shipment Details
              </Tabs.Tab>
              <Tabs.Tab value="Images" leftSection={<IconPhoto style={iconStyle} />}>
                Images
              </Tabs.Tab>
              <Tabs.Tab value="Documents" leftSection={<IconFile style={iconStyle} />}>
                Documents
              </Tabs.Tab>
            </Tabs.List>

              <Space h="md" />

            <Tabs.Panel value="Details">
              {renderShipmentDetails()}
            </Tabs.Panel>

            <Tabs.Panel value="Images">
  <SimpleGrid cols={3} spacing="md">
    {shipmentData.products && shipmentData.products.some(product => product.productImages?.length > 0) ? (
      shipmentData.products.map((product, productIndex) => 
        product.productImages?.map((imageUrl, imageIndex) => (
          <Card key={`${productIndex}-${imageIndex}`} shadow="sm" padding="xs" radius="md" withBorder>
            <Card.Section>
              <Image
                src={imageUrl}
                height={200}
                alt={`${product.productName} image ${imageIndex + 1}`}
                fit="cover"
              />
            </Card.Section>
            <Text size="sm" color="dimmed" mt="xs">
              {product.productName} - Image {imageIndex + 1}
            </Text>
          </Card>
        ))
      ).flat()
    ) : (
      <Paper p="xl" withBorder style={{ gridColumn: '1 / -1' }}>
        <Flex direction="column" align="center" gap="md">
          <IconPhoto size={48} color="gray" />
          <Text size="lg" color="dimmed">No images available for any products in this shipment.</Text>
        </Flex>
      </Paper>
    )}
  </SimpleGrid>
</Tabs.Panel>

            <Tabs.Panel value="Documents">
                {renderDocumentsTab()}
            </Tabs.Panel>
          </Tabs>
          </Stack>
        </Grid.Col>

        {(acceptedBid || bids.length > 0) && (
          <Grid.Col span={acceptedBid ? 3 : 12}>
            {acceptedBid ? renderAcceptedBidCard() : (
              <Stack spacing="xl">
            <Paper shadow="sm" p="md" withBorder>
                  <Stack spacing="md">
                    <Group position="apart" align="flex-start">
                      <Title order={4}>Bid Management</Title>
                      <Select
                        label="Preferred Currency"
                        value={preferredCurrency}
                        onChange={setPreferredCurrency}
                        data={CURRENCIES}
                        size="sm"
                        style={{ width: 160 }}
                      />
                  </Group>
                    <Divider />
                    {renderBidsTable()}
              </Stack>
            </Paper>

            <Paper shadow="sm" p="md" withBorder>
                <Stack spacing="md">
                    <Title order={4}>Shipment Actions</Title>
                    <Divider />
                          <Button
                      color="red" 
                      leftIcon={<IconTruck size={16} />}
                      variant="outline"
                            fullWidth
                            onClick={() => setShowCancelModal(true)}
                            disabled={shipmentData.isCompleted || shipmentData.dispatched}
                          >
                      Cancel Shipment
                          </Button>
                    <Alert 
                              variant="light"
                      color="red" 
                      radius="md" 
                      title="Important Note" 
                      icon={<IconInfoCircle size={16} />}
                    >
                      Cancelling a shipment may not be refundable. Please review our cancellation policy.
                    </Alert>
                      </Stack>
                    </Paper>
                </Stack>
              )}
          </Grid.Col>
        )}
      </Grid>

      {/* Document Upload Modal */}
      <Modal
        opened={uploadModalOpened}
        onClose={closeUploadModal}
        title={<Text size="lg" weight={500}>Upload Document</Text>}
      >
              <Stack spacing="md">
          <Text size="sm" color="dimmed">
            Please select a {uploadType ? DOCUMENT_TYPES.find(d => d.value === uploadType)?.label.toLowerCase() : 'document'} to upload.
            Only PDF and Word documents are allowed (max 10MB).
          </Text>

          <FileButton
            accept=".pdf,.doc,.docx"
            onChange={handleFileUpload}
            disabled={isUploading}
          >
            {(props) => (
              <Button
                {...props}
                loading={isUploading}
                leftIcon={<IconUpload size={16} />}
                fullWidth
              >
                Select File
                </Button>
            )}
          </FileButton>

          {Object.entries(uploadProgress).map(([fileName, progress]) => (
            <Progress
              key={fileName}
              value={progress}
              label={`${Math.round(progress)}%`}
              size="sm"
              radius="xl"
            />
          ))}
        </Stack>
      </Modal>

      {/* Chat Modal */}
      <Modal
        opened={chatOpened}
        onClose={closeChat}
        size="xl"
        padding={0}
        radius="md"
        withCloseButton={false}
      >
        {acceptedBid && user && (
          <Chat
            shipmentId={shipmentData._id}
            currentUser={{
              id: user.id,
              full_name: user.fullName,
              company_name: user.publicMetadata?.companyName,
              image_url: user.imageUrl,
              email: user.primaryEmailAddress?.emailAddress
            }}
            otherUser={{
              id: acceptedBid.carrier._id,
              full_name: acceptedBid.carrier.companyName,
              company_name: acceptedBid.carrier.companyName,
              image_url: carrierStats[acceptedBid.carrier._id]?.clerkProfile?.imageUrl,
              email: acceptedBid.carrier.email
            }}
            onClose={closeChat}
          />
        )}
      </Modal>

      <Modal
        opened={showCancelModal}
        onClose={() => !isCancelling && setShowCancelModal(false)}
        title={<Text size="lg" weight={600} color="red">Cancel Shipment</Text>}
      >
        <Stack spacing="md">
          <Text>Are you sure you want to cancel this shipment? This action cannot be undone.</Text>
          
          <Alert 
            color="red" 
            variant="light"
            title="Warning"
          >
            Cancelling a shipment may have financial implications and affect your seller rating.
          </Alert>

          <Group position="apart" mt="xl">
            <Button 
              variant="subtle" 
              onClick={() => setShowCancelModal(false)}
              disabled={isCancelling}
            >
              Keep Shipment
            </Button>
            <Button 
              color="red" 
              onClick={handleCancelShipment}
              loading={isCancelling}
            >
              {isCancelling ? 'Cancelling...' : 'Yes, Cancel Shipment'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
};

export default ShipmentSellerView;
