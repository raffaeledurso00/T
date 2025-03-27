// mini-server.js
console.log('Starting mini server...');

const express = require('express');
console.log('Express loaded');

const app = express();
console.log('Express app created');

app.get('/', (req, res) => {
  res.send('Hello World');
});

console.log('About to start listening...');
app.listen(3001, () => {
  console.log('Mini server running on port 3001');
});