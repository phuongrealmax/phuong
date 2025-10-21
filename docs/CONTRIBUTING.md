# Contributing to MonaAI

Thank you for your interest in contributing to MonaAI! This document provides guidelines and instructions for contributing.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Making Changes](#making-changes)
5. [Pull Request Process](#pull-request-process)
6. [Coding Standards](#coding-standards)
7. [Testing](#testing)
8. [Documentation](#documentation)

---

## Code of Conduct

### Our Pledge

We are committed to making participation in this project a harassment-free experience for everyone.

### Our Standards

- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

---

## Getting Started

1. **Fork the Repository**

```bash
# Fork on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/monaai.git
cd monaai
```

2. **Add Upstream Remote**

```bash
git remote add upstream https://github.com/monaai/monaai.git
```

3. **Create a Branch**

```bash
git checkout -b feature/your-feature-name
```

---

## Development Setup

Follow the setup instructions in QUICKSTART.md:

```bash
# Install dependencies
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd ai-models && pip install -r requirements.txt && cd ..

# Start development environment
npx hardhat node  # Terminal 1
cd backend && npm start  # Terminal 2
cd frontend && npm start  # Terminal 3
```

---

## Making Changes

### Branch Naming

Use descriptive branch names:

- `feature/add-model-versioning`
- `fix/marketplace-purchase-bug`
- `docs/update-api-documentation`
- `refactor/optimize-contract-gas`

### Commit Messages

Follow conventional commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```
feat(marketplace): add bulk purchase functionality

Implement ability to purchase multiple models in a single transaction
to reduce gas costs for users.

Closes #123
```

```
fix(contract): prevent reentrancy in purchaseModel

Add reentrancy guard to marketplace purchase function to prevent
potential security vulnerability.
```

---

## Pull Request Process

### Before Submitting

1. **Update your branch**

```bash
git fetch upstream
git rebase upstream/main
```

2. **Run tests**

```bash
npm test
cd backend && npm test && cd ..
cd frontend && npm test && cd ..
```

3. **Check linting**

```bash
npm run lint
```

4. **Update documentation** if needed

### Submitting PR

1. **Push your changes**

```bash
git push origin feature/your-feature-name
```

2. **Create Pull Request** on GitHub

3. **Fill out PR template**

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added where necessary
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests passing
```

### Review Process

- At least one approval required
- All CI checks must pass
- Address reviewer feedback
- Keep PR focused and small

---

## Coding Standards

### JavaScript/Node.js

- Use ES6+ features
- Follow Airbnb Style Guide
- Use meaningful variable names
- Add JSDoc comments for functions

```javascript
/**
 * Register a new AI model on the blockchain
 * @param {string} name - Model name
 * @param {string} ipfsHash - IPFS hash of the model
 * @returns {Promise<number>} Model ID
 */
async function registerModel(name, ipfsHash) {
  // Implementation
}
```

### Solidity

- Use Solidity 0.8+
- Follow official style guide
- Add NatSpec comments
- Optimize for gas efficiency

```solidity
/**
 * @dev Register a new AI model
 * @param _name Name of the model
 * @param _ipfsHash IPFS hash where model is stored
 * @return uint256 Model ID
 */
function registerModel(
    string memory _name,
    string memory _ipfsHash
) public returns (uint256) {
    // Implementation
}
```

### Python

- Follow PEP 8
- Use type hints
- Add docstrings

```python
def evaluate_model(model_path: str, test_data: List[str]) -> Dict[str, float]:
    """
    Evaluate model performance.

    Args:
        model_path: Path to the model file
        test_data: List of test samples

    Returns:
        Dictionary containing evaluation metrics
    """
    # Implementation
```

### React/JSX

- Use functional components
- Use hooks appropriately
- PropTypes or TypeScript for type checking

```javascript
/**
 * Marketplace component for browsing and purchasing models
 */
function Marketplace({ provider, account }) {
  // Implementation
}
```

---

## Testing

### Smart Contracts

```bash
npx hardhat test
```

Write comprehensive tests:

```javascript
describe("MonaAI", function () {
  it("Should register a model", async function () {
    // Test implementation
  });

  it("Should fail if...', async function () {
    // Test implementation
  });
});
```

### Backend

```bash
cd backend
npm test
```

### Frontend

```bash
cd frontend
npm test
```

### Coverage

Aim for >80% code coverage:

```bash
npx hardhat coverage
```

---

## Documentation

### When to Update Docs

- Adding new features
- Changing APIs
- Updating deployment process
- Fixing bugs that affect usage

### Documentation Files

- `README.md` - Overview and quick start
- `QUICKSTART.md` - Detailed setup guide
- `docs/API.md` - API documentation
- `docs/ARCHITECTURE.md` - System architecture
- `docs/DEPLOYMENT.md` - Deployment guide

### Code Comments

- Explain **why**, not **what**
- Document complex logic
- Add TODOs for future improvements

---

## Areas for Contribution

### High Priority

- [ ] Security audits for smart contracts
- [ ] Performance optimization
- [ ] Test coverage improvements
- [ ] Documentation enhancements

### Features

- [ ] Model versioning system
- [ ] Advanced analytics dashboard
- [ ] Mobile app
- [ ] Integration with more blockchains
- [ ] Enhanced AI model evaluation

### Bug Fixes

Check GitHub Issues for bugs tagged with `good first issue`.

---

## Getting Help

- **Discord**: Join our community
- **GitHub Issues**: Ask questions
- **Email**: dev@monaai.com

---

## Recognition

Contributors will be:

- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Eligible for contributor badges
- Invited to community events

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to MonaAI!
