// server.js
const express = require('express');
const path = require('path');
const app = express();

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public/static')));

// Serve index.html for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/pages', 'index.html'));
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Frontend running at http://localhost:${PORT}`);
});
