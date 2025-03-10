const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  clerkId: {  // Clerk user ID
    type: String,
    required: true,
    unique: true
  },
  companyName: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['seller', 'carrier'],
    required: true
  },
  profileCompleted: {
    type: Boolean,
    default: false
  },
  // Common fields
  firstName: String,
  lastName: String,
  imageUrl: String,
  // Carrier specific fields
  specialization: String,
  certifications: [String],
  rating: {
    value: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Add index for faster queries
UserSchema.index({ clerkId: 1 });
UserSchema.index({ email: 1 });

const User = mongoose.model('User', UserSchema);
module.exports = User;
