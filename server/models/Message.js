const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    text: {
      type: String,
    },
    imageUrl: {  // optional, if they send images (stored in Supabase)
      type: String
    },
    seenBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ]
  }, {
    timestamps: true
  });
  
  MessageSchema.index({ conversationId: 1 });
  
  const Message = mongoose.model("Message", MessageSchema);
  module.exports = Message;
  