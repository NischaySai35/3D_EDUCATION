import mongoose from 'mongoose';

const ModelSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // Model name (must be unique)
  gcsUrl: { type: String, required: true },             // Google Cloud Storage URL of the model  
  category: { type: String, required: true }            // Category of the model
});

const Model = mongoose.model('Model', ModelSchema);
export default Model;
