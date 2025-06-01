
# 🖥️ zkPredict Front – Interface Web3 pour le Prediction Market Anonyme

**Front-end application for interacting with the zkPredict protocol on Aleo.**

Ce dépôt contient l'interface utilisateur du projet **zkPredict**, un marché de prédiction anonyme basé sur les ZK-proofs construit avec Leo sur la blockchain Aleo. Cette application permet aux utilisateurs de créer, parier et consulter les marchés de prédiction en toute confidentialité.

## ⚙️ Stack Technique

- ⚛️ React.js
- 🦺 TypeScript
- 🔐 Aleo Wallet SDK
- ♻️ Zustand / Redux (état global)
- 🌐 API SnarkOS (query + broadcast)
- 🎨 TailwindCSS

## 🚀 Lancer le projet en local

### Prérequis

- Node.js >= 18
- npm ou yarn

### Installation

```bash
npm install
```

### Lancement

```bash
npm run dev
```

## 🔑 Fonctionnalités Clés

- Connexion avec **Aleo Wallet**
- Interface pour créer un marché avec une question
- Intégration des tokens YES/NO mintés depuis le smart contract
- Interface de pari privé
- Visualisation de la liste des marchés actifs/clos
- Affichage simplifié pour l’utilisateur : question, deadline, pool, statut

## 📦 Structure du Projet

```
predictionmarket-front/
├── public/               # Assets publics
├── src/
│   ├── components/       # Composants réutilisables
│   ├── pages/            # Pages principales (Home, Market, etc.)
│   ├── services/         # Interactions avec Aleo API & Smart Contracts
│   ├── utils/            # Fonctions utilitaires
│   └── styles/           # Styles globaux
├── .env                 # Variables d’environnement
└── README.md            # Ce fichier
```

## 🧪 Test

Des tests unitaires peuvent être ajoutés avec Jest / Vitest selon la configuration.

## 🤝 Contribution

1. Fork le repo  
2. Crée ta branche `git checkout -b feature/awesome-feature`  
3. Commit `git commit -am 'Add new feature'`  
4. Push `git push origin feature/awesome-feature`  
5. Ouvre une **Pull Request**

## 🧠 Projet relié

👉 [Smart Contracts Leo (prediction_market_leo)](https://github.com/alphabetaZK/prediction_market_leo)

## 👨‍💻 Équipe

- **Ramzy** – Lead Front Dev  
- **Lina** – UI/UX Designer  
- **Mathieu** – Intégration Wallet / ZK Logic  
- **Salim** – Smart contract liaison  
- **Abdellahi** – Tests & Feedback

## 📩 Contact / Support

- Via [GitHub Issues](https://github.com/alphabetaZK/predictionmarket-front/issues)

## 🌐 Licence

MIT – Open-source, forkable, build your own private market.
