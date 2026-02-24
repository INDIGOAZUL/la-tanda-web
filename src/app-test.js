// src/app-test.js
const express = require('express');
const bodyParser = require('body-parser');
const apiVersionMiddleware = require('./middleware/apiVersionCheck');
const sanitizeRequestBody = require('./middleware/sanitizeRequest');
const router = require('./routes');

// Create Express application without starting the server
function createApp() {
  const app = express();
  
  // Middleware
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(apiVersionMiddleware);
  app.use(sanitizeRequestBody);
  
  // Routes
  app.use('/api', router);
  
  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  });
  
  return app;
}

module.exports = createApp;
