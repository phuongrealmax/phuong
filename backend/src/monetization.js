/**
 * MonaAI Monetization Module
 * Handles all revenue generation mechanisms
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class MonetizationManager {
  constructor(dataDir = './data') {
    this.dataDir = dataDir;
    this.feesFile = path.join(dataDir, 'fees.json');
    this.subscriptionsFile = path.join(dataDir, 'subscriptions.json');
    this.apiUsageFile = path.join(dataDir, 'api-usage.json');
    this.revenueFile = path.join(dataDir, 'revenue.json');
    this.stakingFile = path.join(dataDir, 'staking.json');
    this.withdrawalsFile = path.join(dataDir, 'withdrawals.json');

    // Fee configuration
    this.config = {
      // Marketplace fees
      platformFeePercentage: 2.5, // 2.5% platform fee on each sale
      minPlatformFee: 0.001, // Minimum 0.001 ETH fee

      // Subscription tiers (monthly prices in ETH)
      subscriptionTiers: {
        free: {
          price: 0,
          apiCallsPerMonth: 1000,
          maxModelSize: 100000000, // 100MB
          features: ['basic_marketplace', 'model_upload'],
          modelListingLimit: 3
        },
        pro: {
          price: 0.1, // 0.1 ETH/month
          apiCallsPerMonth: 50000,
          maxModelSize: 5000000000, // 5GB
          features: ['basic_marketplace', 'model_upload', 'priority_support', 'analytics', 'api_access'],
          modelListingLimit: 20
        },
        enterprise: {
          price: 0.5, // 0.5 ETH/month
          apiCallsPerMonth: -1, // Unlimited
          maxModelSize: -1, // Unlimited
          features: ['basic_marketplace', 'model_upload', 'priority_support', 'analytics', 'api_access', 'custom_integration', 'white_label'],
          modelListingLimit: -1 // Unlimited
        }
      },

      // API pricing (per 1000 calls)
      apiPricing: {
        inference: 0.001, // 0.001 ETH per 1000 inference calls
        modelQuery: 0.0001, // 0.0001 ETH per 1000 queries
        dataStorage: 0.01 // 0.01 ETH per GB per month
      },

      // Staking rewards
      stakingRewards: {
        annualPercentageYield: 12, // 12% APY
        minStakeAmount: 0.1, // Minimum 0.1 ETH
        lockPeriods: {
          flexible: { multiplier: 1.0, lockDays: 0 },
          '30days': { multiplier: 1.2, lockDays: 30 },
          '90days': { multiplier: 1.5, lockDays: 90 },
          '180days': { multiplier: 2.0, lockDays: 180 }
        }
      },

      // Platform wallet for collecting fees
      platformWallet: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
    };

    this.initializeData();
  }

  /**
   * Initialize data files
   */
  initializeData() {
    const files = [
      this.feesFile,
      this.subscriptionsFile,
      this.apiUsageFile,
      this.revenueFile,
      this.stakingFile,
      this.withdrawalsFile
    ];

    files.forEach(file => {
      if (!fs.existsSync(file)) {
        fs.writeFileSync(file, JSON.stringify([], null, 2));
      }
    });

    // Initialize revenue summary if empty
    const revenue = this.readData(this.revenueFile);
    if (revenue.length === 0) {
      this.writeData(this.revenueFile, [{
        totalRevenue: 0,
        platformFees: 0,
        subscriptionRevenue: 0,
        apiRevenue: 0,
        stakingFees: 0,
        lastUpdated: Date.now()
      }]);
    }
  }

  readData(filePath) {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  writeData(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  /**
   * Calculate platform fee for a sale
   */
  calculatePlatformFee(salePrice) {
    const fee = parseFloat(salePrice) * (this.config.platformFeePercentage / 100);
    return Math.max(fee, this.config.minPlatformFee);
  }

  /**
   * Process marketplace sale and collect fees
   */
  processSale(saleData) {
    const { listingId, modelId, buyer, seller, price, txHash } = saleData;
    const platformFee = this.calculatePlatformFee(price);
    const sellerAmount = parseFloat(price) - platformFee;

    const feeRecord = {
      id: this.readData(this.feesFile).length + 1,
      type: 'marketplace_sale',
      listingId,
      modelId,
      buyer,
      seller,
      totalAmount: parseFloat(price),
      platformFee,
      sellerAmount,
      txHash: txHash || this.generateTxHash(),
      timestamp: Date.now()
    };

    // Record fee
    const fees = this.readData(this.feesFile);
    fees.push(feeRecord);
    this.writeData(this.feesFile, fees);

    // Update revenue
    this.updateRevenue('platformFees', platformFee);

    return {
      ...feeRecord,
      message: `Platform fee: ${platformFee.toFixed(4)} ETH, Seller receives: ${sellerAmount.toFixed(4)} ETH`
    };
  }

  /**
   * Subscribe user to a tier
   */
  subscribe(userAddress, tier, duration = 30) {
    if (!this.config.subscriptionTiers[tier]) {
      throw new Error('Invalid subscription tier');
    }

    const tierConfig = this.config.subscriptionTiers[tier];
    const totalCost = tierConfig.price * (duration / 30);

    const subscription = {
      id: this.readData(this.subscriptionsFile).length + 1,
      userAddress,
      tier,
      price: tierConfig.price,
      duration,
      totalCost,
      startDate: Date.now(),
      endDate: Date.now() + (duration * 24 * 60 * 60 * 1000),
      isActive: true,
      features: tierConfig.features,
      limits: {
        apiCallsPerMonth: tierConfig.apiCallsPerMonth,
        maxModelSize: tierConfig.maxModelSize,
        modelListingLimit: tierConfig.modelListingLimit
      },
      apiCallsUsed: 0,
      txHash: this.generateTxHash()
    };

    const subscriptions = this.readData(this.subscriptionsFile);

    // Deactivate old subscriptions
    subscriptions.forEach(sub => {
      if (sub.userAddress.toLowerCase() === userAddress.toLowerCase() && sub.isActive) {
        sub.isActive = false;
      }
    });

    subscriptions.push(subscription);
    this.writeData(this.subscriptionsFile, subscriptions);

    // Update revenue
    if (totalCost > 0) {
      this.updateRevenue('subscriptionRevenue', totalCost);
    }

    return subscription;
  }

  /**
   * Get user's current subscription
   */
  getUserSubscription(userAddress) {
    const subscriptions = this.readData(this.subscriptionsFile);
    const now = Date.now();

    // Find active subscription
    let activeSub = subscriptions.find(sub =>
      sub.userAddress.toLowerCase() === userAddress.toLowerCase() &&
      sub.isActive &&
      sub.endDate > now
    );

    // If no active subscription, return free tier
    if (!activeSub) {
      return {
        tier: 'free',
        isActive: true,
        features: this.config.subscriptionTiers.free.features,
        limits: {
          apiCallsPerMonth: this.config.subscriptionTiers.free.apiCallsPerMonth,
          maxModelSize: this.config.subscriptionTiers.free.maxModelSize,
          modelListingLimit: this.config.subscriptionTiers.free.modelListingLimit
        },
        apiCallsUsed: 0
      };
    }

    return activeSub;
  }

  /**
   * Track API usage and bill accordingly
   */
  trackAPIUsage(userAddress, apiType, callCount = 1) {
    const subscription = this.getUserSubscription(userAddress);
    const usage = this.readData(this.apiUsageFile);

    // Find or create usage record for current month
    const currentMonth = new Date().toISOString().slice(0, 7);
    let userUsage = usage.find(u =>
      u.userAddress.toLowerCase() === userAddress.toLowerCase() &&
      u.month === currentMonth
    );

    if (!userUsage) {
      userUsage = {
        id: usage.length + 1,
        userAddress,
        month: currentMonth,
        calls: {},
        totalCalls: 0,
        charges: 0
      };
      usage.push(userUsage);
    }

    // Track calls
    if (!userUsage.calls[apiType]) {
      userUsage.calls[apiType] = 0;
    }
    userUsage.calls[apiType] += callCount;
    userUsage.totalCalls += callCount;

    // Check if over limit
    if (subscription.limits.apiCallsPerMonth !== -1 &&
        userUsage.totalCalls > subscription.limits.apiCallsPerMonth) {

      // Calculate overage charge
      const overageCalls = userUsage.totalCalls - subscription.limits.apiCallsPerMonth;
      const pricing = this.config.apiPricing[apiType] || this.config.apiPricing.modelQuery;
      const charge = (overageCalls / 1000) * pricing;

      userUsage.charges += charge;

      // Update revenue
      this.updateRevenue('apiRevenue', charge);
    }

    // Update subscription API calls used
    if (subscription.id) {
      const subscriptions = this.readData(this.subscriptionsFile);
      const sub = subscriptions.find(s => s.id === subscription.id);
      if (sub) {
        sub.apiCallsUsed = userUsage.totalCalls;
        this.writeData(this.subscriptionsFile, subscriptions);
      }
    }

    this.writeData(this.apiUsageFile, usage);

    return {
      callsThisMonth: userUsage.totalCalls,
      limit: subscription.limits.apiCallsPerMonth,
      overageCharges: userUsage.charges,
      remaining: subscription.limits.apiCallsPerMonth === -1 ?
        'unlimited' :
        Math.max(0, subscription.limits.apiCallsPerMonth - userUsage.totalCalls)
    };
  }

  /**
   * Stake tokens
   */
  stake(userAddress, amount, lockPeriod = 'flexible') {
    amount = parseFloat(amount);

    if (amount < this.config.stakingRewards.minStakeAmount) {
      throw new Error(`Minimum stake amount is ${this.config.stakingRewards.minStakeAmount} ETH`);
    }

    if (!this.config.stakingRewards.lockPeriods[lockPeriod]) {
      throw new Error('Invalid lock period');
    }

    const lockConfig = this.config.stakingRewards.lockPeriods[lockPeriod];
    const stakes = this.readData(this.stakingFile);

    const stake = {
      id: stakes.length + 1,
      userAddress,
      amount,
      lockPeriod,
      lockDays: lockConfig.lockDays,
      rewardMultiplier: lockConfig.multiplier,
      startDate: Date.now(),
      unlockDate: Date.now() + (lockConfig.lockDays * 24 * 60 * 60 * 1000),
      isActive: true,
      claimedRewards: 0,
      txHash: this.generateTxHash()
    };

    stakes.push(stake);
    this.writeData(this.stakingFile, stakes);

    return stake;
  }

  /**
   * Calculate staking rewards
   */
  calculateStakingRewards(stakeId) {
    const stakes = this.readData(this.stakingFile);
    const stake = stakes.find(s => s.id === stakeId);

    if (!stake) {
      throw new Error('Stake not found');
    }

    const now = Date.now();
    const stakingDuration = now - stake.startDate;
    const daysStaked = stakingDuration / (24 * 60 * 60 * 1000);

    const baseAPY = this.config.stakingRewards.annualPercentageYield / 100;
    const effectiveAPY = baseAPY * stake.rewardMultiplier;

    const rewards = stake.amount * effectiveAPY * (daysStaked / 365);
    const unclaimedRewards = rewards - stake.claimedRewards;

    return {
      totalRewards: rewards,
      claimedRewards: stake.claimedRewards,
      unclaimedRewards,
      daysStaked: Math.floor(daysStaked),
      canUnstake: now >= stake.unlockDate,
      unlockDate: new Date(stake.unlockDate).toISOString()
    };
  }

  /**
   * Claim staking rewards
   */
  claimRewards(stakeId, userAddress) {
    const stakes = this.readData(this.stakingFile);
    const stake = stakes.find(s => s.id === stakeId);

    if (!stake) {
      throw new Error('Stake not found');
    }

    if (stake.userAddress.toLowerCase() !== userAddress.toLowerCase()) {
      throw new Error('Not authorized');
    }

    const rewardInfo = this.calculateStakingRewards(stakeId);

    if (rewardInfo.unclaimedRewards <= 0) {
      throw new Error('No rewards to claim');
    }

    stake.claimedRewards += rewardInfo.unclaimedRewards;
    this.writeData(this.stakingFile, stakes);

    return {
      amount: rewardInfo.unclaimedRewards,
      txHash: this.generateTxHash(),
      timestamp: Date.now()
    };
  }

  /**
   * Unstake tokens
   */
  unstake(stakeId, userAddress) {
    const stakes = this.readData(this.stakingFile);
    const stake = stakes.find(s => s.id === stakeId);

    if (!stake) {
      throw new Error('Stake not found');
    }

    if (stake.userAddress.toLowerCase() !== userAddress.toLowerCase()) {
      throw new Error('Not authorized');
    }

    if (!stake.isActive) {
      throw new Error('Stake already unstaked');
    }

    const now = Date.now();
    if (now < stake.unlockDate) {
      throw new Error(`Cannot unstake before ${new Date(stake.unlockDate).toISOString()}`);
    }

    // Claim any remaining rewards
    const rewardInfo = this.calculateStakingRewards(stakeId);
    stake.claimedRewards += rewardInfo.unclaimedRewards;
    stake.isActive = false;

    this.writeData(this.stakingFile, stakes);

    // Record withdrawal
    const withdrawals = this.readData(this.withdrawalsFile);
    withdrawals.push({
      id: withdrawals.length + 1,
      stakeId,
      userAddress,
      principalAmount: stake.amount,
      rewardsAmount: rewardInfo.unclaimedRewards,
      totalAmount: stake.amount + rewardInfo.unclaimedRewards,
      txHash: this.generateTxHash(),
      timestamp: Date.now()
    });
    this.writeData(this.withdrawalsFile, withdrawals);

    return {
      principal: stake.amount,
      rewards: rewardInfo.unclaimedRewards,
      total: stake.amount + rewardInfo.unclaimedRewards,
      txHash: this.generateTxHash()
    };
  }

  /**
   * Get user's staking portfolio
   */
  getUserStakes(userAddress) {
    const stakes = this.readData(this.stakingFile);
    const userStakes = stakes.filter(s =>
      s.userAddress.toLowerCase() === userAddress.toLowerCase()
    );

    return userStakes.map(stake => {
      const rewards = this.calculateStakingRewards(stake.id);
      return {
        ...stake,
        rewards
      };
    });
  }

  /**
   * Update revenue totals
   */
  updateRevenue(category, amount) {
    const revenue = this.readData(this.revenueFile);
    const summary = revenue[0];

    summary[category] = (summary[category] || 0) + parseFloat(amount);
    summary.totalRevenue =
      (summary.platformFees || 0) +
      (summary.subscriptionRevenue || 0) +
      (summary.apiRevenue || 0) +
      (summary.stakingFees || 0);
    summary.lastUpdated = Date.now();

    this.writeData(this.revenueFile, revenue);
  }

  /**
   * Get revenue summary
   */
  getRevenueSummary() {
    const revenue = this.readData(this.revenueFile);
    const fees = this.readData(this.feesFile);
    const subscriptions = this.readData(this.subscriptionsFile);
    const apiUsage = this.readData(this.apiUsageFile);
    const stakes = this.readData(this.stakingFile);

    const summary = revenue[0] || {
      totalRevenue: 0,
      platformFees: 0,
      subscriptionRevenue: 0,
      apiRevenue: 0,
      stakingFees: 0
    };

    // Calculate monthly recurring revenue (MRR)
    const activeSubscriptions = subscriptions.filter(s =>
      s.isActive && s.endDate > Date.now()
    );
    const mrr = activeSubscriptions.reduce((sum, sub) => {
      const monthlyPrice = this.config.subscriptionTiers[sub.tier]?.price || 0;
      return sum + monthlyPrice;
    }, 0);

    // Calculate total value locked (TVL) in staking
    const tvl = stakes
      .filter(s => s.isActive)
      .reduce((sum, s) => sum + s.amount, 0);

    return {
      ...summary,
      monthlyRecurringRevenue: mrr,
      totalValueLocked: tvl,
      activeSubscriptions: activeSubscriptions.length,
      totalTransactions: fees.length,
      totalStakers: new Set(stakes.map(s => s.userAddress)).size
    };
  }

  /**
   * Get subscription tier pricing
   */
  getSubscriptionTiers() {
    return this.config.subscriptionTiers;
  }

  /**
   * Get all fees collected
   */
  getAllFees(limit = 100) {
    const fees = this.readData(this.feesFile);
    return fees.slice(-limit).reverse();
  }

  generateTxHash() {
    return '0x' + crypto.randomBytes(32).toString('hex');
  }
}

// Export singleton
let monetizationInstance = null;

const getMonetization = (dataDir) => {
  if (!monetizationInstance) {
    monetizationInstance = new MonetizationManager(dataDir);
  }
  return monetizationInstance;
};

module.exports = {
  MonetizationManager,
  getMonetization
};
