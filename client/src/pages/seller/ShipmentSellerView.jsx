/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  IconClock, IconTruck, IconPackage, IconFileCheck, IconPhoto, 
  IconInfoCircle, IconArrowLeft, IconListDetails, IconStar,
  IconUpload, IconTrash, IconDownload, IconFile, IconCurrencyDollar,
  IconMessage, IconShip, IconEye
} from '@tabler/icons-react';
import { 
  Timeline, Text, Title, Container, Grid, Flex, Fieldset, 
  TextInput, Modal, Tabs, Button, Alert, Image, 
  Space, ScrollArea, Paper, Stack, Group, Badge, 
  Avatar, Tooltip, Table, Card, Progress, FileButton,
  ActionIcon, SimpleGrid, Select, NumberInput, Divider, Box, FileInput
} from '@mantine/core';
import { rem } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useUser } from "@clerk/clerk-react";
import { notifications } from '@mantine/notifications';
import Chat from '../../components/Chat';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import { fromLonLat } from 'ol/proj';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
import Fill from 'ol/style/Fill';
import Circle from 'ol/style/Circle';
import { default as OLText } from 'ol/style/Text';
import Overlay from 'ol/Overlay';
import 'ol/ol.css';
import { supabase } from '../../components/Supabase';

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

const formatLocation = (location) => {
  if (typeof location === 'object') {
    const { name, city, country } = location;
    return [name, city, country].filter(Boolean).join(', ');
  }
  return location || '';
};

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
  const [mapModalOpened, { open: openMapModal, close: closeMapModal }] = useDisclosure(false);
  const [isLoadingTracking, setIsLoadingTracking] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState(null);
  const [vesselCoordinates, setVesselCoordinates] = useState(null);
  const [viewPdfUrl, setViewPdfUrl] = useState(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const connectHathorWallet = async () => {
    try {
      // Check if Hathor Wallet is installed
      if (typeof window.hathorLib === 'undefined') {
        notifications.show({
          title: 'Wallet Not Found',
          message: 'Please install Hathor Wallet extension first',
          color: 'red'
        });
        return;
      }

      // Request wallet connection
      const address = await window.hathorLib.requestAccounts();
      setWalletAddress(address[0]);
      setWalletConnected(true);
      
      notifications.show({
        title: 'Success',
        message: 'Wallet connected successfully',
        color: 'green'
      });
    } catch (error) {
      console.error('Error connecting wallet:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to connect wallet: ' + error.message,
        color: 'red'
      });
    }
  };

  const handlePayment = async () => {
    if (!walletConnected) {
      notifications.show({
        title: 'Error',
        message: 'Please connect your Hathor wallet first',
        color: 'red'
      });
      return;
    }

    try {
      setIsProcessingPayment(true);
      
      // Create payment transaction
      const tx = {
        outputs: [{
          address: acceptedBid.carrier.walletAddress, // Carrier's wallet address
          value: acceptedBid.amount * 100, // Convert to cents
          token: 'HTR' // Hathor's native token
        }]
      };

      // Send transaction
      const txId = await window.hathorLib.sendTransaction(tx);

      notifications.show({
        title: 'Success',
        message: 'Payment completed successfully',
        color: 'green'
      });

      // Update payment status in backend
      await fetch(`${import.meta.env.VITE_API_URL}/shipments/${shipmentData._id}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          txId,
          amount: acceptedBid.amount,
          currency: acceptedBid.currency
        })
      });

    } catch (error) {
      console.error('Payment error:', error);
      notifications.show({
        title: 'Error',
        message: 'Payment failed: ' + error.message,
        color: 'red'
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

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

  const handleGetVesselInfo = async () => {
    try {
      setIsLoadingTracking(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tracking/vessel/${shipmentData._id}`);
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 404) {
          notifications.show({
            title: 'No Tracking Information',
            message: 'This shipment hasn\'t started its journey yet.',
            color: 'yellow'
          });
          return;
        }
        throw new Error(data.message || 'Failed to fetch tracking information');
      }

      // Get vessel info using IMO number from first RapidAPI
      const vesselResponse = await fetch(
        `https://vessel-information-api.p.rapidapi.com/1575/get%2Bcurrent%2Bposition?imoCode=${data.tracking.imoNumber}`, {
          method: 'GET',
          headers: {
            'x-rapidapi-key': '344b6cfffamshb0dac064337b943p180c04jsn6702bb3313d0',
            'x-rapidapi-host': 'vessel-information-api.p.rapidapi.com'
          }
      });

      const vesselData = await vesselResponse.json();
console.log(vesselData)
      // Get position data using MMSI number from second RapidAPI
      const positionResponse = await fetch(`https://vessels1.p.rapidapi.com/vessel/${data.tracking.mmsiNumber}`, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': 'ae8576435emsh4e91980d90a2549p1b2994jsn4a574609c054',
          'x-rapidapi-host': 'vessels1.p.rapidapi.com'
        }
      });

      const positionData = await positionResponse.json();
      
      setTrackingInfo({
        ...data.tracking,
        // Vessel info from first API (IMO)
        position_received: vesselData.success ? vesselData.data.position_received : null,
        area: vesselData.success ? vesselData.data.area : null,
        current_port: vesselData.success ? vesselData.data.current_port : null,
        navigational_status: vesselData.success ? vesselData.data.navigational_status : null,
        speed_course: vesselData.success ? vesselData.data.speed_course : null,
        ais_source: vesselData.success ? vesselData.data.ais_source : null,
        // Position data from second API (MMSI)
        mmsi: positionData.mmsi,
        imo: data.tracking.imoNumber,
        vessel_name: positionData.name,
        callSign: positionData.callSign,
        vessel_type: positionData.type,
        draught: positionData.draught,
        latitude: positionData.positions?.[0]?.latitude,
        longitude: positionData.positions?.[0]?.longitude,
        heading: positionData.positions?.[0]?.heading,
        destination: positionData.destination,
        eta: positionData.eta,
        lastUpdate: positionData.positions?.[0]?.timestamp
      });
      
      openMapModal();
    } catch (error) {
      console.error('Error fetching vessel info:', error);
      notifications.show({
        title: 'Error',
        message: error.message,
        color: 'red'
      });
    } finally {
      setIsLoadingTracking(false);
    }
  };

  useEffect(() => {
    if (mapModalOpened && trackingInfo) {
      // Create vessel marker feature
      const vesselFeature = new Feature({
        geometry: new Point(fromLonLat([
          trackingInfo.longitude,
          trackingInfo.latitude
        ]))
      });

      // Create vessel marker style with label
      const vesselStyle = new Style({
        image: new Circle({
          radius: 6,
          fill: new Fill({ color: '#3498db' }),
          stroke: new Stroke({ color: '#fff', width: 2 })
        }),
        text: new OLText({
          text: `${trackingInfo.vessel_name}\n${trackingInfo.speed_course || ''}`,
          offsetY: -15,
          fill: new Fill({ color: '#000' }),
          stroke: new Stroke({ color: '#fff', width: 3 })
        })
      });

      vesselFeature.setStyle(vesselStyle);

      // Create route feature with coordinates
      const routeCoords = [
        fromLonLat([shipmentData.origin.coordinates[0], shipmentData.origin.coordinates[1]]),
        fromLonLat([trackingInfo.longitude, trackingInfo.latitude]),
        fromLonLat([shipmentData.destination.coordinates[0], shipmentData.destination.coordinates[1]])
      ];

      const routeFeature = new Feature({
        geometry: new LineString(routeCoords)
      });

      const routeStyle = new Style({
        stroke: new Stroke({
          color: '#2ecc71',
          width: 2,
          lineDash: [5, 5]
        })
      });

      routeFeature.setStyle(routeStyle);

      // Create vector source and layer for vessel and route
      const vectorSource = new VectorSource({
        features: [vesselFeature, routeFeature]
      });

      const vectorLayer = new VectorLayer({
        source: vectorSource,
        zIndex: 2
      });

      // Base OSM layer
      const osmLayer = new TileLayer({
        source: new OSM(),
        zIndex: 0
      });

      // Weather layers
      const weatherLayer = new TileLayer({
        source: new XYZ({
          url: 'https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=144c61f14efc9c0489394629cbdd96f4',
          attributions: '© OpenWeatherMap'
        }),
        opacity: 0.5,
        zIndex: 1
      });

      const windLayer = new TileLayer({
        source: new XYZ({
          url: 'https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=144c61f14efc9c0489394629cbdd96f4',
          attributions: '© OpenWeatherMap'
        }),
        opacity: 0.5,
        zIndex: 1
      });

      // Create weather info overlay
      const weatherInfoElement = document.createElement('div');
      weatherInfoElement.className = 'weather-info-overlay';
      weatherInfoElement.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
      weatherInfoElement.style.padding = '10px';
      weatherInfoElement.style.borderRadius = '4px';

      const weatherOverlay = new Overlay({
        element: weatherInfoElement,
        position: fromLonLat([trackingInfo.longitude, trackingInfo.latitude]),
        positioning: 'top-left',
        offset: [10, 10]
      });

      // Initialize map with all layers
      const map = new Map({
        target: 'map',
        layers: [osmLayer, weatherLayer, windLayer, vectorLayer],
        view: new View({
          center: fromLonLat([trackingInfo.longitude, trackingInfo.latitude]),
          zoom: 5
        })
      });

      // Add weather overlay
      map.addOverlay(weatherOverlay);

      // Update weather info
      const updateWeatherInfo = async () => {
        try {
          const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${trackingInfo.latitude}&lon=${trackingInfo.longitude}&units=metric&appid=144c61f14efc9c0489394629cbdd96f4`
          );
          const data = await response.json();
          weatherInfoElement.innerHTML = `
            <strong>Weather at Vessel Location</strong><br>
            Temperature: ${data.main.temp}°C<br>
            Conditions: ${data.weather[0].description}<br>
            Wind: ${data.wind.speed} m/s, ${data.wind.deg}°
          `;
        } catch (error) {
          console.error('Error fetching weather data:', error);
        }
      };

      updateWeatherInfo();

      // Fit view to show all features
      const extent = vectorSource.getExtent();
      map.getView().fit(extent, { padding: [50, 50, 50, 50] });

      // Cleanup function
      return () => {
        if (map) {
          map.setTarget(undefined);
        }
      };
    }
  }, [mapModalOpened, trackingInfo, shipmentData]);

  useEffect(() => {
    if (shipmentData?.origin?.coordinates && shipmentData?.destination?.coordinates) {
      // Convert coordinates to OpenLayers format
      const originCoords = fromLonLat([shipmentData.origin.coordinates[0], shipmentData.origin.coordinates[1]]);
      const destCoords = fromLonLat([shipmentData.destination.coordinates[0], shipmentData.destination.coordinates[1]]);

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
        }),
        text: new OLText({
          text: (feature) => feature === originFeature ? 'Origin' : 'Destination',
          offsetY: -15,
          fill: new Fill({ color: '#000' }),
          stroke: new Stroke({ color: '#fff', width: 3 })
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
        target: 'map',
        layers: [osmLayer, vectorLayer],
        view: new View({
          center: originCoords,
          zoom: 5
        })
      });

      // Fit view to show the entire route
      const extent = vectorLayer.getSource().getExtent();
      map.getView().fit(extent, { padding: [50, 50, 50, 50] });

      // Cleanup function
      return () => {
        map.setTarget(undefined);
      };
    }
  }, [shipmentData]);

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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/shipments/${shipmentData._id}/documents`);
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      
      const { documents } = await response.json();
      const documentMap = {};
      documents.forEach(doc => {
        documentMap[doc.documentType] = doc.documentUrl;
      });
      setDocuments(documentMap);
    } catch (error) {
      console.error('Error fetching documents:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to fetch documents',
        color: 'red'
      });
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    setIsUploading(true);

    try {
      // Validate file size
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size should not exceed 10MB');
      }

      // Create unique filename
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._]/g, '_');
      const uniqueFileName = `${timestamp}_${sanitizedName}`;
      const filePath = `documents/${shipmentData._id}/${uniqueFileName}`;

      // Upload file with explicit content type
      const { data, error: uploadError } = await supabase.storage
        .from('filesStore')
        .upload(filePath, file, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: false,
          onUploadProgress: (progress) => {
            const percent = (progress.loaded / progress.total) * 100;
            setUploadProgress(prev => ({ ...prev, [uniqueFileName]: percent }));
          }
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        if (uploadError.message?.includes('row-level security')) {
          throw new Error('Storage permission denied. Please contact administrator to enable file uploads.');
        }
        throw new Error(uploadError.message || 'Failed to upload file');
      }

      // Get public URL
      const { data: urlData, error: urlError } = await supabase.storage
        .from('filesStore')
        .getPublicUrl(filePath);

      if (urlError) {
        console.error('URL error:', urlError);
        throw new Error(urlError.message || 'Failed to get public URL');
      }

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL');
      }

      // Save document reference in MongoDB
      const response = await fetch(`${import.meta.env.VITE_API_URL}/shipments/${shipmentData._id}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentUrl: urlData.publicUrl,
          documentType: uploadType, // Use the uploadType state variable here
          clerkId: user.user.id
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to save document reference');
      }

      if (responseData.isShipmentVerified) {
        notifications.show({
          title: 'Success',
          message: 'All required documents have been uploaded and verified',
          color: 'green'
        });
      }

      notifications.show({
        title: 'Success',
        message: 'Document uploaded successfully',
        color: 'green'
      });

      fetchDocuments();
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

  const handleFileDelete = async (documentType) => {
    try {
      const confirmed = window.confirm('Are you sure you want to delete this document?');
      if (!confirmed) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/documents/delete/${shipmentData._id}/${documentType}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: 'Document deleted successfully',
          color: 'green'
        });
        // Update the documents state to remove the deleted document
        setDocuments(prev => ({
          ...prev,
          [documentType]: null
        }));
      } else {
        throw new Error('Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to delete document',
        color: 'red'
      });
    }
  };

  const handleFileDownload = async (fileName) => {
    try {
      const { data, error } = await supabase
        .storage
        .from('filesStore')
        .download(`documents/${shipmentData._id}/${fileName}`);

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

  const handlePDF = async (documentUrl) => {
    setViewPdfUrl(documentUrl);
    setIsPdfModalOpen(true);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const renderShipmentDetails = () => {
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
        <Title order={4}>Required Documents</Title>

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
                        leftIcon={<IconEye size={16} />}
                        onClick={() => handlePDF(documents[docType.value])}
                        fullWidth
                      >
                        View
                      </Button>
                      <ActionIcon
                        color="red"
                        variant="light"
                        onClick={() => handleFileDelete(docType.value)}
                        title="Delete Document"
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
          <Stack spacing={2}>
            <Text size="lg" weight={500}>{acceptedBid.carrier?.companyName}</Text>
            <Text size="sm" color="dimmed">{acceptedBid.carrier?.email}</Text>
          </Stack>
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
          <Button
            variant="filled"
            leftIcon={<IconCurrencyDollar size={16} />}
            onClick={handlePayment}
            color="green"
            loading={isProcessingPayment}
          >
            {isProcessingPayment ? 'Processing Payment...' : 'Make Payment'}
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
            <Button
              variant="light"
              color="blue"
              onClick={handleGetVesselInfo}
              loading={isLoadingTracking}
              leftIcon={<IconShip size={16} />}
            >
              Track Shipment
            </Button>
            {bids.length > 0 && !acceptedBid && (
              <Button
                variant="filled"
                leftIcon={<IconListDetails size={16} />}
                onClick={openBidsModal}
              >
                View All Bids ({bids.length})
              </Button>
            )}
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
                {shipmentData.products?.some(product => product.productImages?.length > 0) ? (
                  shipmentData.products.map((product, productIndex) => 
                    product.productImages?.map((imageUrl, imageIndex) => (
                      <Card key={`${productIndex}-${imageIndex}`} shadow="sm" padding="xs" radius="md" withBorder>
                        <Card.Section>
                          <Image
                            src={imageUrl}
                            height={200}
                            alt={`${product.productName} - Image ${imageIndex + 1}`}
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

      {/* Map Modal */}
      <Modal
        opened={mapModalOpened}
        onClose={closeMapModal}
        size="xl"
        title={<Text size="lg" weight={500}>Vessel Tracking</Text>}
      >
        <Stack spacing="md">
          {trackingInfo ? (
            <>
              <Paper p="md" withBorder>
                <Group position="apart">
                  <Group>
                    <Text weight={500}>Vessel Number:</Text>
                    <Text>{trackingInfo.vesselNumber}</Text>
                  </Group>
                  <Group>
                    <Text weight={500}>Status:</Text>
                    <Badge color="blue">{trackingInfo.status}</Badge>
                  </Group>
                </Group>
              </Paper>

              <Paper p="md" withBorder>
                <Stack spacing="sm">
                  <Text weight={500}>Vessel Information:</Text>
                  <SimpleGrid cols={2} spacing="md">
                    <Group>
                      <Text size="sm" weight={500}>Last Position Update:</Text>
                      <Text size="sm">{trackingInfo.position_received || 'N/A'}</Text>
                    </Group>
                    <Group>
                      <Text size="sm" weight={500}>Current Area:</Text>
                      <Text size="sm">{trackingInfo.area || 'N/A'}</Text>
                    </Group>
                    <Group>
                      <Text size="sm" weight={500}>Current Port:</Text>
                      <Text size="sm">{trackingInfo.current_port || 'N/A'}</Text>
                    </Group>
                    <Group>
                      <Text size="sm" weight={500}>Navigation Status:</Text>
                      <Text size="sm">{trackingInfo.navigational_status || 'N/A'}</Text>
                    </Group>
                    <Group>
                      <Text size="sm" weight={500}>Speed & Course:</Text>
                      <Text size="sm">{trackingInfo.speed_course || 'N/A'}</Text>
                    </Group>
                    <Group>
                      <Text size="sm" weight={500}>AIS Source:</Text>
                      <Text size="sm">{trackingInfo.ais_source || 'N/A'}</Text>
                    </Group>
                  </SimpleGrid>
                </Stack>
              </Paper>

              <Paper p="md" withBorder>
                <Stack spacing="sm">
                  <Text weight={500}>Vessel Position Details:</Text>
                  <SimpleGrid cols={2} spacing="md">
                    <Group>
                      <Text size="sm" weight={500}>MMSI:</Text>
                      <Text size="sm">{trackingInfo.mmsi || 'N/A'}</Text>
                    </Group>
                    <Group>
                      <Text size="sm" weight={500}>Call Sign:</Text>
                      <Text size="sm">{trackingInfo.callSign || 'N/A'}</Text>
                    </Group>
                    <Group>
                      <Text size="sm" weight={500}>Vessel Name:</Text>
                      <Text size="sm">{trackingInfo.vessel_name || 'N/A'}</Text>
                    </Group>
                    <Group>
                      <Text size="sm" weight={500}>Vessel Type:</Text>
                      <Text size="sm">{trackingInfo.vessel_type || 'N/A'}</Text>
                    </Group>
                    <Group>
                      <Text size="sm" weight={500}>Draught:</Text>
                      <Text size="sm">{trackingInfo.draught || 'N/A'} m</Text>
                    </Group>
                    <Group>
                      <Text size="sm" weight={500}>Last Update:</Text>
                      <Text size="sm">{trackingInfo.lastUpdate ? new Date(trackingInfo.lastUpdate).toLocaleString() : 'N/A'}</Text>
                    </Group>
                    <Group>
                      <Text size="sm" weight={500}>Current Position:</Text>
                      <Text size="sm">
                        {trackingInfo.latitude && trackingInfo.longitude 
                          ? `${trackingInfo.latitude}°, ${trackingInfo.longitude}°` 
                          : 'N/A'}
                      </Text>
                    </Group>
                    <Group>
                      <Text size="sm" weight={500}>Heading:</Text>
                      <Text size="sm">{trackingInfo.heading !== undefined ? `${trackingInfo.heading}°` : 'N/A'}</Text>
                    </Group>
                    <Group>
                      <Text size="sm" weight={500}>Destination:</Text>
                      <Text size="sm">{trackingInfo.destination || 'N/A'}</Text>
                    </Group>
                    <Group>
                      <Text size="sm" weight={500}>ETA:</Text>
                      <Text size="sm">{trackingInfo.eta || 'N/A'}</Text>
                    </Group>
                  </SimpleGrid>
                </Stack>
              </Paper>

              <Paper p="md" withBorder>
                <Stack spacing="sm">
                  <Text weight={500}>Route Information:</Text>
                  <Group position="apart">
                    <Group>
                      <IconTruck size={16} />
                      <Text>Origin: {formatLocation(shipmentData?.origin)}</Text>
                    </Group>
                    <Group>
                      <IconTruck size={16} />
                      <Text>Destination: {formatLocation(shipmentData?.destination)}</Text>
                    </Group>
                  </Group>
                </Stack>
              </Paper>

              <div id="map" style={{ width: '100%', height: '400px', marginTop: '1rem' }} />

              <Alert color="blue" title="Tracking Status" variant="light">
                <Stack spacing="xs">
                  <Text>Current vessel location being tracked.</Text>
                  <Text size="sm" color="dimmed">
                    Real-time updates will be available as the vessel transmits new position data.
                  </Text>
                </Stack>
              </Alert>
            </>
          ) : (
            <Alert color="yellow" title="Loading Tracking Information">
              <Text>Retrieving vessel tracking information...</Text>
            </Alert>
          )}
        </Stack>
      </Modal>

      {/* PDF Viewer Modal */}
      <Modal
        opened={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        size="xl"
        title="Document Viewer"
      >
        {viewPdfUrl && (
          <iframe
            src={viewPdfUrl}
            style={{ width: '100%', height: '80vh' }}
            frameBorder="0"
          />
        )}
      </Modal>
    </Container>
  );
};

export default ShipmentSellerView;
