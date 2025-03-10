import { useState, useEffect } from 'react';
import {
  Stack,
  Text,
  Avatar,
  Group,
  Box,
  ScrollArea,
  Paper,
  Container,
  TextInput,
  ActionIcon,
  Flex,
  Divider,
  Badge,
  UnstyledButton,
  LoadingOverlay
} from '@mantine/core';
import { IconSearch, IconMessage } from '@tabler/icons-react';
import { useUser } from '@clerk/clerk-react';
import { notifications } from '@mantine/notifications';
import { supabase } from '../components/Supabase';
import ShipmentChat from '../components/ShipmentChat';

const Chats = () => {
  const { user } = useUser();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all chats where user is either seller or carrier
  useEffect(() => {
    const fetchChats = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        console.log('Fetching chats for user:', user.id);

        // First ensure user profile exists
        const { data: existingProfile } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!existingProfile) {
          // Create new profile if doesn't exist
          const { data: newProfile, error: createError } = await supabase
            .from('users')
            .insert({
              id: user.id,
              email: user.emailAddresses[0].emailAddress,
              full_name: user.fullName,
              company_name: user.publicMetadata.companyName || 'Unknown Company',
              image_url: user.imageUrl,
              role: user.publicMetadata.role || 'seller',
              created_at: new Date().toISOString()
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating user profile:', createError);
            // Continue with fetching chats even if profile creation fails
          }
        }

        // Get shipments where user is seller
        const { data: sellerShipments, error: sellerError } = await supabase
          .from('shipments')
          .select(`
            id,
            product_name,
            status,
            created_at,
            carrier:carrier_id (
              id,
              full_name,
              company_name,
              email,
              image_url
            ),
            seller:seller_id (
              id,
              full_name,
              company_name,
              email,
              image_url
            ),
            chat_messages (
              id,
              content,
              message_type,
              sender_id,
              created_at
            )
          `)
          .eq('seller_id', user.id)
          .eq('status', 'accepted')
          .order('created_at', { ascending: false });

        if (sellerError) {
          console.error('Error fetching seller shipments:', sellerError);
          // Continue with carrier shipments even if seller shipments fail
        }

        // Get shipments where user is carrier
        const { data: carrierShipments, error: carrierError } = await supabase
          .from('shipments')
          .select(`
            id,
            product_name,
            status,
            created_at,
            carrier:carrier_id (
              id,
              full_name,
              company_name,
              email,
              image_url
            ),
            seller:seller_id (
              id,
              full_name,
              company_name,
              email,
              image_url
            ),
            chat_messages (
              id,
              content,
              message_type,
              sender_id,
              created_at
            )
          `)
          .eq('carrier_id', user.id)
          .eq('status', 'accepted')
          .order('created_at', { ascending: false });

        if (carrierError) {
          console.error('Error fetching carrier shipments:', carrierError);
          // Continue with processing even if carrier shipments fail
        }

        console.log('Seller shipments:', sellerShipments);
        console.log('Carrier shipments:', carrierShipments);

        const allChats = [
          ...(sellerShipments || []),
          ...(carrierShipments || [])
        ].map(chat => ({
          ...chat,
          // Sort messages by date and get the latest
          chat_messages: chat.chat_messages?.sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
          ) || [],
          // Get the latest message
          last_message: chat.chat_messages?.sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
          )[0] || null,
          // Determine the other party based on user role
          other_party: user.id === chat.seller?.id ? chat.carrier : chat.seller
        })).filter(chat => chat.other_party !== null); // Filter out chats where other party is missing

        console.log('All chats:', allChats);
        setChats(allChats);
      } catch (error) {
        console.error('Error in chat fetching process:', error);
        // Don't show error notification for profile issues
        if (!error.message.includes('user profile')) {
          notifications.show({
            title: 'Error',
            message: 'Failed to load chats. Please try again later.',
            color: 'red'
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchChats();
  }, [user]);

  // Subscribe to new messages
  useEffect(() => {
    if (!user?.id) return;

    const subscription = supabase
      .channel('chat_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, (payload) => {
        console.log('New message received:', payload);
        // Refresh chats when new message arrives
        fetchChats();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const getOtherParty = (chat) => {
    if (!chat || !user) return null;
    return user.id === chat.seller.id ? chat.carrier : chat.seller;
  };

  const getLastMessage = (chat) => {
    if (!chat.last_message) {
      return 'No messages yet';
    }
    return chat.last_message.content.text || 'Shared a file';
  };

  const getLastMessageTime = (chat) => {
    if (!chat.last_message) {
      return '';
    }
    return new Date(chat.last_message.created_at).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const filteredChats = chats.filter(chat => {
    const otherParty = getOtherParty(chat);
    if (!otherParty) return false;
    
    return otherParty.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           chat.product_name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <Flex h="calc(100vh - 120px)" pos="relative">
      <LoadingOverlay visible={isLoading} />
      
      {/* Left Sidebar - Chat List */}
      <Box w={300} h="100%" style={{ borderRight: '1px solid #eee' }}>
        <Paper p="md" radius={0} h="100%">
          <Stack spacing="md">
            <TextInput
              placeholder="Search chats..."
              icon={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
            />
            
            <ScrollArea h="calc(100vh - 190px)">
              <Stack spacing="xs">
                {filteredChats.length > 0 ? (
                  filteredChats.map((chat) => {
                    const otherParty = getOtherParty(chat);
                    if (!otherParty) return null;

                    return (
                      <UnstyledButton
                        key={chat.id}
                        onClick={() => setSelectedChat(chat)}
                        p="sm"
                        style={{
                          backgroundColor: selectedChat?.id === chat.id ? '#f8f9fa' : 'transparent',
                          borderRadius: '8px',
                          width: '100%'
                        }}
                      >
                        <Group align="flex-start" spacing="sm">
                          <Avatar
                            src={otherParty.image_url}
                            radius="xl"
                            size="md"
                          />
                          <Box style={{ flex: 1 }}>
                            <Group position="apart" mb={4}>
                              <Text size="sm" weight={500} lineClamp={1}>
                                {otherParty.company_name}
                              </Text>
                              <Text size="xs" color="dimmed">
                                {getLastMessageTime(chat)}
                              </Text>
                            </Group>
                            <Text size="xs" color="dimmed" lineClamp={1}>
                              {chat.product_name}
                            </Text>
                            <Text size="xs" lineClamp={1}>
                              {getLastMessage(chat)}
                            </Text>
                          </Box>
                        </Group>
                      </UnstyledButton>
                    );
                  })
                ) : (
                  <Flex 
                    direction="column" 
                    align="center" 
                    justify="center" 
                    h="100%"
                    py="xl"
                  >
                    <IconMessage size={48} color="gray" opacity={0.3} />
                    <Text align="center" color="dimmed" size="sm" mt="md">
                      {isLoading ? 'Loading chats...' : 'No chats found'}
                    </Text>
                  </Flex>
                )}
              </Stack>
            </ScrollArea>
          </Stack>
        </Paper>
      </Box>

      {/* Right Side - Chat Area */}
      <Box style={{ flex: 1 }}>
        {selectedChat ? (
          <Flex direction="column" h="100%">
            <Paper p="md" radius={0} style={{ borderBottom: '1px solid #eee' }}>
              <Group>
                <Avatar
                  src={getOtherParty(selectedChat)?.image_url}
                  radius="xl"
                  size="md"
                />
                <Box>
                  <Text weight={500}>
                    {getOtherParty(selectedChat)?.company_name}
                  </Text>
                  <Text size="xs" color="dimmed">
                    {selectedChat.product_name}
                  </Text>
                </Box>
              </Group>
            </Paper>
            <Box style={{ flex: 1 }}>
              <ShipmentChat
                shipmentId={selectedChat.id}
                carrierId={selectedChat.carrier.id}
                sellerId={selectedChat.seller.id}
              />
            </Box>
          </Flex>
        ) : (
          <Flex 
            direction="column" 
            align="center" 
            justify="center" 
            h="100%"
          >
            <IconMessage size={64} color="gray" opacity={0.3} />
            <Text align="center" color="dimmed" size="lg" mt="md">
              Select a chat to start messaging
            </Text>
          </Flex>
        )}
      </Box>
    </Flex>
  );
};

export default Chats; 