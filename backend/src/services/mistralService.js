// backend/src/services/mistralService.js
// This file is maintained for backward compatibility with existing files
// It simply redirects to the modular implementation

const mistralService = require('./mistral');

// Export the service instance from the modular implementation
module.exports = mistralService;