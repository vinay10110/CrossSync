const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const shipmentRoute = require('./routes/shipments');
const userRoute = require('./routes/users');
const googleRoute = require('./routes/googlevision');
const sellerRoute = require('./routes/seller');
const currencyRoute = require('./routes/currency');
const trackingRoute = require('./routes/tracking');
const conversationRoute = require('./routes/conversations');
const carrierRoute = require('./routes/carriers');

const app = express();
const server = http.createServer(app);
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("MongoDB connection error: ", err));

app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Content-Length', 'X-Requested-With'],
  credentials: true,
}));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL || "http://localhost:5173");
  next();
});

const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  }
});

const userSocketMap = {};

io.on('connection', (socket) => {
  const email = socket.handshake.query.email;
  if (email) {
    userSocketMap[email] = socket.id;
    console.log(`User with email ${email} connected`);
  }
  socket.on('disconnect', () => {
    if (email) {
      delete userSocketMap[email];
      console.log(`User with email ${email} disconnected`);
    }
  });
});

// Register routes
app.use('/currency', currencyRoute); // Register currency route first
app.use('/shipments', (req, res, next) => {
  req.io = io;
  next();
}, shipmentRoute);
app.use('/users', userRoute);
app.use('/google', googleRoute);
app.use('/seller', sellerRoute);
app.use('/tracking', trackingRoute);
app.use('/conversations', conversationRoute);
app.use('/carriers', carrierRoute);

server.listen(4000, () => {
  console.log("App running on port 4000");
});

module.exports = { app, server };