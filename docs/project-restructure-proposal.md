# Project Structure Optimization Proposal

## Current Issues

The current project structure has several organizational challenges:

1. **Root Directory Clutter**: All HTML files are in the root directory
2. **Mixed Functionality**: Different types of tools are not categorized
3. **Maintenance Difficulty**: Hard to locate and maintain specific components
4. **Unclear Dependencies**: Relationships between components are not obvious

## Proposed New Structure

```
bitcoin-toolkit/
├── docs/                           # Technical documentation
│   ├── README.md                   # Main documentation index
│   ├── bbqr-reader.md             # BBQr Reader documentation
│   ├── psbt-signer.md             # PSBT Signer documentation
│   ├── brain-wallet.md            # Brain Wallet documentation
│   └── ...                        # Other component docs
│
├── apps/                           # Main application pages
│   ├── wallet/                     # Wallet-related tools
│   │   ├── brain-wallet.html      # Brain wallet generator
│   │   └── index.html              # Wallet tools index
│   │
│   ├── psbt/                       # PSBT-related tools
│   │   ├── signer.html             # PSBT signer
│   │   ├── analyzer.html           # PSBT analyzer (psbt.html)
│   │   └── index.html              # PSBT tools index
│   │
│   ├── qr/                         # QR code tools
│   │   ├── generator.html          # Basic QR generator (qr.html)
│   │   ├── bbqr-generator.html     # BBQr generator (bbqr.html)
│   │   ├── bbqr-reader.html        # BBQr scanner
│   │   └── index.html              # QR tools index
│   │
│   ├── market/                     # Market data tools
│   │   ├── price.html              # Price tracker
│   │   └── index.html              # Market tools index
│   │
│   └── index.html                  # Main apps directory index
│
├── src/                            # JavaScript source files
│   ├── wallet/
│   │   └── brain-wallet.js
│   ├── psbt/
│   │   ├── signer.js               # Renamed from psbt-signer.js
│   │   └── analyzer.js             # Renamed from psbt.js
│   ├── qr/
│   │   ├── generator.js            # Renamed from qr.js
│   │   ├── bbqr-generator.js       # Renamed from bbqr.js
│   │   └── bbqr-reader.js
│   ├── market/
│   │   └── price.js                # New file for price.html
│   └── shared/                     # Shared utilities
│       ├── bitcoin-utils.js        # Common Bitcoin operations
│       ├── ui-utils.js             # Common UI helpers
│       └── qr-utils.js             # Common QR code utilities
│
├── dist/                           # Compiled bundles (organized by category)
│   ├── wallet/
│   ├── psbt/
│   ├── qr/
│   └── market/
│
├── assets/                         # Static assets
│   ├── icons/                      # App icons and favicons
│   ├── styles/                     # Shared CSS files
│   │   ├── common.css              # Common styles
│   │   ├── components.css          # Reusable components
│   │   └── themes.css              # Theme definitions
│   └── images/                     # Images and graphics
│
├── tools/                          # Development and build tools
│   ├── https-server.js             # HTTPS development server
│   ├── build-scripts/              # Custom build scripts
│   └── templates/                  # HTML templates
│
├── tests/                          # Test files (organized by category)
│   ├── wallet/
│   ├── psbt/
│   ├── qr/
│   └── shared/
│
├── index.html                      # Main landing page (stays in root)
├── 404.html                        # Error page (stays in root)
├── webpack.config.js               # Updated webpack configuration
├── package.json                    # Project dependencies
└── README.md                       # Project overview
```

## Migration Benefits

### 1. **Logical Organization**
- **Wallet Tools**: All wallet-related functionality grouped together
- **PSBT Tools**: Transaction signing and analysis tools
- **QR Tools**: QR generation and scanning capabilities
- **Market Tools**: Price tracking and market data

### 2. **Improved Navigation**
- **Category Landing Pages**: Each category has its own index page
- **Clear Hierarchy**: Users can easily find related tools
- **Consistent URLs**: Predictable URL structure (`/apps/category/tool.html`)

### 3. **Better Maintenance**
- **Isolated Changes**: Modifications to one category don't affect others
- **Easier Testing**: Tests organized by functional area
- **Code Reusability**: Shared utilities reduce duplication

### 4. **Enhanced Development**
- **Modular Development**: Teams can work on different categories independently
- **Selective Building**: Build only changed categories
- **Clear Dependencies**: Easy to see what each component depends on

## Implementation Plan

### Phase 1: Documentation and Planning
1. ✅ Create comprehensive technical documentation
2. ✅ Define new directory structure
3. Create migration checklist
4. Update build configuration

### Phase 2: Core Restructuring
1. Create new directory structure
2. Move HTML files to appropriate categories
3. Reorganize JavaScript files
4. Update import paths and dependencies

### Phase 3: Build System Updates
1. Update webpack configuration for new structure
2. Modify build scripts for category-based compilation
3. Update development server configuration
4. Test all build processes

### Phase 4: Navigation and Linking
1. Create category index pages
2. Update main landing page
3. Add breadcrumb navigation
4. Update internal links

### Phase 5: Testing and Validation
1. Test all applications in new structure
2. Validate all links and resources
3. Ensure mobile compatibility
4. Update documentation

## URL Migration Map

### Current → New Structure
```
brain-wallet.html       → apps/wallet/brain-wallet.html
psbt-signer.html       → apps/psbt/signer.html
psbt.html              → apps/psbt/analyzer.html
qr.html                → apps/qr/generator.html
bbqr.html              → apps/qr/bbqr-generator.html
bbqr-reader.html       → apps/qr/bbqr-reader.html
price.html             → apps/market/price.html
```

## Webpack Configuration Updates

### New Entry Points
```javascript
module.exports = {
  entry: {
    // Wallet tools
    'wallet/brain-wallet': './src/wallet/brain-wallet.js',
    
    // PSBT tools
    'psbt/signer': './src/psbt/signer.js',
    'psbt/analyzer': './src/psbt/analyzer.js',
    
    // QR tools
    'qr/generator': './src/qr/generator.js',
    'qr/bbqr-generator': './src/qr/bbqr-generator.js',
    'qr/bbqr-reader': './src/qr/bbqr-reader.js',
    
    // Market tools
    'market/price': './src/market/price.js',
    
    // Shared utilities
    'shared/bitcoin-utils': './src/shared/bitcoin-utils.js'
  },
  
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js'
  }
};
```

## Category Index Pages

### Example: QR Tools Index (`apps/qr/index.html`)
```html
<!DOCTYPE html>
<html>
<head>
    <title>QR Code Tools - Bitcoin Toolkit</title>
    <link rel="stylesheet" href="../../assets/styles/common.css">
</head>
<body>
    <nav class="breadcrumb">
        <a href="../../">Home</a> › 
        <a href="../">Apps</a> › 
        <span>QR Tools</span>
    </nav>
    
    <h1>QR Code Tools</h1>
    
    <div class="tool-grid">
        <div class="tool-card">
            <h3>QR Generator</h3>
            <p>Generate basic QR codes from text</p>
            <a href="generator.html" class="btn">Open Tool</a>
        </div>
        
        <div class="tool-card">
            <h3>BBQr Generator</h3>
            <p>Create multi-frame BBQr codes for large data</p>
            <a href="bbqr-generator.html" class="btn">Open Tool</a>
        </div>
        
        <div class="tool-card">
            <h3>BBQr Scanner</h3>
            <p>Scan and decode BBQr codes with mobile camera</p>
            <a href="bbqr-reader.html" class="btn">Open Tool</a>
        </div>
    </div>
</body>
</html>
```

## Shared Components

### Common CSS (`assets/styles/common.css`)
```css
/* Shared styles for all applications */
:root {
    --primary-color: #f7931a;
    --secondary-color: #333;
    --background-color: #f5f5f5;
    --border-radius: 8px;
}

.tool-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin: 20px 0;
}

.tool-card {
    background: white;
    padding: 20px;
    border-radius: var(--border-radius);
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.breadcrumb {
    margin: 10px 0;
    font-size: 14px;
}

.breadcrumb a {
    color: var(--primary-color);
    text-decoration: none;
}
```

## Backwards Compatibility

### Redirect Strategy
Create simple redirect pages in the root directory:
```html
<!-- psbt-signer.html -->
<script>
    window.location.replace('./apps/psbt/signer.html');
</script>
<noscript>
    <meta http-equiv="refresh" content="0; url=./apps/psbt/signer.html">
</noscript>
```

## Next Steps

1. **Review and Approve**: Review this proposal and suggest modifications
2. **Create Branch**: Create a feature branch for the restructuring
3. **Implement Phase by Phase**: Execute the migration plan systematically
4. **Test Thoroughly**: Ensure all functionality works in new structure
5. **Update Documentation**: Update all documentation to reflect new structure

This restructuring will significantly improve the project's maintainability, user experience, and development workflow while preserving all existing functionality. 