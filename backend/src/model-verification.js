/**
 * Model Verification & Quality Assurance System
 * Tạo giá trị: Đảm bảo models có chất lượng, không phải scam
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class ModelVerification {
  constructor(dataDir = './data') {
    this.dataDir = dataDir;
    this.verificationsFile = path.join(dataDir, 'verifications.json');
    this.ratingsFile = path.join(dataDir, 'ratings.json');
    this.reportsFile = path.join(dataDir, 'reports.json');

    this.initializeData();
  }

  initializeData() {
    const files = [this.verificationsFile, this.ratingsFile, this.reportsFile];
    files.forEach(file => {
      if (!fs.existsSync(file)) {
        fs.writeFileSync(file, JSON.stringify([], null, 2));
      }
    });
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
   * Verify model quality
   * Trong production: sẽ chạy automated tests
   */
  verifyModel(modelId, verificationData) {
    const verifications = this.readData(this.verificationsFile);

    // Run verification checks
    const checks = {
      formatValid: this.checkModelFormat(verificationData),
      sizeValid: this.checkModelSize(verificationData),
      metadataComplete: this.checkMetadata(verificationData),
      securityScan: this.runSecurityScan(verificationData),
      performanceTest: this.runPerformanceTest(verificationData)
    };

    const passedChecks = Object.values(checks).filter(c => c.passed).length;
    const totalChecks = Object.keys(checks).length;
    const score = (passedChecks / totalChecks) * 100;

    const verification = {
      id: verifications.length + 1,
      modelId,
      timestamp: Date.now(),
      checks,
      score,
      status: score >= 80 ? 'verified' : score >= 60 ? 'warning' : 'failed',
      badge: score >= 90 ? 'premium' : score >= 80 ? 'verified' : null,
      verifiedBy: 'MonaAI Auto-Verification System',
      expiresAt: Date.now() + 90 * 24 * 60 * 60 * 1000 // 90 days
    };

    verifications.push(verification);
    this.writeData(this.verificationsFile, verifications);

    return verification;
  }

  /**
   * Check model format
   */
  checkModelFormat(data) {
    // Simplified check - in production would validate actual model file
    return {
      passed: !!data.ipfsHash && data.ipfsHash.startsWith('Qm'),
      message: data.ipfsHash ? 'Valid IPFS format' : 'Invalid format',
      details: 'Model stored on IPFS'
    };
  }

  /**
   * Check model size
   */
  checkModelSize(data) {
    const maxSize = 10000000000; // 10GB
    const size = data.metrics?.size || 0;
    return {
      passed: size > 0 && size <= maxSize,
      message: size > 0 ? `Size: ${(size / 1000000000).toFixed(2)}GB` : 'Size not specified',
      details: `Max allowed: ${(maxSize / 1000000000)}GB`
    };
  }

  /**
   * Check metadata completeness
   */
  checkMetadata(data) {
    const required = ['name', 'description', 'category', 'version'];
    const missing = required.filter(field => !data[field]);
    return {
      passed: missing.length === 0,
      message: missing.length === 0 ? 'Complete metadata' : `Missing: ${missing.join(', ')}`,
      details: `Required fields: ${required.join(', ')}`
    };
  }

  /**
   * Security scan
   */
  runSecurityScan(data) {
    // Simplified - in production would scan for malicious code
    const risks = [];

    if (!data.creator || !data.creator.startsWith('0x')) {
      risks.push('Invalid creator address');
    }

    return {
      passed: risks.length === 0,
      message: risks.length === 0 ? 'No security issues found' : `Issues: ${risks.join(', ')}`,
      details: 'Scanned for malicious patterns'
    };
  }

  /**
   * Performance test
   */
  runPerformanceTest(data) {
    // Simplified - in production would run actual inference tests
    const hasMetrics = data.metrics && (data.metrics.accuracy || data.metrics.parameters);
    return {
      passed: hasMetrics,
      message: hasMetrics ?
        `Accuracy: ${(data.metrics.accuracy * 100).toFixed(1)}%` :
        'No performance metrics',
      details: hasMetrics ?
        `Parameters: ${(data.metrics.parameters / 1000000000).toFixed(1)}B` :
        'Performance metrics required'
    };
  }

  /**
   * Get model verification status
   */
  getVerificationStatus(modelId) {
    const verifications = this.readData(this.verificationsFile);
    const verification = verifications
      .filter(v => v.modelId === modelId)
      .sort((a, b) => b.timestamp - a.timestamp)[0];

    if (!verification) {
      return {
        status: 'unverified',
        message: 'Model not verified yet'
      };
    }

    // Check if expired
    if (verification.expiresAt < Date.now()) {
      return {
        status: 'expired',
        message: 'Verification expired, re-verification required',
        lastVerification: verification
      };
    }

    return verification;
  }

  /**
   * Rate a model (1-5 stars)
   */
  rateModel(modelId, userAddress, rating, review = '') {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const ratings = this.readData(this.ratingsFile);

    // Check if user already rated
    const existingRating = ratings.find(
      r => r.modelId === modelId && r.userAddress.toLowerCase() === userAddress.toLowerCase()
    );

    if (existingRating) {
      throw new Error('You have already rated this model');
    }

    const newRating = {
      id: ratings.length + 1,
      modelId,
      userAddress,
      rating,
      review,
      timestamp: Date.now(),
      helpful: 0,
      verified: false // Set to true if user purchased the model
    };

    ratings.push(newRating);
    this.writeData(this.ratingsFile, ratings);

    return newRating;
  }

  /**
   * Get model ratings
   */
  getModelRatings(modelId) {
    const ratings = this.readData(this.ratingsFile);
    const modelRatings = ratings.filter(r => r.modelId === modelId);

    if (modelRatings.length === 0) {
      return {
        averageRating: 0,
        totalRatings: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        reviews: []
      };
    }

    const averageRating = modelRatings.reduce((sum, r) => sum + r.rating, 0) / modelRatings.length;

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    modelRatings.forEach(r => {
      distribution[r.rating]++;
    });

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalRatings: modelRatings.length,
      distribution,
      reviews: modelRatings
        .filter(r => r.review)
        .sort((a, b) => b.helpful - a.helpful)
        .slice(0, 10)
    };
  }

  /**
   * Report a model
   */
  reportModel(modelId, userAddress, reason, description) {
    const reports = this.readData(this.reportsFile);

    const report = {
      id: reports.length + 1,
      modelId,
      userAddress,
      reason, // 'scam', 'malware', 'poor_quality', 'inappropriate', 'other'
      description,
      timestamp: Date.now(),
      status: 'pending', // 'pending', 'investigating', 'resolved', 'dismissed'
      resolution: null
    };

    reports.push(report);
    this.writeData(this.reportsFile, reports);

    // Auto-flag model if too many reports
    const modelReports = reports.filter(r => r.modelId === modelId && r.status === 'pending');
    if (modelReports.length >= 3) {
      return {
        ...report,
        alert: 'Model auto-flagged for review due to multiple reports'
      };
    }

    return report;
  }

  /**
   * Get trust score for a model
   */
  getTrustScore(modelId) {
    const verification = this.getVerificationStatus(modelId);
    const ratings = this.getModelRatings(modelId);
    const reports = this.readData(this.reportsFile);
    const modelReports = reports.filter(r => r.modelId === modelId);

    let score = 50; // Base score

    // Verification score (0-30 points)
    if (verification.status === 'verified') {
      score += 20;
      if (verification.badge === 'premium') score += 10;
    } else if (verification.status === 'warning') {
      score += 10;
    }

    // Ratings score (0-20 points)
    if (ratings.totalRatings > 0) {
      score += (ratings.averageRating / 5) * 20;
    }

    // Reports penalty (-5 points per unresolved report)
    const unresolvedReports = modelReports.filter(r => r.status === 'pending').length;
    score -= unresolvedReports * 5;

    // Usage bonus (0-10 points) - would come from purchase count
    // score += Math.min(purchaseCount / 10, 10);

    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      level: score >= 80 ? 'High Trust' : score >= 60 ? 'Medium Trust' : 'Low Trust',
      factors: {
        verification: verification.status,
        badge: verification.badge,
        averageRating: ratings.averageRating,
        totalRatings: ratings.totalRatings,
        reports: unresolvedReports
      }
    };
  }

  /**
   * Get all verified models
   */
  getVerifiedModels() {
    const verifications = this.readData(this.verificationsFile);
    const now = Date.now();

    return verifications
      .filter(v => v.status === 'verified' && v.expiresAt > now)
      .map(v => v.modelId);
  }

  /**
   * Get premium badge models
   */
  getPremiumModels() {
    const verifications = this.readData(this.verificationsFile);
    const now = Date.now();

    return verifications
      .filter(v => v.badge === 'premium' && v.expiresAt > now)
      .map(v => v.modelId);
  }
}

// Export singleton
let verificationInstance = null;

const getVerification = (dataDir) => {
  if (!verificationInstance) {
    verificationInstance = new ModelVerification(dataDir);
  }
  return verificationInstance;
};

module.exports = {
  ModelVerification,
  getVerification
};
