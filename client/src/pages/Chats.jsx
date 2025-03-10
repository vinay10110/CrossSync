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
  Button,
  Paper,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAt } from '@tabler/icons-react';

import { useUser } from '@clerk/clerk-react';
import { 
  Chat, 
  Channel, 
  MessageList, 
  MessageInput, 
  Window 
} from 'stream-chat-react';
import { StreamChat } from 'stream-chat';
import 'stream-chat-react/dist/css/v2/index.css';
import { supabase } from '../components/Supabase';

const STREAM_API_KEY = '3n72h7jzrate';

const Chats = () => {
  const { user } = useUser();
  const [client, setClient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [channel, setChannel] = useState(null);
  const [acceptedShipments, setAcceptedShipments] = useState([]);

  useEffect(() => {
    const initChat = async () => {
      if (!user) return;

      const chatClient = StreamChat.getInstance(STREAM_API_KEY);

      try {
        await chatClient.connectUser(
          {
            id: user.id,
            name: user.fullName,
            image: user.imageUrl,
          },
          chatClient.devToken(user.id)
        );

        setClient(chatClient);
      } catch (error) {
        console.error('Failed to connect to Stream Chat:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initChat();

    return () => {
      if (client) client.disconnectUser();
    };
  }, [user]);

  useEffect(() => {
    const fetchAcceptedShipments = async () => {
      if (!user?.id) return;

      try {
        // Fetch shipments where the logged-in user is either seller or carrier
        const { data: shipments, error } = await supabase
          .from('shipments')
          .select(`
            id,
            product_name,
            carrier_id,
            seller_id,
            carrier:carrier_id (
              id,
              full_name,
              email,
              image_url
            ),
            seller:seller_id (
              id,
              full_name,
              email,
              image_url
            )
          `)
          .or(`seller_id.eq.${user.id},carrier_id.eq.${user.id}`)
          .eq('status', 'accepted');

        if (error) throw error;
        setAcceptedShipments(shipments);

        // Create channels for each accepted shipment
        if (client) {
          for (const shipment of shipments) {
            const otherUser = shipment.seller_id === user.id ? shipment.carrier : shipment.seller;
            const channelId = `shipment-${shipment.id}`;

            const channel = client.channel('messaging', channelId, {
              members: [user.id, otherUser.id],
              name: `Shipment: ${shipment.product_name}`,
              shipment_id: shipment.id
            });

            await channel.watch();
          }
        }
      } catch (error) {
        console.error('Error fetching shipments:', error);
        notifications.show({
          title: 'Error',
          message: 'Failed to load shipments',
          color: 'red'
        });
      }
    };

    if (client) {
      fetchAcceptedShipments();
    }
  }, [user, client]);

  if (!client || isLoading) {
    return (
      <Flex h="calc(100vh - 120px)" align="center" justify="center">
        <LoadingOverlay visible={true} />
      </Flex>
    );
  }

  return (
    <Flex h="calc(100vh - 120px)" pos="relative">
      <Chat client={client} theme="messaging light">
        <Box w={300} h="100%" style={{ borderRight: '1px solid #eee' }}>
          <Stack p="md" spacing="xs">
            {acceptedShipments.map((shipment) => {
              const otherUser = shipment.seller_id === user.id ? shipment.carrier : shipment.seller;
              const channelId = `shipment-${shipment.id}`;
              
              return (
                <UnstyledButton
                  key={shipment.id}
                  onClick={() => {
                    const channel = client.channel('messaging', channelId);
                    channel.watch().then(() => {
                      setChannel(channel);
                      setSelectedUser(otherUser);
                    });
                  }}
                  p="sm"
                  style={{
                    backgroundColor: channel?.id === channelId ? '#f8f9fa' : 'transparent',
                    borderRadius: '8px',
                    width: '100%'
                  }}
                >
                  <Group>
                    <Avatar
                      src={otherUser.image_url}
                      radius="xl"
                      size="md"
                    />
                    <Box>
                      <Text size="sm" weight={500}>
                        {otherUser.full_name}
                      </Text>
                      <Text size="xs" color="dimmed">
                        {shipment.product_name}
                      </Text>
                    </Box>
                  </Group>
                </UnstyledButton>
              );
            })}
          </Stack>
        </Box>

        <Box style={{ flex: 1 }}>
          {channel ? (
            <Channel channel={channel}>
              <Window>
                <MessageList />
                <MessageInput />
              </Window>
            </Channel>
          ) : (
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
        </Box>
      </Chat>
    </Flex>
  );
};

export default Chats;