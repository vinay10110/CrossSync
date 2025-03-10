import { useState, useEffect } from 'react';
import { 
  Container, Paper, Stack, Group, Avatar, Text, 
  Badge, Card, Loader, Grid, Title, Divider,
  ActionIcon, TextInput, Button
} from '@mantine/core';
import { useUser } from "@clerk/clerk-react";
import { IconMessage, IconChevronRight, IconTruck, IconSend } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';

const Messages = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const [activeChats, setActiveChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate('/auth/signin');
      return;
    }

    if (user) {
      loadActiveChats();
    }
  }, [user, isLoaded, isSignedIn, navigate]);

  const loadActiveChats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/shipments/accepted-bids`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch accepted bids');
      }

      const data = await response.json();
      console.log('Loaded active chats:', data);
      setActiveChats(data.acceptedBids || []);
    } catch (error) {
      console.error('Error loading active chats:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load chats. Please try again.',
        color: 'red'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getOtherUser = (bid) => {
    const isCarrier = user.publicMetadata?.role === 'carrier';
    return isCarrier ? bid.seller : bid.carrier;
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    // TODO: Implement WebSocket message sending
    console.log('Sending message:', {
      chatId: selectedChat._id,
      senderId: user.id,
      message: message.trim(),
      timestamp: new Date()
    });

    setMessage('');
  };

  const renderChatList = () => (
    <Stack spacing="md">
      {activeChats.map((bid) => {
        const otherUser = getOtherUser(bid);
        const isSelected = selectedChat?._id === bid._id;
        
        return (
          <Card 
            key={bid._id} 
            withBorder 
            p="md"
            onClick={() => setSelectedChat(bid)}
            style={{ 
              cursor: 'pointer',
              backgroundColor: isSelected ? '#F8F9FA' : 'white',
              transition: 'background-color 0.2s ease'
            }}
          >
            <Group position="apart" noWrap>
              <Group noWrap spacing="md">
                <Avatar
                  src={otherUser?.clerkProfile?.imageUrl}
                  radius="xl"
                  size="lg"
                />
                <Stack spacing={4}>
                  <Group spacing="xs">
                    <Text weight={500}>
                      {otherUser?.clerkProfile?.firstName} {otherUser?.clerkProfile?.lastName}
                    </Text>
                    <Badge size="sm" variant="dot" color="green">Active</Badge>
                  </Group>
                  <Group spacing="xs" noWrap>
                    <IconTruck size={14} />
                    <Text size="sm" color="dimmed">
                      {bid.shipment?.productName || 'Shipment'}
                    </Text>
                  </Group>
                  <Text size="xs" color="dimmed">
                    Amount: {bid.amount} {bid.currency}
                  </Text>
                </Stack>
              </Group>
              <ActionIcon 
                variant="light" 
                color="blue" 
                size="lg"
                style={{ visibility: isSelected ? 'visible' : 'hidden' }}
              >
                <IconChevronRight size={20} />
              </ActionIcon>
            </Group>
          </Card>
        );
      })}
      {isLoading ? (
        <Paper p="xl" withBorder>
          <Stack align="center" spacing="md">
            <Loader size="md" />
            <Text size="sm" color="dimmed">Loading chats...</Text>
          </Stack>
        </Paper>
      ) : activeChats.length === 0 && (
        <Paper p="xl" withBorder>
          <Stack align="center" spacing="md">
            <IconMessage size={48} color="gray" />
            <Text size="lg" color="dimmed" align="center">
              No accepted bids
            </Text>
            <Text size="sm" color="dimmed" align="center">
              {user.publicMetadata?.role === 'carrier' 
                ? 'Your bids will appear here once accepted by sellers'
                : 'Accept a bid to start chatting with carriers'}
            </Text>
          </Stack>
        </Paper>
      )}
    </Stack>
  );

  const renderChatMessages = () => (
    <Stack spacing={0} style={{ height: '600px' }}>
      <Paper p="md" withBorder>
        <Group position="apart">
          <Group>
            <Avatar
              src={getOtherUser(selectedChat)?.clerkProfile?.imageUrl}
              size="lg"
              radius="xl"
            />
            <Stack spacing={2}>
              <Text weight={500}>
                {getOtherUser(selectedChat)?.clerkProfile?.firstName} {getOtherUser(selectedChat)?.clerkProfile?.lastName}
              </Text>
              <Text size="sm" color="dimmed">Shipment: {selectedChat.shipment?.productName}</Text>
            </Stack>
          </Group>
          <Badge color="green">Bid Accepted</Badge>
        </Group>
      </Paper>

      <Paper 
        p="md" 
        withBorder 
        style={{ 
          flex: 1,
          overflowY: 'auto',
          marginTop: -1,
          marginBottom: -1,
          display: 'flex',
          flexDirection: 'column-reverse'
        }}
      >
        {/* Messages will be displayed here */}
        <Text color="dimmed" align="center" size="sm">
          Messages will appear here
        </Text>
      </Paper>

      <Paper p="md" withBorder style={{ marginTop: -1 }}>
        <Group spacing="md" align="flex-start">
          <TextInput
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.currentTarget.value)}
            style={{ flex: 1 }}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            rightIcon={<IconSend size={16} />}
          >
            Send
          </Button>
        </Group>
      </Paper>
    </Stack>
  );

  return (
    <Container size="xl" py="xl">
      <Grid>
        <Grid.Col span={4}>
          <Paper withBorder p="md">
            <Title order={4} mb="xl">Messages</Title>
            {renderChatList()}
          </Paper>
        </Grid.Col>
        <Grid.Col span={8}>
          {selectedChat ? (
            renderChatMessages()
          ) : (
            <Paper p="xl" withBorder h="600px">
              <Stack align="center" spacing="md" justify="center" h="100%">
                <IconMessage size={48} color="gray" />
                <Text size="lg" color="dimmed">Select a chat to start messaging</Text>
              </Stack>
            </Paper>
          )}
        </Grid.Col>
      </Grid>
    </Container>
  );
};

export default Messages; 