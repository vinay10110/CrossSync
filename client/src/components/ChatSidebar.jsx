import { useState, useEffect } from 'react';
import {
  Drawer,
  ActionIcon,
  Stack,
  Text,
  Paper,
  Avatar,
  Group,
  Badge,
  UnstyledButton,
  Box,
  ScrollArea,
  TextInput,
  Button,
  Modal
} from '@mantine/core';
import {
  IconMessage,
  IconX,
  IconSend,
  IconUpload,
  IconChevronLeft
} from '@tabler/icons-react';
import { useUser } from '@clerk/clerk-react';
import { notifications } from '@mantine/notifications';
import { supabase } from './Supabase';
import ShipmentChat from './ShipmentChat';

const ChatSidebar = () => {
  const { user } = useUser();
  const [opened, setOpened] = useState(false);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [miniChatOpened, setMiniChatOpened] = useState(false);

  // Fetch all chats where user is either seller or carrier
  useEffect(() => {
    const fetchChats = async () => {
      try {
        // Get shipments where user is seller
        const { data: sellerShipments, error: sellerError } = await supabase
          .from('shipments')
          .select(`
            id,
            productName,
            carrier:carrier_id (
              id,
              companyName,
              email,
              imageUrl
            ),
            seller:seller_id (
              id,
              companyName,
              email,
              imageUrl
            ),
            status,
            last_message:chat_messages (
              content,
              created_at,
              sender_id
            )
          `)
          .eq('seller_id', user.id)
          .eq('status', 'accepted')
          .order('created_at', { ascending: false });

        // Get shipments where user is carrier
        const { data: carrierShipments, error: carrierError } = await supabase
          .from('shipments')
          .select(`
            id,
            productName,
            carrier:carrier_id (
              id,
              companyName,
              email,
              imageUrl
            ),
            seller:seller_id (
              id,
              companyName,
              email,
              imageUrl
            ),
            status,
            last_message:chat_messages (
              content,
              created_at,
              sender_id
            )
          `)
          .eq('carrier_id', user.id)
          .eq('status', 'accepted')
          .order('created_at', { ascending: false });

        if (sellerError || carrierError) throw sellerError || carrierError;

        const allChats = [...(sellerShipments || []), ...(carrierShipments || [])];
        setChats(allChats);
      } catch (error) {
        console.error('Error fetching chats:', error);
        notifications.show({
          title: 'Error',
          message: 'Failed to fetch chats',
          color: 'red'
        });
      }
    };

    if (user) {
      fetchChats();
    }
  }, [user]);

  // Subscribe to new messages
  useEffect(() => {
    const subscription = supabase
      .channel('chat_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, () => {
        // Refresh chats when new message arrives
        if (user) {
          fetchChats();
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const handleChatClick = (chat) => {
    setSelectedChat(chat);
    setMiniChatOpened(true);
  };

  const getOtherParty = (chat) => {
    if (user.id === chat.seller.id) {
      return chat.carrier;
    }
    return chat.seller;
  };

  const getLastMessage = (chat) => {
    if (!chat.last_message || chat.last_message.length === 0) {
      return 'No messages yet';
    }
    const lastMessage = chat.last_message[0];
    if (lastMessage.content.text) {
      return lastMessage.content.text;
    }
    return 'Shared a file';
  };

  const getLastMessageTime = (chat) => {
    if (!chat.last_message || chat.last_message.length === 0) {
      return '';
    }
    return new Date(chat.last_message[0].created_at).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <>
      <ActionIcon
        variant="filled"
        color="blue"
        size="xl"
        radius="xl"
        onClick={() => setOpened(true)}
        sx={{ position: 'fixed', bottom: 20, left: 20 }}
      >
        <IconMessage size={24} />
      </ActionIcon>

      <Drawer
        opened={opened}
        onClose={() => setOpened(false)}
        title="Chats"
        padding="md"
        size="md"
        position="left"
      >
        <ScrollArea h="calc(100vh - 100px)">
          <Stack spacing="md">
            {chats.map((chat) => (
              <UnstyledButton
                key={chat.id}
                onClick={() => handleChatClick(chat)}
                sx={(theme) => ({
                  padding: theme.spacing.sm,
                  borderRadius: theme.radius.md,
                  '&:hover': {
                    backgroundColor: theme.colorScheme === 'dark' 
                      ? theme.colors.dark[6] 
                      : theme.colors.gray[0]
                  }
                })}
              >
                <Group>
                  <Avatar
                    src={getOtherParty(chat).imageUrl}
                    radius="xl"
                    size="lg"
                  />
                  <Box sx={{ flex: 1 }}>
                    <Group position="apart">
                      <Text weight={500}>{getOtherParty(chat).companyName}</Text>
                      <Text size="xs" color="dimmed">
                        {getLastMessageTime(chat)}
                      </Text>
                    </Group>
                    <Text size="sm" color="dimmed" lineClamp={1}>
                      {chat.productName}
                    </Text>
                    <Text size="sm" lineClamp={1}>
                      {getLastMessage(chat)}
                    </Text>
                  </Box>
                </Group>
              </UnstyledButton>
            ))}
          </Stack>
        </ScrollArea>
      </Drawer>

      <Modal
        opened={miniChatOpened}
        onClose={() => setMiniChatOpened(false)}
        title={
          <Group>
            <ActionIcon onClick={() => setMiniChatOpened(false)}>
              <IconChevronLeft size={20} />
            </ActionIcon>
            {selectedChat && (
              <Group>
                <Avatar
                  src={getOtherParty(selectedChat).imageUrl}
                  radius="xl"
                />
                <div>
                  <Text weight={500}>
                    {getOtherParty(selectedChat).companyName}
                  </Text>
                  <Text size="xs" color="dimmed">
                    {selectedChat.productName}
                  </Text>
                </div>
              </Group>
            )}
          </Group>
        }
        size="lg"
        styles={{
          header: { marginBottom: 0 },
          body: { padding: 0 }
        }}
      >
        {selectedChat && (
          <ShipmentChat
            shipmentId={selectedChat.id}
            carrierId={selectedChat.carrier.id}
            sellerId={selectedChat.seller.id}
          />
        )}
      </Modal>
    </>
  );
};

export default ChatSidebar; 