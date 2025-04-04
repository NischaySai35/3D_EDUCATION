import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/mongodb.js';
import Routes from './routes/modelRoutes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Setup __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use('/api', Routes);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);

  // Only open browser in development
  if (process.env.NODE_ENV !== 'production') {
    import('open').then((open) => {
      open.default(`http://localhost:${port}`).catch((err) => {
        console.error("Error opening browser:", err);
      });
    });
  }
});
