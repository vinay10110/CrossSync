const mongoose = require('mongoose');

const trackingSchema = new mongoose.Schema({
  shipmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shipments',
    required: true
  },
  mmsiNumber: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^\d{9}$/.test(v);
      },
      message: props => `${props.value} is not a valid MMSI number! Must be exactly 9 digits.`
    }
  },
  imoNumber: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^\d{7}$/.test(v);
      },
      message: props => `${props.value} is not a valid IMO number! Must be exactly 7 digits.`
    }
  },
  lastKnownPosition: {
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  vesselInfo: {
    name: String,
    callSign: String,
    type: String,
    draught: Number
  },
  navigationStatus: {
    status: String,
    speed: Number,
    course: Number,
    destination: String,
    eta: Date
  },
  currentPort: String,
  area: String,
  aisSource: String,
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create a geospatial index on lastKnownPosition.coordinates
trackingSchema.index({ 'lastKnownPosition.coordinates': '2dsphere' });

const Tracking = mongoose.model('Tracking', trackingSchema);
module.exports = Tracking;