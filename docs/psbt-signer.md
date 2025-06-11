# PSBT Signer - Technical Documentation

## Overview

The PSBT Signer is a web-based tool for signing Bitcoin Partially Signed Bitcoin Transactions (PSBTs) and generating BBQr codes for mobile transmission. It provides a secure, client-side interface for PSBT handling without exposing private keys to external services.

## Features

### Core Functionality
- **PSBT Import**: Paste or upload PSBT data in Base64 format
- **Private Key Input**: Secure WIF (Wallet Import Format) private key handling
- **Transaction Signing**: Client-side PSBT signing with input validation
- **BBQr Generation**: Multi-frame QR code generation for large PSBTs
- **Mobile Optimization**: Responsive design for smartphone usage

### Security Features
- **Client-side Processing**: All operations performed locally in browser
- **No Data Transmission**: Private keys never leave the user's device
- **Memory Clearing**: Sensitive data cleared after operations
- **Input Validation**: Comprehensive PSBT and key format verification

## Technical Architecture

### File Structure
```
psbt-signer.html         # Main HTML interface
src/psbt-signer.js       # Core JavaScript logic
dist/psbt-signer.bundle.js    # Compiled bundle
```

### Dependencies
- **bitcoinjs-lib**: Bitcoin transaction handling and PSBT operations
- **bbqr**: BBQr format encoding for multi-frame QR codes
- **qrcode**: Single QR code generation

### Key Classes and Methods

#### Main Functions
```javascript
// PSBT Processing
function parsePSBT(psbtBase64)     // Parse and validate PSBT input
function signPSBT(psbt, privateKey) // Sign PSBT with private key
function validateInputs()          // Validate form inputs

// BBQr Generation  
function generateBBQr(data)        // Generate multi-frame BBQr
function displayQRFrames(frames)   // Display animated QR sequence
function updateProgress()          // Update generation progress

// UI Management
function showStep(stepNumber)      // Navigate between workflow steps
function clearSensitiveData()      // Clear private keys from memory
```

## Workflow Steps

### Step 1: PSBT Input
- **Purpose**: Import PSBT transaction data
- **Input Format**: Base64 encoded PSBT string
- **Validation**: 
  - Base64 format verification
  - PSBT structure validation
  - Input/output analysis
- **Display**: Transaction summary with inputs, outputs, and fees

### Step 2: Private Key Input & Signing
- **Purpose**: Sign PSBT with user's private key
- **Input Format**: WIF (Wallet Import Format) private key
- **Security**:
  - Client-side key validation
  - Automatic key clearing after use
  - No network transmission
- **Process**:
  1. Validate private key format
  2. Extract public key and address
  3. Match against PSBT inputs
  4. Sign applicable inputs
  5. Generate signed PSBT

### Step 3: BBQr Generation (Removed in current version)
*This step was removed to simplify the workflow*

### Step 4: Transaction Display (Removed in current version)
*This step was removed to focus on core signing functionality*

## PSBT Processing Details

### Input Validation
```javascript
// PSBT Format Check
if (!psbtBase64.match(/^[A-Za-z0-9+/]+=*$/)) {
    throw new Error('Invalid Base64 format');
}

// PSBT Structure Validation
const psbt = bitcoin.Psbt.fromBase64(psbtBase64);
if (psbt.inputCount === 0) {
    throw new Error('PSBT has no inputs');
}
```

### Private Key Handling
```javascript
// WIF Validation and Import
const keyPair = bitcoin.ECPair.fromWIF(privateKeyWIF, network);
const publicKey = keyPair.publicKey;
const address = bitcoin.payments.p2pkh({ 
    pubkey: publicKey, 
    network 
}).address;
```

### Signing Process
```javascript
// Sign Each Applicable Input
for (let i = 0; i < psbt.inputCount; i++) {
    try {
        psbt.signInput(i, keyPair);
        signedInputs++;
    } catch (error) {
        // Input not signable by this key
        continue;
    }
}

// Finalize if all inputs signed
if (signedInputs === psbt.inputCount) {
    psbt.finalizeAllInputs();
}
```

## BBQr Integration

### Encoding Configuration
```javascript
const bbqrConfig = {
    encoding: 'H',        // Hex encoding
    maxFragmentSize: 200, // QR code capacity
    description: 'PSBT'   // Frame description
};
```

### Frame Generation
- **Automatic Splitting**: Large PSBTs split into optimal frame sizes
- **Progressive Display**: Frames displayed with timing controls
- **Manual Navigation**: Users can manually navigate between frames
- **Copy Functionality**: Individual frames copyable for manual entry

## UI Components

### Step Navigation
- **Progress Indicators**: Visual step completion status
- **Navigation Controls**: Next/Previous step buttons
- **Validation Gates**: Steps locked until prerequisites met

### Input Forms
```html
<!-- PSBT Input -->
<textarea id="psbt-input" placeholder="Paste PSBT Base64 here..."></textarea>

<!-- Private Key Input -->
<input type="password" id="private-key" placeholder="Enter WIF private key">

<!-- Action Buttons -->
<button id="parse-psbt">Parse PSBT</button>
<button id="sign-psbt">Sign Transaction</button>
```

### Display Areas
- **Transaction Summary**: Inputs, outputs, fees, and metadata
- **Signing Status**: Number of inputs signed vs total
- **BBQr Display**: Animated QR code sequence
- **Result Output**: Final signed PSBT in Base64 format

## Error Handling

### Common Error Types
- **Invalid PSBT Format**: Malformed Base64 or PSBT structure
- **Private Key Errors**: Invalid WIF format or network mismatch
- **Signing Failures**: Key doesn't match any inputs
- **Network Errors**: Testnet/mainnet configuration mismatches

### Error Display
```javascript
function showError(message, details = null) {
    const errorDiv = document.getElementById('error-display');
    errorDiv.innerHTML = `
        <div class="error-message">
            <strong>Error:</strong> ${message}
            ${details ? `<div class="error-details">${details}</div>` : ''}
        </div>
    `;
    errorDiv.style.display = 'block';
}
```

## Security Considerations

### Private Key Security
- **Memory Management**: Keys cleared immediately after use
- **No Persistence**: No local storage or cookies for sensitive data
- **Client-side Only**: All cryptographic operations performed locally

### Network Security
- **HTTPS Required**: Secure connection for production use
- **No External Calls**: No API dependencies for core functionality
- **Offline Capable**: Works without internet connection

### Input Validation
- **Sanitization**: All inputs validated and sanitized
- **Type Checking**: Strict type validation for all parameters
- **Error Boundaries**: Graceful handling of invalid inputs

## Browser Compatibility

### Supported Browsers
- **Chrome/Chromium 80+**: Full support
- **Safari 13+**: Full support with WebCrypto
- **Firefox 75+**: Full support
- **Edge 80+**: Full support

### Required APIs
- **WebCrypto API**: For cryptographic operations
- **Canvas API**: For QR code generation
- **localStorage**: For UI state (non-sensitive data only)

## Development Setup

### Build Process
```bash
# Install dependencies
npm install

# Build production bundle
npm run build

# Development server
python3 -m http.server 8081
```

### Testing
```bash
# Test with sample PSBT
const testPSBT = "cHNidP8BAHECAAAAAbCl..."; // Sample Base64 PSBT
const testKey = "KxvBz2TZr8...";            // Sample WIF key
```

## Best Practices

### For Users
1. **Verify PSBT Details**: Always review transaction details before signing
2. **Secure Environment**: Use on trusted, secure devices
3. **Private Key Safety**: Never share WIF private keys
4. **Double-check Outputs**: Verify recipient addresses and amounts

### For Developers
1. **Input Validation**: Validate all user inputs thoroughly
2. **Error Handling**: Provide clear, actionable error messages
3. **Security First**: Never log or store sensitive data
4. **Testing**: Test with various PSBT formats and edge cases

## Troubleshooting

### Common Issues
- **"Invalid PSBT"**: Check Base64 formatting and completeness
- **"No signable inputs"**: Verify private key matches PSBT inputs
- **"Network mismatch"**: Ensure key and PSBT use same network
- **QR display issues**: Check browser canvas support

### Debug Mode
Enable detailed logging by setting `DEBUG = true` in the console for additional troubleshooting information. 