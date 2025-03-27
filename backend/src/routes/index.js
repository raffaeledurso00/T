// backend/src/routes/index.js
const express = require('express');
const router = express.Router();
const mistralRoutes = require('./mistralRoutes');
const chatRoutes = require('./chatRoutes');

// Main routes
router.use('/chat', mistralRoutes);
router.use('/openai', chatRoutes);

module.exports = router;