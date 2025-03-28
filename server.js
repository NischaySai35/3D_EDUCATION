// Import required modules
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const connectDB = require('./db');
const path = require('path');
const open = require('open')

// Initialize Express app
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());  // Enable CORS
app.use(bodyParser.json()); // Parse JSON request body
app.use(express.json());  // Alternative to body-parser

// Connect to MongoDB
connectDB();

// Routes
const Routes = require('./routes/modelRoutes');
const { generateGeminiResponse } = require('./services/geminiService');

app.use('/api', Routes);
// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname)));
// Default route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
const { exec } = require('child_process');

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    exec(`start http://localhost:${port}`); // Windows
});
