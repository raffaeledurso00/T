// src/utils/mongoFallback.js
const mongoose = require('mongoose');
const { isMongoFallbackMode } = require('../config/database');

// Import mock data
const villaInfoData = require('../data/villaInfo');
const servicesData = require('../data/services');
const eventsData = require('../data/events');
const restaurantData = require('../data/restaurant');

// In-memory mock collections
const collections = {
    villainfo: [villaInfoData],
    service: servicesData,
    event: eventsData,
    booking: [],
    restaurant: [restaurantData]
};

// Override Mongoose methods if in fallback mode
const setupMongoFallbacks = () => {
    if (isMongoFallbackMode) {
        console.log('Setting up MongoDB fallbacks with mock data');
        
        // Save original methods
        const originalModel = mongoose.model;
        const originalConnect = mongoose.connect;
        
        // Override connect to avoid repeated connection attempts
        mongoose.connect = async function(...args) {
            console.log('MongoDB connect called in fallback mode - not actually connecting');
            return Promise.resolve();
        };
        
        // Override model function
        mongoose.model = function(name, schema) {
            const lowerName = name.toLowerCase();
            
            // Create a mock model that uses our in-memory collections
            const mockModel = function(data) {
                if (data) {
                    // If data is provided, "save" it to our collection
                    data._id = data._id || mongoose.Types.ObjectId().toString();
                    data.save = () => Promise.resolve(data);
                    collections[lowerName] = collections[lowerName] || [];
                    collections[lowerName].push(data);
                    return data;
                }
                return null;
            };
            
            // Add instance methods
            mockModel.prototype = {
                save: function() {
                    const lowerName = this.constructor.modelName.toLowerCase();
                    collections[lowerName] = collections[lowerName] || [];
                    this._id = this._id || mongoose.Types.ObjectId().toString();
                    
                    // Check if this document already exists
                    const index = collections[lowerName].findIndex(item => 
                        item._id && item._id.toString() === this._id.toString());
                    
                    if (index >= 0) {
                        collections[lowerName][index] = this;
                    } else {
                        collections[lowerName].push(this);
                    }
                    
                    return Promise.resolve(this);
                }
            };
            
            // Add static methods to the mock model
            mockModel.find = async function(query = {}) {
                try {
                    const collection = collections[lowerName] || [];
                    // Simple filtering based on query criteria
                    if (Object.keys(query).length === 0) {
                        return collection;
                    }
                    
                    return collection.filter(item => {
                        for (const key in query) {
                            if (item[key] !== query[key]) {
                                return false;
                            }
                        }
                        return true;
                    });
                } catch (error) {
                    console.error(`Error in mock find for ${lowerName}:`, error);
                    return [];
                }
            };
            
            mockModel.findOne = async function(query = {}) {
                try {
                    const collection = collections[lowerName] || [];
                    if (Object.keys(query).length === 0) {
                        return collection[0] || null;
                    }
                    
                    return collection.find(item => {
                        for (const key in query) {
                            if (item[key] !== query[key]) {
                                return false;
                            }
                        }
                        return true;
                    }) || null;
                } catch (error) {
                    console.error(`Error in mock findOne for ${lowerName}:`, error);
                    return null;
                }
            };
            
            mockModel.findById = async function(id) {
                try {
                    if (!id) return null;
                    const collection = collections[lowerName] || [];
                    return collection.find(item => item._id && item._id.toString() === id.toString()) || null;
                } catch (error) {
                    console.error(`Error in mock findById for ${lowerName}:`, error);
                    return null;
                }
            };
            
            mockModel.create = async function(data) {
                try {
                    if (Array.isArray(data)) {
                        return Promise.all(data.map(item => this.create(item)));
                    }
                    
                    const newItem = { ...data };
                    newItem._id = newItem._id || mongoose.Types.ObjectId().toString();
                    collections[lowerName] = collections[lowerName] || [];
                    collections[lowerName].push(newItem);
                    return newItem;
                } catch (error) {
                    console.error(`Error in mock create for ${lowerName}:`, error);
                    return null;
                }
            };
            
            mockModel.deleteMany = async function(query = {}) {
                try {
                    if (Object.keys(query).length === 0) {
                        const count = (collections[lowerName] || []).length;
                        collections[lowerName] = [];
                        return { deletedCount: count };
                    }
                    
                    const originalCount = (collections[lowerName] || []).length;
                    collections[lowerName] = (collections[lowerName] || []).filter(item => {
                        for (const key in query) {
                            if (item[key] === query[key]) {
                                return false;
                            }
                        }
                        return true;
                    });
                    
                    return { deletedCount: originalCount - (collections[lowerName] || []).length };
                } catch (error) {
                    console.error(`Error in mock deleteMany for ${lowerName}:`, error);
                    return { deletedCount: 0 };
                }
            };
            
            mockModel.insertMany = async function(items) {
                try {
                    collections[lowerName] = collections[lowerName] || [];
                    const newItems = items.map(item => {
                        const newItem = { ...item };
                        newItem._id = newItem._id || mongoose.Types.ObjectId().toString();
                        collections[lowerName].push(newItem);
                        return newItem;
                    });
                    return newItems;
                } catch (error) {
                    console.error(`Error in mock insertMany for ${lowerName}:`, error);
                    return [];
                }
            };
            
            // Add model name property
            mockModel.modelName = name;
            
            // Try to use the real model if available, otherwise use mock
            try {
                return originalModel.call(mongoose, name, schema);
            } catch (error) {
                console.log(`Using fallback for model: ${name}`);
                return mockModel;
            }
        };
        
        // Create a mock ObjectId function
        mongoose.Types = mongoose.Types || {};
        mongoose.Types.ObjectId = (id) => {
            return {
                toString: () => id || Math.random().toString(36).substring(2, 15)
            };
        };
        
        console.log('MongoDB fallbacks set up successfully');
    }
};

module.exports = setupMongoFallbacks;