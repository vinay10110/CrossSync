/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from 'react';
import { 
  Paper, Text, Stack, Group, TextInput, Button, 
  ScrollArea, Avatar,  Tabs, FileButton,
  Card, Progress, ActionIcon, Modal
} from '@mantine/core';
import { 
   IconUpload, IconDownload, 
  IconFile, IconTrash, IconPhoto, IconMessage, IconSend
} from '@tabler/icons-react';

import { notifications } from '@mantine/notifications';
import { supabase } from './Supabase';

const ShipmentChat = ({ shipmentId, carrierId, sellerId }) => {
  const { user } = useUser();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [documents, setDocuments] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const messagesEndRef = useRef(null);

  // Subscribe to new messages
  useEffect(() => {
    // Fetch existing messages
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select(`
            id,
            content,
            message_type,
            created_at,
            sender:sender_id (
              id,
              full_name,
              company_name,
              image_url
            )
          `)
          .eq('shipment_id', shipmentId)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching messages:', error);
          return; // Don't show error notification, just log it
        }
        
        setMessages(data || []);
      } catch (error) {
        console.error('Error fetching messages:', error);
        // Don't show error notification, just log it
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const subscription = supabase
      .channel(`chat:${shipmentId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `shipment_id=eq.${shipmentId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [shipmentId]);

  // Fetch documents
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const { data, error } = await supabase
          .storage
          .from('shipment-documents')
          .list(`${shipmentId}/`);

        if (error) {
          console.error('Error fetching documents:', error);
          return; // Don't show error notification, just log it
        }
        setDocuments(data || []);
      } catch (error) {
        console.error('Error fetching documents:', error);
        // Don't show error notification, just log it
      }
    };

    fetchDocuments();
  }, [shipmentId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const message = {
        shipment_id: shipmentId,
        sender_id: user.id,
        message_type: 'text',
        content: { 
          text: newMessage.trim() 
        },
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('chat_messages')
        .insert(message);

      if (error) {
        console.error('Error sending message:', error);
        notifications.show({
          title: 'Error',
          message: 'Failed to send message',
          color: 'red'
        });
        return;
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to send message',
        color: 'red'
      });
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    try {
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${shipmentId}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('shipment-documents')
        .upload(filePath, file, {
          onUploadProgress: (progress) => {
            const percent = (progress.loaded / progress.total) * 100;
            setUploadProgress(prev => ({ ...prev, [fileName]: percent }));
          },
        });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        notifications.show({
          title: 'Error',
          message: 'Failed to upload file',
          color: 'red'
        });
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('shipment-documents')
        .getPublicUrl(filePath);

      // Send file message
      const message = {
        shipment_id: shipmentId,
        sender_id: user.id,
        message_type: 'file',
        content: {
          name: fileName,
          url: publicUrl,
          size: file.size,
          type: file.type
        },
        created_at: new Date().toISOString()
      };

      const { error: messageError } = await supabase
        .from('chat_messages')
        .insert(message);

      if (messageError) {
        console.error('Error sending file message:', messageError);
        notifications.show({
          title: 'Error',
          message: 'Failed to send file message',
          color: 'red'
        });
        return;
      }

      // Update documents list
      setDocuments(prev => [...prev, { name: fileName, url: publicUrl, type: file.type }]);
      setUploadProgress(prev => ({ ...prev, [fileName]: 100 }));

      notifications.show({
        title: 'Success',
        message: 'File uploaded successfully',
        color: 'green'
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to upload file',
        color: 'red'
      });
    }
  };

  const handleFileDelete = async (fileName) => {
    try {
      const { error } = await supabase.storage
        .from('shipment-documents')
        .remove([`${shipmentId}/${fileName}`]);

      if (error) throw error;

      setDocuments(prev => prev.filter(doc => doc.name !== fileName));
      
      notifications.show({
        title: 'Success',
        message: 'File deleted successfully',
        color: 'green'
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to delete file',
        color: 'red'
      });
    }
  };

  const isImage = (fileType) => fileType.startsWith('image/');

  const renderMessage = (message) => {
    const isCurrentUser = message.sender.id === user.id;
    const isSystemMessage = message.message_type === 'system';

    if (isSystemMessage) {
      return (
        <Paper 
          key={message.id} 
          p="xs" 
          bg="gray.1" 
          style={{ 
            width: 'fit-content', 
            margin: '1rem auto',
            textAlign: 'center' 
          }}
        >
          <Text size="sm" color="dimmed">{message.content.text}</Text>
          {message.content.bid_amount && (
            <Text size="xs" color="dimmed">
              Bid Amount: {message.content.bid_amount} {message.content.currency}
            </Text>
          )}
        </Paper>
      );
    }

    return (
      <Group 
        key={message.id} 
        position={isCurrentUser ? 'right' : 'left'} 
        align="flex-start"
        spacing="xs"
        noWrap
      >
        {!isCurrentUser && (
          <Avatar src={message.sender.image_url} radius="xl" size="md" />
        )}
        <Stack spacing={4}>
          {!isCurrentUser && (
            <Text size="xs" color="dimmed">
              {message.sender.company_name}
            </Text>
          )}
          <Paper 
            p="xs" 
            bg={isCurrentUser ? 'blue.5' : 'gray.1'}
            style={{ 
              borderRadius: '8px',
              maxWidth: '70%' 
            }}
          >
            {message.message_type === 'text' ? (
              <Text 
                color={isCurrentUser ? 'white' : 'black'}
                style={{ wordBreak: 'break-word' }}
              >
                {message.content.text}
              </Text>
            ) : (
              <Group spacing="xs">
                <IconFile size={20} />
                <Text 
                  color={isCurrentUser ? 'white' : 'black'}
                  style={{ wordBreak: 'break-word' }}
                >
                  {message.content.name}
                </Text>
                <Button 
                  variant="subtle" 
                  size="xs"
                  onClick={() => handleFileDownload(message.content.name)}
                >
                  Download
                </Button>
              </Group>
            )}
          </Paper>
          <Text size="xs" color="dimmed" align={isCurrentUser ? 'right' : 'left'}>
            {new Date(message.created_at).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </Stack>
        {isCurrentUser && (
          <Avatar src={message.sender.image_url} radius="xl" size="md" />
        )}
      </Group>
    );
  };

  return (
    <>
      <Modal
        opened={showImagePreview}
        onClose={() => setShowImagePreview(false)}
        size="xl"
        padding={0}
      >
        <img 
          src={selectedImage} 
          alt="Preview" 
          style={{ width: '100%', height: 'auto' }} 
        />
      </Modal>

      <Tabs defaultValue="chat">
        <Tabs.List>
          <Tabs.Tab value="chat" leftSection={<IconMessage size={16} />}>
            Chat
          </Tabs.Tab>
          <Tabs.Tab value="documents" leftSection={<IconFile size={16} />}>
            Documents
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="chat">
          <Paper shadow="sm" p="md" style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
            <ScrollArea style={{ flex: 1, marginBottom: '1rem' }}>
              <Stack spacing="md">
                {messages.map(renderMessage)}
                <div ref={messagesEndRef} />
              </Stack>
            </ScrollArea>

            <Group position="apart" spacing="xs">
              <FileButton
                onChange={handleFileUpload}
                accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
              >
                {(props) => (
                  <ActionIcon {...props} size="lg" variant="light">
                    <IconUpload size={20} />
                  </ActionIcon>
                )}
              </FileButton>
              <TextInput
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                style={{ flex: 1 }}
                rightSection={
                  <ActionIcon 
                    size="lg" 
                    color="blue" 
                    variant="filled"
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                  >
                    <IconSend size={20} />
                  </ActionIcon>
                }
              />
            </Group>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="documents">
          <Paper shadow="sm" p="md">
            <Group position="apart" mb="md">
              <Text weight={500}>Shared Documents</Text>
              <FileButton onChange={handleFileUpload}>
                {(props) => (
                  <Button {...props} leftIcon={<IconUpload size={16} />}>
                    Upload Document
                  </Button>
                )}
              </FileButton>
            </Group>

            <Stack spacing="md">
              {documents.map((doc, index) => (
                <Card key={index} p="sm" withBorder>
                  <Group position="apart">
                    <Group>
                      {isImage(doc.type) ? (
                        <IconPhoto size={24} />
                      ) : (
                        <IconFile size={24} />
                      )}
                      <div>
                        <Text size="sm" weight={500}>{doc.name}</Text>
                        <Text size="xs" color="dimmed">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </Text>
                      </div>
                    </Group>
                    <Group spacing="xs">
                      {isImage(doc.type) && (
                        <ActionIcon
                          variant="light"
                          color="blue"
                          onClick={() => {
                            setSelectedImage(doc.url);
                            setShowImagePreview(true);
                          }}
                        >
                          <IconPhoto size={16} />
                        </ActionIcon>
                      )}
                      <Button 
                        variant="subtle" 
                        size="xs"
                        component="a"
                        href={doc.url}
                        target="_blank"
                        leftIcon={<IconDownload size={14} />}
                      >
                        Download
                      </Button>
                      <ActionIcon
                        variant="light"
                        color="red"
                        onClick={() => handleFileDelete(doc.name)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Group>
                  {uploadProgress[doc.name] && uploadProgress[doc.name] < 100 && (
                    <Progress 
                      value={uploadProgress[doc.name]} 
                      mt="sm"
                      size="sm"
                      color="blue"
                    />
                  )}
                </Card>
              ))}
              {documents.length === 0 && (
                <Text color="dimmed" align="center">No documents shared yet</Text>
              )}
            </Stack>
          </Paper>
        </Tabs.Panel>
      </Tabs>
    </>
  );
};

export default ShipmentChat; 