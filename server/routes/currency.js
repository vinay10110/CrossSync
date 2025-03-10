const express = require('express');
const router = express.Router();
const axios = require('axios');

router.post('/convert', async (req, res) => {
  try {
    const { amount, from, to } = req.body;

    if (!amount || !from || !to) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Using exchangerate-api.com
    const response = await axios.get(
      `https://api.exchangerate-api.com/v4/latest/${from}`
    );

    if (!response.data || !response.data.rates || !response.data.rates[to]) {
      throw new Error('Invalid currency pair');
    }

    const rate = response.data.rates[to];
    const convertedAmount = parseFloat(amount) * rate;

    res.json({
      convertedAmount: Number(convertedAmount.toFixed(2)),
      rate: rate,
      from,
      to
    });
  } catch (error) {
    console.error('Currency conversion error:', error.message);
    res.status(500).json({ 
      error: 'Failed to convert currency',
      details: error.message 
    });
  }
});

module.exports = router; 