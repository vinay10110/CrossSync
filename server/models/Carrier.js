const mongoose = require('mongoose');

const carrierSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  companyName: {
    type: String,
    required: true
  },
  registrationNumber: {
    type: String,
    required: true
  },
  taxId: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  postalCode: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  website: String,
  description: String,
  fleetSize: {
    type: Number,
    required: true
  },
  vehicleTypes: {
    type: [String],
    required: true
  },
  specializations: {
    type: [String],
    required: true
  },
  certifications: [String],
  operatingRegions: {
    type: [String],
    required: true
  },
  insuranceProvider: {
    type: String,
    required: true
  },
  insuranceNumber: {
    type: String,
    required: true
  },
  insuranceExpiry: {
    type: Date,
    required: true
  },
  bankName: {
    type: String,
    required: true
  },
  accountNumber: {
    type: String,
    required: true
  },
  ifscCode: {
    type: String,
    required: true
  },
  logo: String,
  documents: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: Date
  }],
  rating: {
    type: Number,
    default: 0
  },
  totalShipments: {
    type: Number,
    default: 0
  },
  completedShipments: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

carrierSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Carrier', carrierSchema); 