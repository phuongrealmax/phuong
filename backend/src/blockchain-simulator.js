/**
 * Blockchain Contract Simulator for MonaAI
 * Simulates smart contract behavior without requiring compiled Solidity contracts
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class BlockchainSimulator {
  constructor(dataDir = './data') {
    this.dataDir = dataDir;
    this.modelsFile = path.join(dataDir, 'models.json');
    this.listingsFile = path.join(dataDir, 'listings.json');
    this.purchasesFile = path.join(dataDir, 'purchases.json');
    this.usersFile = path.join(dataDir, 'users.json');
    this.transactionsFile = path.join(dataDir, 'transactions.json');

    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Initialize data files
    this.initializeData();
  }

  /**
   * Initialize data files with empty arrays if they don't exist
   */
  initializeData() {
    const files = [
      this.modelsFile,
      this.listingsFile,
      this.purchasesFile,
      this.usersFile,
      this.transactionsFile
    ];

    files.forEach(file => {
      if (!fs.existsSync(file)) {
        fs.writeFileSync(file, JSON.stringify([], null, 2));
      }
    });

    // Add some initial test data if files are empty
    this.seedInitialData();
  }

  /**
   * Seed initial test data
   */
  seedInitialData() {
    const models = this.readData(this.modelsFile);
    if (models.length === 0) {
      const initialModels = [
        {
          id: 1,
          name: 'GPT-Mona Language Model',
          description: 'Advanced language model for text generation and understanding',
          ipfsHash: 'QmX7K8JmXZYvKjZ4NqR3hC2wPxB9fT5uE4vW8nY6pQ1mL2',
          creator: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
          timestamp: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
          version: '1.0.0',
          category: 'Language Model',
          metrics: {
            accuracy: 0.94,
            size: 1500000000, // 1.5GB
            parameters: 7000000000 // 7B parameters
          }
        },
        {
          id: 2,
          name: 'Vision Transformer v2',
          description: 'State-of-the-art image classification and object detection',
          ipfsHash: 'QmY8L9NpXZWvKjA5OsS4iD3xQ0rC7wT6vF9oZ7qR2nM3',
          creator: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
          timestamp: Date.now() - 15 * 24 * 60 * 60 * 1000, // 15 days ago
          version: '2.1.0',
          category: 'Computer Vision',
          metrics: {
            accuracy: 0.96,
            size: 800000000, // 800MB
            parameters: 2000000000 // 2B parameters
          }
        },
        {
          id: 3,
          name: 'Audio Classifier Pro',
          description: 'Multi-label audio classification for music and speech',
          ipfsHash: 'QmZ9M0OqYZXvLkB6PtT5jE4yR1sD8xU7wG0pA8rS3oN4',
          creator: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
          timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
          version: '1.2.0',
          category: 'Audio Processing',
          metrics: {
            accuracy: 0.91,
            size: 450000000, // 450MB
            parameters: 1200000000 // 1.2B parameters
          }
        }
      ];

      initialModels.forEach(model => this.addModel(model));

      // Create listings for these models
      const initialListings = [
        {
          id: 1,
          modelId: 1,
          seller: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
          price: '0.5',
          isActive: true,
          createdAt: Date.now() - 25 * 24 * 60 * 60 * 1000,
          purchases: 12
        },
        {
          id: 2,
          modelId: 2,
          seller: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
          price: '0.8',
          isActive: true,
          createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
          purchases: 8
        },
        {
          id: 3,
          modelId: 3,
          seller: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
          price: '0.3',
          isActive: true,
          createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
          purchases: 15
        }
      ];

      initialListings.forEach(listing => this.createListing(listing));
    }
  }

  /**
   * Read data from JSON file
   */
  readData(filePath) {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  /**
   * Write data to JSON file
   */
  writeData(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  /**
   * Generate a random Ethereum-style address
   */
  generateAddress() {
    return '0x' + crypto.randomBytes(20).toString('hex');
  }

  /**
   * Generate a random transaction hash
   */
  generateTxHash() {
    return '0x' + crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate a random IPFS hash
   */
  generateIPFSHash() {
    const hash = crypto.randomBytes(32).toString('hex');
    return 'Qm' + hash.substring(0, 44);
  }

  /**
   * Add a new model
   */
  addModel(modelData) {
    const models = this.readData(this.modelsFile);
    const id = modelData.id || models.length + 1;

    const model = {
      id,
      name: modelData.name,
      description: modelData.description,
      ipfsHash: modelData.ipfsHash || this.generateIPFSHash(),
      creator: modelData.creator,
      timestamp: modelData.timestamp || Date.now(),
      version: modelData.version || '1.0.0',
      category: modelData.category || 'Uncategorized',
      metrics: modelData.metrics || {}
    };

    models.push(model);
    this.writeData(this.modelsFile, models);

    // Record transaction
    this.recordTransaction({
      type: 'MODEL_REGISTERED',
      modelId: id,
      from: modelData.creator,
      timestamp: model.timestamp,
      data: { name: model.name }
    });

    return model;
  }

  /**
   * Get all models
   */
  getModels() {
    return this.readData(this.modelsFile);
  }

  /**
   * Get model by ID
   */
  getModelById(id) {
    const models = this.readData(this.modelsFile);
    return models.find(m => m.id === parseInt(id));
  }

  /**
   * Create a new marketplace listing
   */
  createListing(listingData) {
    const listings = this.readData(this.listingsFile);
    const id = listingData.id || listings.length + 1;

    const listing = {
      id,
      modelId: listingData.modelId,
      seller: listingData.seller,
      price: listingData.price,
      isActive: listingData.isActive !== undefined ? listingData.isActive : true,
      createdAt: listingData.createdAt || Date.now(),
      purchases: listingData.purchases || 0
    };

    listings.push(listing);
    this.writeData(this.listingsFile, listings);

    // Record transaction
    this.recordTransaction({
      type: 'LISTING_CREATED',
      listingId: id,
      modelId: listing.modelId,
      from: listing.seller,
      timestamp: listing.createdAt,
      data: { price: listing.price }
    });

    return listing;
  }

  /**
   * Get all active listings with model details
   */
  getActiveListings() {
    const listings = this.readData(this.listingsFile);
    const models = this.readData(this.modelsFile);

    return listings
      .filter(l => l.isActive)
      .map(listing => {
        const model = models.find(m => m.id === listing.modelId);
        return {
          ...listing,
          model
        };
      });
  }

  /**
   * Purchase a model
   */
  purchaseModel(listingId, buyer, txHash) {
    const listings = this.readData(this.listingsFile);
    const purchases = this.readData(this.purchasesFile);

    const listing = listings.find(l => l.id === parseInt(listingId));
    if (!listing) {
      throw new Error('Listing not found');
    }

    if (!listing.isActive) {
      throw new Error('Listing is not active');
    }

    // Record purchase
    const purchase = {
      id: purchases.length + 1,
      listingId: listing.id,
      modelId: listing.modelId,
      buyer,
      seller: listing.seller,
      price: listing.price,
      timestamp: Date.now(),
      txHash: txHash || this.generateTxHash()
    };

    purchases.push(purchase);
    this.writeData(this.purchasesFile, purchases);

    // Update listing purchase count
    listing.purchases = (listing.purchases || 0) + 1;
    this.writeData(this.listingsFile, listings);

    // Record transaction
    this.recordTransaction({
      type: 'MODEL_PURCHASED',
      listingId: listing.id,
      modelId: listing.modelId,
      from: buyer,
      to: listing.seller,
      timestamp: purchase.timestamp,
      data: { price: listing.price }
    });

    return purchase;
  }

  /**
   * Get purchases by user
   */
  getPurchasesByUser(userAddress) {
    const purchases = this.readData(this.purchasesFile);
    const models = this.readData(this.modelsFile);

    return purchases
      .filter(p => p.buyer.toLowerCase() === userAddress.toLowerCase())
      .map(purchase => {
        const model = models.find(m => m.id === purchase.modelId);
        return {
          ...purchase,
          model
        };
      });
  }

  /**
   * Get user statistics
   */
  getUserStats(userAddress) {
    const models = this.readData(this.modelsFile);
    const listings = this.readData(this.listingsFile);
    const purchases = this.readData(this.purchasesFile);

    const userModels = models.filter(
      m => m.creator.toLowerCase() === userAddress.toLowerCase()
    );

    const userListings = listings.filter(
      l => l.seller.toLowerCase() === userAddress.toLowerCase()
    );

    const userPurchases = purchases.filter(
      p => p.buyer.toLowerCase() === userAddress.toLowerCase()
    );

    const salesAsBuyer = purchases.filter(
      p => p.seller.toLowerCase() === userAddress.toLowerCase()
    );

    const totalRevenue = salesAsBuyer.reduce(
      (sum, p) => sum + parseFloat(p.price),
      0
    );

    const totalSpent = userPurchases.reduce(
      (sum, p) => sum + parseFloat(p.price),
      0
    );

    return {
      address: userAddress,
      modelsCreated: userModels.length,
      modelsListed: userListings.length,
      modelsPurchased: userPurchases.length,
      modelsSold: salesAsBuyer.length,
      totalRevenue: totalRevenue.toFixed(4),
      totalSpent: totalSpent.toFixed(4),
      activeListings: userListings.filter(l => l.isActive).length
    };
  }

  /**
   * Get recent user activity
   */
  getUserActivity(userAddress, limit = 10) {
    const transactions = this.readData(this.transactionsFile);

    return transactions
      .filter(tx =>
        tx.from?.toLowerCase() === userAddress.toLowerCase() ||
        tx.to?.toLowerCase() === userAddress.toLowerCase()
      )
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Record a transaction
   */
  recordTransaction(txData) {
    const transactions = this.readData(this.transactionsFile);

    const transaction = {
      id: transactions.length + 1,
      hash: txData.hash || this.generateTxHash(),
      type: txData.type,
      from: txData.from,
      to: txData.to || null,
      timestamp: txData.timestamp || Date.now(),
      data: txData.data || {},
      ...txData
    };

    transactions.push(transaction);
    this.writeData(this.transactionsFile, transactions);

    return transaction;
  }

  /**
   * Get all transactions
   */
  getTransactions(limit = 100) {
    const transactions = this.readData(this.transactionsFile);
    return transactions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get platform statistics
   */
  getPlatformStats() {
    const models = this.readData(this.modelsFile);
    const listings = this.readData(this.listingsFile);
    const purchases = this.readData(this.purchasesFile);
    const transactions = this.readData(this.transactionsFile);

    const totalVolume = purchases.reduce(
      (sum, p) => sum + parseFloat(p.price),
      0
    );

    const activeListingsCount = listings.filter(l => l.isActive).length;

    // Get unique users
    const uniqueCreators = new Set(models.map(m => m.creator));
    const uniqueBuyers = new Set(purchases.map(p => p.buyer));
    const uniqueSellers = new Set(purchases.map(p => p.seller));
    const allUsers = new Set([...uniqueCreators, ...uniqueBuyers, ...uniqueSellers]);

    // Calculate category distribution
    const categoryStats = {};
    models.forEach(model => {
      const category = model.category || 'Uncategorized';
      if (!categoryStats[category]) {
        categoryStats[category] = 0;
      }
      categoryStats[category]++;
    });

    // Recent activity (last 24 hours)
    const last24h = Date.now() - 24 * 60 * 60 * 1000;
    const recentTransactions = transactions.filter(tx => tx.timestamp >= last24h);

    return {
      totalModels: models.length,
      totalListings: listings.length,
      activeListings: activeListingsCount,
      totalPurchases: purchases.length,
      totalVolume: totalVolume.toFixed(4),
      uniqueUsers: allUsers.size,
      uniqueCreators: uniqueCreators.size,
      categories: categoryStats,
      recentActivity: {
        last24h: recentTransactions.length,
        transactions: recentTransactions.slice(0, 10)
      }
    };
  }

  /**
   * Search models
   */
  searchModels(query, category = null) {
    let models = this.readData(this.modelsFile);

    if (query) {
      const lowerQuery = query.toLowerCase();
      models = models.filter(m =>
        m.name.toLowerCase().includes(lowerQuery) ||
        m.description.toLowerCase().includes(lowerQuery)
      );
    }

    if (category) {
      models = models.filter(m => m.category === category);
    }

    return models;
  }

  /**
   * Clear all data (for testing)
   */
  clearAllData() {
    const files = [
      this.modelsFile,
      this.listingsFile,
      this.purchasesFile,
      this.usersFile,
      this.transactionsFile
    ];

    files.forEach(file => {
      fs.writeFileSync(file, JSON.stringify([], null, 2));
    });
  }
}

// Export singleton instance
let simulatorInstance = null;

const getSimulator = (dataDir) => {
  if (!simulatorInstance) {
    simulatorInstance = new BlockchainSimulator(dataDir);
  }
  return simulatorInstance;
};

module.exports = {
  BlockchainSimulator,
  getSimulator
};
