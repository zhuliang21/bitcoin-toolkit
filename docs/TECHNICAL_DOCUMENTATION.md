# Bitcoin Toolkit - Technical Documentation

## Project Overview

Bitcoin Toolkit is a web-based collection of Bitcoin utilities providing various practical functions for Bitcoin development, testing, and educational purposes. The project adopts a pure frontend architecture, supports offline usage, and ensures user fund security.

### Technology Stack
- **Frontend Framework**: Native HTML5 + CSS3 + JavaScript (ES6+)
- **Build Tool**: Webpack 5
- **Crypto Libraries**: bitcoinjs-lib, bip39, qrious
- **UI Design**: Responsive design with mobile support
- **Deployment**: Static website, GitHub Pages compatible

---

## 1. Homepage (index.html)

### Functional Overview
Project entry page providing tool navigation and project introduction.

### Technical Features
- **Responsive Layout**: CSS Grid + Flexbox
- **Multi-language Support**: English/Chinese toggle
- **Gradient Background**: CSS linear gradients
- **Card Navigation**: Glass morphism effects

### Core Functions
1. **Tool Navigation**: Links to various sub-function pages
2. **Language Toggle**: localStorage persistent language settings
3. **Security Notice**: Dismissible warning banner

### Code Structure
```javascript
// Language toggle logic
function toggleLanguage() {
  currentLanguage = currentLanguage === 'en' ? 'zh' : 'en';
  localStorage.setItem('language', currentLanguage);
  updateTexts();
}
```

---

## 2. BBQr Helper (bbqr-helper.html)

### Functional Overview
Complete PSBT to ColdCard to broadcast workflow, supporting BBQr QR code generation and scanning.

### Technical Architecture
- **Modular Design**: 5-step workflow
- **State Management**: Global state object
- **Camera Integration**: MediaDevices API
- **QR Code Processing**: QRious library + jsQR scanning

### Core Functions

#### Step 1: Import PSBT
- **File Upload**: FileReader API
- **Text Input**: Base64 format validation
- **PSBT Parsing**: bitcoinjs-lib library

```javascript
// PSBT parsing core logic
function decodePSBT(psbtBase64) {
  const psbtBuffer = Buffer.from(psbtBase64, 'base64');
  const psbt = bitcoin.Psbt.fromBuffer(psbtBuffer);
  return {
    fee: psbt.getFee(),
    outputs: psbt.txOutputs,
    signatureStatus: psbt.validateSignaturesOfAllInputs() ? 'Fully Signed' : 'Unsigned'
  };
}
```

#### Step 2: Generate BBQr
- **Square Layout**: CSS Grid responsive design
- **PSBT Summary**: Smart change detection
- **BBQr Generation**: Fragmented QR code auto-play

```javascript
// BBQr generation logic
function generateBBQrCodes() {
  const psbtBinary = Uint8Array.from(atob(state.psbtData), c => c.charCodeAt(0));
  const result = splitQRs(psbtBinary, 'P', {
    maxSplit: 50,
    minSplit: 3,
    maxBytes: 1000
  });
  setupQRNavigation(result.parts);
}
```

#### Step 3: Scan Signed PSBT
- **Camera Access**: getUserMedia API
- **Real-time Scanning**: requestAnimationFrame loop
- **BBQr Reconstruction**: Multi-fragment merge validation

#### Step 4: Finalize Transaction
- **PSBT Finalization**: finalizePsbt function
- **Transaction Summary**: Detailed input/output analysis

#### Step 5: Broadcast Transaction
- **Multi-API Support**: BlockCypher, Blockstream
- **Error Handling**: Detailed error message parsing
- **Success Feedback**: Transaction ID display

### State Management
```javascript
const state = {
  currentStep: 1,
  psbtData: null,
  bbqrCodes: [],
  signedPsbt: null,
  finalizedTx: null
};
```

### Responsive Design
- **Desktop**: Side-by-side square areas
- **Mobile**: Vertical stacked layout
- **Camera Optimization**: 70vw×70vw viewport, max 300px

---

## 3. Brain Wallet Generator (brain-wallet.html)

### Functional Overview
Generate deterministic Bitcoin wallets based on arbitrary text input, supporting multiple address formats.

### Technical Implementation
- **Entropy Source**: User input text
- **Mnemonic Generation**: BIP39 standard
- **Seed Derivation**: PBKDF2 algorithm
- **Address Generation**: Supports Legacy, SegWit, Taproot

### Core Algorithm
```javascript
// Wallet generation workflow
function generateWallet(inputText) {
  // 1. Generate mnemonic
  const entropy = crypto.createHash('sha256').update(inputText).digest();
  const mnemonic = bip39.entropyToMnemonic(entropy);
  
  // 2. Generate seed
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  
  // 3. Derive various address formats
  const addresses = {
    legacy: generateLegacyAddress(seed),      // P2PKH
    segwit: generateSegWitAddress(seed),      // P2SH-P2WPKH
    native: generateNativeSegWit(seed),       // P2WPKH
    taproot: generateTaprootAddress(seed)     // P2TR
  };
  
  return { mnemonic, seed, addresses };
}
```

### Address Format Support
1. **Legacy (P2PKH)**: Traditional addresses starting with 1
2. **Nested SegWit (P2SH-P2WPKH)**: Compatible addresses starting with 3
3. **Native SegWit (P2WPKH)**: Native SegWit starting with bc1
4. **Taproot (P2TR)**: Taproot addresses starting with bc1p

### Security Features
- **Disclaimer Modal**: Mandatory security warning display
- **Educational Purpose**: Clearly marked for learning only
- **Offline Usage**: Recommended for offline use

### UI Features
- **Mnemonic Grid**: 12-word card display
- **Address Checking**: Integrated blockchain API usage queries
- **Copy Functions**: One-click copy for various format data

---

## 4. Bitcoin Price Monitor (price.html)

### Functional Overview
Real-time Bitcoin price monitoring with multiple exchange data sources and price alerts.

### Data Source Integration
- **CoinGecko API**: Primary price data source
- **Binance API**: Backup data source
- **Local Cache**: localStorage price history

### Core Functions

#### Real-time Price Updates
```javascript
// Price fetching logic
async function fetchBitcoinPrice() {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,cny');
    const data = await response.json();
    
    updatePriceDisplay({
      usd: data.bitcoin.usd,
      cny: data.bitcoin.cny,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Price fetch failed:', error);
    tryBackupAPI();
  }
}
```

#### Price Alert System
- **Threshold Settings**: User-defined price alerts
- **Browser Notifications**: Notification API
- **Persistent Storage**: localStorage settings storage

#### Historical Data Visualization
- **Price Charts**: Canvas-drawn simple charts
- **Trend Analysis**: 24-hour price changes
- **Multi-currency Support**: USD, CNY dual currency display

### Technical Features
- **Scheduled Updates**: setInterval auto-refresh
- **Error Handling**: Multiple backup solutions
- **Offline Detection**: navigator.onLine status monitoring
- **Responsive Charts**: Mobile-optimized display

---

## 5. 404 Error Page (404.html)

### Functional Overview
User-friendly 404 error page providing navigation options back to homepage.

### Design Features
- **Consistent Design**: Unified visual style with main theme
- **Friendly Messages**: Bilingual error messages (English/Chinese)
- **Quick Navigation**: Return to homepage button
- **Animation Effects**: CSS transition animations

---

## Technical Architecture Details

### Build System (webpack.config.js)
```javascript
module.exports = {
  entry: {
    'index': './src/index.js',
    'bbqr-helper': './src/bbqr-helper.js',
    'brain-wallet': './src/brain-wallet.js',
    'qr': './src/qr.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js'
  },
  // ... other configurations
};
```

### Dependency Management
- **bitcoinjs-lib**: Bitcoin protocol implementation
- **bip39**: Mnemonic generation and validation
- **qrious**: QR code generation library
- **jsqr**: QR code scanning library

### Security Considerations
1. **Pure Frontend**: No server-side data transmission
2. **Offline Usage**: Supports complete offline operation
3. **No Data Collection**: Does not collect any user data
4. **Open Source Transparency**: All code publicly auditable

### Performance Optimization
1. **Code Splitting**: Webpack multi-entry bundling
2. **Resource Compression**: Production environment code compression
3. **Caching Strategy**: Reasonable browser cache settings
4. **Lazy Loading**: On-demand feature module loading

### Compatibility
- **Modern Browsers**: Chrome 80+, Firefox 75+, Safari 13+
- **Mobile**: iOS Safari, Android Chrome
- **API Support**: MediaDevices, Canvas, localStorage

---

## Deployment Instructions

### Development Environment
```bash
# Install dependencies
npm install

# Development build
npm run build

# Local HTTPS server
node simple-https-server.js
```

### Production Deployment
1. **Static Hosting**: Supports any static website hosting service
2. **HTTPS Requirement**: Camera functionality requires HTTPS environment
3. **CDN Optimization**: Recommended to use CDN for resource acceleration

### Mobile Testing
- **iOS Safari**: Requires HTTPS environment
- **Android Chrome**: Supports local HTTP testing
- **Camera Permissions**: Requires manual user authorization

---

## Maintenance and Extension

### Code Structure
```
bitcoin-toolkit/
├── src/                 # Source code
│   ├── index.js        # Homepage logic
│   ├── bbqr-helper.js  # BBQr helper
│   ├── brain-wallet.js # Brain wallet
│   └── qr.js          # QR generator
├── dist/               # Build output
├── docs/               # Documentation
└── icon/              # Icon resources
```

### Extension Recommendations
1. **New Feature Modules**: Follow existing modular structure
2. **Internationalization**: Expand multi-language support
3. **Theme System**: Support dark/light theme switching
4. **Plugin Architecture**: Support third-party feature extensions

### Testing Strategy
1. **Unit Testing**: Core algorithm function testing
2. **Integration Testing**: End-to-end workflow testing
3. **Compatibility Testing**: Multi-browser environment testing
4. **Security Testing**: Cryptographic algorithm correctness verification

---

## Frequently Asked Questions

### Q: Why choose a pure frontend architecture?
A: To ensure user fund security and avoid transmitting sensitive information like private keys to servers.

### Q: How to ensure code security?
A: The project is completely open source, all code is auditable, and uses mature cryptographic libraries.

### Q: What if mobile camera doesn't work?
A: Ensure using HTTPS environment and grant camera permissions to the browser.

### Q: Can it be used offline?
A: Yes, except for price query functionality, all other features support complete offline usage.

---

## Changelog

### v1.0.0 (Current Version)
- ✅ Complete BBQr helper workflow
- ✅ Brain wallet generator
- ✅ QR code generation tool
- ✅ Bitcoin price monitoring
- ✅ Responsive design
- ✅ Multi-language support

### Planned Features
- 🔄 Hardware wallet integration
- 🔄 Batch transaction processing
- 🔄 Advanced PSBT editor
- 🔄 Transaction analysis tools

---

*Last updated: December 2024* 