// src/server.js
const app = require('./app');

// Get port from environment or default to 3000
const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Health check: http://localhost:${PORT}/api/health`);
  console.log(`API Validation test: http://localhost:${PORT}/api/validation-test?testParam=value`);
});
