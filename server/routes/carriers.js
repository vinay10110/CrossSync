const express = require('express');
const router = express.Router();
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');
const Carrier = require('../models/Carrier');

// Middleware to check if user is a seller
const checkSellerRole = async (req, res, next) => {
  try {
    const userRole = req.headers['x-user-role'];
    if (userRole !== 'seller') {
      return res.status(403).json({ message: 'Access denied. Only sellers can view carrier profiles.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking user role' });
  }
};

// Middleware to check if user owns the profile
const checkProfileOwnership = async (req, res, next) => {
  try {
    const requestingUserId = req.headers['x-user-id'];
    const targetUserId = req.params.userId;
    
    if (requestingUserId !== targetUserId) {
      const userRole = req.headers['x-user-role'];
      if (userRole !== 'seller') {
        return res.status(403).json({ message: 'Access denied. You can only view your own profile.' });
      }
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking profile ownership' });
  }
};

// Configure S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Helper function to upload to S3
async function uploadToS3(file, folder) {
  const fileName = `${folder}/${crypto.randomBytes(16).toString('hex')}-${file.originalname}`;
  
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read'
  });

  await s3Client.send(command);
  return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
}

// Get carrier profile - Protected route
router.get('/profile/:userId', checkProfileOwnership, async (req, res) => {
  try {
    const carrier = await Carrier.findOne({ userId: req.params.userId });
    if (!carrier) {
      return res.status(404).json({ message: 'Carrier profile not found' });
    }
    res.json(carrier);
  } catch (error) {
    console.error('Error fetching carrier profile:', error);
    res.status(500).json({ message: 'Failed to fetch carrier profile' });
  }
});

// Create or update carrier profile - Only profile owner can update
router.post('/profile', async (req, res) => {
  try {
    const { userId, ...profileData } = req.body;
    
    // Check if user is updating their own profile
    const requestingUserId = req.headers['x-user-id'];
    if (requestingUserId !== userId) {
      return res.status(403).json({ message: 'Access denied. You can only update your own profile.' });
    }

    // Convert insurance expiry to Date object
    if (profileData.insuranceExpiry) {
      profileData.insuranceExpiry = new Date(profileData.insuranceExpiry);
    }

    const carrier = await Carrier.findOneAndUpdate(
      { userId },
      { ...profileData },
      { new: true, upsert: true, runValidators: true }
    );

    res.json(carrier);
  } catch (error) {
    console.error('Error saving carrier profile:', error);
    res.status(500).json({ message: 'Failed to save carrier profile' });
  }
});

// Upload carrier logo
router.post('/upload-logo', upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const url = await uploadToS3(req.file, 'carrier-logos');
    res.json({ url });
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({ message: 'Failed to upload logo' });
  }
});

// Upload carrier documents
router.post('/upload-documents', upload.array('documents', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadPromises = req.files.map(file => uploadToS3(file, 'carrier-documents'));
    const urls = await Promise.all(uploadPromises);

    const documents = urls.map((url, index) => ({
      name: req.files[index].originalname,
      url,
      type: req.files[index].mimetype,
      uploadedAt: new Date()
    }));

    res.json({ documents });
  } catch (error) {
    console.error('Error uploading documents:', error);
    res.status(500).json({ message: 'Failed to upload documents' });
  }
});

// Get carrier statistics - Protected route
router.get('/stats/:userId', checkProfileOwnership, async (req, res) => {
  try {
    const carrier = await Carrier.findOne({ userId: req.params.userId });
    if (!carrier) {
      return res.status(404).json({ message: 'Carrier not found' });
    }

    res.json({
      rating: carrier.rating,
      totalShipments: carrier.totalShipments,
      completedShipments: carrier.completedShipments
    });
  } catch (error) {
    console.error('Error fetching carrier stats:', error);
    res.status(500).json({ message: 'Failed to fetch carrier stats' });
  }
});

// Update carrier statistics - Only profile owner can update
router.post('/stats/:userId', async (req, res) => {
  try {
    const { rating, totalShipments, completedShipments } = req.body;
    
    // Check if user is updating their own stats
    const requestingUserId = req.headers['x-user-id'];
    if (requestingUserId !== req.params.userId) {
      return res.status(403).json({ message: 'Access denied. You can only update your own statistics.' });
    }
    
    const carrier = await Carrier.findOneAndUpdate(
      { userId: req.params.userId },
      { rating, totalShipments, completedShipments },
      { new: true }
    );

    if (!carrier) {
      return res.status(404).json({ message: 'Carrier not found' });
    }

    res.json(carrier);
  } catch (error) {
    console.error('Error updating carrier stats:', error);
    res.status(500).json({ message: 'Failed to update carrier stats' });
  }
});

module.exports = router; 