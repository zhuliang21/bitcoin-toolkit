# BBQr Reader - Technical Documentation

## Overview

The BBQr Reader is a mobile-friendly web application that uses camera access to scan and decode BBQr (Bitcoin QR) codes. BBQr is a format for encoding large amounts of data across multiple QR codes, commonly used for Bitcoin PSBT transactions that exceed single QR code capacity.

## Features

### Core Functionality
- **Multi-frame BBQr scanning**: Automatically detects and combines multiple QR code frames
- **Real-time progress tracking**: Visual progress bar and frame status indicators
- **Multiple encoding support**: Handles H (Hex), Z (Zlib), M (Raw), B (Base64) encodings
- **Single QR fallback**: Also works with regular QR codes
- **Mobile camera access**: HTTPS-enabled camera streaming for mobile devices

### User Interface
- **Environment detection**: Automatically checks protocol (HTTP/HTTPS) and device type
- **Camera testing**: Step-by-step camera access verification
- **Visual scanning overlay**: Green scanning area with pulse animation
- **Debug console**: Real-time logging and troubleshooting information
- **Copy to clipboard**: One-click copying of decoded results

## Technical Architecture

### File Structure
```
bbqr-reader.html        # Main HTML interface
src/bbqr-reader.js      # Core JavaScript logic
dist/bbqr-reader.bundle.js   # Compiled bundle
```

### Dependencies
- **html5-qrcode**: QR code scanning library
- **bbqr**: BBQr format handling
- **Modern browser APIs**: MediaDevices, getUserMedia, DecompressionStream

### Key Classes and Methods

#### BBQrReader Class
```javascript
class BBQrReader {
    constructor()           // Initialize components and state
    startBBQrScan()        // Begin QR code scanning
    onQrCodeDetected()     // Handle detected QR codes
    parseBBQrFrame()       // Parse BBQr frame format
    processBBQrFrame()     // Process and store frame data
    completeBBQrScan()     // Combine and decode all frames
    decodeBBQrData()       // Decode based on encoding type
}
```

## BBQr Format Support

### Standard Format
```
B$<index>/<total>/<encoding>/<data>
```
- `index`: Frame number (1-based)
- `total`: Total number of frames
- `encoding`: H|Z|M|B (Hex|Zlib|Raw|Base64)
- `data`: Encoded payload

### Hex Format
```
bbqr1<index_hex><total_hex><encoding_hex><data>
```
- Uses hexadecimal encoding for frame metadata

### Encoding Types
- **H (Hex)**: Raw hexadecimal data → Base64
- **Z (Zlib)**: Compressed data → Decompress → Base64
- **M (Raw)**: Uncompressed data → Base64
- **B (Base64)**: Already Base64 encoded

## Setup and Deployment

### Development Environment
```bash
# Install dependencies
npm install

# Build bundle
npm run build

# Start HTTPS server (required for camera)
node https-server.js
```

### HTTPS Requirements
Camera access requires HTTPS in production environments:
- Desktop: `https://localhost:8443/bbqr-reader.html`
- Mobile: `https://[LOCAL_IP]:8443/bbqr-reader.html`

### Browser Compatibility
- **Chrome/Chromium**: Full support
- **Safari (iOS)**: Requires specific permission handling
- **Firefox**: Full support
- **Edge**: Full support

## Usage Flow

1. **Environment Check**: Verify HTTPS and device compatibility
2. **Camera Test**: Test camera access permissions
3. **Start Camera**: Initialize video stream
4. **Begin Scanning**: Activate QR code detection
5. **Frame Collection**: Automatically collect BBQr frames
6. **Progress Tracking**: Real-time visual feedback
7. **Completion**: Decode and display final result

## Error Handling

### Common Issues
- **Camera Permission Denied**: Guide user through browser settings
- **HTTP Protocol**: Warn about HTTPS requirement
- **Frame Inconsistency**: Validate encoding and frame count
- **Missing Frames**: Handle incomplete sequences gracefully

### Debug Features
- Real-time scanning logs
- Frame validation messages
- Environment compatibility checks
- Detailed error descriptions

## Mobile Considerations

### iOS Safari
- Requires user gesture to start camera
- Specific permission flow handling
- Self-signed certificate warnings

### Android Chrome
- Standard camera permissions
- Better certificate handling
- Hardware acceleration support

## Security

### Privacy
- All processing done client-side
- No data sent to servers
- Camera stream never recorded
- Sensitive data cleared on completion

### Best Practices
- Always use HTTPS for camera access
- Validate BBQr frame integrity
- Clear sensitive data from memory
- Handle permission denials gracefully

## Configuration

### Scanner Settings
```javascript
const config = {
    fps: 10,                    // Scanning frame rate
    qrbox: { width: 250, height: 250 },  // Scan area size
    aspectRatio: 1.0,           // Square aspect ratio
    disableFlip: false,         // Allow camera flip
    experimentalFeatures: {
        useBarCodeDetectorIfSupported: true
    }
};
```

### Camera Constraints
```javascript
const constraints = {
    video: {
        facingMode: "environment",  // Back camera preferred
        width: { ideal: 1280 },
        height: { ideal: 720 }
    }
};
```

## Testing

### Manual Testing
1. Test on multiple devices (iOS/Android)
2. Verify HTTPS certificate acceptance
3. Test with various BBQr encodings
4. Validate error handling scenarios

### Test Data
Generate test BBQr codes using the BBQr Generator component for comprehensive testing.

## Troubleshooting

### Common Solutions
- **Camera not detected**: Check browser permissions
- **Scanning fails**: Ensure adequate lighting and stable positioning
- **Frame errors**: Verify BBQr format compliance
- **Mobile issues**: Confirm HTTPS certificate acceptance

### Debug Mode
Enable detailed logging by monitoring the debug console for real-time scanning information and error diagnostics. 