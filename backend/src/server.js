const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Import analytics and monitoring
const { router: analyticsRouter, trackUserActivity } = require('./analytics');
const monitor = require('./monitor');
const { getSimulator } = require('./blockchain-simulator');

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

// Initialize blockchain simulator
const simulator = getSimulator('./data');

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
    const { category, search } = req.query;
    let models = simulator.getModels();

    // Apply filters if provided
    if (search || category) {
      models = simulator.searchModels(search, category);
    }

    res.json({
      success: true,
      models: models,
      total: models.length
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
    const model = simulator.getModelById(modelId);

    if (!model) {
      return res.status(404).json({
        success: false,
        error: 'Model not found'
      });
    }

    res.json({
      success: true,
      model: model
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
    const { name, description, ipfsHash, creator, category, version, metrics } = req.body;

    if (!name || !description || !creator) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, description, creator'
      });
    }

    const model = simulator.addModel({
      name,
      description,
      ipfsHash,
      creator,
      category,
      version,
      metrics
    });

    res.json({
      success: true,
      message: 'Model registered successfully',
      model: model
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
    const stats = simulator.getUserStats(userAddress);

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
    const limit = parseInt(req.query.limit) || 10;

    const activity = simulator.getUserActivity(userAddress, limit);

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
    const activeListings = simulator.getActiveListings();

    // Transform to include model details
    const listings = activeListings.map(listing => ({
      id: listing.id,
      name: listing.model?.name || 'Unknown Model',
      description: listing.model?.description || '',
      price: listing.price,
      seller: listing.seller,
      purchases: listing.purchases || 0,
      category: listing.model?.category || 'Uncategorized',
      modelId: listing.modelId,
      ipfsHash: listing.model?.ipfsHash,
      version: listing.model?.version,
      metrics: listing.model?.metrics,
      createdAt: listing.createdAt
    }));

    res.json({
      success: true,
      listings: listings,
      total: listings.length
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
    const { modelId, price, seller } = req.body;

    if (!modelId || !price || !seller) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: modelId, price, seller'
      });
    }

    const listing = simulator.createListing({
      modelId: parseInt(modelId),
      price,
      seller
    });

    res.json({
      success: true,
      message: 'Listing created successfully',
      listing: listing
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Purchase a model
app.post('/api/marketplace/purchase', async (req, res) => {
  try {
    const { listingId, buyer } = req.body;

    if (!listingId || !buyer) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: listingId, buyer'
      });
    }

    const purchase = simulator.purchaseModel(listingId, buyer);

    res.json({
      success: true,
      message: 'Model purchased successfully',
      purchase: purchase
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get platform statistics
app.get('/api/platform/stats', async (req, res) => {
  try {
    const stats = simulator.getPlatformStats();

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
