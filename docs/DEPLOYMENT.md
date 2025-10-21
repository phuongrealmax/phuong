# MonaAI Deployment Guide

This guide covers deploying MonaAI to various environments.

## Table of Contents

1. [Local Development](#local-development)
2. [Testnet Deployment](#testnet-deployment)
3. [Mainnet Deployment](#mainnet-deployment)
4. [Production Backend](#production-backend)
5. [Frontend Hosting](#frontend-hosting)

---

## Local Development

### Prerequisites

- Node.js v18+
- Python 3.8+
- MetaMask browser extension
- Git

### Setup Steps

1. **Clone and Install**

```bash
git clone <repository-url>
cd monaai

# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install AI/ML dependencies
cd ai-models && pip install -r requirements.txt && cd ..
```

2. **Start Local Blockchain**

```bash
npx hardhat node
```

This starts a local Ethereum node at `http://localhost:8545` with 20 test accounts.

3. **Deploy Contracts**

```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network localhost
```

Save the deployed contract addresses!

4. **Configure Backend**

Create `backend/.env`:

```env
PORT=3001
RPC_URL=http://localhost:8545
CONTRACT_ADDRESS=<MonaAI_contract_address>
MARKETPLACE_ADDRESS=<Marketplace_contract_address>
TOKEN_ADDRESS=<MonaToken_contract_address>
IPFS_GATEWAY=http://127.0.0.1:5001
```

5. **Start Backend**

```bash
cd backend
npm start
```

6. **Start Frontend**

```bash
cd frontend
npm start
```

7. **Configure MetaMask**

- Network Name: `Hardhat Local`
- RPC URL: `http://localhost:8545`
- Chain ID: `1337`
- Currency Symbol: `ETH`

Import a test account private key from Hardhat.

---

## Testnet Deployment

### Sepolia Testnet

1. **Get Testnet ETH**

Get Sepolia ETH from faucets:
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia

2. **Configure Environment**

Create `.env` in root:

```env
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
ETHERSCAN_API_KEY=your_etherscan_api_key
```

3. **Update Hardhat Config**

```javascript
// hardhat.config.js
networks: {
  sepolia: {
    url: process.env.SEPOLIA_RPC_URL,
    accounts: [process.env.PRIVATE_KEY],
    chainId: 11155111
  }
}
```

4. **Deploy to Sepolia**

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

5. **Verify Contracts**

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

6. **Update Backend Config**

Update `backend/.env` with Sepolia RPC URL and contract addresses.

---

## Mainnet Deployment

### ⚠️ Important Warnings

- Test thoroughly on testnet first
- Use a hardware wallet for private keys
- Consider using a multisig wallet
- Audit smart contracts before deployment
- Start with small amounts

### Deployment Steps

1. **Audit Smart Contracts**

Get contracts audited by professional auditors:
- OpenZeppelin
- CertiK
- ConsenSys Diligence

2. **Prepare Mainnet Environment**

```env
PRIVATE_KEY=your_secure_private_key
MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
ETHERSCAN_API_KEY=your_etherscan_api_key
```

3. **Update Hardhat Config**

```javascript
networks: {
  mainnet: {
    url: process.env.MAINNET_RPC_URL,
    accounts: [process.env.PRIVATE_KEY],
    chainId: 1,
    gasPrice: "auto"
  }
}
```

4. **Deploy to Mainnet**

```bash
# Make sure you have enough ETH for gas
npx hardhat run scripts/deploy.js --network mainnet

# Verify contracts
npx hardhat verify --network mainnet <CONTRACT_ADDRESS>
```

---

## Production Backend

### Option 1: Traditional VPS (DigitalOcean, AWS EC2)

1. **Setup Server**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2
```

2. **Deploy Application**

```bash
# Clone repository
git clone <repository-url>
cd monaai/backend

# Install dependencies
npm install --production

# Create .env file
nano .env
```

3. **Start with PM2**

```bash
pm2 start src/server.js --name monaai-backend
pm2 save
pm2 startup
```

4. **Setup Nginx Reverse Proxy**

```nginx
server {
    listen 80;
    server_name api.monaai.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

5. **Setup SSL with Let's Encrypt**

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.monaai.com
```

### Option 2: Docker Deployment

1. **Create Dockerfile**

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3001

CMD ["node", "src/server.js"]
```

2. **Create docker-compose.yml**

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    env_file:
      - ./backend/.env
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
    restart: unless-stopped
```

3. **Deploy**

```bash
docker-compose up -d
```

### Option 3: Serverless (Vercel, Netlify)

1. **Install Vercel CLI**

```bash
npm i -g vercel
```

2. **Deploy**

```bash
cd backend
vercel --prod
```

---

## Frontend Hosting

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**

```bash
npm i -g vercel
```

2. **Deploy**

```bash
cd frontend
vercel --prod
```

3. **Configure Environment Variables**

In Vercel dashboard, add:
- `REACT_APP_API_URL=https://api.monaai.com`
- `REACT_APP_CONTRACT_ADDRESS=<address>`

### Option 2: Netlify

1. **Install Netlify CLI**

```bash
npm i -g netlify-cli
```

2. **Build and Deploy**

```bash
cd frontend
npm run build
netlify deploy --prod --dir=build
```

### Option 3: IPFS (Decentralized)

1. **Build Frontend**

```bash
cd frontend
npm run build
```

2. **Upload to IPFS**

```bash
# Using IPFS CLI
ipfs add -r build/

# Or use Pinata
# Upload build/ folder to https://pinata.cloud
```

3. **Access via IPFS Gateway**

```
https://gateway.pinata.cloud/ipfs/<your-hash>
```

---

## CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to production
        run: |
          # Add your deployment commands here
```

---

## Monitoring and Maintenance

### Logging

```bash
# PM2 logs
pm2 logs monaai-backend

# Docker logs
docker-compose logs -f
```

### Monitoring

- Use PM2 Plus for process monitoring
- Setup Sentry for error tracking
- Use Grafana + Prometheus for metrics

### Backups

```bash
# Backup environment variables
cp backend/.env backend/.env.backup

# Backup database if using one
# pg_dump, mongodump, etc.
```

---

## Security Checklist

- [ ] Use environment variables for secrets
- [ ] Enable HTTPS/SSL
- [ ] Use rate limiting
- [ ] Enable CORS properly
- [ ] Validate all inputs
- [ ] Use helmet.js for Express
- [ ] Keep dependencies updated
- [ ] Use security scanning tools
- [ ] Monitor for vulnerabilities
- [ ] Regular security audits

---

## Troubleshooting

### Contract Deployment Fails

```bash
# Check gas price
npx hardhat run scripts/check-gas.js

# Increase gas limit in deployment script
```

### Backend Won't Start

```bash
# Check port availability
lsof -i :3001

# Check environment variables
node -e "require('dotenv').config(); console.log(process.env)"
```

### Frontend Build Fails

```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Check Node version
node --version
```

---

## Support

For deployment issues:
- Check documentation: `/docs`
- Open an issue on GitHub
- Join our Discord community

---

**Last Updated:** October 2025
