/* backend/src/middleware/corsMiddleware.js
module.exports = function(req, res, next) {
    // Set CORS headers for all responses
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, X-Session-ID, Accept, Origin");
    
    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    next();
};*/