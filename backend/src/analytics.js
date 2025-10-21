const express = require('express');
const router = express.Router();

/**
 * Analytics Service for MonaAI Platform
 * Tracks usage, performance, and user behavior
 */

// In-memory storage (use Redis or DB in production)
const analytics = {
  models: {
    total: 0,
    byCategory: {},
    byCreator: {},
    registrationsOverTime: []
  },
  marketplace: {
    totalListings: 0,
    totalSales: 0,
    totalVolume: 0,
    salesOverTime: []
  },
  users: {
    totalUsers: 0,
    activeUsers: 0,
    userActivity: {}
  },
  inference: {
    totalRequests: 0,
    averageLatency: 0,
    requestsOverTime: []
  }
};

/**
 * Track model registration
 */
function trackModelRegistration(modelData) {
  analytics.models.total++;

  // Track by category
  const category = modelData.category || 'uncategorized';
  analytics.models.byCategory[category] = (analytics.models.byCategory[category] || 0) + 1;

  // Track by creator
  const creator = modelData.creator;
  analytics.models.byCreator[creator] = (analytics.models.byCreator[creator] || 0) + 1;

  // Track over time
  analytics.models.registrationsOverTime.push({
    timestamp: Date.now(),
    modelId: modelData.id,
    creator: creator
  });

  // Keep only last 1000 entries
  if (analytics.models.registrationsOverTime.length > 1000) {
    analytics.models.registrationsOverTime.shift();
  }
}

/**
 * Track marketplace sale
 */
function trackSale(saleData) {
  analytics.marketplace.totalSales++;
  analytics.marketplace.totalVolume += parseFloat(saleData.price || 0);

  analytics.marketplace.salesOverTime.push({
    timestamp: Date.now(),
    listingId: saleData.listingId,
    price: saleData.price,
    buyer: saleData.buyer,
    seller: saleData.seller
  });

  // Keep only last 1000 entries
  if (analytics.marketplace.salesOverTime.length > 1000) {
    analytics.marketplace.salesOverTime.shift();
  }
}

/**
 * Track user activity
 */
function trackUserActivity(address, action) {
  if (!analytics.users.userActivity[address]) {
    analytics.users.userActivity[address] = {
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      actions: []
    };
    analytics.users.totalUsers++;
  }

  analytics.users.userActivity[address].lastSeen = Date.now();
  analytics.users.userActivity[address].actions.push({
    type: action.type,
    timestamp: Date.now(),
    metadata: action.metadata
  });

  // Keep only last 100 actions per user
  if (analytics.users.userActivity[address].actions.length > 100) {
    analytics.users.userActivity[address].actions.shift();
  }

  // Update active users (active in last 24 hours)
  updateActiveUsers();
}

/**
 * Track inference request
 */
function trackInference(inferenceData) {
  analytics.inference.totalRequests++;

  // Update average latency
  if (inferenceData.latency) {
    const totalLatency = analytics.inference.averageLatency * (analytics.inference.totalRequests - 1);
    analytics.inference.averageLatency = (totalLatency + inferenceData.latency) / analytics.inference.totalRequests;
  }

  analytics.inference.requestsOverTime.push({
    timestamp: Date.now(),
    modelId: inferenceData.modelId,
    latency: inferenceData.latency,
    success: inferenceData.success
  });

  // Keep only last 1000 entries
  if (analytics.inference.requestsOverTime.length > 1000) {
    analytics.inference.requestsOverTime.shift();
  }
}

/**
 * Update active users count
 */
function updateActiveUsers() {
  const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
  analytics.users.activeUsers = Object.values(analytics.users.userActivity)
    .filter(user => user.lastSeen > oneDayAgo)
    .length;
}

/**
 * Get analytics summary
 */
function getAnalyticsSummary() {
  updateActiveUsers();

  return {
    models: {
      total: analytics.models.total,
      byCategory: analytics.models.byCategory,
      topCreators: getTopCreators(5)
    },
    marketplace: {
      totalListings: analytics.marketplace.totalListings,
      totalSales: analytics.marketplace.totalSales,
      totalVolume: analytics.marketplace.totalVolume.toFixed(4),
      averageSalePrice: analytics.marketplace.totalSales > 0
        ? (analytics.marketplace.totalVolume / analytics.marketplace.totalSales).toFixed(4)
        : 0
    },
    users: {
      totalUsers: analytics.users.totalUsers,
      activeUsers: analytics.users.activeUsers
    },
    inference: {
      totalRequests: analytics.inference.totalRequests,
      averageLatency: analytics.inference.averageLatency.toFixed(2)
    }
  };
}

/**
 * Get top creators
 */
function getTopCreators(limit = 10) {
  return Object.entries(analytics.models.byCreator)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([address, count]) => ({ address, count }));
}

/**
 * Get time series data
 */
function getTimeSeries(metric, timeRange = '24h') {
  const now = Date.now();
  let timeAgo;

  switch (timeRange) {
    case '1h':
      timeAgo = now - (60 * 60 * 1000);
      break;
    case '24h':
      timeAgo = now - (24 * 60 * 60 * 1000);
      break;
    case '7d':
      timeAgo = now - (7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      timeAgo = now - (30 * 24 * 60 * 60 * 1000);
      break;
    default:
      timeAgo = now - (24 * 60 * 60 * 1000);
  }

  let data = [];

  switch (metric) {
    case 'registrations':
      data = analytics.models.registrationsOverTime;
      break;
    case 'sales':
      data = analytics.marketplace.salesOverTime;
      break;
    case 'inference':
      data = analytics.inference.requestsOverTime;
      break;
  }

  return data.filter(item => item.timestamp > timeAgo);
}

// API Routes

/**
 * Get analytics overview
 */
router.get('/overview', (req, res) => {
  try {
    const summary = getAnalyticsSummary();
    res.json({
      success: true,
      analytics: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get time series data
 */
router.get('/timeseries/:metric', (req, res) => {
  try {
    const { metric } = req.params;
    const { range } = req.query;

    const data = getTimeSeries(metric, range || '24h');

    res.json({
      success: true,
      metric: metric,
      range: range || '24h',
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get top creators
 */
router.get('/top-creators', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const creators = getTopCreators(limit);

    res.json({
      success: true,
      creators: creators
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get user analytics
 */
router.get('/users/:address', (req, res) => {
  try {
    const { address } = req.params;
    const userActivity = analytics.users.userActivity[address];

    if (!userActivity) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        address: address,
        firstSeen: new Date(userActivity.firstSeen).toISOString(),
        lastSeen: new Date(userActivity.lastSeen).toISOString(),
        totalActions: userActivity.actions.length,
        recentActions: userActivity.actions.slice(-10)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Track custom event
 */
router.post('/track', (req, res) => {
  try {
    const { eventType, data } = req.body;

    switch (eventType) {
      case 'model_registration':
        trackModelRegistration(data);
        break;
      case 'sale':
        trackSale(data);
        break;
      case 'user_activity':
        trackUserActivity(data.address, data.action);
        break;
      case 'inference':
        trackInference(data);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Unknown event type'
        });
    }

    res.json({
      success: true,
      message: 'Event tracked successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Export router and tracking functions
module.exports = {
  router,
  trackModelRegistration,
  trackSale,
  trackUserActivity,
  trackInference,
  getAnalyticsSummary
};
