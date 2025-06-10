// PSBT QR Format Converter
// Converts between Coldcard BBQr and Blockchain Commons UR (crypto-psbt) formats

import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import QRCode from 'qrcode';
const bitcoin = require('bitcoinjs-lib');

// Import BBQr library for BBQr generation
let BBQr;
try {
    // BBQr库是ES模块，需要动态导入
    import('bbqr').then(module => {
        BBQr = module.default || module;
        console.log('BBQr library loaded successfully');
    }).catch(error => {
        console.warn('BBQr library not available:', error.message);
    });
} catch (error) {
    console.warn('BBQr library not available:', error.message);
}

// Import bc-ur library for proper UR handling
let bcUR;
try {
    bcUR = require('@ngraveio/bc-ur');
} catch (error) {
    console.warn('bc-ur library not available:', error.message);
}

// Import specific classes from bc-ur
let UR, UrFountainDecoder, CBOR;
if (bcUR) {
    UR = bcUR.UR;
    UrFountainDecoder = bcUR.UrFountainDecoder;
}

// Global variables
let html5QrCode = null;
let isScanning = false;
let debugLog = [];

// UR decoding variables - 使用UrFountainDecoder
let urFountainDecoder = null;
let urFragments = new Map(); // 保留作为备份
let expectedTotal = 0;
let isProcessingComplete = false; // 添加处理完成标志
let lastProcessedQR = null; // 记录最后处理的QR码，避免重复
let psbtGenerated = false; // 明确标记PSBT是否已生成

// DOM elements (初始化为null，页面加载后再获取)
let startScanBtn = null;
let stopScanBtn = null;
let scanStatus = null;
let scannedDataTextarea = null;
let formatInfo = null;
let conversionStatus = null;
let qrOutput = null;
let debugInfo = null;

/**
 * 添加调试信息
 * @param {string} message - 调试消息
 */
function addDebugLog(message) {
    const timestamp = new Date().toLocaleTimeString();
    debugLog.push(`[${timestamp}] ${message}`);
    
    if (debugInfo) {
        debugInfo.value = debugLog.join('\n');
        debugInfo.scrollTop = debugInfo.scrollHeight;
    }
    
    console.log(`[Convert] ${message}`);
}

/**
 * 显示状态信息
 * @param {HTMLElement} element - 状态元素
 * @param {string} message - 状态消息
 * @param {string} type - 状态类型 (info, success, error)
 */
function showStatus(element, message, type = 'info') {
    element.textContent = message;
    element.className = `status status-${type}`;
    element.classList.remove('hidden');
    addDebugLog(`Status [${type}]: ${message}`);
}

/**
 * 开始扫码
 */
async function startScanning() {
    try {
        // 重置状态
        isProcessingComplete = false;
        lastProcessedQR = null;
        psbtGenerated = false;
        if (urFountainDecoder) {
            urFountainDecoder.reset();
        }
        
        addDebugLog('Initializing QR scanner...');
        addDebugLog('=== STARTING NEW SCAN SESSION ===');
        
        if (html5QrCode) {
            await html5QrCode.stop();
        }

        html5QrCode = new Html5Qrcode("qr-reader");
        
        const config = {
            fps: 10,
            qrbox: { width: 300, height: 300 },
            aspectRatio: 1.0
        };

        await html5QrCode.start(
            { facingMode: "environment" }, // 后置摄像头
            config,
            onScanSuccess,
            onScanFailure
        );

        isScanning = true;
        startScanBtn.classList.add('hidden');
        stopScanBtn.classList.remove('hidden');
        showStatus(scanStatus, 'Scanning for QR codes...', 'info');
        
        addDebugLog('QR scanner started successfully');
        
    } catch (err) {
        addDebugLog(`Failed to start scanner: ${err.message}`);
        showStatus(scanStatus, `Failed to start scanner: ${err.message}`, 'error');
    }
}

/**
 * 停止扫码
 */
async function stopScanning() {
    try {
        if (html5QrCode && isScanning) {
            await html5QrCode.stop();
            addDebugLog('QR scanner stopped');
        }
        
        isScanning = false;
        startScanBtn.classList.remove('hidden');
        stopScanBtn.classList.add('hidden');
        showStatus(scanStatus, 'Scanner stopped', 'info');
        
    } catch (err) {
        addDebugLog(`Error stopping scanner: ${err.message}`);
    }
}

/**
 * 扫码成功回调
 * @param {string} decodedText - 解码得到的文本
 */
function onScanSuccess(decodedText) {
    // 如果已经处理完成，直接返回
    if (isProcessingComplete || psbtGenerated) {
        addDebugLog('Processing already complete, ignoring additional scans');
        return;
    }

    // 检查是否是重复的QR码
    if (lastProcessedQR === decodedText) {
        addDebugLog('Duplicate QR code detected, skipping...');
        return;
    }

    lastProcessedQR = decodedText;
    addDebugLog(`QR code detected: ${decodedText.substring(0, 100)}...`);
    
    // 显示扫码结果
    scannedDataTextarea.value = decodedText;
    
    // 先分析格式，决定是否需要继续扫描
    const shouldContinueScanning = analyzeAndConvert(decodedText);
    
    // 如果不需要继续扫描，则停止
    if (!shouldContinueScanning) {
        isProcessingComplete = true;
        psbtGenerated = true;
        addDebugLog('Processing complete, stopping scanner...');
        addDebugLog('=== SCAN SESSION COMPLETED ===');
        stopScanning();
    }
}

/**
 * 扫码失败回调
 * @param {string} error - 错误信息
 */
function onScanFailure(error) {
    // 这个回调会频繁触发，不需要记录所有失败
    // addDebugLog(`Scan failed: ${error}`);
}

/**
 * 分析QR格式并执行转换
 * @param {string} qrData - QR码数据
 * @returns {boolean} 是否需要继续扫描
 */
function analyzeAndConvert(qrData) {
    try {
        addDebugLog('Analyzing QR format...');
        
        // 转换为小写进行格式检测（但保留原始数据）
        const qrDataLower = qrData.toLowerCase();
        
        // 检测格式
        if (qrDataLower.startsWith('ur:')) {
            addDebugLog('Detected UR format');
            
            // 检查是否是crypto-psbt类型
            if (qrDataLower.includes('ur:crypto-psbt')) {
                showStatus(formatInfo, 'Format: Blockchain Commons UR (crypto-psbt)', 'info');
                return convertURToBBQr(qrData);
            } else {
                showStatus(formatInfo, 'Format: UR format (but not crypto-psbt)', 'error');
                showStatus(conversionStatus, 'Cannot decode: Not a PSBT UR format', 'error');
                return false;
            }
        } else {
            addDebugLog('Unknown format detected');
            showStatus(formatInfo, 'Unknown format - not a recognized PSBT UR format', 'error');
            showStatus(conversionStatus, 'Cannot decode: Unknown format', 'error');
            return false;
        }
        
    } catch (err) {
        addDebugLog(`Error analyzing format: ${err.message}`);
        showStatus(formatInfo, `Error: ${err.message}`, 'error');
        return false;
    }
}

/**
 * 将UR格式转换为BBQr格式
 * @param {string} urString - UR格式字符串
 * @returns {boolean} 是否需要继续扫描
 */
function convertURToBBQr(urString) {
    try {
        // 如果PSBT已经生成，不要重复处理
        if (psbtGenerated) {
            addDebugLog('PSBT already generated, stopping conversion...');
            return false;
        }

        addDebugLog('Converting UR to PSBT...');
        showStatus(conversionStatus, 'Converting UR to PSBT...', 'info');
        
        addDebugLog(`UR string: ${urString}`);
        
        // 检查并确保UR解码器可用
        if (!bcUR || !UrFountainDecoder || !UR) {
            throw new Error('bc-ur library or required classes not available, cannot decode UR');
        }
        
        // 初始化UR解码器（如果还没有）
        if (!urFountainDecoder) {
            urFountainDecoder = new UrFountainDecoder();
            addDebugLog('Initialized new UrFountainDecoder');
        }
        
        // 使用bc-ur库解码UR
        let isComplete = false;
        let urResult = null;
        
        try {
            // 尝试接收UR片段
            urFountainDecoder.receivePartUr(urString);
            const progress = (urFountainDecoder.getProgress() * 100).toFixed(1);
            const estimatedProgress = (urFountainDecoder.estimatedPercentComplete() * 100).toFixed(1);
            addDebugLog(`UR decoder progress: ${progress}%, estimated: ${estimatedProgress}%`);
            
            if (urFountainDecoder.isComplete()) {
                addDebugLog('=== UR DECODER IS COMPLETE ===');
                addDebugLog(`urFountainDecoder.isSuccessful(): ${urFountainDecoder.isSuccessful()}`);
                
                if (urFountainDecoder.isSuccessful()) {
                    addDebugLog('=== EXAMINING UR FOUNTAIN DECODER OBJECT ===');
                    addDebugLog(`urFountainDecoder properties: ${Object.getOwnPropertyNames(urFountainDecoder)}`);
                    addDebugLog(`urFountainDecoder prototype: ${Object.getOwnPropertyNames(Object.getPrototypeOf(urFountainDecoder))}`);
                    
                    // 使用正确的属性名和方法
                    urResult = urFountainDecoder.resultUr;  // 使用正确的 camelCase 属性名
                    addDebugLog(`urFountainDecoder.resultUr exists: ${!!urResult}`);
                    addDebugLog(`urFountainDecoder.resultUr type: ${typeof urResult}`);
                    
                    // 尝试使用 getDecodedData 方法
                    const decodedData = urFountainDecoder.getDecodedData();
                    addDebugLog(`getDecodedData() result exists: ${!!decodedData}`);
                    addDebugLog(`getDecodedData() type: ${typeof decodedData}`);
                    addDebugLog(`getDecodedData() length: ${decodedData ? decodedData.length : 'N/A'}`);
                    
                    // 检查 resultRaw 属性
                    const resultRaw = urFountainDecoder.resultRaw;
                    addDebugLog(`resultRaw exists: ${!!resultRaw}`);
                    addDebugLog(`resultRaw type: ${typeof resultRaw}`);
                    addDebugLog(`resultRaw length: ${resultRaw ? resultRaw.length : 'N/A'}`);
                    
                    if (urResult || decodedData || resultRaw) {
                        isComplete = true;
                        addDebugLog('UR decoding complete!');
                    } else {
                        addDebugLog('WARNING: UR decoding successful but no result found!');
                        isComplete = true; // 继续处理，看看会发生什么
                        addDebugLog('UR decoding complete!');
                    }
                } else {
                    addDebugLog(`UR decoding not successful! Error: ${urFountainDecoder.error || 'Unknown error'}`);
                    addDebugLog(`urFountainDecoder.error: ${urFountainDecoder.error}`);
                    addDebugLog(`urFountainDecoder methods: ${Object.getOwnPropertyNames(urFountainDecoder)}`);
                    throw new Error(`UR decoding failed: ${urFountainDecoder.error || 'Unknown error'}`);
                }
            } else {
                showStatus(conversionStatus, `UR incomplete: ${progress}% complete (estimated: ${estimatedProgress}%). Please scan more QR codes.`, 'info');
                addDebugLog(`Need more UR fragments. Progress: ${progress}%, estimated: ${estimatedProgress}%`);
                return true; // Continue scanning
            }
        } catch (urError) {
            addDebugLog(`bc-ur decoding error: ${urError.message}`);
            // 尝试重置解码器并重新开始
            urFountainDecoder.reset();
            throw new Error(`UR decoding failed: ${urError.message}`);
        }
        
        if (isComplete && (urResult || decodedData || resultRaw)) {
            addDebugLog('=== UR PROCESSING COMPLETE, STARTING PSBT GENERATION ===');
            
            // 优先选择可用的数据源
            let dataSource = null;
            let sourceName = '';
            
            if (urResult) {
                dataSource = urResult;
                sourceName = 'urResult';
                addDebugLog(`Using urResult as data source`);
                addDebugLog(`urResult type: ${typeof urResult}`);
                addDebugLog(`urResult constructor: ${urResult ? urResult.constructor.name : 'null'}`);
            } else if (decodedData) {
                addDebugLog(`Using decodedData as data source`);
                addDebugLog(`decodedData type: ${typeof decodedData}`);
                addDebugLog(`decodedData length: ${decodedData.length}`);
                addDebugLog(`decodedData first 20 bytes: ${Array.from(decodedData.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
                
                // 直接使用decodedData作为PSBT数据
                let psbtData = decodedData;
                
                // 检查并添加PSBT魔数（如果需要）
                const expectedHeader = [0x70, 0x73, 0x62, 0x74, 0xff]; // "psbt" + 0xff
                let hasCorrectHeader = psbtData.length >= 5;
                for (let i = 0; i < expectedHeader.length && hasCorrectHeader; i++) {
                    if (psbtData[i] !== expectedHeader[i]) {
                        hasCorrectHeader = false;
                    }
                }
                
                if (!hasCorrectHeader) {
                    addDebugLog('Adding PSBT magic bytes to decodedData...');
                    const header = new Uint8Array(expectedHeader);
                    const fullPsbt = new Uint8Array(header.length + psbtData.length);
                    fullPsbt.set(header);
                    fullPsbt.set(psbtData, header.length);
                    psbtData = fullPsbt;
                }
                
                // 转换为Base64
                const psbtBase64 = btoa(String.fromCharCode(...psbtData));
                addDebugLog(`Generated Base64 PSBT from decodedData: ${psbtBase64.substring(0, 100)}...`);
                
                // 验证PSBT
                const psbtValidation = validatePSBT(psbtData, psbtBase64);
                addDebugLog(`PSBT validation result: ${psbtValidation.isValid ? 'VALID' : 'INVALID'}`);
                if (!psbtValidation.isValid) {
                    addDebugLog(`PSBT validation error: ${psbtValidation.error}`);
                }
                
                // 转换为BBQr并输出结果
                return generateAndOutputBBQr(psbtData, psbtBase64, psbtValidation);
                
            } else if (resultRaw) {
                addDebugLog(`Using resultRaw as data source`);
                addDebugLog(`resultRaw type: ${typeof resultRaw}`);
                addDebugLog(`resultRaw length: ${resultRaw.length}`);
                addDebugLog(`resultRaw first 20 bytes: ${Array.from(resultRaw.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
                
                // 尝试将resultRaw作为PSBT数据
                let psbtData = resultRaw;
                
                // 检查并添加PSBT魔数（如果需要）
                const expectedHeader = [0x70, 0x73, 0x62, 0x74, 0xff]; // "psbt" + 0xff
                let hasCorrectHeader = psbtData.length >= 5;
                for (let i = 0; i < expectedHeader.length && hasCorrectHeader; i++) {
                    if (psbtData[i] !== expectedHeader[i]) {
                        hasCorrectHeader = false;
                    }
                }
                
                if (!hasCorrectHeader) {
                    addDebugLog('Adding PSBT magic bytes to resultRaw...');
                    const header = new Uint8Array(expectedHeader);
                    const fullPsbt = new Uint8Array(header.length + psbtData.length);
                    fullPsbt.set(header);
                    fullPsbt.set(psbtData, header.length);
                    psbtData = fullPsbt;
                }
                
                // 转换为Base64
                const psbtBase64 = btoa(String.fromCharCode(...psbtData));
                addDebugLog(`Generated Base64 PSBT from resultRaw: ${psbtBase64.substring(0, 100)}...`);
                
                // 验证PSBT
                const psbtValidation = validatePSBT(psbtData, psbtBase64);
                addDebugLog(`PSBT validation result: ${psbtValidation.isValid ? 'VALID' : 'INVALID'}`);
                if (!psbtValidation.isValid) {
                    addDebugLog(`PSBT validation error: ${psbtValidation.error}`);
                }
                
                // 转换为BBQr并输出结果
                return generateAndOutputBBQr(psbtData, psbtBase64, psbtValidation);
            }
            
            // 如果使用urResult，继续原来的流程
            if (!dataSource) {
                addDebugLog('No valid data source found!');
                throw new Error('No valid UR result data found');
            }
            
            urResult = dataSource;
            
            // 检查UR类型
            if (urResult.type !== 'crypto-psbt') {
                throw new Error(`Unsupported UR type: ${urResult.type}. Expected: crypto-psbt`);
            }
            
            showStatus(formatInfo, `Format: Blockchain Commons UR (${urResult.type})`, 'info');
            
            // 获取CBOR数据 - 使用正确的API方法
            addDebugLog('Attempting to get CBOR data...');
            let cborData;
            try {
                cborData = urResult.getPayloadCbor();
                addDebugLog(`Decoded CBOR data length: ${cborData.length} bytes`);
            } catch (cborError) {
                addDebugLog(`getPayloadCbor() failed: ${cborError.message}`);
                // 尝试其他方法获取数据
                if (typeof urResult.cbor !== 'undefined') {
                    cborData = urResult.cbor;
                    addDebugLog(`Using urResult.cbor directly, length: ${cborData.length} bytes`);
                } else if (typeof urResult.payload !== 'undefined') {
                    cborData = urResult.payload;
                    addDebugLog(`Using urResult.payload, length: ${cborData.length} bytes`);
                } else {
                    throw new Error('Cannot find CBOR data in urResult');
                }
            }
            
            // 解码CBOR得到PSBT数据
            let psbtData;
            try {
                addDebugLog(`cborData type: ${typeof cborData}`);
                addDebugLog(`cborData length: ${cborData ? cborData.length : 'undefined'}`);
                
                // 对于crypto-psbt，CBOR数据应该直接是PSBT二进制数据
                if (cborData instanceof Uint8Array) {
                    psbtData = cborData;
                } else if (Array.isArray(cborData)) {
                    psbtData = new Uint8Array(cborData);
                } else if (typeof cborData === 'string') {
                    // 如果是hex字符串，转换为Uint8Array
                    const hex = cborData.replace(/^0x/, '');
                    psbtData = new Uint8Array(hex.length / 2);
                    for (let i = 0; i < hex.length; i += 2) {
                        psbtData[i / 2] = parseInt(hex.substr(i, 2), 16);
                    }
                } else {
                    psbtData = new Uint8Array(cborData);
                }
                
                addDebugLog(`PSBT data length: ${psbtData.length} bytes`);
                addDebugLog(`First 20 bytes: ${Array.from(psbtData.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
                
                // 检查是否为CBOR编码的PSBT (以 59 01 开头的字节串)
                if (psbtData.length >= 3 && psbtData[0] === 0x59) {
                    addDebugLog('Detected CBOR-encoded PSBT, extracting inner PSBT data...');
                    
                    // CBOR major type 2 (byte string) with additional info 25 (2-byte length)
                    // 59 XX XX where XX XX is big-endian length
                    const innerLength = (psbtData[1] << 8) | psbtData[2];
                    addDebugLog(`CBOR inner length: ${innerLength} bytes`);
                    
                    if (psbtData.length >= 3 + innerLength) {
                        // 提取内部PSBT数据
                        psbtData = psbtData.slice(3, 3 + innerLength);
                        addDebugLog(`Extracted inner PSBT data length: ${psbtData.length} bytes`);
                        addDebugLog(`Inner PSBT first 20 bytes: ${Array.from(psbtData.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
                    }
                }
                
                // 现在检查PSBT魔数 - 只在需要时添加
                const expectedHeader = [0x70, 0x73, 0x62, 0x74, 0xff]; // "psbt" + 0xff
                let hasCorrectHeader = true;
                if (psbtData.length >= 5) {
                    for (let i = 0; i < expectedHeader.length; i++) {
                        if (psbtData[i] !== expectedHeader[i]) {
                            hasCorrectHeader = false;
                            break;
                        }
                    }
                } else {
                    hasCorrectHeader = false;
                }
                
                if (!hasCorrectHeader) {
                    addDebugLog('PSBT header missing, adding magic bytes...');
                    const header = new Uint8Array(expectedHeader);
                    const fullPsbt = new Uint8Array(header.length + psbtData.length);
                    fullPsbt.set(header);
                    fullPsbt.set(psbtData, header.length);
                    psbtData = fullPsbt;
                    addDebugLog(`Added PSBT header, new length: ${psbtData.length} bytes`);
                } else {
                    addDebugLog('PSBT header already present, no need to add');
                }
                
            } catch (cborError) {
                addDebugLog(`CBOR decoding error: ${cborError.message}`);
                throw new Error(`Failed to decode CBOR: ${cborError.message}`);
            }
            
            // 转换为Base64
            const psbtBase64 = btoa(String.fromCharCode(...psbtData));
            addDebugLog(`Generated Base64 PSBT: ${psbtBase64.substring(0, 100)}...`);
            addDebugLog(`Base64 PSBT length: ${psbtBase64.length} characters`);
            
            // 验证PSBT
            addDebugLog('Validating PSBT data...');
            const psbtValidation = validatePSBT(psbtData, psbtBase64);
            
            if (psbtValidation.isValid) {
                addDebugLog('PSBT validation successful!');
                if (psbtValidation.details) {
                    addDebugLog(`PSBT info: ${formatPSBTInfo(psbtValidation.details)}`);
                }
            } else {
                addDebugLog(`PSBT validation failed: ${psbtValidation.error}`);
            }
            
            // 转换为BBQr并输出结果
            return generateAndOutputBBQr(psbtData, psbtBase64, psbtValidation);
        }
        
        return true; // 继续扫描更多片段
        
    } catch (err) {
        addDebugLog(`UR to PSBT conversion failed: ${err.message}`);
        showStatus(conversionStatus, `Conversion failed: ${err.message}`, 'error');
        
        // 重置解码器
        if (urFountainDecoder) {
            urFountainDecoder.reset();
        }
        urFragments.clear();
        expectedTotal = 0;
        isProcessingComplete = false; // 重置处理状态
        
        return false; // Stop scanning
    }
}

/**
 * 生成BBQr QR码并输出结果
 * @param {Uint8Array} psbtData - PSBT二进制数据
 * @param {string} psbtBase64 - PSBT的Base64编码
 * @param {Object} psbtValidation - PSBT验证结果
 * @returns {boolean} 是否停止扫描
 */
async function generateAndOutputBBQr(psbtData, psbtBase64, psbtValidation) {
    try {
        // 输出完整的PSBT内容到日志
        addDebugLog('=== FINAL PSBT OUTPUT ===');
        addDebugLog(`Complete Base64 PSBT: ${psbtBase64}`);
        addDebugLog(`PSBT Length: ${psbtBase64.length} characters`);
        addDebugLog(`PSBT hex (first 100 bytes): ${Array.from(psbtData.slice(0, 100)).map(b => b.toString(16).padStart(2, '0')).join('')}`);
        addDebugLog('=== END PSBT OUTPUT ===');
        
        // 标记PSBT已生成
        psbtGenerated = true;
        isProcessingComplete = true;
        
        // 显示状态
        const statusMsg = psbtValidation.isValid 
            ? `✅ UR decoded successfully! Generated VALID PSBT (${psbtBase64.length} chars). Converting to BBQr...`
            : `⚠️ UR decoded! Generated PSBT (${psbtBase64.length} chars) but validation failed. Converting to BBQr anyway...`;
            
        showStatus(conversionStatus, statusMsg, psbtValidation.isValid ? 'info' : 'error');
        
        // 检查BBQr库是否可用
        if (!BBQr) {
            addDebugLog('BBQr library not available, showing PSBT only');
            outputPSBTResult(psbtData, psbtBase64, psbtValidation);
            return false;
        }
        
        // 生成BBQr
        addDebugLog('=== GENERATING BBQR ===');
        addDebugLog('Converting PSBT to BBQr format...');
        
        let bbqrResult;
        try {
            // 使用BBQr库的splitQRs函数将PSBT转换为多个QR码
            addDebugLog(`PSBT data for BBQr: ${psbtData.length} bytes`);
            addDebugLog(`PSBT hex for BBQr: ${Array.from(psbtData.slice(0, 50)).map(b => b.toString(16).padStart(2, '0')).join('')}... (${psbtData.length * 2} chars)`);
            
            // 使用splitQRs函数，传入PSBT二进制数据
            bbqrResult = BBQr.splitQRs(psbtData, 'P', {
                encoding: 'Z', // 使用Zlib压缩
                minSplit: 1,
                maxSplit: 100,
                minVersion: 5,
                maxVersion: 40
            });
            
            addDebugLog(`BBQr generated ${bbqrResult.parts.length} parts with version ${bbqrResult.version} and encoding ${bbqrResult.encoding}`);
            
        } catch (bbqrError) {
            addDebugLog(`BBQr encoding failed: ${bbqrError.message}`);
            addDebugLog(`BBQr error stack: ${bbqrError.stack}`);
            // 如果BBQr失败，显示PSBT
            outputPSBTResult(psbtData, psbtBase64, psbtValidation);
            return false;
        }
        
        // 生成QR码图像
        addDebugLog('Generating QR code images...');
        const qrImages = [];
        
        for (let i = 0; i < bbqrResult.parts.length; i++) {
            try {
                const qrDataUrl = await QRCode.toDataURL(bbqrResult.parts[i], {
                    width: 200,
                    margin: 1,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    }
                });
                
                qrImages.push({
                    dataUrl: qrDataUrl,
                    text: bbqrResult.parts[i],
                    index: i + 1,
                    total: bbqrResult.parts.length
                });
                
            } catch (qrError) {
                addDebugLog(`Failed to generate QR code ${i + 1}: ${qrError.message}`);
            }
        }
        
        addDebugLog(`Generated ${qrImages.length} QR code images`);
        
        // 显示结果到页面
        const resultContainer = document.createElement('div');
        resultContainer.style.marginTop = '20px';
        resultContainer.style.padding = '20px';
        resultContainer.style.border = `2px solid ${psbtValidation.isValid ? '#28a745' : '#ffc107'}`;
        resultContainer.style.borderRadius = '10px';
        resultContainer.style.backgroundColor = psbtValidation.isValid ? '#d4edda' : '#fff3cd';
        
        resultContainer.innerHTML = `
            <h3>🎉 UR → BBQr Conversion Complete!</h3>
            <div style="margin: 15px 0;">
                <p><strong>PSBT Status:</strong> ${psbtValidation.isValid ? '✅ Valid PSBT' : '⚠️ Invalid PSBT'}</p>
                <p><strong>PSBT Length:</strong> ${psbtBase64.length} characters</p>
                <p><strong>BBQr Parts:</strong> ${bbqrResult.parts.length} QR codes</p>
            </div>
            
            <details style="margin: 15px 0;">
                <summary style="cursor: pointer; font-weight: bold;">📋 View Base64 PSBT</summary>
                <textarea readonly style="width: 100%; height: 80px; font-family: monospace; font-size: 11px; margin-top: 10px;">${psbtBase64}</textarea>
            </details>
            
            <h4>BBQr QR Codes:</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: center;">
                ${qrImages.map(qr => `
                    <div style="text-align: center; border: 1px solid #ddd; border-radius: 8px; padding: 10px; background: white;">
                        <img src="${qr.dataUrl}" alt="QR Code ${qr.index}" style="max-width: 200px; height: auto;"/>
                        <div style="margin-top: 8px; font-weight: bold; color: #333;">Part ${qr.index}/${qr.total}</div>
                        <div style="font-family: monospace; font-size: 10px; color: #666; margin-top: 5px; word-break: break-all;">
                            ${qr.text.substring(0, 40)}${qr.text.length > 40 ? '...' : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div style="margin-top: 20px; padding: 10px; background: #f8f9fa; border-radius: 5px; font-size: 12px; color: #666;">
                <strong>How to use:</strong> Scan these QR codes in sequence on your hardware wallet or compatible software.
            </div>
        `;
        
        // 清空之前的输出并添加新的
        qrOutput.innerHTML = '';
        qrOutput.appendChild(resultContainer);
        
        // 更新状态
        showStatus(conversionStatus, `✅ Success! Generated ${bbqrResult.parts.length} BBQr QR codes from UR format.`, 'success');
        
        // 重置解码器
        urFountainDecoder.reset();
        
        addDebugLog('=== BBQR CONVERSION COMPLETE ===');
        return false; // 停止扫描
        
    } catch (error) {
        addDebugLog(`BBQr generation failed: ${error.message}`);
        
        // 如果BBQr生成失败，fallback到PSBT显示
        addDebugLog('Falling back to PSBT display...');
        outputPSBTResult(psbtData, psbtBase64, psbtValidation);
        return false;
    }
}

/**
 * 页面初始化
 */
function initializePage() {
    console.log('Initializing PSBT QR converter...');
    console.log('=== CODE VERSION: 2025-06-10-22:32:00 ===');
    
    // 获取DOM元素
    startScanBtn = document.getElementById('start-scan-btn');
    stopScanBtn = document.getElementById('stop-scan-btn');
    scanStatus = document.getElementById('scan-status');
    scannedDataTextarea = document.getElementById('scanned-data');
    formatInfo = document.getElementById('format-info');
    conversionStatus = document.getElementById('conversion-status');
    qrOutput = document.getElementById('qr-output');
    debugInfo = document.getElementById('debug-info');
    
    console.log('DOM elements found:', {
        startScanBtn: !!startScanBtn,
        stopScanBtn: !!stopScanBtn,
        scanStatus: !!scanStatus,
        debugInfo: !!debugInfo
    });
    
    if (!startScanBtn || !stopScanBtn || !scanStatus || !debugInfo) {
        console.error('Some DOM elements not found!');
        return;
    }
    
    addDebugLog('Initializing PSBT QR converter...');
    
    // 绑定事件监听器
    startScanBtn.addEventListener('click', startScanning);
    stopScanBtn.addEventListener('click', stopScanning);
    
    console.log('Event listeners added to buttons');
    addDebugLog('Page initialized successfully');
}

// 页面加载完成后初始化
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initializePage);
    
    // 页面卸载时清理资源
    window.addEventListener('beforeunload', () => {
        if (html5QrCode && isScanning) {
            html5QrCode.stop();
        }
    });
}

// 手动UR解析函数已删除，现在使用标准bc-ur库

/**
 * 验证PSBT数据的有效性
 * @param {Uint8Array} psbtData - PSBT数据
 * @param {string} psbtBase64 - PSBT的Base64表示
 * @returns {Object} 验证结果
 */
function validatePSBT(psbtData, psbtBase64) {
    try {
        addDebugLog('Starting PSBT validation...');
        addDebugLog(`Checking for window.decodePSBT function: ${typeof window.decodePSBT}`);
        
        // 使用window.decodePSBT函数验证
        if (typeof window.decodePSBT === 'function') {
            addDebugLog('Using window.decodePSBT for detailed parsing...');
            const result = window.decodePSBT(psbtBase64);
            
            addDebugLog(`decodePSBT result: ${JSON.stringify(result, null, 2)}`);
            
            if (result.error) {
                addDebugLog(`decodePSBT error: ${result.error}`);
                return {
                    isValid: false,
                    error: result.error,
                    details: null
                };
            }
            
            addDebugLog('decodePSBT successful, PSBT parsed correctly');
            return {
                isValid: true,
                error: null,
                details: result
            };
        } else {
            addDebugLog('window.decodePSBT not available, falling back to basic validation');
            // 如果没有解码函数，进行基本格式验证
            return validatePSBTFormat(psbtData);
        }
        
    } catch (error) {
        addDebugLog(`validatePSBT exception: ${error.message}`);
        addDebugLog(`Error stack: ${error.stack}`);
        return {
            isValid: false,
            error: `PSBT validation error: ${error.message}`,
            details: null
        };
    }
}

/**
 * 基本PSBT格式验证
 * @param {Uint8Array} psbtData - PSBT数据
 * @returns {Object} 验证结果
 */
function validatePSBTFormat(psbtData) {
    try {
        // 检查PSBT magic bytes
        if (psbtData.length < 5) {
            return { isValid: false, error: 'PSBT too short', details: null };
        }
        
        // 检查magic bytes "psbt" (0x70736274) + 0xff
        const expectedHeader = [0x70, 0x73, 0x62, 0x74, 0xff];
        for (let i = 0; i < expectedHeader.length; i++) {
            if (psbtData[i] !== expectedHeader[i]) {
                return { isValid: false, error: 'Invalid PSBT magic bytes', details: null };
            }
        }
        
        // 基本结构验证 - 查找分隔符0x00
        let separatorCount = 0;
        for (let i = 5; i < psbtData.length; i++) {
            if (psbtData[i] === 0x00) {
                separatorCount++;
            }
        }
        
        if (separatorCount === 0) {
            return { isValid: false, error: 'No section separators found', details: null };
        }
        
        return {
            isValid: true,
            error: null,
            details: {
                size: psbtData.length,
                separators: separatorCount,
                basic: true
            }
        };
        
    } catch (error) {
        return {
            isValid: false,
            error: `Format validation error: ${error.message}`,
            details: null
        };
    }
}

/**
 * 格式化PSBT信息用于显示
 * @param {Object} psbtDetails - PSBT详细信息
 * @returns {string} 格式化的信息
 */
function formatPSBTInfo(psbtDetails) {
    if (!psbtDetails) {
        return 'No PSBT details available';
    }
    
    let info = [];
    
    if (psbtDetails.basic) {
        info.push(`Basic PSBT validation passed`);
        info.push(`Size: ${psbtDetails.size} bytes`);
        info.push(`Separators: ${psbtDetails.separators}`);
    } else {
        // 详细信息
        if (psbtDetails.version !== undefined) {
            info.push(`Version: ${psbtDetails.version}`);
        }
        
        if (psbtDetails.locktime !== undefined) {
            info.push(`Locktime: ${psbtDetails.locktime}`);
        }
        
        if (psbtDetails.inputs && psbtDetails.inputs.length > 0) {
            info.push(`Inputs: ${psbtDetails.inputs.length}`);
            psbtDetails.inputs.forEach((input, i) => {
                if (input.witnessUtxo) {
                    info.push(`  Input ${i}: ${input.witnessUtxo.valueInBTC} BTC${input.witnessUtxo.address ? ' to ' + input.witnessUtxo.address : ''}`);
                } else if (input.txid) {
                    info.push(`  Input ${i}: ${input.txid}:${input.vout}`);
                }
            });
        }
        
        if (psbtDetails.outputs && psbtDetails.outputs.length > 0) {
            info.push(`Outputs: ${psbtDetails.outputs.length}`);
            psbtDetails.outputs.forEach((output, i) => {
                info.push(`  Output ${i}: ${output.valueInBTC} BTC${output.address ? ' to ' + output.address : ''}`);
            });
        }
        
        if (psbtDetails.fee !== null && psbtDetails.fee !== undefined) {
            const feeInBTC = (psbtDetails.fee / 100000000).toFixed(8);
            info.push(`Fee: ${feeInBTC} BTC (${psbtDetails.fee} sats)`);
        }
        
        if (psbtDetails.parseError) {
            info.push(`Parse Error: ${psbtDetails.parseError}`);
        }
    }
    
    return info.join('\n');
}

/**
 * 统一输出PSBT结果的函数
 */
function outputPSBTResult(psbtData, psbtBase64, psbtValidation) {
    // 输出完整的PSBT内容到日志
    addDebugLog('=== FINAL PSBT OUTPUT ===');
    addDebugLog(`Complete Base64 PSBT: ${psbtBase64}`);
    addDebugLog(`PSBT Length: ${psbtBase64.length} characters`);
    addDebugLog(`PSBT hex (first 100 bytes): ${Array.from(psbtData.slice(0, 100)).map(b => b.toString(16).padStart(2, '0')).join('')}`);
    addDebugLog(`PSBT validation: ${psbtValidation.isValid ? 'VALID' : 'INVALID'}`);
    if (!psbtValidation.isValid) {
        addDebugLog(`Validation error: ${psbtValidation.error}`);
    }
    addDebugLog('=== END PSBT OUTPUT ===');
    
    // 标记PSBT已生成
    psbtGenerated = true;
    isProcessingComplete = true;
    
    // 输出结果到页面
    const statusMsg = psbtValidation.isValid 
        ? `✅ UR decoded successfully! Generated VALID Base64 PSBT (${psbtBase64.length} chars).`
        : `⚠️ UR decoded successfully! Generated PSBT (${psbtBase64.length} chars) but validation failed: ${psbtValidation.error}`;
        
    showStatus(conversionStatus, statusMsg, psbtValidation.isValid ? 'success' : 'error');
    
    // 将PSBT显示在页面上
    const psbtDisplay = document.createElement('div');
    psbtDisplay.style.marginTop = '20px';
    psbtDisplay.style.padding = '10px';
    psbtDisplay.style.border = `1px solid ${psbtValidation.isValid ? '#28a745' : '#dc3545'}`;
    psbtDisplay.style.borderRadius = '5px';
    psbtDisplay.style.backgroundColor = psbtValidation.isValid ? '#d4edda' : '#f8d7da';
    psbtDisplay.innerHTML = `
        <h4>Generated PSBT:</h4>
        <textarea readonly style="width: 100%; height: 100px; font-family: monospace; font-size: 12px;">${psbtBase64}</textarea>
        <p><strong>Length:</strong> ${psbtBase64.length} characters</p>
        <p><strong>Status:</strong> ${psbtValidation.isValid ? '✅ Valid PSBT' : '❌ Invalid PSBT'}</p>
        ${!psbtValidation.isValid ? `<p><strong>Error:</strong> ${psbtValidation.error}</p>` : ''}
    `;
    
    // 清空之前的输出并添加新的
    qrOutput.innerHTML = '';
    qrOutput.appendChild(psbtDisplay);
}

// Add decodePSBT function directly to this file
window.decodePSBT = function(psbtBase64) {
  let psbt;
  try {
    psbt = bitcoin.Psbt.fromBase64(psbtBase64.trim());
  } catch (e) {
    return { error: 'Invalid PSBT: ' + e.message };
  }

  const result = {
    inputs: [],
    outputs: [],
    fee: null,
    debug: {}
  };

  try {
    // Get transaction info
    const tx = psbt.data.globalMap.unsignedTx;
    result.debug.hasTx = !!tx;
    
    if (tx) {
      result.version = tx.version;
      result.locktime = tx.locktime;
      result.debug.hasOuts = !!tx.outs;
      result.debug.hasIns = !!tx.ins;
      result.debug.outsLength = tx.outs ? tx.outs.length : 0;
      result.debug.insLength = tx.ins ? tx.ins.length : 0;
      
      // Process outputs with addresses
      if (tx.outs && Array.isArray(tx.outs)) {
        tx.outs.forEach((out, index) => {
          let address = null;
          try {
            address = bitcoin.address.fromOutputScript(out.script, bitcoin.networks.bitcoin);
          } catch (e) {
            // Couldn't decode address
          }
          
          result.outputs.push({
            index,
            value: out.value,
            valueInBTC: (out.value / 100000000).toFixed(8),
            script: out.script.toString('hex'),
            address
          });
        });
      }
      
      // Process inputs 
      if (tx.ins && Array.isArray(tx.ins)) {
        tx.ins.forEach((input, index) => {
          result.inputs.push({
            index,
            txid: Buffer.from(input.hash).reverse().toString('hex'),
            vout: input.index,
            sequence: input.sequence,
            script: input.script.toString('hex')
          });
        });
      }
    }

    // Try to get fee if possible
    try {
      result.fee = psbt.getFee();
    } catch (e) {
      result.debug.feeError = e.message;
    }

    // Also try to get input/output info from PSBT data
    if (psbt.data && psbt.data.inputs) {
      result.debug.psbtInputsLength = psbt.data.inputs.length;
      
      // If we didn't get inputs from tx, try from PSBT data
      if (result.inputs.length === 0) {
        psbt.data.inputs.forEach((input, index) => {
          const inputInfo = { index };
          if (input.witnessUtxo) {
            inputInfo.witnessUtxo = {
              value: input.witnessUtxo.value,
              valueInBTC: (input.witnessUtxo.value / 100000000).toFixed(8),
              script: input.witnessUtxo.script.toString('hex')
            };
            // Try to get address from witness UTXO
            try {
              inputInfo.witnessUtxo.address = bitcoin.address.fromOutputScript(input.witnessUtxo.script, bitcoin.networks.bitcoin);
            } catch (e) {
              // Couldn't decode address
            }
          }
          if (input.nonWitnessUtxo) {
            inputInfo.nonWitnessUtxo = input.nonWitnessUtxo.toString('hex');
          }
          result.inputs.push(inputInfo);
        });
      }
    }
    if (psbt.data && psbt.data.outputs) {
      result.debug.psbtOutputsLength = psbt.data.outputs.length;
    }

  } catch (e) {
    result.parseError = e.message;
  }

  return result;
};

// 已移除手动UR解码函数，现在使用bc-ur库进行正确的UR解码 