const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

app.use(cors());
app.use(express.json());

// Import routes
const shipmentsRouter = require('./routes/shipments');
const carriersRouter = require('./routes/carriers');
const chatRouter = require('./routes/chat');

// Use routes
app.use('/api/shipments', shipmentsRouter);
app.use('/api/carriers', carriersRouter);
app.use('/api/chat', chatRouter);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a chat room
  socket.on('join_room', (shipmentId) => {
    socket.join(shipmentId);
    console.log(`User ${socket.id} joined room ${shipmentId}`);
  });

  // Handle new message
  socket.on('send_message', async (data) => {
    const { shipmentId, senderId, message, senderRole } = data;
    
    try {
      // Store message in Supabase
      const { data: chatMessage, error } = await supabase
        .from('messages')
        .insert([{
          shipment_id: shipmentId,
          sender_id: senderId,
          sender_role: senderRole,
          message: message,
          timestamp: new Date().toISOString()
        }])
        .select();

      if (error) throw error;

      // Broadcast message to room
      io.to(shipmentId).emit('receive_message', chatMessage[0]);
    } catch (error) {
      console.error('Error storing message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    socket.to(data.shipmentId).emit('user_typing', {
      userId: data.userId,
      isTyping: data.isTyping
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 