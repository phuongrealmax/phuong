# MonaAI API Documentation

REST API documentation for the MonaAI platform.

**Base URL:** `http://localhost:3001` (development)

**Production URL:** `https://api.monaai.com`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Models](#models)
3. [Marketplace](#marketplace)
4. [Users](#users)
5. [Inference](#inference)
6. [Error Handling](#error-handling)

---

## Authentication

Currently, the API doesn't require authentication for read operations. Write operations require signing transactions with your private key.

---

## Models

### Get All Models

```http
GET /api/models
```

**Response:**

```json
{
  "success": true,
  "models": [
    {
      "id": "1",
      "name": "GPT-Mona",
      "ipfsHash": "QmTest123...",
      "creator": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      "timestamp": "1234567890",
      "isActive": true
    }
  ]
}
```

---

### Get Model by ID

```http
GET /api/models/:id
```

**Parameters:**

- `id` (string): Model ID

**Response:**

```json
{
  "success": true,
  "model": {
    "id": "1",
    "name": "GPT-Mona",
    "ipfsHash": "QmTest123...",
    "creator": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "timestamp": "1234567890",
    "isActive": true
  }
}
```

---

### Register New Model

```http
POST /api/models/register
```

**Request Body:**

```json
{
  "name": "My AI Model",
  "ipfsHash": "QmTest123456789",
  "privateKey": "0x..."
}
```

**Response:**

```json
{
  "success": true,
  "message": "Model registered successfully",
  "transactionHash": "0xabc..."
}
```

**Error Response:**

```json
{
  "success": false,
  "error": "Missing required fields: name, ipfsHash, privateKey"
}
```

---

## Marketplace

### Get All Listings

```http
GET /api/marketplace/listings
```

**Query Parameters:**

- `category` (optional): Filter by category
- `minPrice` (optional): Minimum price in ETH
- `maxPrice` (optional): Maximum price in ETH

**Response:**

```json
{
  "success": true,
  "listings": [
    {
      "id": 1,
      "name": "GPT-Mona AI Model",
      "description": "Advanced language model for text generation",
      "price": "0.5",
      "seller": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      "purchases": 12,
      "category": "Language Model"
    }
  ]
}
```

---

### Create Listing

```http
POST /api/marketplace/create
```

**Request Body:**

```json
{
  "modelId": "1",
  "price": "1.5",
  "privateKey": "0x..."
}
```

**Response:**

```json
{
  "success": true,
  "message": "Listing created successfully",
  "listingId": 123
}
```

---

### Purchase Model

```http
POST /api/marketplace/purchase
```

**Request Body:**

```json
{
  "listingId": "1",
  "privateKey": "0x..."
}
```

**Response:**

```json
{
  "success": true,
  "message": "Model purchased successfully",
  "transactionHash": "0xdef..."
}
```

---

## Users

### Get User Models

```http
GET /api/users/:address/models
```

**Parameters:**

- `address` (string): Ethereum address

**Response:**

```json
{
  "success": true,
  "address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "models": [
    {
      "id": "1",
      "name": "GPT-Mona",
      "ipfsHash": "QmTest123..."
    }
  ]
}
```

---

### Get User Stats

```http
GET /api/users/:address/stats
```

**Parameters:**

- `address` (string): Ethereum address

**Response:**

```json
{
  "success": true,
  "stats": {
    "totalModels": 3,
    "userModels": 2,
    "totalPurchases": 5,
    "totalEarnings": 2.5
  }
}
```

---

### Get User Activity

```http
GET /api/users/:address/activity
```

**Parameters:**

- `address` (string): Ethereum address

**Response:**

```json
{
  "success": true,
  "activity": [
    {
      "type": "register",
      "description": "Registered new AI model \"GPT-Mona\"",
      "timestamp": "2 hours ago",
      "amount": null
    },
    {
      "type": "purchase",
      "description": "Purchased \"Sentiment Analyzer Pro\"",
      "timestamp": "5 hours ago",
      "amount": "0.5"
    }
  ]
}
```

---

## Inference

### Run Inference

```http
POST /api/inference
```

**Request Body:**

```json
{
  "modelId": "1",
  "input": "Your input text here"
}
```

**Response:**

```json
{
  "success": true,
  "result": "Generated output text",
  "modelId": "1",
  "input": "Your input text here"
}
```

---

## Error Handling

### Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### HTTP Status Codes

- `200` - Success
- `400` - Bad Request (missing or invalid parameters)
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

### Common Errors

**400 Bad Request:**

```json
{
  "success": false,
  "error": "Missing required fields: name, ipfsHash, privateKey"
}
```

**404 Not Found:**

```json
{
  "success": false,
  "error": "Model not found"
}
```

**500 Internal Server Error:**

```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Rate Limiting

**Current Limits:**

- 100 requests per minute per IP
- 1000 requests per hour per IP

**Rate Limit Headers:**

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

---

## Examples

### cURL Examples

**Get all models:**

```bash
curl http://localhost:3001/api/models
```

**Register a model:**

```bash
curl -X POST http://localhost:3001/api/models/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My AI Model",
    "ipfsHash": "QmTest123",
    "privateKey": "0x..."
  }'
```

**Run inference:**

```bash
curl -X POST http://localhost:3001/api/inference \
  -H "Content-Type: application/json" \
  -d '{
    "modelId": "1",
    "input": "Hello, MonaAI!"
  }'
```

---

### JavaScript Examples

**Using fetch:**

```javascript
// Get all models
const response = await fetch('http://localhost:3001/api/models');
const data = await response.json();
console.log(data.models);

// Register a model
const registerResponse = await fetch('http://localhost:3001/api/models/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'My AI Model',
    ipfsHash: 'QmTest123',
    privateKey: '0x...'
  })
});
const registerData = await registerResponse.json();
console.log(registerData);
```

**Using axios:**

```javascript
const axios = require('axios');

// Get all models
const { data } = await axios.get('http://localhost:3001/api/models');
console.log(data.models);

// Register a model
const registerData = await axios.post('http://localhost:3001/api/models/register', {
  name: 'My AI Model',
  ipfsHash: 'QmTest123',
  privateKey: '0x...'
});
console.log(registerData.data);
```

---

### Python Examples

```python
import requests

# Get all models
response = requests.get('http://localhost:3001/api/models')
models = response.json()['models']
print(models)

# Register a model
data = {
    'name': 'My AI Model',
    'ipfsHash': 'QmTest123',
    'privateKey': '0x...'
}
response = requests.post('http://localhost:3001/api/models/register', json=data)
result = response.json()
print(result)
```

---

## Webhooks

**Coming Soon:** Subscribe to events like:

- New model registered
- Model purchased
- Listing created

---

## API Versioning

Current version: `v1`

Future versions will be accessed via:

```
/api/v2/models
```

---

## Support

For API support:

- GitHub Issues: https://github.com/monaai/monaai/issues
- Discord: https://discord.gg/monaai
- Email: api@monaai.com

---

**Last Updated:** October 2025
