# 🔧 Bitcoin Toolkit

> A streamlined web-based collection of Bitcoin utilities focused on QR code generation, price monitoring, and market analysis.

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)]()
[![Bitcoin](https://img.shields.io/badge/Bitcoin-Compatible-orange.svg)]()

## 🌟 Features

### 📱 QR Code Generator
Universal QR code generation with responsive design
- **Auto-sizing**: Responsive QR codes (200-400px)
- **Real-time Preview**: Instant generation on input
- **Download Support**: PNG export with timestamps
- **Mobile Optimized**: Touch-friendly interface

### 💰 Bitcoin Price Monitor
Real-time Bitcoin price tracking with alerts
- **Multi-source Data**: CoinGecko and Binance APIs
- **Price Alerts**: Browser notifications for threshold breaches
- **Historical Charts**: Canvas-based price visualization
- **Dual Currency**: USD and CNY support

### 📊 Market Cap Comparison
Compare Bitcoin's market cap with major tech companies
- **Real-time Data**: Live Bitcoin market cap updates
- **Company Comparisons**: Apple, Google, Amazon, and more
- **Visual Charts**: Interactive market cap visualizations
- **Historical Analysis**: Track market cap changes over time

### 🐍 Python Data Tools
Streamlined Bitcoin data analysis with professional visualizations
- **Daily Close Prices**: Download Bitcoin daily closing prices (2013+)
- **Monthly Averages**: Calculate monthly price averages automatically
- **Professional Charts**: Generate high-resolution trend and analysis charts
- **Lightweight**: Simple CSV output, Excel compatible
- **One-Click**: Automated data download and chart generation
- **See**: [`python-tools/`](./python-tools/) directory

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ 
- Modern browser (Chrome 80+, Firefox 75+, Safari 13+)

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/bitcoin-toolkit.git
cd bitcoin-toolkit

# Install dependencies
npm install

# Build the project
npm run build

# Start local HTTPS server (required for camera features)
node simple-https-server.js
```

### Access the Tools
- **Local**: https://localhost:9443/
- **Mobile Testing**: https://[your-ip]:9443/ (same WiFi network)

## 🏗️ Technology Stack

### Frontend
- **Framework**: Pure HTML5 + CSS3 + JavaScript (ES6+)
- **Build Tool**: Webpack 5 with multi-entry bundling
- **UI Design**: Responsive design with glass morphism effects
- **Mobile Support**: Touch-optimized interface

### Utility Libraries
- **qrious**: QR code generation
- **jsqr**: QR code scanning
- **html5-qrcode**: Camera-based QR scanning

### APIs & Services
- **Camera**: MediaDevices API for QR scanning
- **Storage**: localStorage for settings persistence
- **Notifications**: Browser Notification API
- **Blockchain**: Multiple API providers for broadcasting

## 📁 Project Structure

```
bitcoin-toolkit/
├── 📄 index.html              # Homepage with tool navigation
├── 💰 price.html              # Bitcoin price monitor
├── 📊 marketcap.html          # Market cap comparison
├── 📂 src/                    # Source code
│   └── index.js               # Homepage logic
├── 📦 dist/                   # Build output
├── 📚 docs/                   # Documentation
│   └── TECHNICAL_DOCUMENTATION.md
├── 🎨 icon/                   # App icons and favicons
└── ⚙️ webpack.config.js       # Build configuration
```

## 🔒 Security Features

### Pure Frontend Architecture
- ✅ **No Server Communication**: All operations happen locally
- ✅ **Offline Capable**: Works without internet (except price monitoring)
- ✅ **No Data Collection**: Zero user data transmission
- ✅ **Open Source**: Fully auditable codebase

### Best Practices
- 🔐 **Educational Purpose**: Clearly marked for learning and testing
- 🛡️ **Security Warnings**: Mandatory disclaimers for sensitive operations
- 📱 **HTTPS Required**: Camera features require secure context
- 🔍 **Code Transparency**: All cryptographic operations visible

## 📱 Mobile Support

### iOS Safari
- ✅ HTTPS environment required
- ✅ Camera permissions needed
- ✅ Responsive touch interface

### Android Chrome
- ✅ Local HTTP testing supported
- ✅ Full feature compatibility
- ✅ Optimized performance

## 🛠️ Development

### Build Commands
```bash
npm run build          # Production build
npm run dev            # Development build
npm run serve          # Start HTTPS server
```

### Adding New Features
1. Create new HTML page in root directory
2. Add corresponding JS file in `src/` directory
3. Update `webpack.config.js` entry points
4. Follow existing modular structure

### Testing
```bash
# Local testing
open https://localhost:9443/

# Mobile testing (replace with your IP)
open https://192.168.x.x:9443/
```

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow existing code style and structure
- Add appropriate documentation
- Test on multiple browsers and devices
- Ensure mobile compatibility

## 📖 Documentation

- 📋 [Technical Documentation](docs/TECHNICAL_DOCUMENTATION.md) - Comprehensive technical details
- 🔧 [API Reference](docs/TECHNICAL_DOCUMENTATION.md#core-functions) - Function documentation
- 🚀 [Deployment Guide](docs/TECHNICAL_DOCUMENTATION.md#deployment-instructions) - Setup instructions

## ❓ FAQ

**Q: Why pure frontend architecture?**
A: To ensure user fund security and avoid transmitting sensitive information like private keys to servers.

**Q: Can it be used offline?**
A: Yes, except for price query functionality, all other features support complete offline usage.

**Q: What tools are included?**
A: QR code generator, Bitcoin price tracker, and market cap comparison tools.

**Q: Mobile camera not working?**
A: Ensure you're using HTTPS and have granted camera permissions to your browser.

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This software is provided for educational and testing purposes only. While it implements industry-standard cryptographic libraries, users should:

- Test thoroughly before using with real funds
- Verify all generated addresses independently
- Use hardware wallets for significant amounts
- Keep backups secure and offline

**Use at your own risk. The developers assume no responsibility for any loss of funds.**

## 🔗 Useful Links

- [Bitcoin Price API - CoinGecko](https://www.coingecko.com/en/api)
- [QR Code Specification](https://en.wikipedia.org/wiki/QR_code)
- [Bitcoin Market Data](https://coinmarketcap.com/currencies/bitcoin/)

---

<div align="center">
  <strong>Built with ❤️ for the Bitcoin community</strong>
</div>
