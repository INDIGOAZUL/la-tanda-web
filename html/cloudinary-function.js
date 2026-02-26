/**
 * Cloudinary Integration for n8n
 * 
 * This file contains functions to interact with the Cloudinary API
 * Usage: Copy the appropriate function into an n8n Function node
 */

// ====== UPLOAD IMAGE TO CLOUDINARY ======
// Copy this into a Function node and connect it after a node that provides the image
function uploadToCloudinary() {
  // Cloudinary credentials
  const cloudName = 'dxxpwgyhs';
  const apiKey = '464361955791283';
  const apiSecret = 'PMSQ4SthuxGDjJmItzb-j47RByQ';
  
  // Get binary data from previous node (assuming it has an image)
  const binaryData = $input.first().binary;
  
  if (!binaryData) {
    throw new Error('No binary data found in input');
  }
  
  // Get the binary property name (e.g., 'data')
  const binaryPropertyName = Object.keys(binaryData)[0];
  const imageData = binaryData[binaryPropertyName];
  
  // Create a signature for Cloudinary
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createSignature(`timestamp=${timestamp}`, apiSecret);
  
  // Setup for multipart/form-data upload
  const formData = {
    file: {
      value: Buffer.from(imageData.data, 'base64'),
      options: {
        filename: imageData.fileName || 'upload.jpg',
        contentType: imageData.mimeType
      }
    },
    api_key: apiKey,
    timestamp: timestamp.toString(),
    signature: signature
  };

  // Setup the request options for Cloudinary upload
  const options = {
    method: 'POST',
    url: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    formData
  };
  
  // Return the request configuration for HTTP Request node
  return {
    json: {
      requestConfig: options
    }
  };
  
  // Helper function to create signature
  function createSignature(paramsToSign, apiSecret) {
    const crypto = require('crypto');
    return crypto.createHash('sha1').update(paramsToSign + apiSecret).digest('hex');
  }
}

// ====== LIST IMAGES FROM CLOUDINARY ======
// Copy this into a Function node
function listFromCloudinary() {
  // Cloudinary credentials
  const cloudName = 'dxxpwgyhs';
  const apiKey = '464361955791283';
  const apiSecret = 'PMSQ4SthuxGDjJmItzb-j47RByQ';
  
  // Create a signature for Cloudinary
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createSignature(`timestamp=${timestamp}`, apiSecret);
  
  // Setup the request options for Cloudinary resources listing
  const options = {
    method: 'GET',
    url: `https://api.cloudinary.com/v1_1/${cloudName}/resources/image`,
    qs: {
      api_key: apiKey,
      timestamp: timestamp,
      signature: signature
    }
  };
  
  // Return the request configuration for HTTP Request node
  return {
    json: {
      requestConfig: options
    }
  };
  
  // Helper function to create signature
  function createSignature(paramsToSign, apiSecret) {
    const crypto = require('crypto');
    return crypto.createHash('sha1').update(paramsToSign + apiSecret).digest('hex');
  }
}

// ====== DELETE IMAGE FROM CLOUDINARY ======
// Copy this into a Function node
function deleteFromCloudinary() {
  // Cloudinary credentials
  const cloudName = 'dxxpwgyhs';
  const apiKey = '464361955791283';
  const apiSecret = 'PMSQ4SthuxGDjJmItzb-j47RByQ';
  
  // Get public_id from previous node
  const publicId = $input.first().json.public_id;
  
  if (!publicId) {
    throw new Error('No public_id found in input');
  }
  
  // Create a signature for Cloudinary
  const timestamp = Math.floor(Date.now() / 1000);
  const stringToSign = `public_id=${publicId}&timestamp=${timestamp}`;
  const signature = createSignature(stringToSign, apiSecret);
  
  // Setup the request options for Cloudinary delete
  const options = {
    method: 'POST',
    url: `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
    formData: {
      public_id: publicId,
      api_key: apiKey,
      timestamp: timestamp.toString(),
      signature: signature
    }
  };
  
  // Return the request configuration for HTTP Request node
  return {
    json: {
      requestConfig: options
    }
  };
  
  // Helper function to create signature
  function createSignature(paramsToSign, apiSecret) {
    const crypto = require('crypto');
    return crypto.createHash('sha1').update(paramsToSign + apiSecret).digest('hex');
  }
}

// ====== DIRECT UPLOAD WITH HTTP REQUEST NODE ======
/*
  Instead of using the Function node, you can directly configure an HTTP Request node:
  
  1. Set method to POST
  2. Set URL to https://api.cloudinary.com/v1_1/dxxpwgyhs/image/upload
  3. Add the following Headers:
     - Content-Type: multipart/form-data
  4. Add the following Body form-data parameters:
     - file: Select binary data from previous node
     - api_key: 464361955791283
     - timestamp: {{Date.now() / 1000 | round}}
     - signature: [Create using the Function node approach first]
*/