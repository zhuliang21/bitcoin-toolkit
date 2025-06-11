# Bitcoin Toolkit - Technical Documentation

## 📋 Project Overview

Bitcoin Toolkit is a comprehensive web-based collection of Bitcoin utilities providing various practical Bitcoin-related functionalities. The project uses a modular design where each feature is an independent web application.

## 🗂️ Current Project Structure

```
bitcoin-toolkit/
├── docs/                     # Technical documentation directory
├── src/                      # JavaScript source code directory
├── dist/                     # Compiled bundle files
├── icon/                     # Icon resources
├── *.html                    # Various feature web pages
├── https-server.js           # HTTPS development server
├── webpack.config.js         # Webpack configuration
└── package.json              # Project dependency configuration
```

## 🔧 Core Component Documentation

### 1. [Main Page (index.html)](./index.md)
- **Function**: Project navigation and feature showcase
- **Features**: Responsive design, feature card layout
- **Tech Stack**: Pure HTML/CSS

### 2. [Brain Wallet Generator (brain-wallet.html)](./brain-wallet.md)
- **Function**: Generate Bitcoin addresses and private keys from mnemonic phrases
- **Features**: Multiple address format support, offline security
- **Tech Stack**: JavaScript, bitcoinjs-lib, bip39

### 3. [PSBT Signer (psbt-signer.html)](./psbt-signer.md)
- **Function**: PSBT transaction signing, BBQr generation
- **Features**: Mobile-friendly, QR code display
- **Tech Stack**: JavaScript, bitcoinjs-lib, BBQr

### 4. [BBQr Scanner (bbqr-reader.html)](./bbqr-reader.md)
- **Function**: Mobile camera scanning of BBQr codes
- **Features**: Multi-frame decoding, real-time progress display
- **Tech Stack**: JavaScript, Html5Qrcode, BBQr

### 5. [PSBT Tools (psbt.html)](./psbt.md)
- **Function**: PSBT creation, parsing, validation
- **Features**: Detailed transaction information display
- **Tech Stack**: JavaScript, bitcoinjs-lib

### 6. [QR Code Generator (qr.html)](./qr.md)
- **Function**: Text to QR code conversion
- **Features**: Customizable styles, batch generation
- **Tech Stack**: JavaScript, QRCode.js

### 7. [BBQr Generator (bbqr.html)](./bbqr.md)
- **Function**: Large data chunked QR code generation
- **Features**: Multiple encoding formats, animation playback
- **Tech Stack**: JavaScript, BBQr, QRCode.js

### 8. [Price Tracker (price.html)](./price.md)
- **Function**: Real-time Bitcoin price queries
- **Features**: Multi-exchange data, chart display
- **Tech Stack**: JavaScript, Chart.js, API integration

## 📋 Project Restructuring Proposal

We have identified opportunities to improve project organization and maintainability. See our comprehensive [Project Structure Optimization Proposal](./project-restructure-proposal.md) for detailed plans to reorganize the codebase into logical categories:

- **apps/wallet/**: Wallet-related tools
- **apps/psbt/**: PSBT transaction tools  
- **apps/qr/**: QR code generation and scanning
- **apps/market/**: Market data and pricing tools

This restructuring will provide better organization, easier maintenance, and improved user navigation.

## 🛠️ Development Guide

### Environment Requirements
- Node.js 18+
- npm 8+
- Modern browser support

### Local Development
```bash
# Install dependencies
npm install

# Compile bundles
npm run build

# Start HTTP server (desktop testing)
python3 -m http.server 8081

# Start HTTPS server (mobile testing)
node https-server.js
```

### Deployment Instructions
- Static file deployment to GitHub Pages
- Automated builds via GitHub Actions
- HTTPS required for camera functionality

## 📱 Mobile Support

Some features require HTTPS environment to work properly on mobile devices:
- BBQr Scanner (camera access)
- Any features requiring camera functionality

## 🔒 Security Considerations

- All private key operations performed client-side
- No sensitive information sent to servers
- Offline usage support
- HTTPS access recommended

## 📝 Documentation Status

### Completed Documentation
- ✅ [BBQr Reader](./bbqr-reader.md) - Comprehensive technical documentation
- ✅ [PSBT Signer](./psbt-signer.md) - Complete implementation guide
- ✅ [Project Restructuring Proposal](./project-restructure-proposal.md) - Detailed optimization plan

### Pending Documentation
- ⏳ Brain Wallet Generator
- ⏳ PSBT Tools/Analyzer
- ⏳ QR Code Generator
- ⏳ BBQr Generator
- ⏳ Price Tracker
- ⏳ Main Page/Navigation

## 🤝 Contributing Guidelines

1. Fork the project
2. Create a feature branch
3. Submit changes
4. Create a Pull Request

## 📞 Contact Information

For questions or suggestions, please provide feedback through GitHub Issues.

---

**Note**: This documentation is being actively developed. We're transitioning from Chinese to English documentation and implementing a new organized project structure for better maintainability and user experience. 