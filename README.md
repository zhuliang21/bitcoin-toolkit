# Crypto Wallet Tools

A modern, secure, and mobile-optimized collection of cryptocurrency wallet utilities built with vanilla JavaScript. Features beautiful UI design with minimalist aesthetics and comprehensive Bitcoin wallet functionality.

## 🚀 Features

### 🧠 Brain Wallet Generator

- **Deterministic Wallet Generation**: Create Bitcoin wallets from any memorable text input
- **Multiple Address Types**: Support for Legacy (P2PKH), Nested SegWit (P2SH-P2WPKH), and Native SegWit (P2WPKH)
- **Beautiful Mnemonic Display**: 4×3 grid layout with sequence numbers and one-click copy functionality
- **QR Code Generation**: Generate QR codes for easy backup and sharing
- **Wallet Usage Verification**: Check if generated addresses have been used on the blockchain
- **Mobile-First Design**: Responsive interface optimized for mobile devices
- **Modern UI**: Minimalist design with gradients, rounded corners, and smooth animations

### 🎨 Design Features

- **Minimalist Aesthetics**: Clean, 素雅 (elegant) color scheme with subtle gradients
- **Mobile Optimization**: Touch-friendly interface with proper spacing and font scaling
- **Responsive Layout**: Adapts seamlessly to different screen sizes (desktop, tablet, mobile)
- **Modern Animations**: Smooth transitions, hover effects, and micro-interactions
- **Card-Based Layout**: Organized sections with proper visual hierarchy

## 📱 Live Demo

Open `index.html` in your browser to access the tools:

- **Index Page**: Overview of all available tools
- **Brain Wallet Generator**: Full-featured wallet generation tool

## 🛠️ Installation

### Prerequisites

- Node.js (v14.x or later recommended)
- npm (v6.x or later recommended)

### Setup

```bash
git clone [your-repo-url]
cd seed-demo
npm install
```

### Build

```bash
npm run build
```

This will generate the bundled JavaScript file in the `dist/` directory.

## 📂 Project Structure

```text
crypto-wallet-tools/
├── index.html              # Main landing page with tool overview
├── brain-wallet.html        # Brain wallet generator interface
├── src/
│   └── brain-wallet.js     # Core wallet generation logic
├── dist/
│   └── brain-wallet.bundle.js # Bundled JavaScript output
├── package.json            # Node.js dependencies and scripts
└── README.md              # This file
```

## 🔧 Technical Implementation

### Core Technologies

- **Vanilla JavaScript**: No framework dependencies for better performance
- **Browserify**: Module bundling for browser compatibility
- **Bitcoin Libraries**:
  - `bitcoinjs-lib`: Bitcoin transaction and address handling
  - `bip32`: Hierarchical deterministic wallet support
  - `bip39`: Mnemonic phrase generation and validation
  - `bs58check`: Base58 encoding/decoding
- **QR Code Generation**: `qrcode` library for visual backup codes

### Security Features

- **Client-Side Only**: All wallet generation happens locally in the browser
- **No Data Transmission**: Private keys and seeds never leave your device
- **Usage Verification**: Check address usage via public blockchain APIs
- **Entropy Generation**: Secure random number generation for wallet creation

### Mobile Optimization

- **Responsive Breakpoints**: 768px and 375px for tablet and mobile
- **Touch-Friendly**: Larger touch targets and appropriate spacing
- **Performance**: Optimized for mobile browsers and slower connections

## 🎯 Usage Guide

### Brain Wallet Generator

1. **Enter Text**: Input any memorable text or passphrase
2. **Generate Wallet**: Click "Generate Wallet" to create your wallet
3. **View Mnemonic**: See your 12-word mnemonic phrase in an organized 4×3 grid
4. **Copy Backup**: Use the copy button to save your mnemonic phrase
5. **Check QR Code**: Scan the QR code for easy backup
6. **Get Addresses**: View addresses for different Bitcoin formats
7. **Verify Usage**: Check if the wallet has been used before

### Safety Recommendations

- ⚠️ **Never use this for real funds without thorough testing**
- 🔒 **Always verify wallet usage before depositing funds**
- 💾 **Backup your mnemonic phrase securely**
- 🔐 **Use strong, unique passphrases for brain wallets**

## 🔮 Roadmap

### Coming Soon

- **HD Wallet Generator**: Standard BIP39 mnemonic generation
- **Address Analyzer**: Detailed Bitcoin address analysis
- **Transaction Builder**: Custom Bitcoin transaction creation
- **Multi-Currency Support**: Ethereum, Litecoin, and other cryptocurrencies

## 🛡️ Security Notice

This tool is designed for educational and development purposes. While it implements industry-standard cryptographic libraries, users should:

- Test thoroughly before using with real funds
- Verify all generated addresses independently
- Use hardware wallets for significant amounts
- Keep backups secure and offline

## 📖 API Reference

### Core Functions

```javascript
// Generate wallet from entropy
generateKeysAndAddresses(seedBuffer)

// Create mnemonic from text
const mnemonic = bip39.entropyToMnemonic(entropyHex)

// Generate addresses for different types
const p2pkh = payments.p2pkh({ pubkey: node.publicKey }).address
const p2sh = payments.p2sh({ redeem: payments.p2wpkh({ pubkey: node.publicKey }) }).address
const p2wpkh = payments.p2wpkh({ pubkey: node.publicKey }).address
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for:

- Bug fixes
- New features
- UI/UX improvements
- Documentation updates

## 📄 License

ISC License - see LICENSE file for details

## 🔗 Links

- [Bitcoin Developer Documentation](https://developer.bitcoin.org/)
- [BIP39 Specification](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki)
- [BIP32 Specification](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki)

---

**Disclaimer**: This software is provided "as is" without warranty. Use at your own risk.
