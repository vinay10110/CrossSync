const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  companyName: {
    type: String,
    required: true
  },
  businessType: String,
  registrationNumber: String,
  taxId: String,
  description: String,
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  contact: {
    email: String,
    phone: String,
    website: String
  },
  categories: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
sellerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Seller', sellerSchema); 