// Import required modules
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./db');
const path = require('path');
const open = require('open'); // Changed from await import('open')

// Initialize Express app
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: 'http://localhost:3000' }));  // Enable CORS
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
    res.sendFile(path.join(__dirname,'index.html'));
});

// Start the server
const { exec } = require('child_process');

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
<<<<<<< HEAD
    exec(`start http://localhost:${port}`); // Windows
=======

    // Open the URL in the default browser
    exec(`start http://localhost:${port}`, (err) => {
        if (err) {
            console.error("Error opening browser:", err);
        }
    });
>>>>>>> f7bb9ae206690c98af0860d527d35af09018e1e3
});

