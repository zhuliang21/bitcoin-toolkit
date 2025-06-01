(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/**
 * QR Code Generator using BBQr library for PSBT base64 data
 * This module includes all necessary dependencies for BBQr functionality
 */

// BBQr library will be loaded globally via script tag in HTML
// This avoids ES module compatibility issues with browserify
let BBQrLib;

class PSBTQRGenerator {
    constructor() {
        this.container = null;
        this.currentImage = null;
    }

    /**
     * Initialize the QR generator with a container element
     * @param {HTMLElement|string} container - Container element or selector
     */
    init(container) {
        // Initialize BBQr library reference
        if (typeof window !== 'undefined' && window.BBQr) {
            BBQrLib = window.BBQr;
        }
        
        if (typeof container === 'string') {
            this.container = document.querySelector(container);
        } else {
            this.container = container;
        }

        if (!this.container) {
            throw new Error('Container not found');
        }

        // Create the UI
        this.createUI();
    }

    /**
     * Create the user interface
     */
    createUI() {
        this.container.innerHTML = `
            <div class="qr-generator">
                <h2>PSBT QR Code Generator</h2>
                <div class="input-section">
                    <label for="psbt-input">Enter Base64 PSBT:</label>
                    <textarea 
                        id="psbt-input" 
                        placeholder="Paste your base64 encoded PSBT here..."
                        rows="6"
                        style="width: 100%; margin: 10px 0; padding: 10px; border: 1px solid #ccc; border-radius: 4px;"
                    ></textarea>
                    <button 
                        id="generate-qr" 
                        style="background: #0066cc; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; margin: 10px 0;"
                    >
                        Generate QR Code
                    </button>
                </div>
                <div class="output-section">
                    <div id="qr-info" style="margin: 20px 0;"></div>
                    <div id="qr-display" style="text-align: center; margin: 20px 0;"></div>
                    <div id="error-display" style="color: red; margin: 10px 0;"></div>
                </div>
            </div>
        `;

        // Bind events
        const generateBtn = this.container.querySelector('#generate-qr');
        const input = this.container.querySelector('#psbt-input');

        generateBtn.addEventListener('click', () => this.generateQR());
        input.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                this.generateQR();
            }
        });
    }

    /**
     * Generate QR code from base64 PSBT
     */
    async generateQR() {
        const input = this.container.querySelector('#psbt-input').value.trim();
        const infoDiv = this.container.querySelector('#qr-info');
        const displayDiv = this.container.querySelector('#qr-display');
        const errorDiv = this.container.querySelector('#error-display');

        // Clear previous results
        infoDiv.innerHTML = '';
        displayDiv.innerHTML = '';
        errorDiv.innerHTML = '';

        if (!input) {
            errorDiv.innerHTML = 'Please enter a base64 PSBT';
            return;
        }

        try {
            // Show loading
            infoDiv.innerHTML = '<p>Generating QR code...</p>';

            // Detect file type and get raw bytes
            const { raw, fileType } = await this.detectFileType(input);

            if (fileType !== 'P' && fileType !== 'T') {
                // If not detected as PSBT or Transaction, try to process as base64
                try {
                    const cleanInput = input.replace(/\s/g, ''); // Remove whitespace
                    const binaryString = atob(cleanInput);
                    const rawBytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        rawBytes[i] = binaryString.charCodeAt(i);
                    }
                    
                    // Check if this looks like a PSBT
                    if (this.looksLikePSBT(rawBytes)) {
                        const result = await this.processData(rawBytes, 'P');
                        return result;
                    } else {
                        // Try as transaction
                        const result = await this.processData(rawBytes, 'T');
                        return result;
                    }
                } catch (base64Error) {
                    throw new Error('Invalid base64 data or unsupported format');
                }
            }

            // Process the detected data
            await this.processData(raw, fileType);

        } catch (error) {
            console.error('Error generating QR:', error);
            errorDiv.innerHTML = `Error: ${error.message}`;
        }
    }

    /**
     * Check if data looks like a PSBT
     * @param {Uint8Array} data 
     * @returns {boolean}
     */
    looksLikePSBT(data) {
        // PSBT magic bytes: 'psbt' + 0xff
        const psbtMagic = new Uint8Array([0x70, 0x73, 0x62, 0x74, 0xff]);
        if (data.length < psbtMagic.length) return false;
        
        return psbtMagic.every((byte, index) => byte === data[index]);
    }

    /**
     * Process the data and generate QR codes
     * @param {Uint8Array} rawData 
     * @param {string} fileType 
     */
    async processData(rawData, fileType) {
        const infoDiv = this.container.querySelector('#qr-info');
        const displayDiv = this.container.querySelector('#qr-display');

        // Split the data into QR parts
        const splitResult = this.splitQRs(rawData, fileType, {
            encoding: 'Z', // Use Zlib compression
            minVersion: 5,
            maxVersion: 40,
            minSplit: 1,
            maxSplit: 1295
        });

        // Display info about the QR codes
        const fileTypeName = this.getFileTypeName(fileType);
        let infoHtml = `
            <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; border-left: 4px solid #0066cc;">
                <h3>QR Code Information</h3>
                <p><strong>File Type:</strong> ${fileTypeName}</p>
                <p><strong>Data Size:</strong> ${rawData.length} bytes</p>
                <p><strong>Encoding:</strong> ${this.getEncodingName(splitResult.encoding)}</p>
                <p><strong>QR Version:</strong> ${splitResult.version}</p>
                <p><strong>Number of QR Parts:</strong> ${splitResult.parts.length}</p>
        `;

        if (splitResult.parts.length === 1) {
            infoHtml += `<p><em>A single QR code will be sufficient for this data.</em></p>`;
        } else {
            infoHtml += `<p><em>Multiple QR codes will be shown in an animated format.</em></p>`;
        }

        infoHtml += `</div>`;
        infoDiv.innerHTML = infoHtml;

        // Generate the QR image
        const imgBuffer = await this.renderQRImage(splitResult.parts, splitResult.version, {
            frameDelay: 500, // Slower animation for better scanning
            randomizeOrder: false
        });

        // Convert to data URL and display
        const base64String = btoa(String.fromCharCode(...new Uint8Array(imgBuffer)));
        const dataUrl = `data:image/png;base64,${base64String}`;

        displayDiv.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); display: inline-block;">
                <img src="${dataUrl}" alt="BBQr QR Code" style="max-width: 100%; height: auto; border: 1px solid #ddd;" />
            </div>
            <div style="margin-top: 15px;">
                <button onclick="window.psbtQR.downloadQR('${dataUrl}')" 
                        style="background: #28a745; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; margin: 5px;">
                    Download QR Code
                </button>
                <button onclick="window.psbtQR.copyQRParts()" 
                        style="background: #17a2b8; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; margin: 5px;">
                    Copy QR Parts
                </button>
            </div>
        `;

        // Store parts for copying
        this.currentParts = splitResult.parts;
    }

    /**
     * Get human-readable file type name
     * @param {string} fileType 
     * @returns {string}
     */
    getFileTypeName(fileType) {
        const types = {
            'P': 'PSBT (Partially Signed Bitcoin Transaction)',
            'T': 'Bitcoin Transaction',
            'J': 'JSON',
            'U': 'Unicode Text',
            'B': 'Binary'
        };
        return types[fileType] || fileType;
    }

    /**
     * Get human-readable encoding name
     * @param {string} encoding 
     * @returns {string}
     */
    getEncodingName(encoding) {
        const encodings = {
            'H': 'HEX',
            'Z': 'Zlib Compressed Base32',
            '2': 'Base32'
        };
        return encodings[encoding] || encoding;
    }

    /**
     * Download QR code image
     * @param {string} dataUrl 
     */
    downloadQR(dataUrl) {
        const link = document.createElement('a');
        link.download = 'psbt-qr-code.png';
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Copy QR parts to clipboard
     */
    async copyQRParts() {
        if (!this.currentParts) {
            alert('No QR parts to copy');
            return;
        }

        try {
            const partsText = this.currentParts.join('\n');
            await navigator.clipboard.writeText(partsText);
            
            // Show success message
            const errorDiv = this.container.querySelector('#error-display');
            errorDiv.style.color = 'green';
            errorDiv.innerHTML = 'QR parts copied to clipboard!';
            setTimeout(() => {
                errorDiv.innerHTML = '';
                errorDiv.style.color = 'red';
            }, 3000);
        } catch (err) {
            console.error('Failed to copy:', err);
            alert('Failed to copy QR parts to clipboard');
        }
    }

    /**
     * Wrapper methods for BBQr library functions
     */
    async detectFileType(input) {
        if (BBQrLib && BBQrLib.detectFileType) {
            return await BBQrLib.detectFileType(input);
        }
        if (typeof window !== 'undefined' && window.BBQr) {
            return await window.BBQr.detectFileType(input);
        }
        throw new Error('BBQr library not available');
    }

    splitQRs(data, fileType, options) {
        if (BBQrLib && BBQrLib.splitQRs) {
            return BBQrLib.splitQRs(data, fileType, options);
        }
        if (typeof window !== 'undefined' && window.BBQr) {
            return window.BBQr.splitQRs(data, fileType, options);
        }
        throw new Error('BBQr library not available');
    }

    async renderQRImage(parts, version, options) {
        if (BBQrLib && BBQrLib.renderQRImage) {
            return await BBQrLib.renderQRImage(parts, version, options);
        }
        if (typeof window !== 'undefined' && window.BBQr) {
            return await window.BBQr.renderQRImage(parts, version, options);
        }
        throw new Error('BBQr library not available');
    }
}

// Create global instance
const psbtQR = new PSBTQRGenerator();

// Export for global access
if (typeof window !== 'undefined') {
    window.psbtQR = psbtQR;
}

// Export for CommonJS/module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PSBTQRGenerator;
}
},{}]},{},[1]);
