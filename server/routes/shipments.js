const express = require('express');
const Shipments = require('../models/Shipments');
const User = require('../models/User');
const Document = require('../models/Documents');
const Conversation = require('../models/Conversation');
const router = express.Router();
const { sendEmail } = require('../Email/EmailTemplate');
const formatLocation = (location) => {
  if (typeof location === 'object') {
    return `${location.city}, ${location.country} (${location.name})`;
  }
  return location;
};

router.post('/create', async (req, res) => {
  try {
    const { email, userId, companyName, products, origin, destination, transportModes, estimatedDeliveryDate, totalWeight } = req.body;
    
    console.log('Received request data:', req.body);

    // Find user first by email or create if doesn't exist
    let user = await User.findOne({ email });
    if (!user) {
      // Create new user if doesn't exist
      user = new User({
        email,
        userId, // Clerk user ID
        role: 'seller',
        companyName
      });
      await user.save();
      console.log('Created new user:', user);
    }

    // Prepare the shipment data
    const preparedShipmentData = {
      user: user._id,
      companyName,
      products: products.map(product => ({
        productName: product.productName,
        productType: product.productType,
        category: product.category,
        subCategory: product.subCategory,
        dimensions: `${product.dimensions.length}x${product.dimensions.width}x${product.dimensions.height} ${product.dimensions.unit}`,
        weight: Number(product.weight),
        quantity: Number(product.quantity),
        price: Number(product.price),
        productImages: product.productImages || [],
        handlingInstructions: product.handlingInstructions || ''
      })),
      origin,
      destination,
      transportModes: transportModes || ['sea'],
      estimatedDeliveryDate: new Date(estimatedDeliveryDate),
      shippingStatus: 'pending',
      verifiedShipment: false,
      isCompleted: false,
      dispatched: false,
      isTaken: false,
      totalWeight: Number(totalWeight)
    };

    console.log('Prepared shipment data:', JSON.stringify(preparedShipmentData, null, 2));

    // Create new shipment
    const newShipment = new Shipments(preparedShipmentData);

    // Save the shipment
    await newShipment.save();

    // Send email notification
    try {
      await sendEmail({
        to: email,
        subject: 'New Shipment Created',
        text: `Your shipment has been created successfully. Shipment ID: ${newShipment._id}`,
        html: `
          <h1>Shipment Created Successfully</h1>
          <p>Your shipment has been created with the following details:</p>
          <ul>
            <li>Shipment ID: ${newShipment._id}</li>
            <li>Origin: ${formatLocation(origin)}</li>
            <li>Destination: ${formatLocation(destination)}</li>
            <li>Total Products: ${products.length}</li>
            <li>Total Weight: ${totalWeight}kg</li>
            <li>Estimated Delivery: ${new Date(estimatedDeliveryDate).toLocaleDateString()}</li>
          </ul>
          <p>You can track your shipment status in your dashboard.</p>
        `
      });
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      message: 'Shipment created successfully',
      shipment: newShipment
    });
  } catch (error) {
    console.error('Error creating shipment:', error);
    res.status(500).json({
      message: 'Failed to create shipment',
      error: error.message
    });
  }
});

router.get('/user/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) {
      // Return empty shipments array instead of 404 error when user doesn't exist
      return res.json({ shipments: [] });
    }

    const shipments = await Shipments.find({ user: user._id })
      .populate('user', 'email companyName')
      .populate('bids.carrier', 'email companyName')
      .lean();

    // Format the response data
    const formattedShipments = shipments.map(shipment => ({
      ...shipment,
      origin: shipment.origin || '',
      destination: shipment.destination || '',
      products: (shipment.products || []).map(product => ({
        ...product,
        dimensions: typeof product.dimensions === 'string' 
          ? { 
              length: parseInt(product.dimensions.split('x')[0]) || 0,
              width: parseInt(product.dimensions.split('x')[1]) || 0,
              height: parseInt(product.dimensions.split('x')[2].split(' ')[0]) || 0,
              unit: product.dimensions.split(' ')[1] || 'cm'
            }
          : product.dimensions || { length: 0, width: 0, height: 0, unit: 'cm' }
      }))
    }));

    res.json({ shipments: formattedShipments });
  } catch (error) {
    console.error('Error fetching shipments:', error);
    res.status(500).json({ error: 'Failed to fetch shipments' });
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

router.post('/optimize-route', async (req, res) => {
  try {
    const { origin, destination, transportMode, selectedRoute } = req.body;
    
    // Validate the route data
    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination are required' });
    }

    // If a specific route is selected, return it
    if (selectedRoute) {
      return res.json({ success: true, route: selectedRoute });
    }

    // Since route calculation is handled in the frontend using OpenLayers,
    // we just need to validate and return the input data
    return res.json({ 
      success: true,
      route: {
        origin,
        destination,
        transportMode
      }
    });
  } catch (error) {
    console.error('Route optimization error:', error);
    res.status(500).json({ error: 'Failed to process route optimization' });
  }
});

router.get('/seller/profile/:email', async (req, res) => {
  try {
    // Find the user and populate necessary fields
    const user = await User.findOne({ email: req.params.email });
    if (!user) {
      // Return empty data instead of 404 error when user doesn't exist
      return res.json({ 
        user: null,
        shipments: [] 
      });
    }

    // Find all shipments for this user with populated fields
    const shipments = await Shipments.find({ user: user._id })
      .populate('user', 'email companyName userId role')
      .populate('bids.carrier', 'email companyName userId role')
      .populate('takenBy', 'email companyName userId role')
      .lean();

    // Format the response data
    const formattedShipments = shipments.map(shipment => ({
      ...shipment,
      origin: shipment.origin || '',
      destination: shipment.destination || '',
      products: (shipment.products || []).map(product => ({
        ...product,
        dimensions: typeof product.dimensions === 'string' 
          ? { 
              length: parseInt(product.dimensions.split('x')[0]) || 0,
              width: parseInt(product.dimensions.split('x')[1]) || 0,
              height: parseInt(product.dimensions.split('x')[2].split(' ')[0]) || 0,
              unit: product.dimensions.split(' ')[1] || 'cm'
            }
          : product.dimensions || { length: 0, width: 0, height: 0, unit: 'cm' }
      }))
    }));

    // Return both user and shipments data
    res.json({ 
      user: {
        _id: user._id,
        email: user.email,
        companyName: user.companyName,
        userId: user.userId,
        role: user.role
      },
      shipments: formattedShipments 
    });
  } catch (error) {
    console.error('Error fetching seller profile:', error);
    res.status(500).json({ 
      error: 'Failed to fetch seller profile',
      details: error.message 
    });
  }
});

// Add new endpoint to fetch available shipments
router.get('/available', async (req, res) => {
  try {
    console.log('Fetching available shipments');
    const availableShipments = await Shipments.find({ 
      isTaken: false 
    })
    .populate('user', 'email companyName')
    .lean(); // Convert to plain JavaScript object

    // Format the response data to match the structure expected by frontend
    const formattedShipments = availableShipments.map(shipment => ({
      _id: shipment._id,
      origin: shipment.origin || '',
      destination: shipment.destination || '',
      products: (shipment.products || []).map(product => ({
        ...product,
        dimensions: typeof product.dimensions === 'string' 
          ? { 
              length: parseInt(product.dimensions.split('x')[0]) || 0,
              width: parseInt(product.dimensions.split('x')[1]) || 0,
              height: parseInt(product.dimensions.split('x')[2].split(' ')[0]) || 0,
              unit: product.dimensions.split(' ')[1] || 'cm'
            }
          : product.dimensions || { length: 0, width: 0, height: 0, unit: 'cm' }
      })),
      estimatedDeliveryDate: shipment.estimatedDeliveryDate,
      createdAt: shipment.createdAt,
      totalWeight: shipment.totalWeight || 0,
      user: shipment.user,
      transportModes: shipment.transportModes || ['sea'],
      shippingStatus: shipment.shippingStatus || 'pending'
    }));

    // Log the first shipment for debugging
    if (formattedShipments.length > 0) {
      console.log('Sample formatted shipment data:', JSON.stringify(formattedShipments[0], null, 2));
    }

    return res.json({ shipments: formattedShipments });
  } catch (error) {
    console.error('Error fetching available shipments:', error);
    return res.status(500).json({ error: 'Failed to fetch available shipments' });
  }
});

// Place a bid on a shipment
router.post('/bid/:shipmentId', async (req, res) => {
  try {
    const { email, amount, currency = 'USD', notes, convertedAmount, conversionRate } = req.body;
    const shipmentId = req.params.shipmentId;

    // Find the shipment
    const shipment = await Shipments.findById(shipmentId);
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    // Check if shipment is already taken
    if (shipment.isTaken) {
      return res.status(400).json({ error: 'Shipment is already taken' });
    }

    // Find carrier by email
    let carrier = await User.findOne({ email });
    if (!carrier) {
      // If carrier doesn't exist in MongoDB, create a new carrier record
      carrier = new User({
        email,
        role: 'carrier',
        companyName: 'New Carrier', // You might want to get this from Clerk or user input
        rating: { value: 0, count: 0 }
      });
      await carrier.save();
    }

    // Check if carrier has already placed a bid
    const existingBid = shipment.bids.find(bid => bid.carrier.toString() === carrier._id.toString());
    if (existingBid) {
      return res.status(400).json({ error: 'You have already placed a bid on this shipment' });
    }

    // Create the new bid
    const newBid = {
      carrier: carrier._id,
      amount,
      currency,
      notes,
      convertedAmount,
      conversionRate,
      status: 'pending',
      createdAt: new Date()
    };

    // Add the bid to the shipment
    shipment.bids.push(newBid);
    await shipment.save();

    // Populate carrier details for the response
    const populatedShipment = await Shipments.findById(shipmentId)
      .populate('bids.carrier', 'email companyName rating');

    const placedBid = populatedShipment.bids[populatedShipment.bids.length - 1];

    // Notify the shipment owner about the new bid
    try {
      await sendEmail(
        shipment.user.email,
        'New Bid Received',
        `<h3>Dear User,</h3>
        <p>A new bid has been placed on your shipment:</p>
        <pre>
Product: ${shipment.productName}
Bid Amount: ${amount} ${currency}
${convertedAmount ? `Converted Amount: ${convertedAmount} ${shipment.currency}` : ''}
Notes: ${notes || 'No additional notes'}
        </pre>`
      );
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Don't fail the bid placement if email fails
    }

    return res.status(201).json({
      success: true,
      message: 'Bid placed successfully',
      bid: placedBid
    });
  } catch (error) {
    console.error('Error placing bid:', error);
    return res.status(500).json({ error: error.message || 'Failed to place bid' });
  }
});

// Accept a bid
router.post('/bid/:shipmentId/accept/:bidId', async (req, res) => {
  try {
    const { shipmentId, bidId } = req.params;

    const shipment = await Shipments.findById(shipmentId);
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    const bid = shipment.bids.id(bidId);
    if (!bid) {
      return res.status(404).json({ error: 'Bid not found' });
    }

    // Update bid status and shipment
    bid.status = 'accepted';
    shipment.isTaken = true;
    shipment.takenBy = bid.carrier;
    shipment.acceptedBid = bid.carrier;
    
    // Reject all other bids
    shipment.bids.forEach(otherBid => {
      if (otherBid._id.toString() !== bidId) {
        otherBid.status = 'rejected';
      }
    });

    await shipment.save();

    // Create conversation between seller and carrier
    try {
      const existingConversation = await Conversation.findOne({
        participants: { $all: [shipment.user, bid.carrier] },
        shipmentId: shipmentId
      });

      if (!existingConversation) {
        const conversation = new Conversation({
          participants: [shipment.user, bid.carrier],
          shipmentId: shipmentId,
          lastMessage: 'Conversation started - bid accepted',
          lastMessageAt: new Date()
        });
        await conversation.save();
        console.log('Conversation created between seller and carrier');
      }
    } catch (conversationError) {
      console.error('Error creating conversation:', conversationError);
      // Don't fail the bid acceptance if conversation creation fails
    }

    // Notify the carrier
    const carrier = await User.findById(bid.carrier);
    await sendEmail(
      carrier.email,
      'Bid Accepted',
      `<h3>Congratulations!</h3><p>Your bid for shipment ${shipment.productName} has been accepted.</p>`
    );

    return res.status(200).json({
      success: true,
      message: 'Bid accepted successfully',
      shipment
    });
  } catch (error) {
    console.error('Error accepting bid:', error);
    return res.status(500).json({ error: 'Failed to accept bid' });
  }
});

// Get all bids for a shipment
router.get('/bids/:shipmentId', async (req, res) => {
  try {
    const shipment = await Shipments.findById(req.params.shipmentId)
      .populate('bids.carrier', 'email companyName');
    
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    return res.json({ bids: shipment.bids });
  } catch (error) {
    console.error('Error fetching bids:', error);
    return res.status(500).json({ error: 'Failed to fetch bids' });
  }
});

// Currency conversion endpoint
router.get('/convert-currency', async (req, res) => {
  try {
    const { amount, from, to } = req.query;

    if (!amount || !from || !to) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    // Using ExchangeRate-API for currency conversion
    const response = await fetch(`https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_RATE_API_KEY}/pair/${from}/${to}/${amount}`);
    const data = await response.json();

    if (data.result === 'error') {
      throw new Error(data['error-type']);
    }

    res.json({
      amount: data.conversion_result,
      rate: data.conversion_rate,
      from,
      to
    });
  } catch (error) {
    console.error('Currency conversion error:', error);
    res.status(500).json({ message: 'Failed to convert currency', error: error.message });
  }
});

// Get carrier statistics
router.get('/carrier-stats/:carrierId', async (req, res) => {
  try {
    const carrierId = req.params.carrierId;

    // Get completed shipments count
    const completedShipments = await Shipments.countDocuments({
      takenBy: carrierId,
      isCompleted: true
    });

    // Get total shipments count
    const totalShipments = await Shipments.countDocuments({
      takenBy: carrierId
    });

    // Calculate average rating (assuming we store ratings in the shipments)
    const shipments = await Shipments.find({
      takenBy: carrierId,
      isCompleted: true,
      'rating.value': { $exists: true }
    });

    let rating = 0;
    if (shipments.length > 0) {
      const totalRating = shipments.reduce((sum, shipment) => sum + (shipment.rating?.value || 0), 0);
      rating = totalRating / shipments.length;
    }

    res.json({
      completedShipments,
      totalShipments,
      rating: rating || 0,
      successRate: totalShipments > 0 ? (completedShipments / totalShipments) * 100 : 0
    });
  } catch (error) {
    console.error('Error fetching carrier stats:', error);
    res.status(500).json({ error: 'Failed to fetch carrier statistics' });
  }
});

// Add this new route to get accepted bids
router.get('/accepted-bids', async (req, res) => {
  try {
    const userId = req.headers.authorization;
    console.log('Received request for accepted bids with userId:', userId);
    
    if (!userId) {
      console.log('No userId provided in Authorization header');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // First find the user to get both ID and email
    const user = await User.findOne({
      $or: [
        { clerkId: userId },
       
      ]
    });

    if (!user) {
      console.log('User not found for ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Found user:', { id: user._id, email: user.email, role: user.role });

    // Find shipments where the user has an accepted bid
    const shipments = await Shipments.find({
      'bids': {
        $elemMatch: {
          'carrier': user._id,
          'status': 'accepted'
        }
      }
    })
    .populate({
      path: 'user',
      select: 'email companyName userId role'
    })
    .populate({
      path: 'bids.carrier',
      select: 'email companyName userId role'
    })
    .lean();

    console.log(`Found ${shipments.length} shipments with accepted bids`);

    // Extract accepted bids with shipment details
    const acceptedBids = [];
    for (const shipment of shipments) {
      // Find the accepted bid for this carrier
      const acceptedBid = shipment.bids.find(bid => 
        bid.status === 'accepted' && 
        bid.carrier._id.toString() === user._id.toString()
      );

      if (acceptedBid) {
        console.log(`Found accepted bid for shipment ${shipment._id}`);
        
        // Format the shipment data
        const formattedShipment = {
          _id: shipment._id,
          origin: shipment.origin || {},
          destination: shipment.destination || {},
          products: shipment.products?.map(product => ({
            ...product,
            productImages: product.productImages || [],
            dimensions: typeof product.dimensions === 'string' 
              ? {
                  length: parseInt(product.dimensions.split('x')[0]) || 0,
                  width: parseInt(product.dimensions.split('x')[1]) || 0,
                  height: parseInt(product.dimensions.split('x')[2].split(' ')[0]) || 0,
                  unit: product.dimensions.split(' ')[1] || 'cm'
                }
              : product.dimensions || { length: 0, width: 0, height: 0, unit: 'cm' }
          })) || [],
          isCompleted: shipment.isCompleted || false,
          dispatched: shipment.dispatched || false,
          verifiedShipment: shipment.verifiedShipment || false,
          estimatedDeliveryDate: shipment.estimatedDeliveryDate,
          createdAt: shipment.createdAt,
          totalWeight: shipment.totalWeight || 0,
          shippingStatus: shipment.shippingStatus || 'pending'
        };

        acceptedBids.push({
          _id: acceptedBid._id,
          amount: acceptedBid.amount,
          currency: acceptedBid.currency,
          status: acceptedBid.status,
          notes: acceptedBid.notes,
          carrier: acceptedBid.carrier,
          seller: shipment.user,
          shipment: formattedShipment,
          createdAt: acceptedBid.createdAt
        });
      }
    }

    console.log(`Returning ${acceptedBids.length} accepted bids`);
    if (acceptedBids.length > 0) {
      console.log('Sample bid data:', {
        bidId: acceptedBids[0]._id,
        shipmentId: acceptedBids[0].shipment._id,
        products: acceptedBids[0].shipment.products.length
      });
    }

    res.json({ acceptedBids });
  } catch (error) {
    console.error('Error fetching accepted bids:', error);
    res.status(500).json({ 
      message: 'Error fetching accepted bids', 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Add this new route before module.exports
router.get('/getallroutes', async (req, res) => {
  try {
    searoutesDocs.auth('fJL790ghkr4CDfv5nlcrr5uYb7PMXGiH2nvBJqJQ');
    
    searoutesDocs.getPlanSeaRoute({
      continuousCoordinates: 'true',
      allowIceAreas: 'false',
      avoidHRA: 'false',
      avoidSeca: 'false',
      locations: '-122.4194,37.7749;-74.006,40.7128', // San Francisco to New York
      'accept-version': '2.0'
    })
    .then(({ data }) => {
      console.log(data);
      res.json(data);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch sea routes', details: err.message });
    });
  } catch (error) {
    console.error('Error fetching sea routes:', error);
    res.status(500).json({ 
      error: 'Failed to fetch sea routes',
      details: error.message 
    });
  }
});

// Update the document upload route to handle Clerk ID
router.post('/:shipmentId/documents', async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const { documentUrl, documentType, clerkId } = req.body;
        console.log(shipmentId, documentUrl, documentType, clerkId);
    // Verify shipment exists
    const shipment = await Shipments.findById(shipmentId);
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    // Find user by Clerk ID
    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create new document
    const document = new Document({
      shipmentId,
      documentType,
      documentUrl,
      uploadedBy: user._id // Use MongoDB ObjectId from User model
    });

    await document.save();

    // If this is the last required document, mark shipment as verified
    const requiredDocs = ['commercial_invoice', 'certificate_of_origin', 'packing_list'];
    const uploadedDocs = await Document.find({ shipmentId });
    const uploadedDocTypes = uploadedDocs.map(doc => doc.documentType);
    
    const allDocsUploaded = requiredDocs.every(docType => 
      uploadedDocTypes.includes(docType)
    );

    if (allDocsUploaded) {
      shipment.verifiedShipment = true;
      await shipment.save();
    }

    res.status(201).json({ document, isShipmentVerified: allDocsUploaded });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get documents for a shipment
router.get('/:shipmentId/documents', async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const documents = await Document.find({ shipmentId })
      .populate('uploadedBy', 'email companyName')
      .sort('-uploadedAt');

    res.json({ documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete document
router.delete('/:shipmentId/documents/:documentId', async (req, res) => {
  try {
    const { shipmentId, documentId } = req.params;
    
    const document = await Document.findOneAndDelete({
      _id: documentId,
      shipmentId
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Update shipment verification status
    const shipment = await Shipments.findById(shipmentId);
    if (shipment) {
      const remainingDocs = await Document.find({ shipmentId });
      const requiredDocs = ['commercial_invoice', 'certificate_of_origin', 'packing_list'];
      const uploadedDocTypes = remainingDocs.map(doc => doc.documentType);
      
      const allDocsPresent = requiredDocs.every(docType => 
        uploadedDocTypes.includes(docType)
      );

      if (!allDocsPresent && shipment.verifiedShipment) {
        shipment.verifiedShipment = false;
        await shipment.save();
      }
    }

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete document
router.delete('/:id/documents/:type', async (req, res) => {
  try {
    const { id, type } = req.params;
    const shipment = await Shipments.findById(id);
    
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    if (shipment.documents && shipment.documents[type]) {
      delete shipment.documents[type];
      await shipment.save();
      return res.status(200).json({ message: 'Document deleted successfully' });
    }

    res.status(404).json({ message: 'Document not found' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
