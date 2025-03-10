const express = require('express');
const router = express.Router();
const Seller = require('../models/Seller');
const Product = require('../models/Products');

// Get seller profile
router.get('/profile/:email', async (req, res) => {
  try {
    let seller = await Seller.findOne({ email: req.params.email });
    
    // If no profile exists, create a default one
    if (!seller) {
      seller = new Seller({
        email: req.params.email,
        companyName: '',
        businessType: '',
        registrationNumber: '',
        taxId: '',
        description: '',
        address: {
          street: '',
          city: '',
          state: '',
          country: '',
          zipCode: '',
        },
        contact: {
          email: req.params.email,
          phone: '',
          website: '',
        },
        categories: [],
      });
      await seller.save();
    }
    
    res.json({ profile: seller });
  } catch (error) {
    console.error('Error fetching seller profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update seller profile
router.post('/profile/update', async (req, res) => {
  try {
    const { email, profile } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Ensure the profile has the email field
    const updatedProfile = {
      ...profile,
      email,
      updatedAt: new Date()
    };

    const seller = await Seller.findOneAndUpdate(
      { email },
      { $set: updatedProfile },
      { new: true, upsert: true, runValidators: true }
    );

    if (!seller) {
      return res.status(404).json({ message: 'Failed to update seller profile' });
    }

    res.json({ profile: seller });
  } catch (error) {
    console.error('Error updating seller profile:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid profile data', errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get seller's product templates
router.get('/products/:email', async (req, res) => {
  try {
    const products = await Product.find({ sellerEmail: req.params.email });
    res.json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Add new product template
router.post('/products/add', async (req, res) => {
  try {
    const { email, product } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const newProduct = new Product({
      sellerEmail: email,
      ...product,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await newProduct.save();
    res.status(201).json({ product: newProduct });
  } catch (error) {
    console.error('Error adding product:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid product data', errors: error.errors });
    }
    res.status(500).json({ error: 'Failed to add product' });
  }
});

// Delete product template
router.delete('/products/delete/:id', async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Update product template
router.put('/products/update/:id', async (req, res) => {
  try {
    const { email, product } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find the product and verify ownership
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    if (existingProduct.sellerEmail !== email) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        ...product,
        sellerEmail: email,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    res.json({ product: updatedProduct });
  } catch (error) {
    console.error('Error updating product:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid product data', errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router; 