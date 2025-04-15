/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // Add useNavigate
import { Timeline, Text,  Title, Container, Grid, Flex, Fieldset, TextInput, Modal, Tabs, Button,Breadcrumbs,Space,ScrollArea,Image,RingProgress,Alert, Paper, Badge, SimpleGrid, Card, Group, Avatar, Divider, Stack, Loader } from '@mantine/core'; // Add Stack here
import {  IconPhoto, IconMessageCircle, IconSettings,IconClock,IconFileCheck,IconTruck,IconPackage, IconArrowLeft, IconListDetails, IconFile, IconShip, IconCloud } from '@tabler/icons-react';
import { rem } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {Link} from 'react-router-dom';
import { IconInfoCircle } from '@tabler/icons-react';
import * as ol from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import View from 'ol/View';
import 'ol/ol.css';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { fromLonLat, transform } from 'ol/proj';
import { Style, Stroke, Circle, Fill } from 'ol/style';
import { default as OLText } from 'ol/style/Text';
import Overlay from 'ol/Overlay';
import { notifications } from '@mantine/notifications';

const ShipmentStatus = () => {
  const icon = <IconInfoCircle />;
  const location = useLocation();
  const navigate = useNavigate();
  const shipmentData = location.state?.shipmentData;
  const [activeSteps, setActiveSteps] = useState(0);
  const [opened, { open, close }] = useDisclosure(false);
  const [url, setUrl] = useState(null);
  const iconStyle = { width: rem(12), height: rem(12) };
  const [progressCertificate, setProgressCertificate] = useState(0);
  const [progressInvoice, setProgressInvoice] = useState(0);
  const [progressPackingList, setProgressPackingList] = useState(0);
  const [isVerfied, setisVerfied] = useState(shipmentData.verifiedShipment);
  const [mapModalOpened, { open: openMapModal, close: closeMapModal }] = useDisclosure(false);
  const [vesselNumber, setVesselNumber] = useState('');
  const [mmsiNumber, setMmsiNumber] = useState('');
  const [imoNumber, setImoNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDispatched, setIsDispatched] = useState(false);
  const [hasVesselInfo, setHasVesselInfo] = useState(false);
  const [weatherMapOpened, { open: openWeatherMap, close: closeWeatherMap }] = useDisclosure(false);
  const [weatherInfo, setWeatherInfo] = useState(null);

  // Add new function to check tracking info
  const checkVesselTracking = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tracking/vessel/${shipmentData._id}`);
      const data = await response.json();
      
      if (response.ok && data.tracking) {
        setHasVesselInfo(true);
        setIsDispatched(true);
        setVesselNumber(data.tracking.vesselNumber);
      }
    } catch (error) {
      console.error('Error checking vessel tracking:', error);
    }
  };

  useEffect(() => {
    if (shipmentData?._id) {
      checkVesselTracking();
    }
  }, [shipmentData?._id]);

  const handleBeginJourney = async () => {
    setIsSubmitting(true);
    try {
      if (!mmsiNumber || !imoNumber) {
        throw new Error('Both MMSI and IMO numbers are required');
      }

      // Validate MMSI (9 digits) and IMO (7 digits) formats
      if (!/^\d{9}$/.test(mmsiNumber)) {
        throw new Error('MMSI number must be exactly 9 digits');
      }
      if (!/^\d{7}$/.test(imoNumber)) {
        throw new Error('IMO number must be exactly 7 digits');
      }

      // First update the shipment with vessel numbers
      const updateShipmentResponse = await fetch(`${import.meta.env.VITE_API_URL}/shipments/updateshipment/${shipmentData._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          updatedDoc: {
            mmsiNumber,
            imoNumber,
            dispatched: true
          }
        })
      });

      if (!updateShipmentResponse.ok) {
        throw new Error('Failed to update shipment');
      }

      // Save vessel tracking information
      const vesselTrackingResponse = await fetch(`${import.meta.env.VITE_API_URL}/tracking/savevessel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shipmentId: shipmentData._id,
          userId: shipmentData.carrierId,
          mmsiNumber,
          imoNumber
        })
      });

      if (!vesselTrackingResponse.ok) {
        throw new Error('Failed to save vessel tracking information');
      }

      notifications.show({
        title: 'Journey Started',
        message: `Journey has begun with MMSI: ${mmsiNumber} and IMO: ${imoNumber}`,
        color: 'green'
      });
      
      // Update local state to reflect the changes
      setActiveSteps(prev => Math.max(prev, 3));
      setIsDispatched(true);
      closeMapModal();
    } catch (error) {
      console.error('Error starting journey:', error);
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to start journey',
        color: 'red'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
      setIsDispatched(dispatched);
    }
  }, [shipmentData]);

  useEffect(() => {
    if (weatherMapOpened && shipmentData) {
      // Check if origin and destination have valid coordinates
      const originCoordinates = shipmentData.origin?.coordinates || [0, 0];
      const destinationCoordinates = shipmentData.destination?.coordinates || [0, 0];

      // Convert coordinates to OpenLayers format
      const originCoords = fromLonLat(originCoordinates);
      const destCoords = fromLonLat(destinationCoordinates);

      // Add OpenWeatherMap layers
      const weatherLayer = new TileLayer({
        source: new XYZ({
          url: 'https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=144c61f14efc9c0489394629cbdd96f4',
          attributions: '© OpenWeatherMap'
        }),
        opacity: 0.5
      });

      const windLayer = new TileLayer({
        source: new XYZ({
          url: 'https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=144c61f14efc9c0489394629cbdd96f4',
          attributions: '© OpenWeatherMap'
        }),
        opacity: 0.5
      });

      // Create route feature
      const routeFeature = new Feature({
        geometry: new LineString([originCoords, destCoords])
      });

      const routeStyle = new Style({
        stroke: new Stroke({
          color: '#2ecc71',
          width: 2,
          lineDash: [5, 5]
        })
      });

      routeFeature.setStyle(routeStyle);

      // Create markers for origin and destination
      const originFeature = new Feature({
        geometry: new Point(originCoords)
      });

      const destFeature = new Feature({
        geometry: new Point(destCoords)
      });

      const markerStyle = new Style({
        image: new Circle({
          radius: 6,
          fill: new Fill({ color: '#3498db' }),
          stroke: new Stroke({ color: '#fff', width: 2 })
        })
      });

      originFeature.setStyle(markerStyle);
      destFeature.setStyle(markerStyle);

      // Create vector layer for route and markers
      const vectorLayer = new VectorLayer({
        source: new VectorSource({
          features: [routeFeature, originFeature, destFeature]
        })
      });

      // Base map layer
      const osmLayer = new TileLayer({
        source: new OSM()
      });

      // Initialize map
      const map = new Map({
        target: 'weather-map',
        layers: [osmLayer, weatherLayer, windLayer, vectorLayer],
        view: new View({
          center: originCoords,
          zoom: 5
        })
      });

      // Fetch weather data for the route
      const fetchWeatherData = async () => {
        try {
          // Get weather for the middle point of the route
          const midLat = (originCoordinates[1] + destinationCoordinates[1]) / 2;
          const midLon = (originCoordinates[0] + destinationCoordinates[0]) / 2;

          const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${midLat}&lon=${midLon}&units=metric&appid=144c61f14efc9c0489394629cbdd96f4`
          );
          const data = await response.json();

          if (response.ok) {
            setWeatherInfo({
              temperature: data.main.temp,
              windSpeed: data.wind.speed,
              windDirection: data.wind.deg,
              conditions: data.weather[0].description
            });
          } else {
            throw new Error('Failed to fetch weather data');
          }
        } catch (error) {
          console.error('Error fetching weather data:', error);
          notifications.show({
            title: 'Error',
            message: 'Failed to fetch weather data',
            color: 'red'
          });
        }
      };

      fetchWeatherData();

      // Fit view to show the entire route
      const extent = vectorLayer.getSource().getExtent();
      map.getView().fit(extent, { padding: [50, 50, 50, 50] });

      // Cleanup function
      return () => {
        map.setTarget(undefined);
      };
    }
  }, [weatherMapOpened, shipmentData]);

  if (!shipmentData) {
    return <Text color="red">No shipment data available. Take shipments to make progress</Text>;
  }

  const handlePDF = (url) => {
    setUrl(url);
    console.log(url)
    open(); 
  };

  const handleDocuments = async (url, docType) => {
    try {
      // Show verification in progress notification
      notifications.show({
        id: 'verifying',
        title: 'Verifying Document',
        message: 'Please wait while we verify the document...',
        loading: true,
        autoClose: false
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/google/analyzedoc`, {
        method: 'POST',
        body: JSON.stringify({ imageUrl: url }),
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to verify document');
      }

      const data = await response.json();
      
      // Update progress based on document type
      switch (data.documentType) {
        case 'commercial_invoice':
          setProgressInvoice(100);
          break;
        case 'packing_list':
          setProgressPackingList(100);
          break;
        case 'certificate_of_origin':
          setProgressCertificate(100);
          break;
        default:
          throw new Error('Unknown document type');
      }

      // Close the verifying notification and show success
      notifications.hide('verifying');
      notifications.show({
        title: 'Document Verified',
        message: 'Document has been successfully verified',
        color: 'green'
      });

      // Check if all documents are verified
      if (progressInvoice === 100 && progressPackingList === 100 && progressCertificate === 100) {
        setisVerfied(true);
      }

    } catch (error) {
      console.error('Error verifying document:', error);
      notifications.hide('verifying');
      notifications.show({
        title: 'Verification Failed',
        message: error.message || 'Failed to verify document',
        color: 'red'
      });
    }
  };

  const handleVerified = async () => {
    try {
      notifications.show({
        id: 'updating',
        title: 'Updating Shipment',
        message: 'Please wait while we update the shipment status...',
        loading: true,
        autoClose: false
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/shipments/updateshipment/${shipmentData._id}`, {
        method: 'PUT',
        body: JSON.stringify({ updatedDoc: { verifiedShipment: true }}),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to update shipment status');
      }

      const result = await response.json();
      notifications.hide('updating');
      notifications.show({
        title: 'Success',
        message: 'Shipment has been verified successfully',
        color: 'green'
      });

      // Update the active steps
      setActiveSteps(prev => Math.max(prev, 2));

    } catch (error) {
      console.error('Error updating shipment:', error);
      notifications.hide('updating');
      notifications.show({
        title: 'Update Failed',
        message: error.message || 'Failed to update shipment status',
        color: 'red'
      });
    }
  };

  const renderShipmentDetails = () => {
    const formatLocation = (location) => {
      if (typeof location === 'object') {
        const { name, city, country } = location;
        return `${city}, ${country} (${name})`;
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

    const fields = [
      { label: 'Company Name', value: shipmentData.companyName || '' },
      { label: 'Origin', value: formatLocation(shipmentData.origin) },
      { label: 'Destination', value: formatLocation(shipmentData.destination) },
      { label: 'Total Weight', value: `${shipmentData.totalWeight || 0} kg` },
      { label: 'Estimated Delivery', value: new Date(shipmentData.estimatedDeliveryDate).toLocaleDateString() },
    ];

    // Add product details if available
    if (shipmentData.products && shipmentData.products.length > 0) {
      const product = shipmentData.products[0]; // Display first product for now
      fields.push(
        { label: 'Product Name', value: product.productName || '' },
        { label: 'Category', value: product.category || '' },
        { label: 'Sub Category', value: product.subCategory || '' },
        { label: 'Product Type', value: product.productType || '' },
        { label: 'Weight', value: `${product.weight || 0} kg` },
        { label: 'Quantity', value: product.quantity || 0 },
        { label: 'Price', value: `$${product.price || 0}` },
        { label: 'Dimensions', value: formatDimensions(product.dimensions) },
        { label: 'Handling Instructions', value: product.handlingInstructions || '' }
      );
    }

    return (
      <Grid>
        {fields.map((field, index) => (
          <Grid.Col span={6} key={index}>
            <TextInput
              label={field.label}
              value={field.value}
              readOnly
            />
          </Grid.Col>
        ))}
      </Grid>
    );
  };
  const items = [
    { title: 'Shipments', href: '/dashboard/myshipments' }, 
    { title: 'Shipmentdetails' }, 
  ].map((item, index) => (
    <Link to={item.href} key={index}>
      {item.title}
    </Link>
  ));
  return (
    <Container size="xl">
      <Paper shadow="xs" p="md" mb="xl" withBorder>
        <Group position="apart">
          <Group>
            <Button 
              variant="light" 
              leftIcon={<IconArrowLeft size={16} />}
              onClick={() => navigate(-1)}
            >
              Back to Shipments
            </Button>
            <Title order={3}>Shipment Details</Title>
          </Group>
          <Group position="apart">
            {!isDispatched && !hasVesselInfo && (
              <Button
                variant="filled"
                color="blue"
                onClick={openMapModal}
                leftIcon={<IconTruck size={16} />}
              >
                Begin Journey
              </Button>
            )}
            <Button
              variant="light"
              color="blue"
              onClick={openWeatherMap}
              leftIcon={<IconCloud size={16} />}
            >
              Check Weather Condition
            </Button>
            <Badge size="lg" color={shipmentData.isCompleted ? 'green' : 'blue'}>
              {shipmentData.isCompleted ? 'Completed' : 'In Progress'}
            </Badge>
          </Group>
        </Group>
      </Paper>

      {/* Vessel Details Modal */}
      <Modal
        opened={mapModalOpened}
        onClose={() => {
          closeMapModal();
        }}
        title="Enter Vessel Details"
        size="md"
      >
        <Stack spacing="md">
          <TextInput
            label="MMSI Number"
            placeholder="Enter 9-digit MMSI number"
            required
            value={mmsiNumber}
            onChange={(event) => setMmsiNumber(event.currentTarget.value)}
          />
          
          <TextInput
            label="IMO Number"
            placeholder="Enter 7-digit IMO number"
            required
            value={imoNumber}
            onChange={(event) => setImoNumber(event.currentTarget.value)}
          />
          
          <Group position="right" mt="md">
            <Button color="gray" onClick={closeMapModal}>Cancel</Button>
            <Button 
              color="blue" 
              onClick={handleBeginJourney}
              loading={isSubmitting}
            >
              Begin Journey
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Weather Map Modal */}
      <Modal
        opened={weatherMapOpened}
        onClose={closeWeatherMap}
        size="xl"
        title={<Text size="lg" weight={500}>Weather Conditions</Text>}
      >
        <Stack spacing="md">
          <div id="weather-map" style={{ width: '100%', height: '400px' }} />
          {weatherInfo && (
            <Paper p="md" withBorder>
              <Stack spacing="sm">
                <Text weight={500}>Current Weather Conditions:</Text>
                <SimpleGrid cols={2}>
                  <Group>
                    <Text weight={500}>Temperature:</Text>
                    <Text>{weatherInfo.temperature}°C</Text>
                  </Group>
                  <Group>
                    <Text weight={500}>Wind Speed:</Text>
                    <Text>{weatherInfo.windSpeed} m/s</Text>
                  </Group>
                  <Group>
                    <Text weight={500}>Wind Direction:</Text>
                    <Text>{weatherInfo.windDirection}°</Text>
                  </Group>
                  <Group>
                    <Text weight={500}>Conditions:</Text>
                    <Text>{weatherInfo.conditions}</Text>
                  </Group>
                </SimpleGrid>
              </Stack>
            </Paper>
          )}
          <Alert color="blue" variant="light">
            <Text size="sm">
              Weather data is updated in real-time. The map shows temperature variations and wind patterns across the route.
            </Text>
          </Alert>
        </Stack>
      </Modal>

      <Grid>
        <Grid.Col span={12}>
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
                <Paper p="md" withBorder>
                  {renderShipmentDetails()}
                </Paper>
              </Tabs.Panel>

              <Tabs.Panel value="Images">
                <SimpleGrid cols={3} spacing="md">
                  {shipmentData.products?.some(product => product.productImages?.length > 0) ? (
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
                        <Text size="lg" color="dimmed">No images available for this shipment.</Text>
                      </Flex>
                    </Paper>
                  )}
                </SimpleGrid>
              </Tabs.Panel>

              <Tabs.Panel value="Documents">
                <Stack spacing="xl">
                  {/* Document verification section */}
                  <SimpleGrid cols={3} spacing="lg">
                    {['Certificate of Origin', 'Commercial Invoice', 'Packing List'].map((doc, index) => (
                      <Card key={index} withBorder padding="lg">
                        <Stack spacing="md">
                          <Group position="apart">
                            <Group>
                              <IconFile size={24} />
                              <Text weight={500}>{doc}</Text>
                            </Group>
                            <Badge color={progressCertificate === 100 ? 'green' : 'gray'}>
                              {progressCertificate === 100 ? 'Verified' : 'Pending'}
                            </Badge>
                          </Group>

                          <Group spacing="xs">
                            <Button
                              variant="light"
                              size="sm"
                              onClick={() => handlePDF(shipmentData[doc.toLowerCase().replace(/\s/g, '')])}
                              fullWidth
                            >
                              View Document
                            </Button>
                            {progressCertificate !== 100 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDocuments(shipmentData[doc.toLowerCase().replace(/\s/g, '')])}
                                fullWidth
                              >
                                Verify
                              </Button>
                            )}
                          </Group>
                        </Stack>
                      </Card>
                    ))}
                  </SimpleGrid>
                </Stack>
              </Tabs.Panel>
            </Tabs>
          </Stack>
        </Grid.Col>

        <Grid.Col span={12}>
          <Paper shadow="sm" p="md" withBorder>
            <Stack spacing="md">
              <Title order={4}>Shipment Actions</Title>
              <Divider />
              <Group position="apart">
                <Button
                  color="blue"
                  onClick={handleVerified}
                  disabled={!isVerfied}
                >
                  Verify Documents
                </Button>
                <Button
                  color="yellow"
                  variant="outline"
                >
                  Request Document Reupload
                </Button>
                <Button
                  color="red"
                  variant="outline"
                >
                  Cancel Shipment
                </Button>
              </Group>
              <Alert
                variant="light"
                color="red"
                radius="md"
                title="Important Note"
                icon={<IconInfoCircle size={16} />}
              >
                Cancelling a shipment may affect your rating and future opportunities.
              </Alert>
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>

      <Modal
        opened={opened}
        onClose={close}
        title={<Text size="lg" weight={500}>Document Preview</Text>}
        size="xl"
      >
        <Image src={url} />
      </Modal>
    </Container>
  );
};

export default ShipmentStatus;
