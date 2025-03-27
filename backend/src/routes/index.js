// backend/src/routes/index.js
const express = require('express');
const router = express.Router();
const mistralRoutes = require('./mistralRoutes');
const chatRoutes = require('./chatRoutes');
const bookingRoutes = require('./bookingRoutes');

// Main routes
router.use('/chat', mistralRoutes);
router.use('/openai', chatRoutes);
router.use('/bookings', bookingRoutes);

module.exports = router;