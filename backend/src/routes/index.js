// backend/src/routes/index.js
const express = require('express');
const router = express.Router();
const mistralRoutes = require('./mistralRoutes');
const chatRoutes = require('./chatRoutes');
const bookingRoutes = require('./bookingRoutes');
const authRoutes = require('./authRoutes');  // Aggiungi questa linea

// Main routes
router.use('/chat', mistralRoutes);
router.use('/openai', chatRoutes);
router.use('/bookings', bookingRoutes);
router.use('/auth', authRoutes);  // Aggiungi questa linea

module.exports = router;