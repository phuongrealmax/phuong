# MonaAI - Hướng dẫn khởi động nhanh

## Bước 1: Cài đặt Dependencies

### Cài đặt dependencies cho Smart Contracts
```bash
npm install
```

### Cài đặt dependencies cho Backend
```bash
cd backend
npm install
cd ..
```

### Cài đặt dependencies cho Frontend
```bash
cd frontend
npm install
cd ..
```

## Bước 2: Khởi động Local Blockchain

Mở terminal đầu tiên và chạy:
```bash
npx hardhat node
```

Blockchain local sẽ chạy tại: `http://127.0.0.1:8545`

**Lưu ý**: Hardhat sẽ tạo 20 accounts test với private keys. Lưu lại để sử dụng.

## Bước 3: Deploy Smart Contract

Mở terminal thứ hai và chạy:
```bash
npx hardhat run scripts/deploy.js --network localhost
```

**Lưu lại địa chỉ contract** được in ra để cấu hình backend!

## Bước 4: Cấu hình Backend

Tạo file `.env` trong thư mục `backend`:
```bash
cd backend
cp .env.example .env
```

Sửa file `backend/.env`:
```
PORT=3001
RPC_URL=http://localhost:8545
CONTRACT_ADDRESS=<địa_chỉ_contract_từ_bước_3>
IPFS_GATEWAY=http://127.0.0.1:5001
```

## Bước 5: Khởi động Backend API

Trong terminal thứ ba:
```bash
cd backend
npm start
```

Backend API sẽ chạy tại: `http://localhost:3001`

Test API:
```bash
curl http://localhost:3001/health
```

## Bước 6: Khởi động Frontend

Trong terminal thứ tư:
```bash
cd frontend
npm start
```

Frontend sẽ tự động mở tại: `http://localhost:3000`

## Bước 7: Kết nối MetaMask

1. Cài đặt MetaMask extension (nếu chưa có)
2. Thêm mạng local:
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `1337`
   - Currency Symbol: `ETH`

3. Import một account test từ Hardhat (sử dụng private key từ Bước 2)

4. Vào `http://localhost:3000` và click "Connect Wallet"

## Bước 8: Test các tính năng

### Test đăng ký model:
1. Kết nối wallet trên frontend
2. Điền thông tin model (tên và IPFS hash giả)
3. Click "Register Model"

### Test API trực tiếp:

**Lấy danh sách models:**
```bash
curl http://localhost:3001/api/models
```

**Chạy inference:**
```bash
curl -X POST http://localhost:3001/api/inference \
  -H "Content-Type: application/json" \
  -d '{"modelId": "1", "input": "Hello MonaAI"}'
```

## Chạy Tests

### Test Smart Contracts:
```bash
npx hardhat test
```

## Tóm tắt các URLs:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Blockchain**: http://localhost:8545
- **Health Check**: http://localhost:3001/health

## Troubleshooting

### Lỗi "Cannot find module"
```bash
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### Lỗi kết nối blockchain
- Kiểm tra Hardhat node đang chạy
- Kiểm tra RPC_URL trong backend/.env

### Lỗi MetaMask
- Reset account trong MetaMask settings
- Xóa và thêm lại mạng local

## Các lệnh hữu ích:

```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Clean and rebuild
npx hardhat clean
npm run compile

# Check contract size
npx hardhat size-contracts
```

## Tiếp theo:

- Đọc README.md để biết thêm chi tiết
- Xem docs/ARCHITECTURE.md để hiểu kiến trúc
- Tùy chỉnh smart contract trong contracts/MonaAI.sol
- Thêm tính năng mới vào frontend/backend

Chúc bạn code vui vẻ! 🚀
