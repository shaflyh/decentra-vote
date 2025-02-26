# Decentralized Vote Smart Contract

## 📌 Prerequisites
Ensure you have the following installed before proceeding:
- **[Node.js (v18+)](https://nodejs.org/)**
- **[pnpm](https://pnpm.io/installation)**
- **Hardhat** (Installed in the project)
- **Alchemy/Infura Account** (for Sepolia RPC URL)
- **MetaMask** wallet with Sepolia test ETH

---

## 🛠 Installation
### 1️⃣ Clone the Repository
```sh
git clone https://github.com/your-repo/voting-smart-contract.git
cd voting-smart-contract
```

### 2️⃣ Install Dependencies (Using pnpm)
`pnpm install`

### 3️⃣ Set Up Environment Variables (Using Hardhat Vars)
```sh
pnpm hardhat vars set DEV_PK=your-private-key
pnpm hardhat vars set SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY
pnpm hardhat vars set ETHERSCAN_API_KEY=your-etherscan-api-key
```
To verify the stored values:
`pnpm hardhat vars list`

## Deployment
```sh
pnpm hardhat compile
pnpm hardhat ignition deploy ignition/modules/DecentraVote.ts --network sepolia --deployment-id sepolia-deployment
pnpm hardhat ignition status sepolia-deployment
pnpm hardhat ignition verify sepolia-deployment
```
