const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

/**
 * Security Middleware and Tools for MonaAI Backend
 */

/**
 * Rate limiter configuration
 */
const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
  return rateLimit({
    windowMs: windowMs, // 15 minutes default
    max: max, // limit each IP to max requests per windowMs
    message: {
      success: false,
      error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });
};

/**
 * Strict rate limiter for sensitive endpoints
 */
const strictRateLimiter = createRateLimiter(15 * 60 * 1000, 10); // 10 requests per 15 minutes

/**
 * Standard rate limiter for API endpoints
 */
const standardRateLimiter = createRateLimiter(15 * 60 * 1000, 100); // 100 requests per 15 minutes

/**
 * Generous rate limiter for read-only endpoints
 */
const readRateLimiter = createRateLimiter(15 * 60 * 1000, 300); // 300 requests per 15 minutes

/**
 * Helmet security headers configuration
 */
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
});

/**
 * Input validation middleware
 */
const validateEthereumAddress = (req, res, next) => {
  const address = req.params.address || req.body.address;

  if (address && !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid Ethereum address format'
    });
  }

  next();
};

/**
 * Validate IPFS hash
 */
const validateIPFSHash = (req, res, next) => {
  const ipfsHash = req.body.ipfsHash;

  if (ipfsHash && !/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(ipfsHash)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid IPFS hash format'
    });
  }

  next();
};

/**
 * Sanitize input to prevent injection attacks
 */
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    // Remove potentially dangerous characters
    return input.replace(/[<>\"']/g, '');
  }
  return input;
};

/**
 * Request sanitization middleware
 */
const sanitizeRequest = (req, res, next) => {
  // Sanitize body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeInput(req.body[key]);
      }
    });
  }

  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeInput(req.query[key]);
      }
    });
  }

  next();
};

/**
 * Request logging middleware for security auditing
 */
const securityLogger = (req, res, next) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    address: req.body?.address || req.params?.address || req.query?.address
  };

  // Log sensitive operations
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
    console.log('[SECURITY]', JSON.stringify(logEntry));
  }

  next();
};

/**
 * Verify signature middleware (for blockchain interactions)
 */
const verifySignature = async (req, res, next) => {
  try {
    const { message, signature, address } = req.body;

    if (!message || !signature || !address) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields for signature verification'
      });
    }

    // Verify signature using ethers.js
    const { ethers } = require('ethers');
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({
        success: false,
        error: 'Invalid signature'
      });
    }

    // Signature is valid
    req.verifiedAddress = recoveredAddress;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Signature verification failed'
    });
  }
};

/**
 * Check if private key is being exposed
 */
const detectPrivateKeyExposure = (req, res, next) => {
  const body = JSON.stringify(req.body);
  const privateKeyPattern = /0x[a-fA-F0-9]{64}/;

  if (privateKeyPattern.test(body)) {
    console.warn('[SECURITY WARNING] Potential private key detected in request body');
  }

  next();
};

/**
 * CORS configuration for production
 */
const corsOptions = {
  origin: function (origin, callback) {
    const whitelist = process.env.CORS_WHITELIST?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001'
    ];

    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

/**
 * Security headers middleware
 */
const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
};

/**
 * Contract address validation
 */
const validateContractAddress = (address) => {
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error('Invalid contract address');
  }

  // Additional checks can be added here
  // e.g., verify contract is deployed, has expected bytecode, etc.

  return true;
};

/**
 * Gas estimation helper
 */
const estimateGasWithBuffer = async (contract, method, ...args) => {
  try {
    const gasEstimate = await contract[method].estimateGas(...args);
    // Add 20% buffer
    const gasLimit = gasEstimate * 120n / 100n;
    return gasLimit;
  } catch (error) {
    console.error('Gas estimation failed:', error);
    throw error;
  }
};

/**
 * Transaction monitoring
 */
const transactionMonitor = {
  pending: new Map(),

  add(txHash, metadata) {
    this.pending.set(txHash, {
      ...metadata,
      timestamp: Date.now(),
      status: 'pending'
    });
  },

  update(txHash, status, receipt = null) {
    const tx = this.pending.get(txHash);
    if (tx) {
      tx.status = status;
      tx.receipt = receipt;
      tx.completedAt = Date.now();

      if (status === 'confirmed' || status === 'failed') {
        // Log for audit
        console.log('[TX]', {
          hash: txHash,
          status: status,
          duration: tx.completedAt - tx.timestamp
        });
      }
    }
  },

  get(txHash) {
    return this.pending.get(txHash);
  },

  cleanup() {
    // Remove transactions older than 1 hour
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [hash, tx] of this.pending.entries()) {
      if (tx.completedAt && tx.completedAt < oneHourAgo) {
        this.pending.delete(hash);
      }
    }
  }
};

// Cleanup old transactions every 10 minutes
setInterval(() => {
  transactionMonitor.cleanup();
}, 10 * 60 * 1000);

module.exports = {
  strictRateLimiter,
  standardRateLimiter,
  readRateLimiter,
  helmetConfig,
  validateEthereumAddress,
  validateIPFSHash,
  sanitizeRequest,
  securityLogger,
  verifySignature,
  detectPrivateKeyExposure,
  corsOptions,
  securityHeaders,
  validateContractAddress,
  estimateGasWithBuffer,
  transactionMonitor
};
