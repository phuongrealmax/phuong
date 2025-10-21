const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Import analytics and monitoring
const { router: analyticsRouter, trackUserActivity } = require('./analytics');
const monitor = require('./monitor');

// Middleware
app.use(cors());
app.use(express.json());

// Performance monitoring middleware
app.use(monitor.trackRequest());

// Activity tracking middleware
app.use((req, res, next) => {
  // Track API requests
  const userAddress = req.headers['x-user-address'] || req.query.address || req.body.address;

  if (userAddress && userAddress.startsWith('0x')) {
    trackUserActivity(userAddress, {
      type: 'api_request',
      metadata: {
        path: req.path,
        method: req.method,
        timestamp: Date.now()
      }
    });
  }

  next();
});

// Web3 setup
let provider;
let contract;

if (process.env.RPC_URL && process.env.CONTRACT_ADDRESS) {
  provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  // Contract ABI would be imported from compiled contracts
  // contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, ABI, provider);
}

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'MonaAI Backend API'
  });
});

// Get all models
app.get('/api/models', async (req, res) => {
  try {
    // This would query the blockchain for all models
    // For now, return a placeholder
    res.json({
      success: true,
      models: []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get model by ID
app.get('/api/models/:id', async (req, res) => {
  try {
    const modelId = req.params.id;

    // Query blockchain for model details
    // const model = await contract.getModel(modelId);

    res.json({
      success: true,
      model: {
        id: modelId,
        // ... other model details
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Register a new model
app.post('/api/models/register', async (req, res) => {
  try {
    const { name, ipfsHash, privateKey } = req.body;

    if (!name || !ipfsHash || !privateKey) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, ipfsHash, privateKey'
      });
    }

    // Create wallet from private key
    const wallet = new ethers.Wallet(privateKey, provider);
    // const contractWithSigner = contract.connect(wallet);

    // Register model on blockchain
    // const tx = await contractWithSigner.registerModel(name, ipfsHash);
    // await tx.wait();

    res.json({
      success: true,
      message: 'Model registered successfully',
      // transactionHash: tx.hash
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Run inference
app.post('/api/inference', async (req, res) => {
  try {
    const { modelId, input } = req.body;

    if (!modelId || !input) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: modelId, input'
      });
    }

    // This would call the AI inference service
    // For now, return a placeholder
    res.json({
      success: true,
      result: 'Inference result placeholder',
      modelId: modelId,
      input: input
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user models
app.get('/api/users/:address/models', async (req, res) => {
  try {
    const userAddress = req.params.address;

    // Query blockchain for user's models
    // const modelIds = await contract.getUserModels(userAddress);

    res.json({
      success: true,
      address: userAddress,
      models: []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user stats
app.get('/api/users/:address/stats', async (req, res) => {
  try {
    const userAddress = req.params.address;

    // Mock data for now
    const stats = {
      totalModels: 3,
      userModels: 2,
      totalPurchases: 5,
      totalEarnings: 2.5
    };

    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user activity
app.get('/api/users/:address/activity', async (req, res) => {
  try {
    const userAddress = req.params.address;

    // Mock activity data
    const activity = [
      {
        type: 'register',
        description: 'Registered new AI model "GPT-Mona"',
        timestamp: '2 hours ago',
        amount: null
      },
      {
        type: 'purchase',
        description: 'Purchased "Sentiment Analyzer Pro"',
        timestamp: '5 hours ago',
        amount: '0.5'
      },
      {
        type: 'sale',
        description: 'Your model was purchased',
        timestamp: '1 day ago',
        amount: '1.2'
      }
    ];

    res.json({
      success: true,
      activity: activity
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Marketplace endpoints

// Get marketplace listings
app.get('/api/marketplace/listings', async (req, res) => {
  try {
    // Mock marketplace listings
    const listings = [
      {
        id: 1,
        name: 'GPT-Mona AI Model',
        description: 'Advanced language model for text generation',
        price: '0.5',
        seller: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        purchases: 12,
        category: 'Language Model'
      },
      {
        id: 2,
        name: 'Image Classifier Pro',
        description: 'State-of-the-art image classification model',
        price: '1.2',
        seller: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        purchases: 8,
        category: 'Computer Vision'
      },
      {
        id: 3,
        name: 'Sentiment Analyzer',
        description: 'Analyze sentiment in text with high accuracy',
        price: '0.3',
        seller: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
        purchases: 25,
        category: 'NLP'
      }
    ];

    res.json({
      success: true,
      listings: listings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create marketplace listing
app.post('/api/marketplace/create', async (req, res) => {
  try {
    const { modelId, price, privateKey } = req.body;

    if (!modelId || !price || !privateKey) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // This would interact with the marketplace contract
    res.json({
      success: true,
      message: 'Listing created successfully',
      listingId: Math.floor(Math.random() * 1000)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Analytics routes
app.use('/api/analytics', analyticsRouter);

// Monitor/Performance routes
app.get('/api/monitor/metrics', (req, res) => {
  res.json({
    success: true,
    metrics: monitor.getMetrics()
  });
});

app.get('/api/monitor/health', (req, res) => {
  const health = monitor.getHealthStatus();
  const statusCode = health.status === 'healthy' ? 200 : health.status === 'warning' ? 200 : 503;

  res.status(statusCode).json({
    success: true,
    health: health
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`MonaAI Backend API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
