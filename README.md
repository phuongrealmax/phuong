# MonaAI

MonaAI is a blockchain-based AI model platform that combines the power of decentralized blockchain technology with artificial intelligence. It allows users to register, share, and utilize AI models in a trustless and transparent manner.

## Features

- **Decentralized AI Model Registry**: Register and manage AI models on the blockchain
- **IPFS Integration**: Store model data on IPFS for distributed file storage
- **Smart Contracts**: Solidity-based smart contracts for model management
- **AI Training & Inference**: Python-based AI model training and inference capabilities
- **REST API**: Backend API for seamless integration
- **Web Interface**: React-based frontend for easy interaction

## Project Structure

```
monaai/
├── contracts/          # Smart contracts (Solidity)
│   └── MonaAI.sol     # Main MonaAI contract
├── tests/             # Smart contract tests
│   └── MonaAI.test.js
├── scripts/           # Deployment scripts
├── backend/           # Backend API (Node.js/Express)
│   ├── src/
│   │   └── server.js  # Main API server
│   ├── config/
│   └── package.json
├── frontend/          # Frontend (React)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── index.jsx
│   ├── public/
│   └── package.json
├── ai-models/         # AI/ML components (Python)
│   ├── models/        # Trained models
│   ├── training/      # Training scripts
│   │   └── train.py
│   ├── inference/     # Inference scripts
│   │   └── model_handler.py
│   └── requirements.txt
└── docs/              # Documentation

```

## Prerequisites

- Node.js (v18+)
- Python (v3.8+)
- MetaMask or another Web3 wallet
- IPFS node (optional, for full functionality)

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd monaai
```

### 2. Install dependencies

**Root project (Smart contracts):**
```bash
npm install
```

**Backend:**
```bash
cd backend
npm install
cd ..
```

**Frontend:**
```bash
cd frontend
npm install
cd ..
```

**AI/ML components:**
```bash
cd ai-models
pip install -r requirements.txt
cd ..
```

## Configuration

### 1. Smart Contracts

Create a `.env` file in the root directory:

```env
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=your_rpc_url_here
```

### 2. Backend

Create a `.env` file in the `backend` directory:

```env
PORT=3001
RPC_URL=http://localhost:8545
CONTRACT_ADDRESS=0x...
IPFS_GATEWAY=http://127.0.0.1:5001
```

## Usage

### 1. Start a local blockchain

```bash
npm run node
```

### 2. Compile and deploy contracts

```bash
npm run compile
npm run deploy
```

### 3. Run tests

```bash
npm test
```

### 4. Start the backend API

```bash
npm run backend
```

### 5. Start the frontend

```bash
npm run frontend
```

### 6. Run everything at once

```bash
npm run dev
```

## Smart Contract API

### Register a Model

```solidity
function registerModel(string memory _name, string memory _ipfsHash) public returns (uint256)
```

### Update a Model

```solidity
function updateModel(uint256 _modelId, string memory _ipfsHash) public
```

### Get Model Details

```solidity
function getModel(uint256 _modelId) public view returns (AIModel memory)
```

### Get User Models

```solidity
function getUserModels(address _user) public view returns (uint256[] memory)
```

## Backend API Endpoints

- `GET /health` - Health check
- `GET /api/models` - Get all models
- `GET /api/models/:id` - Get model by ID
- `POST /api/models/register` - Register a new model
- `POST /api/inference` - Run inference on a model
- `GET /api/users/:address/models` - Get models by user address

## AI/ML Components

### Training a Model

```python
from training.train import MonaAITrainer

trainer = MonaAITrainer(model_name="gpt2")
trainer.train(train_data_path="./data/train.json")
```

### Running Inference

```python
from inference.model_handler import MonaAIModelHandler

handler = MonaAIModelHandler(
    contract_address="0x...",
    rpc_url="http://localhost:8545"
)
result = handler.infer("Your input text here")
```

## Technology Stack

- **Blockchain**: Ethereum, Solidity, Hardhat
- **Backend**: Node.js, Express.js
- **Frontend**: React, ethers.js
- **AI/ML**: Python, PyTorch, Transformers
- **Storage**: IPFS
- **Testing**: Hardhat (contracts), Jest (backend), React Testing Library (frontend)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Roadmap

- [ ] Implement model marketplace
- [ ] Add model versioning
- [ ] Integrate more AI frameworks
- [ ] Add model performance metrics
- [ ] Implement staking mechanism
- [ ] Create mobile app
- [ ] Add support for multiple blockchain networks

## Contact

For questions or support, please open an issue on GitHub.

---

Built with by the MonaAI Team
