
# 🖥️ zkPredict Front – Web3 Interface for the Anonymous Prediction Market

**Front-end application to interact with the zkPredict protocol on Aleo.**

This repository contains the user interface for **zkPredict**, a zero-knowledge-based anonymous prediction market built on the Aleo blockchain using Leo smart contracts. This dApp allows users to create markets, place bets, and view predictions—all while preserving their privacy.

## ⚙️ Tech Stack

- ⚛️ React.js
- 🦺 TypeScript
- 🔐 Aleo Wallet SDK
- ♻️ Zustand / Redux (state management)
- 🌐 SnarkOS API (query + broadcast)
- 🎨 TailwindCSS

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- npm or yarn

### Installation

```bash
npm install
```

### Running Locally

```bash
npm run dev
```

## 🔑 Key Features

- Aleo Wallet connection
- Market creation with a custom question
- Dynamic YES/NO token integration from Leo contract
- Anonymous betting interface
- View of open and closed markets
- Simplified UI: question, deadline, token pools, status

## 📦 Project Structure

```
predictionmarket-front/
├── public/               # Public assets
├── src/
│   ├── components/       # Reusable UI components
│   ├── pages/            # Main pages (Home, Market, etc.)
│   ├── services/         # API & smart contract interactions
│   ├── utils/            # Utility functions
│   └── styles/           # Global styles
├── .env                  # Environment variables
└── README.md             # This file
```

## 🧪 Testing

Unit tests can be added using Jest or Vitest, depending on project setup.

## 🤝 Contributing

1. Fork this repository  
2. Create a new branch `git checkout -b feature/your-feature`  
3. Commit your changes `git commit -am 'Add feature'`  
4. Push to your fork `git push origin feature/your-feature`  
5. Submit a **Pull Request**

## 🧠 Related Project

👉 [Smart Contracts in Leo (prediction_market_leo)](https://github.com/alphabetaZK/prediction_market_leo)

## 👨‍💻 Team

- **Ramzy** – ZK logic 
- **Lina** – UI/UX Designer & Smart Contract liaison
- **Salim** – Frontend & AI
- **Abdellahi** – Testing & business part

## 📩 Contact / Support

- Open an issue at [GitHub Issues](https://github.com/alphabetaZK/predictionmarket-front/issues)

## 🌐 License

MIT – Open-source and free to build your own private market.

