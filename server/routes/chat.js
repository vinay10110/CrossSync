const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Get chat history for a shipment
router.get('/history/:shipmentId', async (req, res) => {
  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('shipment_id', req.params.shipmentId)
      .order('timestamp', { ascending: true });

    if (error) throw error;

    res.json(messages);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ message: 'Failed to fetch chat history' });
  }
});

// Mark messages as read
router.post('/read/:shipmentId', async (req, res) => {
  try {
    const { userId } = req.body;
    
    const { data, error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('shipment_id', req.params.shipmentId)
      .neq('sender_id', userId)
      .eq('read', false);

    if (error) throw error;

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Failed to mark messages as read' });
  }
});

module.exports = router; 