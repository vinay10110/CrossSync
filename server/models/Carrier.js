const mongoose = require('mongoose');

const carrierSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  companyName: String,
  registrationNumber: String,
  taxId: String,
  address: String,
  city: String,
  state: String,
  country: String,
  postalCode: String,
  phone: String,
  email: String,
  website: String,
  description: String,
  fleetSize: Number,
  vehicleTypes: [String],
  specializations: [String],
  certifications: [String],
  operatingRegions: [String],
  insuranceProvider: String,
  insuranceNumber: String,
  insuranceExpiry: Date,
  bankName: String,
  accountNumber: String,
  ifscCode: String,
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