import { useState, useEffect, useRef } from 'react';
import { 
  Paper, Stack, ScrollArea, TextInput, Button, Group, 
  Avatar, Text, Badge, Card, ActionIcon, Menu, Loader
} from '@mantine/core';
import { 
  IconSend, IconPhoto, IconDotsVertical, 
  IconDownload, IconTrash, IconCheck, IconX 
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { supabase } from '../components/Supabase';

const Chat = ({ shipmentId, currentUser, otherUser, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const scrollAreaRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    loadMessages();
    subscribeToMessages();
    markMessagesAsRead();
    return () => {
      supabase.removeAllChannels();
    };
  }, [shipmentId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:sender_id (
            id,
            full_name,
            company_name,
            image_url
          )
        `)
        .eq('shipment_id', shipmentId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load messages',
        color: 'red'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`chat:${shipmentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `shipment_id=eq.${shipmentId}`
        },
        async (payload) => {
          // Fetch the complete message with sender information
          const { data: messageWithSender, error } = await supabase
            .from('chat_messages')
            .select(`
              *,
              sender:sender_id (
                id,
                full_name,
                company_name,
                image_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (!error && messageWithSender) {
            setMessages(prev => [...prev, messageWithSender]);
            if (messageWithSender.sender_id !== currentUser.id) {
              markMessageAsRead(messageWithSender.id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markMessagesAsRead = async () => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('shipment_id', shipmentId)
        .eq('sender_id', otherUser.id)
        .eq('is_read', false);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const markMessageAsRead = async (messageId) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setIsSending(true);
      const messageData = {
        shipment_id: shipmentId,
        sender_id: currentUser.id,
        message_type: 'text',
        content: { text: newMessage.trim() },
        created_at: new Date().toISOString(),
        is_read: false
      };

      const { data, error } = await supabase
        .from('chat_messages')
        .insert([messageData])
        .select(`
          *,
          sender:sender_id (
            id,
            full_name,
            company_name,
            image_url
          )
        `)
        .single();

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to send message',
        color: 'red'
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renderMessage = (message) => {
    const isCurrentUser = message.sender_id === currentUser.id;
    const messageUser = isCurrentUser ? currentUser : otherUser;
    const sender = message.sender || messageUser;

    return (
      <Group 
        position={isCurrentUser ? 'right' : 'left'} 
        align="flex-start" 
        spacing="xs"
        noWrap
        key={message.id}
      >
        {!isCurrentUser && (
          <Avatar
            src={sender.image_url}
            radius="xl"
            size="md"
          />
        )}
        
        <Stack spacing={4} style={{ maxWidth: '70%' }}>
          {!isCurrentUser && (
            <Text size="sm" color="dimmed">
              {sender.full_name || sender.company_name}
            </Text>
          )}
          
          <Card 
            p="xs" 
            radius="md"
            style={{
              backgroundColor: isCurrentUser ? '#E3F2FD' : '#F5F5F5',
            }}
          >
            {message.message_type === 'system' ? (
              <Text size="sm" color="dimmed" italic>
                {message.content.text}
              </Text>
            ) : (
              <Text size="sm">{message.content.text}</Text>
            )}
            
            <Text size="xs" color="dimmed" align="right" mt={4}>
              {new Date(message.created_at).toLocaleTimeString()}
              {isCurrentUser && (
                <IconCheck
                  size={14}
                  style={{ 
                    marginLeft: 4,
                    color: message.is_read ? '#4CAF50' : '#9E9E9E'
                  }}
                />
              )}
            </Text>
          </Card>
        </Stack>

        {isCurrentUser && (
          <Avatar
            src={sender.image_url}
            radius="xl"
            size="md"
          />
        )}
      </Group>
    );
  };

  return (
    <Paper radius="md" p="md" style={{ height: '600px' }}>
      <Stack spacing="md" style={{ height: '100%' }}>
        {/* Header */}
        <Group position="apart">
          <Group>
            <Avatar src={otherUser.image_url} radius="xl" />
            <Stack spacing={0}>
              <Text weight={500}>{otherUser.full_name || otherUser.company_name}</Text>
              <Badge size="sm" variant="dot" color="green">Online</Badge>
            </Stack>
          </Group>
          <ActionIcon onClick={onClose}>
            <IconX size={18} />
          </ActionIcon>
        </Group>

        {/* Messages */}
        <ScrollArea 
          style={{ height: '100%', flex: 1 }}
          ref={scrollAreaRef}
        >
          {isLoading ? (
            <Stack align="center" justify="center" style={{ height: '100%' }}>
              <Loader />
            </Stack>
          ) : (
            <Stack spacing="md">
              {messages.map(renderMessage)}
              <div ref={messagesEndRef} />
            </Stack>
          )}
        </ScrollArea>

        {/* Input */}
        <Group align="flex-start" spacing="xs">
          <TextInput
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            style={{ flex: 1 }}
            disabled={isSending}
          />
          <Button
            onClick={sendMessage}
            loading={isSending}
            disabled={!newMessage.trim()}
          >
            <IconSend size={18} />
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
};

export default Chat; 