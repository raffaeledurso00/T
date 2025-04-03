// backend/test-auth.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./src/models/User');

// Connection URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://villapetriolo:petriolo2024@cluster0.mongodb.net/villapetriolo?retryWrites=true&w=majority';

async function testAuthenticationFlow() {
    try {
        console.log('🔄 Testing authentication flow...');
        console.log(`📊 Using MongoDB URI: ${MONGODB_URI}`);
        
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000,
            socketTimeoutMS: 20000,
        });
        console.log('✅ Connected to MongoDB successfully');
        
        // Create a test user
        const testEmail = `test_${Date.now()}@example.com`;
        const testPassword = 'Password123!';
        const testName = 'Test User';
        
        console.log(`👤 Creating test user: ${testEmail}`);
        
        // Check if user already exists
        let existingUser = await User.findOne({ email: testEmail });
        if (existingUser) {
            console.log('⚠️ Test user already exists, deleting...');
            await User.deleteOne({ email: testEmail });
        }
        
        // Create new user
        const newUser = new User({
            email: testEmail,
            password: testPassword,
            name: testName,
            authProvider: 'local'
        });
        
        await newUser.save();
        console.log('✅ Test user created successfully');
        
        // Verify user was saved properly
        const savedUser = await User.findOne({ email: testEmail });
        if (!savedUser) {
            throw new Error('User was not saved properly');
        }
        
        console.log('✅ User retrieval successful');
        
        // Test password hashing
        const passwordMatch = await bcrypt.compare(testPassword, savedUser.password);
        console.log(`✅ Password hashing ${passwordMatch ? 'works' : 'failed'}`);
        
        if (!passwordMatch) {
            throw new Error('Password hashing failed');
        }
        
        // Clean up
        console.log('🧹 Cleaning up test user...');
        await User.deleteOne({ email: testEmail });
        console.log('✅ Test user deleted successfully');
        
        // Disconnect from MongoDB
        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');
        
        console.log('🎉 Authentication flow test completed successfully!');
        console.log('\n✅✅✅ Your authentication system is working correctly! ✅✅✅');
        console.log('You can now register users to your MongoDB database.');
        
    } catch (error) {
        console.error('❌ Error during authentication test:', error);
        
        // Try to disconnect if connected
        try {
            if (mongoose.connection.readyState !== 0) {
                await mongoose.disconnect();
                console.log('Disconnected from MongoDB after error');
            }
        } catch (disconnectError) {
            console.error('Error disconnecting from MongoDB:', disconnectError);
        }
        
        console.log('\n❌❌❌ Authentication test failed ❌❌❌');
        process.exit(1);
    }
}

testAuthenticationFlow();