// src/middleware/apiVersionCheck.js

// List of supported API versions
const SUPPORTED_VERSIONS = ['1.0', '1.1'];

/**
 * Middleware to validate API version from request headers
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void}
 */
const apiVersionMiddleware = (req, res, next) => {
  const apiVersion = req.headers['x-api-version'];
  
  // Check if API version header exists
  if (!apiVersion) {
    return res.status(400).json({
      status: 'error',
      message: 'API version header is required'
    });
  }
  
  // Check if API version is supported
  if (!SUPPORTED_VERSIONS.includes(apiVersion)) {
    return res.status(400).json({
      status: 'error',
      message: 'API version not supported',
      supportedVersions: SUPPORTED_VERSIONS
    });
  }
  
  // Store API version in request for potential use in route handlers
  req.apiVersion = apiVersion;
  next();
};

module.exports = apiVersionMiddleware;
