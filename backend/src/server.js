const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

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
