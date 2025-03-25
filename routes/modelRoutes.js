const express = require('express');
const router = express.Router();
const Model = require('../models/Model');
const { generateGeminiResponse } = require('../services/geminiService');
const { Storage } = require('@google-cloud/storage');
const multer = require('multer');
const path = require('path');
const MODELS_APIKEY = process.env.MODELS_KEYPATH;

// Google Cloud Storage Configuration
const storage = new Storage({ keyFilename: MODELS_APIKEY });
const bucketName = '3dmodels-bucket';
const bucket = storage.bucket(bucketName);

// Multer Storage for Handling File Uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // Max file size: 50MB
});

// API to Upload Model to Google Cloud Storage
router.post('/upload', upload.single('modelFile'), async (req, res) => {
    console.log("Received upload request");
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        console.log("File received:", req.file.originalname);
        console.log("Model name received:", req.body.name);

        const modelName = req.body.name;
        const folderName = "models"; // Change this to your desired folder
        const fileExt = path.extname(req.file.originalname);
        const fileName = `${folderName}/${modelName}-${Date.now()}${fileExt}`;

        const blob = bucket.file(fileName);
        const blobStream = blob.createWriteStream({
            resumable: false,
            contentType: req.file.mimetype
        });

        blobStream.on('finish', async () => {
            const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;

            const newModel = new Model({ name: modelName, gcsUrl: publicUrl });
            await newModel.save();

            console.log("Upload successful:", publicUrl);
            res.status(201).json({ message: 'Model uploaded successfully', modelUrl: publicUrl });
        });

        blobStream.end(req.file.buffer);
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: 'Failed to upload model' });
    }
});

// GET: Fetch all models
router.get('/', async (req, res) => {
    try {
        const models = await Model.find();
        res.status(200).json(models);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch models' });
    }
});

// GET: Fetch full model details (including parts)
router.get('/:modelName', async (req, res) => {
    try {
        const { modelName } = req.params;
        const model = await Model.findOne({ name: modelName });

        if (!model) return res.status(404).json({ error: 'Model not found' });

        res.status(200).json(model);
    } catch (err) {
        console.error('Fetch model details error:', err);
        res.status(500).json({ error: 'Failed to fetch model details' });
    }
});

// GET: Fetch basic model info (without parts) when model is opened
router.get('/:modelName/info', async (req, res) => {
    try {
        const { modelName } = req.params;
        const model = await Model.findOne({ name: modelName }).select('-parts'); // Exclude parts

        if (!model) return res.status(404).json({ error: 'Model not found' });

        res.status(200).json({ message: 'Model info fetched', data: model });
    } catch (err) {
        console.error('Error fetching model info:', err);
        res.status(500).json({ error: 'Failed to fetch model information' });
    }
});

// GET: Fetch explanation of a part using Gemini API
router.get('/:modelName/parts/:partName/explain', async (req, res) => {
    try {
        console.log("Route hit: /:modelName/parts/:partName/explain");
        const { modelName, partName } = req.params;
        
        console.log(`Received modelName: ${modelName}, partName: ${partName}`);

        const prompt = `Explain the function of ${partName} in ${modelName}.`;
        const explanation = await generateGeminiResponse(prompt);

        res.status(200).json({ part: partName, explanation });
    } catch (err) {
        console.error('Error generating explanation:', err);
        res.status(500).json({ error: 'Failed to generate explanation' });
    }
});

// GET: Fetch all models in a specific category
router.get('/category/:categoryName', async (req, res) => {
    try {
        const { categoryName } = req.params;
        const models = await Model.find({ category: categoryName });

        if (models.length === 0) {
            return res.status(404).json({ error: 'No models found in this category' });
        }

        res.status(200).json(models);
    } catch (err) {
        console.error('Error fetching models by category:', err);
        res.status(500).json({ error: 'Failed to fetch models' });
    }
});

// GET: Search for a model by name within a category
router.get('/category/:categoryName/search', async (req, res) => {
    try {
        const { categoryName } = req.params;
        const { name } = req.query; // Extract search query from request

        if (!name) {
            return res.status(400).json({ error: 'Model name query is required' });
        }

        // Perform case-insensitive search for models within the category
        const models = await Model.find({
            category: categoryName,
            name: { $regex: new RegExp(name, 'i') } // Case-insensitive regex search
        });

        if (models.length === 0) {
            return res.status(404).json({ error: 'No models found matching the search criteria' });
        }

        res.status(200).json(models);
    } catch (err) {
        console.error('Error searching models:', err);
        res.status(500).json({ error: 'Failed to search models' });
    }
});

module.exports = router;
