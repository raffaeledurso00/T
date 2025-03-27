// test-server.js
const express = require('express');
const app = express();
const PORT = 3001;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Test server is running' });
});

app.post('/test', (req, res) => {
  console.log('Received request:', req.body);
  res.json({ status: 'ok', received: req.body });
});

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});