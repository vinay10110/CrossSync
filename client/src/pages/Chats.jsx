import { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  LoadingOverlay,
  Avatar,
  Text,
  Group,
  Stack,
  UnstyledButton,
  Paper,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import Talk from 'talkjs';
import { useUser } from '@clerk/clerk-react';

const Chats = () => {
  const { user } = useUser();
  const [talkLoaded, setTalkLoaded] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [chatPartners, setChatPartners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Talk.ready.then(() => setTalkLoaded(true));
  }, []);

  useEffect(() => {
    const initializeUser = async () => {
      if (!talkLoaded || !user) return;

      try {
        const currentUser = new Talk.User({
          id: user.id,
          name: user.fullName || 'Anonymous',
          email: user.primaryEmailAddress?.emailAddress,
          photoUrl: user.imageUrl,
          role: user.publicMetadata?.role || 'default'
        });

        const session = new Talk.Session({
          appId: 'tjUgirCV',
          me: currentUser
        });

        window.talkSession = session;

        // Fetch chat partners based on user's role and shipments
        await fetchChatPartners();
      } catch (error) {
        console.error('Error initializing TalkJS:', error);
        notifications.show({
          title: 'Error',
          message: 'Failed to initialize chat',
          color: 'red'
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeUser();
  }, [talkLoaded, user]);

  const fetchChatPartners = async () => {
    if (!user?.id) return;

    try {
      const isSeller = user.publicMetadata?.role === 'seller';
      let endpoint;

      if (isSeller) {
        // Get shipments where seller has accepted bids
        endpoint = `${import.meta.env.VITE_API_URL}/shipments/user/${user.primaryEmailAddress?.emailAddress}`;
      } else {
        // Get accepted bids for carrier
        endpoint = `${import.meta.env.VITE_API_URL}/shipments/accepted-bids`;
      }

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': user.id
        }
      });

      if (!response.ok) throw new Error('Failed to fetch chat partners');
      const data = await response.json();

      // Format chat partners based on user role
      const partners = [];
      if (isSeller) {
        // For sellers, get carriers from accepted bids
        const shipments = data.shipments || [];
        shipments.forEach(shipment => {
          const acceptedBid = shipment.bids?.find(bid => bid.status === 'accepted');
          if (acceptedBid) {
            partners.push({
              id: acceptedBid.carrier.userId || acceptedBid.carrier._id,
              name: acceptedBid.carrier.companyName,
              email: acceptedBid.carrier.email,
              shipmentId: shipment._id,
              productName: shipment.products?.[0]?.productName || 'Shipment'
            });
          }
        });
      } else {
        // For carriers, get sellers from accepted bids
        const acceptedBids = data.acceptedBids || [];
        acceptedBids.forEach(bid => {
          partners.push({
            id: bid.seller.userId || bid.seller._id,
            name: bid.seller.companyName,
            email: bid.seller.email,
            shipmentId: bid.shipment._id,
            productName: bid.shipment.products?.[0]?.productName || 'Shipment'
          });
        });
      }

      setChatPartners(partners);
    } catch (error) {
      console.error('Error fetching chat partners:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load chat partners',
        color: 'red'
      });
    }
  };

  const startChat = async (partner) => {
    if (!window.talkSession || !partner) return;

    try {
      const chatPartner = new Talk.User({
        id: partner.id,
        name: partner.name || 'Anonymous',
        email: partner.email,
        role: user.publicMetadata?.role === 'seller' ? 'carrier' : 'seller'
      });

      const conversationId = [user.id, partner.id].sort().join('_');
      
      const conversation = window.talkSession.getOrCreateConversation(conversationId);
      conversation.setParticipant(window.talkSession.me);
      conversation.setParticipant(chatPartner);
      
      conversation.setAttributes({
        shipping_id: partner.shipmentId,
        product_name: partner.productName
      });

      const chatbox = window.talkSession.createChatbox(conversation);
      chatbox.mount(document.getElementById('talkjs-container'));
      
      setSelectedUser(partner);
    } catch (error) {
      console.error('Error starting chat:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to start chat',
        color: 'red'
      });
    }
  };

  if (isLoading || !talkLoaded) {
    return (
      <Flex h="calc(100vh - 120px)" align="center" justify="center">
        <LoadingOverlay visible={true} />
      </Flex>
    );
  }

  return (
    <Flex h="calc(100vh - 120px)" pos="relative">
      <Box w={300} h="100%" style={{ borderRight: '1px solid #eee' }}>
        <Stack p="md" spacing="xs">
          {chatPartners.map((partner) => (
            <UnstyledButton
              key={partner.id}
              onClick={() => startChat(partner)}
              p="sm"
              style={{
                backgroundColor: selectedUser?.id === partner.id ? '#f8f9fa' : 'transparent',
                borderRadius: '8px',
                width: '100%'
              }}
            >
              <Group>
                <Avatar
                  radius="xl"
                  size="md"
                />
                <Box>
                  <Text size="sm" weight={500}>
                    {partner.name}
                  </Text>
                  <Text size="xs" color="dimmed">
                    {partner.productName}
                  </Text>
                </Box>
              </Group>
            </UnstyledButton>
          ))}
          {chatPartners.length === 0 && (
            <Text align="center" color="dimmed" p="md">
              No chat partners available. Accept bids or get your bids accepted to start chatting.
            </Text>
          )}
        </Stack>
      </Box>

      <Box style={{ flex: 1 }}>
        <div 
          id="talkjs-container" 
          style={{ 
            height: '100%', 
            width: '100%' 
          }}
        >
          {!selectedUser && (
            <Flex 
              align="center" 
              justify="center" 
              h="100%"
              direction="column"
            >
              <Text size="xl" color="dimmed">
                Select a user to start chatting
              </Text>
            </Flex>
          )}
        </div>
      </Box>
    </Flex>
  );
};

export default Chats;