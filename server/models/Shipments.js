const mongoose = require('mongoose');

const ShipmentsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', 
      required: true, 
    },
    category: {
      type: String,
      required: true, 
    },
    subCategory: {
      type: String, 
    },
    origin: {
      type: String,
      required: true, 
    },
    destination: {
      type: String,
      required: true, 
    },
    productName: {
      type: String,
      required: true, 
    },
    productType: {
      type: String, 
    },
    verifiedShipment: {
      type: Boolean,
      default: false, 
    },
    isCompleted: {
      type: Boolean,
      default: false, 
    },
    dispatched: {
      type: Boolean,
      default: false, 
    },
    price: {
      type: Number, 
      min: 0, 
    },
    weight: {
      type: Number, 
      min: 0, 
    },
    quantity: {
      type: Number, 
      min: 1, 
    },
    dimensions: {
      type: String, 
    },
    shippingStatus: {
      type: String,
      enum: ['pending', 'dispatched', 'in-transit', 'delivered'],
      default: 'pending',
    },
    estimatedDeliveryDate: {
      type: Date, 
    },
    commercialInvoice:String,
    certificateOfOrigin:String,
    packingList:String,
    images: [
      {
        type: String, 
      },
    ],
    isTaken: {
      type: Boolean,
      default: false, 
    },
    takenBy: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
    },
  },
  {
    timestamps: true, 
  }
);

const ShipmentsModel = mongoose.model('Shipments', ShipmentsSchema);
module.exports = ShipmentsModel;
