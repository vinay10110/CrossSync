const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  shipmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shipments',
    required: true
  },
  documentType: {
    type: String,
    enum: ['commercial_invoice', 'certificate_of_origin', 'packing_list'],
    required: true
  },
  documentUrl: {
    type: String,
    required: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  verificationResult: {
    type: Object,
    default: null
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Document', DocumentSchema);