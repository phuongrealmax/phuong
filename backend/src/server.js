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
const { getMonetization } = require('./monetization');
const { getVerification } = require('./model-verification');

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

// Initialize blockchain simulator, monetization, and verification
const simulator = getSimulator('./data');
const monetization = getMonetization('./data');
const verification = getVerification('./data');

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

    // Auto-verify the model
    const verificationResult = verification.verifyModel(model.id, model);

    res.json({
      success: true,
      message: 'Model registered and verified successfully',
      model: model,
      verification: verificationResult
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

    // Process platform fee
    const feeDetails = monetization.processSale({
      listingId: purchase.listingId,
      modelId: purchase.modelId,
      buyer: purchase.buyer,
      seller: purchase.seller,
      price: purchase.price,
      txHash: purchase.txHash
    });

    res.json({
      success: true,
      message: 'Model purchased successfully',
      purchase: purchase,
      fees: {
        platformFee: feeDetails.platformFee,
        sellerAmount: feeDetails.sellerAmount,
        feeMessage: feeDetails.message
      }
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

// ===== MONETIZATION ENDPOINTS =====

// Get subscription tiers and pricing
app.get('/api/monetization/tiers', (req, res) => {
  try {
    const tiers = monetization.getSubscriptionTiers();
    res.json({
      success: true,
      tiers: tiers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Subscribe to a tier
app.post('/api/monetization/subscribe', async (req, res) => {
  try {
    const { userAddress, tier, duration } = req.body;

    if (!userAddress || !tier) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userAddress, tier'
      });
    }

    const subscription = monetization.subscribe(userAddress, tier, duration || 30);

    res.json({
      success: true,
      message: 'Subscription created successfully',
      subscription: subscription
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user subscription
app.get('/api/monetization/subscription/:address', (req, res) => {
  try {
    const userAddress = req.params.address;
    const subscription = monetization.getUserSubscription(userAddress);

    res.json({
      success: true,
      subscription: subscription
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Stake tokens
app.post('/api/monetization/stake', async (req, res) => {
  try {
    const { userAddress, amount, lockPeriod } = req.body;

    if (!userAddress || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userAddress, amount'
      });
    }

    const stake = monetization.stake(userAddress, amount, lockPeriod || 'flexible');

    res.json({
      success: true,
      message: 'Tokens staked successfully',
      stake: stake
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user stakes
app.get('/api/monetization/stakes/:address', (req, res) => {
  try {
    const userAddress = req.params.address;
    const stakes = monetization.getUserStakes(userAddress);

    res.json({
      success: true,
      stakes: stakes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Claim staking rewards
app.post('/api/monetization/claim-rewards', async (req, res) => {
  try {
    const { stakeId, userAddress } = req.body;

    if (!stakeId || !userAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: stakeId, userAddress'
      });
    }

    const claim = monetization.claimRewards(stakeId, userAddress);

    res.json({
      success: true,
      message: 'Rewards claimed successfully',
      claim: claim
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Unstake tokens
app.post('/api/monetization/unstake', async (req, res) => {
  try {
    const { stakeId, userAddress } = req.body;

    if (!stakeId || !userAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: stakeId, userAddress'
      });
    }

    const result = monetization.unstake(stakeId, userAddress);

    res.json({
      success: true,
      message: 'Tokens unstaked successfully',
      result: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get revenue summary
app.get('/api/monetization/revenue', (req, res) => {
  try {
    const revenue = monetization.getRevenueSummary();

    res.json({
      success: true,
      revenue: revenue
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get platform fees collected
app.get('/api/monetization/fees', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const fees = monetization.getAllFees(limit);

    res.json({
      success: true,
      fees: fees,
      total: fees.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===== MODEL VERIFICATION & QUALITY ASSURANCE =====

// Get model verification status
app.get('/api/verification/model/:id', (req, res) => {
  try {
    const modelId = parseInt(req.params.id);
    const status = verification.getVerificationStatus(modelId);

    res.json({
      success: true,
      verification: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get model trust score
app.get('/api/verification/trust-score/:id', (req, res) => {
  try {
    const modelId = parseInt(req.params.id);
    const trustScore = verification.getTrustScore(modelId);

    res.json({
      success: true,
      trustScore: trustScore
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Rate a model
app.post('/api/verification/rate', async (req, res) => {
  try {
    const { modelId, userAddress, rating, review } = req.body;

    if (!modelId || !userAddress || !rating) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: modelId, userAddress, rating'
      });
    }

    const ratingResult = verification.rateModel(
      parseInt(modelId),
      userAddress,
      parseInt(rating),
      review
    );

    res.json({
      success: true,
      message: 'Rating submitted successfully',
      rating: ratingResult
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get model ratings
app.get('/api/verification/ratings/:id', (req, res) => {
  try {
    const modelId = parseInt(req.params.id);
    const ratings = verification.getModelRatings(modelId);

    res.json({
      success: true,
      ratings: ratings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Report a model
app.post('/api/verification/report', async (req, res) => {
  try {
    const { modelId, userAddress, reason, description } = req.body;

    if (!modelId || !userAddress || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: modelId, userAddress, reason'
      });
    }

    const report = verification.reportModel(
      parseInt(modelId),
      userAddress,
      reason,
      description
    );

    res.json({
      success: true,
      message: 'Report submitted successfully',
      report: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get verified models
app.get('/api/verification/verified-models', (req, res) => {
  try {
    const verifiedModels = verification.getVerifiedModels();
    const premiumModels = verification.getPremiumModels();

    res.json({
      success: true,
      verified: verifiedModels,
      premium: premiumModels,
      counts: {
        verified: verifiedModels.length,
        premium: premiumModels.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Run inference (DEMO - shows value of AI models)
app.post('/api/inference', async (req, res) => {
  try {
    const { modelId, input, userAddress } = req.body;

    if (!modelId || !input) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: modelId, input'
      });
    }

    // Get model details
    const model = simulator.getModelById(modelId);
    if (!model) {
      return res.status(404).json({
        success: false,
        error: 'Model not found'
      });
    }

    // Check if model is verified
    const verificationStatus = verification.getVerificationStatus(modelId);
    if (verificationStatus.status !== 'verified') {
      return res.status(403).json({
        success: false,
        error: 'Only verified models can run inference',
        verification: verificationStatus
      });
    }

    // Track API usage for billing
    if (userAddress) {
      const usage = monetization.trackAPIUsage(userAddress, 'inference', 1);
      if (usage.overageCharges > 0) {
        console.log(`User ${userAddress} incurred overage charges: ${usage.overageCharges} ETH`);
      }
    }

    // DEMO inference - In production would call actual AI model
    let output;
    const category = model.category.toLowerCase();

    if (category.includes('language') || category.includes('nlp')) {
      // Language model demo
      output = {
        text: `[${model.name} Response]: This is a demo response to: "${input.substring(0, 100)}...". In production, this would be actual AI-generated text from the model trained on ${(model.metrics?.parameters / 1000000000).toFixed(1)}B parameters with ${(model.metrics?.accuracy * 100).toFixed(1)}% accuracy.`,
        confidence: 0.92,
        tokens: 150
      };
    } else if (category.includes('vision') || category.includes('image')) {
      // Vision model demo
      output = {
        classifications: [
          { label: 'Object A', confidence: 0.95 },
          { label: 'Object B', confidence: 0.87 },
          { label: 'Object C', confidence: 0.72 }
        ],
        detectedObjects: 3,
        accuracy: model.metrics?.accuracy || 0.96
      };
    } else if (category.includes('audio')) {
      // Audio model demo
      output = {
        classification: 'Speech',
        confidence: 0.89,
        transcription: '[Demo transcription of audio input]',
        duration: '2.5s'
      };
    } else {
      // Generic demo
      output = {
        result: `Processed by ${model.name}`,
        confidence: 0.85,
        model_version: model.version
      };
    }

    res.json({
      success: true,
      modelId: modelId,
      modelName: model.name,
      input: input.substring(0, 200), // Truncate for response
      output: output,
      timestamp: Date.now(),
      processingTime: `${Math.random() * 500 + 100}ms`,
      demo: true,
      message: 'This is a demo inference. In production, this would call the actual AI model.'
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
