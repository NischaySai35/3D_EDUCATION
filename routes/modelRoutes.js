const express = require('express');
const router = express.Router();
const Model = require('../model');
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
    limits: { fileSize: 100 * 1024 * 1024 } // Max file size: 100MB
});

// API to Upload Model to Google Cloud Storage
router.post('/upload', upload.single('modelFile'), async (req, res) => {
    console.log("Received upload request");
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        console.log("File received:", req.file.originalname);
        console.log("Model name received:", req.body.name);
        console.log("Category received:", req.body.category);

        const modelName = req.body.name;
        const category = req.body.category;
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
            const newModel = new Model({ name: modelName, category: category, gcsUrl: publicUrl });
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

//GET model url for model viewewr viewer
router.get('/getmodel/:modelName', async (req, res) => {
    try {
        const { modelName } = req.params;
        const model = await Model.findOne({ name: modelName });

        if (!model) return res.status(404).json({ error: 'Model not found' });

        res.status(200).json({ gcsUrl: model.gcsUrl });
    } catch (err) {
        console.error('Error fetching model URL:', err);
        res.status(500).json({ error: 'Failed to fetch model URL' });
    }
});

// GET: Fetch all models in a specific category
router.get('/category/:category', async (req, res) => {
    try {
        const category = req.params.category;
        console.log('Received category request:', category); // Debugging
        
        const models = await Model.find({ category });
        if (!models.length) {
            return res.status(404).json({ success: false, error: 'No models found' });
        }

        res.status(200).json({ success: true, models });
    } catch (err) {
        console.error('Error fetching models by category:', err);
        res.status(500).json({ error: 'Failed to fetch models' });
    }
});

// GET: Fetch explanation of a part using Gemini API
router.get('/:modelName/parts/:partName/explain', async (req, res) => {
    try {
        console.log("Route hit: /:modelName/parts/:partName/explain");
        const { modelName, partName } = req.params;
        
        console.log(`Received modelName: ${modelName}, partName: ${partName}`);

        const prompt = `Explain the function of ${partName} in ${modelName} in 6 headings and description.`;
        const explanation = await generateGeminiResponse(prompt);

        res.status(200).json({ part: partName, explanation });
    } catch (err) {
        console.error('Error generating explanation:', err);
        res.status(500).json({ error: 'Failed to generate explanation' });
    }
});

module.exports = router;
