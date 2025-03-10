const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  sellerEmail: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  type: String,
  category: [String],
  subCategory: String,
  dimensions: {
    type: String,
    validate: {
      validator: function(v) {
        return /^\d+x\d+x\d+$/.test(v);
      },
      message: props => `${props.value} is not a valid dimension format! Use format like 10x20x30`
    }
  },
  weight: {
    type: Number,
    min: 0
  },
  description: String,
  handlingInstructions: String,
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
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Product', productSchema); 