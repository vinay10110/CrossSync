const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  sellerEmail: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  category: {
    type: [String],
    required: true
  },
  subCategory: String,
  dimensions: String,
  weight: Number,
  description: String,
  handlingInstructions: String,
  images: [String], // Array of Supabase image URLs
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
ProductSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Product', ProductSchema); 