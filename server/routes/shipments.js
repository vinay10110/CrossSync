const express = require('express');
const Shipments = require('../models/Shipments');
const User = require('../models/User');
const router = express.Router();
const { sendEmail } = require('../Email/EmailTemplate');

router.post('/createshipment', async (req, res) => {
  const { shipmentData, email } = req.body;
  try {
    const userDoc = await User.find({ email });
    shipmentData.user = userDoc[0]._id;
    const shipment = new Shipments(shipmentData);
    await shipment.save();
    await sendEmail(
      email,
      'New Shipment Created',
      `<h3>Dear User,</h3><p>A new shipment has been created for the product: </p><pre>${shipmentData.productName}</pre>`
    );
    req.io.emit('shipmentUpdate', {
      message: `New shipment  created.`
    });
    return res.status(201).json({ message: 'Shipment created successfully!', shipment });
  } catch (error) {
    console.error('Error saving shipment:', error);
    return res.status(500).json({ error: 'Failed to create shipment' });
  }
});


router.put('/updateshipment/:id', async (req, res) => {
  const shipmentId = req.params.id;
  const {updatedDoc} = req.body;
 
  try {
    const shipment = await Shipments.findByIdAndUpdate(
      shipmentId,
      updatedDoc,
      { new: true }
    );
    console.log(updatedDoc);
    await sendEmail(
      shipment.user.email,
      'Shipment Updated',
      `<h3>Dear User,</h3><p>Your shipment has been updated with the following changes:</p><pre>${JSON.stringify(updatedDoc, null, 2)}</pre>`
    );
    if (!shipment) {
      io.emit('shipmentUpdate', {
        type: 'error',
        message: 'Shipment not found',
        shipmentId,
      });

      return res.status(404).json({ error: 'Shipment not found' });
    }
    req.io.emit('shipmentUpdate', {
      type: 'success',
      message: 'Shipment updated successfully!',
      shipmentId,
      shipment,
    });

    return res.status(200).json({ message: 'Shipment updated successfully!', shipment });
  } catch (error) {
    console.error('Error updating shipment:', error);
    req.io.emit('shipmentUpdate', {
      type: 'error',
      message: 'Failed to update shipment',
      shipmentId,
    });

    return res.status(500).json({ error: 'Failed to update shipment' });
  }
});

router.get('/shipments', async (req, res) => {
  try {
    const documents = await Shipments.find();

    return res.json(documents);
  } catch (error) {
    console.error('Error fetching shipments:', error);
    return res.status(500).json({ error: 'An error occurred while fetching shipments' });
  }
});


router.delete('/deleteshipment/:id', async (req, res) => {
  const shipmentId = req.params.id;

  try {
    const shipment = await Shipments.findByIdAndDelete(shipmentId);
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }


    return res.status(200).json({ message: 'Shipment deleted successfully!' });
  } catch (error) {
    console.error('Error deleting shipment:', error);
    return res.status(500).json({ error: 'Failed to delete shipment' });
  }
});

module.exports = router;
