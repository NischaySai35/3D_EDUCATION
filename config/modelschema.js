const mongoose = require('mongoose');

const ModelSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }, // Model name (must be unique)
    gcsUrl: { type: String, required: true },  // Google Cloud Storage URL of the model  
    category: { type: String, required: true } 
});

const Model = mongoose.model('Model', ModelSchema);
module.exports = Model;
