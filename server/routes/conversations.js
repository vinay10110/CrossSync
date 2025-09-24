const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Shipments = require('../models/Shipments');

// Create a new conversation (called when bid is accepted)
router.post('/create', async (req, res) => {
  try {
    const { sellerId, carrierId, shipmentId } = req.body;

    // Validate that both users exist
    const seller = await User.findById(sellerId);
    const carrier = await User.findById(carrierId);
    
    if (!seller || !carrier) {
      return res.status(404).json({ error: 'One or both users not found' });
    }

    // Check if conversation already exists between these participants for this shipment
    const existingConversation = await Conversation.findOne({
      participants: { $all: [sellerId, carrierId] },
      shipmentId: shipmentId
    });

    if (existingConversation) {
      return res.status(200).json({ 
        message: 'Conversation already exists',
        conversation: existingConversation 
      });
    }

    // Create new conversation
    const conversation = new Conversation({
      participants: [sellerId, carrierId],
      shipmentId: shipmentId,
      lastMessage: 'Conversation started - bid accepted',
      lastMessageAt: new Date()
    });

    const savedConversation = await conversation.save();

    // Populate the conversation with user details
    const populatedConversation = await Conversation.findById(savedConversation._id)
      .populate('participants', 'email firstName lastName companyName role imageUrl')
      .populate('shipmentId', 'products origin destination');

    res.status(201).json({
      message: 'Conversation created successfully',
      conversation: populatedConversation
    });

  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Get all conversations for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Find all conversations where user is a participant
    const conversations = await Conversation.find({
      participants: userId
    })
    .populate('participants', 'email firstName lastName companyName role imageUrl')
    .populate('shipmentId', 'products origin destination')
    .sort({ lastMessageAt: -1 }); // Sort by most recent

    // Format conversations for frontend
    const formattedConversations = conversations.map(conv => {
      // Get the other participant (not the current user)
      const otherParticipant = conv.participants.find(p => p._id.toString() !== userId);
      
      return {
        _id: conv._id,
        otherParticipant: otherParticipant,
        shipment: conv.shipmentId,
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
        createdAt: conv.createdAt
      };
    });

    res.json({ conversations: formattedConversations });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get a specific conversation with messages
router.get('/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId)
      .populate('participants', 'email firstName lastName companyName role imageUrl')
      .populate('shipmentId', 'products origin destination');

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Get messages for this conversation
    const messages = await Message.find({ conversationId })
      .populate('sender', 'email firstName lastName imageUrl')
      .sort({ createdAt: 1 }); // Sort chronologically

    res.json({
      conversation,
      messages
    });

  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// Send a message in a conversation
router.post('/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { senderId, text, imageUrl } = req.body;

    // Validate conversation exists and user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (!conversation.participants.includes(senderId)) {
      return res.status(403).json({ error: 'User not authorized for this conversation' });
    }

    // Create message
    const message = new Message({
      conversationId,
      sender: senderId,
      text,
      imageUrl,
      seenBy: [senderId] // Mark as seen by sender
    });

    const savedMessage = await message.save();

    // Update conversation's last message
    conversation.lastMessage = text || 'Image sent';
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Populate message with sender details
    const populatedMessage = await Message.findById(savedMessage._id)
      .populate('sender', 'email firstName lastName imageUrl');

    res.status(201).json({
      message: 'Message sent successfully',
      messageData: populatedMessage
    });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Mark messages as seen
router.put('/:conversationId/messages/seen', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;

    // Mark all messages in conversation as seen by this user
    await Message.updateMany(
      { 
        conversationId,
        sender: { $ne: userId }, // Don't mark own messages as seen
        seenBy: { $ne: userId } // Only update if not already seen
      },
      { 
        $addToSet: { seenBy: userId }
      }
    );

    res.json({ message: 'Messages marked as seen' });

  } catch (error) {
    console.error('Error marking messages as seen:', error);
    res.status(500).json({ error: 'Failed to mark messages as seen' });
  }
});

module.exports = router;
