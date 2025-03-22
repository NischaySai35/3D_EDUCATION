// Import required modules
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const connectDB = require('./db');

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
const modelRoutes = require('./routes/modelRoutes');
const { generateGeminiResponse } = require('./services/geminiService');

app.use('/api/models', modelRoutes);

// API Route: Generate AI Explanation for 3D Models
app.post('/api/gemini/generate', async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const generatedText = await generateGeminiResponse(prompt);

        res.status(200).json({ generatedText });
    } catch (err) {
        console.error('Gemini API Error:', err.message);
        res.status(500).json({ error: 'Failed to generate content', details: err.message });
    }
});

// Default route
app.get('/', (req, res) => {
    res.send('Server is running...');
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
