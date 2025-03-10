const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true, 
  },
  productType: {
    type: String, 
  },
  category: {
    type: String,
    required: true, 
  },
  subCategory: {
    type: String, 
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
  productImages: [String],
  handlingInstructions: String,
});

const ShipmentsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', 
      required: true, 
    },
    companyName: {
      type: String,
      required: true,
    },
    products: [ProductSchema],
    origin: {
      type: Object,
      required: true,
      properties: {
        code: String,
        name: String,
        city: String,
        country: String,
        coordinates: [Number]
      }
    },
    destination: {
      type: Object,
      required: true,
      properties: {
        code: String,
        name: String,
        city: String,
        country: String,
        coordinates: [Number]
      }
    },
    transportModes: [{
      type: String,
      enum: ['air', 'sea', 'land'],
      required: true
    }],
    selectedRoute: {
      path: [{
        mode: String,
        coordinates: [{
          lat: Number,
          lng: Number
        }]
      }],
      totalDistance: Number,
      estimatedTime: Number,
      transportModes: [{
        mode: String,
        distance: Number,
        duration: Number,
        from: String,
        to: String
      }]
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
    currency: {
      type: String,
      default: 'USD',
    },
    totalWeight: {
      type: Number,
      min: 0,
    },
    shippingStatus: {
      type: String,
      enum: ['pending', 'dispatched', 'in-transit', 'delivered'],
      default: 'pending',
    },
    estimatedDeliveryDate: {
      type: Date, 
    },
    commercialInvoice: String,
    certificateOfOrigin: String,
    packingList: String,
    isTaken: {
      type: Boolean,
      default: false, 
    },
    takenBy: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
    },
    bids: [{
      carrier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      amount: {
        type: Number,
        required: true,
        min: 0
      },
      currency: {
        type: String,
        required: true,
        default: 'USD'
      },
      convertedAmount: {
        type: Number,
        min: 0
      },
      conversionRate: {
        type: Number,
        min: 0
      },
      status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
      },
      notes: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    acceptedBid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true, 
  }
);

const ShipmentsModel = mongoose.model('Shipments', ShipmentsSchema);
module.exports = ShipmentsModel;
