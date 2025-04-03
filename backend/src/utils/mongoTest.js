// mongoTest.js - Utility to test MongoDB connection
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://villapetriolo:petriolo2024@cluster0.mongodb.net/villapetriolo?retryWrites=true&w=majority';

async function testConnection() {
    try {
        console.log(`Attempting to connect to MongoDB at: ${MONGODB_URI}`);
        
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000,
            socketTimeoutMS: 10000,
            family: 4,
            retryWrites: true,
            retryReads: true
        });
        
        console.log('MongoDB connected successfully!');
        
        // Test User creation
        const testEmail = `test_${Date.now()}@example.com`;
        console.log(`Creating test user with email: ${testEmail}`);
        
        const user = new User({
            email: testEmail,
            password: 'password123',
            name: 'Test User',
            authProvider: 'local'
        });
        
        await user.save();
        console.log('Test user created successfully!');
        console.log(user);
        
        // Delete test user
        await User.deleteOne({ email: testEmail });
        console.log('Test user deleted successfully!');
        
        // Close connection
        await mongoose.disconnect();
        console.log('MongoDB disconnected.');
        
        return true;
    } catch (error) {
        console.error('MongoDB connection test failed:', error);
        return false;
    }
}

// Execute the test if this script is run directly
if (require.main === module) {
    testConnection()
        .then(success => {
            console.log(`MongoDB test ${success ? 'passed' : 'failed'}`);
            process.exit(success ? 0 : 1);
        })
        .catch(err => {
            console.error('Unexpected error during MongoDB test:', err);
            process.exit(1);
        });
}

module.exports = { testConnection };