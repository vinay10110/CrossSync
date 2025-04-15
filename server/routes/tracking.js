const express = require('express');
const router = express.Router();
const Tracking = require('../models/Tracking');
const Shipments = require('../models/Shipments');

// Save vessel tracking information
router.post('/savevessel', async (req, res) => {
  try {
    const { shipmentId, mmsiNumber, imoNumber } = req.body;

    if (!shipmentId || !mmsiNumber || !imoNumber) {
      return res.status(400).json({ message: 'Missing required tracking information' });
    }

    // Check if shipment exists
    const shipment = await Shipments.findById(shipmentId);
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    // Create or update tracking info
    const tracking = await Tracking.findOneAndUpdate(
      { shipmentId },
      {
        mmsiNumber,
        imoNumber,
        lastKnownPosition: {
          coordinates: shipment.origin.coordinates // Initialize with origin coordinates
        }
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ tracking });
  } catch (error) {
    console.error('Error saving vessel tracking:', error);
    res.status(500).json({ message: 'Error saving vessel tracking information' });
  }
});

// Get vessel tracking information
router.get('/vessel/:shipmentId', async (req, res) => {
  try {
    const tracking = await Tracking.findOne({ shipmentId: req.params.shipmentId });
    if (!tracking) {
      return res.status(404).json({ message: 'No tracking information found for this shipment' });
    }
    res.json({ tracking });
  } catch (error) {
    console.error('Error fetching vessel tracking:', error);
    res.status(500).json({ message: 'Error fetching vessel tracking information' });
  }
});

// Update vessel position
router.put('/updateposition/:shipmentId', async (req, res) => {
  try {
    const { coordinates, vesselInfo, navigationStatus } = req.body;
    
    if (!coordinates || !coordinates.length === 2) {
      return res.status(400).json({ message: 'Invalid coordinates' });
    }

    const tracking = await Tracking.findOneAndUpdate(
      { shipmentId: req.params.shipmentId },
      {
        lastKnownPosition: {
          coordinates,
          timestamp: new Date()
        },
        vesselInfo: vesselInfo || {},
        navigationStatus: navigationStatus || {},
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!tracking) {
      return res.status(404).json({ message: 'No tracking information found for this shipment' });
    }

    res.json({ tracking });
  } catch (error) {
    console.error('Error updating vessel position:', error);
    res.status(500).json({ message: 'Error updating vessel position' });
  }
});

module.exports = router;