import * as bitcoin from 'bitcoinjs-lib';
import QRious from 'qrious';

class PSBTSigner {
    constructor() {
        this.currentPSBT = null;
        this.splitQRs = null;
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadBBQr();
        this.addDebug('PSBT Signer initialized');
    }

    async loadBBQr() {
        try {
            const module = await import('bbqr');
            this.splitQRs = module.splitQRs;
            this.addDebug('BBQr library loaded successfully');
        } catch (error) {
            this.addDebug(`Failed to load BBQr library: ${error.message}`);
        }
    }

    initializeElements() {
        // Input elements
        this.psbtInput = document.getElementById('psbt-input');
        this.psbtFile = document.getElementById('psbt-file');
        this.psbtStatus = document.getElementById('psbt-status');
        
        // Button elements
        this.parsePsbtBtn = document.getElementById('parse-psbt-btn');
        this.generateBbqrBtn = document.getElementById('generate-bbqr-btn');
        this.clearDebugBtn = document.getElementById('clear-debug-btn');
        
        // Display elements
        this.bbqrOutput = document.getElementById('bbqr-output');
        this.debugInfo = document.getElementById('debug-info');
    }

    setupEventListeners() {
        this.parsePsbtBtn.addEventListener('click', () => this.parsePSBT());
        this.generateBbqrBtn.addEventListener('click', () => this.generateBBQr());
        this.clearDebugBtn.addEventListener('click', () => this.clearDebug());
        
        // Auto-detect input format on input change
        this.psbtInput.addEventListener('input', () => {
            if (this.psbtInput.value.trim()) {
                this.generateBbqrBtn.disabled = true;
                const input = this.psbtInput.value.trim();
                let formatHint = '';
                
                if (this.isBase64(input)) {
                    formatHint = ' (PSBT Base64 detected)';
                } else if (this.isHex(input)) {
                    formatHint = ' (Hex format detected)';
                }
                
                this.showStatus(this.psbtStatus, `Input ready${formatHint}. Click "Parse Input" to continue.`, 'info');
            }
        });

        // Handle file input
        this.psbtFile.addEventListener('change', (event) => {
            this.handleFileInput(event);
        });

        // Add a test button to verify debug functionality
        setTimeout(() => {
            this.addDebug('🚀 PSBT Signer loaded successfully');
            this.addDebug(`📱 Device: ${this.getDeviceInfo()}`);
            this.addDebug(`🌐 Browser: ${this.getBrowserInfo()}`);
            this.addDebug('💡 Debug area is working - you should see this message!');
        }, 1000);
    }

    addDebug(message) {
        const timestamp = new Date().toLocaleTimeString();
        
        // Make sure debugInfo element exists
        if (!this.debugInfo) {
            console.error('debugInfo element not found!');
            console.log(`[PSBT Signer] ${message}`);
            return;
        }

        const currentValue = this.debugInfo.value;
        this.debugInfo.value = `[${timestamp}] ${message}\n${currentValue}`;
        console.log(`[PSBT Signer] ${message}`);
        
        // Scroll to bottom of debug area
        this.debugInfo.scrollTop = this.debugInfo.scrollHeight;
    }

    clearDebug() {
        this.debugInfo.value = '';
    }

    getDeviceInfo() {
        const ua = navigator.userAgent;
        if (/iPad/i.test(ua)) return 'iPad';
        if (/iPhone/i.test(ua)) return 'iPhone';
        if (/Android/i.test(ua)) return 'Android';
        if (/mobile/i.test(ua)) return 'Mobile';
        return 'Desktop';
    }

    getBrowserInfo() {
        const ua = navigator.userAgent;
        if (/Safari/i.test(ua) && /iPhone|iPad/i.test(ua)) {
            if (/CriOS/i.test(ua)) return 'Chrome on iOS';
            if (/EdgiOS/i.test(ua)) return 'Edge on iOS';
            if (/FxiOS/i.test(ua)) return 'Firefox on iOS';
            return 'Safari on iOS';
        }
        if (/Chrome/i.test(ua)) return 'Chrome';
        if (/Firefox/i.test(ua)) return 'Firefox';
        if (/Safari/i.test(ua)) return 'Safari';
        if (/Edge/i.test(ua)) return 'Edge';
        return 'Unknown';
    }

    showStatus(element, message, type = 'info') {
        element.textContent = message;
        element.className = `status status-${type}`;
        element.classList.remove('hidden');
        this.addDebug(`Status (${type}): ${message}`);
    }

    hideStatus(element) {
        element.classList.add('hidden');
    }

    async handleFileInput(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.addDebug(`Reading file: ${file.name} (${file.size} bytes)`);
        this.showStatus(this.psbtStatus, 'Reading file...', 'info');

        try {
            const content = await this.readFile(file);
            
            // Clear text input when file is loaded
            this.psbtInput.value = '';
            
            // Try to parse the file content directly as PSBT buffer
            let psbt = null;
            
            // If it's a binary file, try direct parsing
            if (file.name.toLowerCase().endsWith('.psbt')) {
                try {
                    psbt = bitcoin.Psbt.fromBuffer(content);
                    this.addDebug('✅ Parsed binary PSBT file');
                } catch (error) {
                    this.addDebug(`Binary PSBT parsing failed: ${error.message}`);
                }
            }
            
            // If binary parsing failed or it's a text file, try text-based parsing
            if (!psbt) {
                const textContent = new TextDecoder().decode(content).trim();
                this.addDebug(`File content length: ${textContent.length} characters`);
                
                psbt = await this.parseInput(textContent);
                if (psbt) {
                    this.addDebug('✅ Parsed text-based PSBT from file');
                }
            }
            
            if (psbt) {
                this.currentPSBT = psbt;
                this.showTransactionPreview();
                this.showStatus(this.psbtStatus, 
                    `✅ File loaded successfully! ${psbt.inputCount} inputs, ${psbt.txOutputs.length} outputs`, 
                    'success'
                );
                this.generateBbqrBtn.disabled = false;
            } else {
                throw new Error('Unable to parse file as PSBT. Please ensure the file contains valid PSBT data.');
            }
            
        } catch (error) {
            this.addDebug(`File reading error: ${error.message}`);
            this.showStatus(this.psbtStatus, `❌ File Error: ${error.message}`, 'error');
            this.generateBbqrBtn.disabled = true;
            
            // Clear the file input
            event.target.value = '';
        }
    }

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                resolve(new Uint8Array(event.target.result));
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            
            // Read as array buffer to handle both binary and text files
            reader.readAsArrayBuffer(file);
        });
    }

    async parsePSBT() {
        try {
            const input = this.psbtInput.value.trim();
            
            if (!input && !this.currentPSBT) {
                this.showStatus(this.psbtStatus, 'Please paste a PSBT in Base64 or hex format, or select a PSBT file', 'error');
                return;
            }

            // If we already have a PSBT from file input, just enable the button
            if (this.currentPSBT && !input) {
                this.showStatus(this.psbtStatus, 
                    `✅ PSBT ready! ${this.currentPSBT.inputCount} inputs, ${this.currentPSBT.txOutputs.length} outputs`, 
                    'success'
                );
                this.generateBbqrBtn.disabled = false;
                return;
            }

            this.addDebug('Parsing input...');
            this.showStatus(this.psbtStatus, 'Parsing input...', 'info');

            // Detect input format and parse accordingly
            this.currentPSBT = await this.parseInput(input);
            
            if (this.currentPSBT) {
                this.addDebug(`Parsed successfully. Inputs: ${this.currentPSBT.inputCount}, Outputs: ${this.currentPSBT.txOutputs.length}`);
                
                // Show transaction preview
                this.showTransactionPreview();
                
                this.showStatus(this.psbtStatus, 
                    `✅ Parsed successfully! ${this.currentPSBT.inputCount} inputs, ${this.currentPSBT.txOutputs.length} outputs`, 
                    'success'
                );
                
                this.generateBbqrBtn.disabled = false;
            } else {
                throw new Error('Unable to parse input as PSBT. Please ensure you are using a valid PSBT in Base64 or hex format');
            }

        } catch (error) {
            this.addDebug(`Parsing error: ${error.message}`);
            this.showStatus(this.psbtStatus, `❌ Error: ${error.message}`, 'error');
            this.generateBbqrBtn.disabled = true;
        }
    }

    async parseInput(input) {
        // Try different input formats
        
        // 1. Try as PSBT Base64
        try {
            if (this.isBase64(input)) {
                this.addDebug('Attempting to parse as PSBT Base64...');
                const psbtBuffer = Buffer.from(input, 'base64');
                const psbt = bitcoin.Psbt.fromBuffer(psbtBuffer);
                this.addDebug('✅ Parsed as PSBT Base64');
                return psbt;
            }
        } catch (error) {
            this.addDebug(`PSBT Base64 parsing failed: ${error.message}`);
        }

        // 2. Try as PSBT hex
        try {
            if (this.isHex(input)) {
                this.addDebug('Attempting to parse as PSBT hex...');
                const psbtBuffer = Buffer.from(input, 'hex');
                const psbt = bitcoin.Psbt.fromBuffer(psbtBuffer);
                this.addDebug('✅ Parsed as PSBT hex');
                return psbt;
            }
        } catch (error) {
            this.addDebug(`PSBT hex parsing failed: ${error.message}`);
        }

        return null;
    }

    isBase64(str) {
        try {
            // Check if string looks like base64
            return /^[A-Za-z0-9+/]+=*$/.test(str) && str.length % 4 === 0;
        } catch {
            return false;
        }
    }

    isHex(str) {
        try {
            // Check if string is valid hex
            return /^[0-9A-Fa-f]+$/.test(str) && str.length % 2 === 0;
        } catch {
            return false;
        }
    }

    showTransactionPreview() {
        if (!this.currentPSBT) return;

        let totalInput = 0;
        let totalOutput = 0;

        // Calculate total outputs
        this.currentPSBT.txOutputs.forEach(output => {
            totalOutput += output.value;
        });

        // Estimate inputs (may not be accurate without witness data)
        const inputCount = this.currentPSBT.inputCount;
        
        const previewInfo = `
Transaction Preview:
- Inputs: ${inputCount}
- Outputs: ${this.currentPSBT.txOutputs.length}
- Total Output: ${totalOutput} sats
- Status: Unsigned PSBT
        `.trim();

        this.addDebug(previewInfo);
    }

    async generateBBQr() {
        try {
            if (!this.currentPSBT) {
                this.showStatus(this.psbtStatus, 'No PSBT to convert', 'error');
                return;
            }

            if (!this.splitQRs) {
                this.showStatus(this.psbtStatus, 'BBQr library not loaded yet', 'error');
                return;
            }

            this.addDebug('Generating BBQr codes...');
            
            // Convert PSBT to buffer
            const psbtBuffer = this.currentPSBT.toBuffer();
            
            // Generate BBQr using splitQRs function
            const result = this.splitQRs(psbtBuffer, 'P'); // 'P' for PSBT
            const qrData = result.parts;
            
            this.addDebug(`BBQr generated: ${qrData.length} parts`);
            
            // Clear previous output
            this.bbqrOutput.innerHTML = '';
            
            // Generate QR codes for each part
            qrData.forEach((part, index) => {
                const qrFrame = document.createElement('div');
                qrFrame.className = 'qr-frame';
                
                const canvas = document.createElement('canvas');
                qrFrame.appendChild(canvas);
                
                const frameInfo = document.createElement('div');
                frameInfo.className = 'frame-info';
                frameInfo.textContent = `Part ${index + 1} of ${qrData.length}`;
                qrFrame.appendChild(frameInfo);
                
                this.bbqrOutput.appendChild(qrFrame);
                
                // Generate QR code using QRious
                this.generateQRCode(canvas, part);
            });
            
            this.showStatus(this.psbtStatus, 
                `✅ BBQr generated! ${qrData.length} QR codes ready for ColdCard Q`, 
                'success'
            );

        } catch (error) {
            this.addDebug(`BBQr generation error: ${error.message}`);
            this.showStatus(this.psbtStatus, `❌ BBQr Error: ${error.message}`, 'error');
        }
    }

    generateQRCode(canvas, data) {
        try {
            const qr = new QRious({
                element: canvas,
                value: data,
                size: 250,
                level: 'M', // Error correction level
                foreground: '#000',
                background: '#fff'
            });
            this.addDebug(`Generated QR code for ${data.length} chars`);
        } catch (error) {
            this.addDebug(`QR generation error: ${error.message}`);
            // Fallback to simple canvas drawing
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, 250, 250);
            
            ctx.fillStyle = '#fff';
            ctx.font = '12px monospace';
            ctx.fillText('QR Code', 10, 20);
            ctx.fillText(`Data: ${data.substring(0, 30)}...`, 10, 40);
        }
    }
}

// Initialize the PSBT signer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PSBTSigner();
}); 