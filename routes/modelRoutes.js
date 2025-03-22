const express = require('express');
const router = express.Router();
const Model = require('../models/Model');
const { generateGeminiResponse } = require('../services/geminiService');
const { Storage } = require('@google-cloud/storage');
const multer = require('multer');
const path = require('path');

// Google Cloud Storage Configuration
const storage = new Storage({ keyFilename: 'path/to/your/google-cloud-key.json' });
const bucketName = 'your-google-cloud-bucket-name';
const bucket = storage.bucket(bucketName);

// Multer Storage for Handling File Uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // Max file size: 50MB
});

// API to Upload Model to Google Cloud Storage
router.post('/upload', upload.single('modelFile'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const modelName = req.body.name;
        const fileExt = path.extname(req.file.originalname);
        const fileName = `${modelName}-${Date.now()}${fileExt}`;

        // Upload file to Google Cloud Storage
        const blob = bucket.file(fileName);
        const blobStream = blob.createWriteStream({
            resumable: false,
            contentType: req.file.mimetype
        });

        blobStream.on('finish', async () => {
            await blob.makePublic();
            const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;

            // Save model details in MongoDB
            const newModel = new Model({ name: modelName, gcsUrl: publicUrl });
            await newModel.save();

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
        const { modelName, partName } = req.params;
        const prompt = `Explain the function of ${partName} in ${modelName}.`;
        const explanation = await generateGeminiResponse(prompt);

        res.status(200).json({ part: partName, explanation });
    } catch (err) {
        console.error('Error generating explanation:', err);
        res.status(500).json({ error: 'Failed to generate explanation' });
    }
});

module.exports = router;
