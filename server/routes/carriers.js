const express = require('express');
const router = express.Router();
const Carrier = require('../models/Carrier');

// Simple helper function to format carrier data
const formatCarrierData = (carrier) => {
  if (!carrier) return null;
  
  return {
    userId: carrier.userId,
    companyName: carrier.companyName || '',
    registrationNumber: carrier.registrationNumber || '',
    taxId: carrier.taxId || '',
    address: carrier.address || '',
    city: carrier.city || '',
    state: carrier.state || '',
    country: carrier.country || '',
    postalCode: carrier.postalCode || '',
    phone: carrier.phone || '',
    email: carrier.email || '',
    website: carrier.website || '',
    description: carrier.description || '',
    fleetSize: carrier.fleetSize || '',
    vehicleTypes: carrier.vehicleTypes || [],
    specializations: carrier.specializations || [],
    certifications: carrier.certifications || [],
    operatingRegions: carrier.operatingRegions || [],
    insuranceProvider: carrier.insuranceProvider || '',
    insuranceNumber: carrier.insuranceNumber || '',
    insuranceExpiry: carrier.insuranceExpiry || '',
    bankName: carrier.bankName || '',
    accountNumber: carrier.accountNumber || '',
    ifscCode: carrier.ifscCode || '',
    logo: carrier.logo || null,
    documents: carrier.documents || []
  };
};

// Get carrier profile
router.get('/profile/:userId', async (req, res) => {
  try {
    console.log('Fetching carrier profile for userId:', req.params.userId);
    
    const carrier = await Carrier.findOne({ userId: req.params.userId });
    if (!carrier) {
      console.log('No carrier found, returning empty profile');
      return res.json({ profile: formatCarrierData(null) });
    }
    
    console.log('Found carrier:', carrier.companyName);
    res.json({ profile: formatCarrierData(carrier) });
  } catch (error) {
    console.error('Error fetching carrier profile:', error);
    res.status(500).json({ 
      message: 'Failed to fetch carrier profile',
      error: error.message
    });
  }
});

// Create or update carrier profile
router.post('/profile', async (req, res) => {
  try {
    const { userId, ...profileData } = req.body;
    
    console.log('Updating carrier profile for userId:', userId);
    console.log('Profile data received:', profileData);
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Convert insurance expiry to Date object if provided
    if (profileData.insuranceExpiry && profileData.insuranceExpiry !== '') {
      profileData.insuranceExpiry = new Date(profileData.insuranceExpiry);
    }

    // Clean up empty strings - convert to null or remove
    Object.keys(profileData).forEach(key => {
      if (profileData[key] === '' || profileData[key] === null) {
        delete profileData[key]; // Remove empty fields instead of setting to null
      }
    });

    console.log('Cleaned profile data:', profileData);

    const carrier = await Carrier.findOneAndUpdate(
      { userId },
      { $set: profileData },
      { new: true, upsert: true, runValidators: false }
    );

    console.log('Carrier saved successfully:', carrier.companyName);
    res.json({ 
      message: 'Profile updated successfully', 
      profile: formatCarrierData(carrier) 
    });
  } catch (error) {
    console.error('Error saving carrier profile:', error);
    res.status(500).json({ 
      message: 'Failed to save carrier profile',
      error: error.message,
      details: error.stack
    });
  }
});

// Simple logo upload placeholder (without S3)
router.post('/upload-logo', async (req, res) => {
  try {
    // For now, just return a placeholder response
    res.status(501).json({ message: 'Logo upload not implemented yet' });
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({ message: 'Failed to upload logo' });
  }
});

// Get carrier statistics
router.get('/stats/:userId', async (req, res) => {
  try {
    const carrier = await Carrier.findOne({ userId: req.params.userId });
    if (!carrier) {
      return res.status(404).json({ message: 'Carrier not found' });
    }

    res.json({
      rating: carrier.rating || 0,
      totalShipments: carrier.totalShipments || 0,
      completedShipments: carrier.completedShipments || 0
    });
  } catch (error) {
    console.error('Error fetching carrier stats:', error);
    res.status(500).json({ message: 'Failed to fetch carrier stats' });
  }
});

module.exports = router; 