const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema({
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // seller or carrier
      required: true
    }
  ],
  shipmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shipment", // optional, tie conversation to shipment
  },
  lastMessage: {
    type: String, // store preview of last message
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true
});

ConversationSchema.index({ participants: 1 });

const Conversation = mongoose.model("Conversation", ConversationSchema);
module.exports = Conversation;
