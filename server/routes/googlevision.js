const express = require('express');
const router = express.Router();
const  analyzeImage  = require('../GoogleVision/googleVisionService');

router.post('/analyzedoc', async (req, res) => {
  const { imageUrl } = req.body;
console.log(imageUrl);
  if (!imageUrl) {
    return res.status(400).json({ success: false, error: 'Image URL is required' });
  }

  try {
    const result = await analyzeImage(imageUrl);

    if (result.success) {
      return res.status(200).json({ success: true, documentType: result.documentType, data: result.data });
    } else {
      return res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error during image analysis:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
