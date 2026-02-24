// src/routes.js
const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString()
  });
});

// Validation test endpoint
router.get('/validation-test', (req, res) => {
  const { testParam } = req.query;
  
  // Simple validation
  if (!testParam) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required parameter'
    });
  }
  
  // Check for suspicious content
  if (testParam.includes('<script>') || testParam.includes('onerror')) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid parameter value'
    });
  }
  
  res.status(200).json({
    status: 'success',
    message: 'Validation passed',
    data: { testParam }
  });
});

// Data submission endpoint
router.post('/data', (req, res) => {
  const { name, email, message } = req.body;
  
  // Validate required fields
  if (!name || !email || !message) {
    return res.status(400).json({
      status: 'error',
      message: 'All fields are required'
    });
  }
  
  // Return processed data
  res.status(201).json({
    status: 'success',
    message: 'Data received successfully',
    data: req.body
  });
});

// Catch-all for non-existent routes
router.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found'
  });
});

module.exports = router;
