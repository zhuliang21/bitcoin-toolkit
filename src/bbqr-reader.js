// BBQr Reader - Bitcoin QR Code Scanner
// Simplified version with only scanning/decoding functionality

import { joinQRs, detectFileType } from 'bbqr';

// Global state
const state = {
  camera: {
    stream: null,
    isScanning: false,
    scanCount: 0,
    parts: []
  },
  lastDecodedData: null
};

// DOM elements
const elements = {};

// Initialize DOM elements
function initializeElements() {
  elements.decodeOutput = document.getElementById('decode-output');
  elements.copyBtn = document.getElementById('copy-btn');
  elements.scanBtn = document.getElementById('scan-btn');
  elements.video = document.getElementById('camera-video');
  elements.canvas = document.getElementById('camera-canvas');
  elements.ctx = elements.canvas?.getContext('2d');
  elements.stopScanBtn = document.getElementById('stop-scan-btn');
  elements.clearBtn = document.getElementById('clear-btn');
  elements.noResults = document.getElementById('no-results');
  elements.resultActions = document.getElementById('result-actions');
  elements.scanStatus = document.getElementById('scan-status');
  elements.cameraContainer = document.getElementById('camera-container');
}

// Utility functions
function clearContainer(container) {
  container.innerHTML = '';
}

function showStatus(container, message, type = 'info', append = false) {
  if (!append) {
    const existingMessages = container.querySelectorAll('.status-message');
    existingMessages.forEach(msg => msg.remove());
  }
  
  const statusEl = document.createElement('div');
  statusEl.className = `status-message status-${type}`;
  statusEl.textContent = message;
  container.appendChild(statusEl);
  return statusEl;
}

// Format decode results for display
function formatDecodeResult(fileType, raw, isFromCamera = false) {
  const u8 = raw instanceof Uint8Array ? raw : new Uint8Array(raw);
  const prefix = isFromCamera ? '📱 扫描成功!\n\n' : '📄 解码成功!\n\n';
  
  const typeLabels = {
    'U': 'Unicode 文本',
    'J': 'JSON 数据',
    'P': 'PSBT (部分签名比特币交易)',
    'B': '二进制数据'
  };
  
  let result = `${prefix}`;
  
  // PSBT specific analysis - show only key information
  if (fileType === 'P') {
    try {
      const psbtInfo = analyzePSBT(u8);
      
      if (psbtInfo.isValid) {
        result += `🔍 PSBT 交易信息\n`;
        result += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        
        if (psbtInfo.inputCount !== null) {
          result += `📥 输入 (Inputs): ${psbtInfo.inputCount}\n`;
        }
        if (psbtInfo.outputCount !== null) {
          result += `📤 输出 (Outputs): ${psbtInfo.outputCount}\n`;
        }
        if (psbtInfo.hasSignatures !== null) {
          result += `✍️  签名状态: ${psbtInfo.hasSignatures ? '✅ 已签名' : '❌ 未签名'}\n`;
        }
        if (psbtInfo.networkType) {
          result += `🌐 网络: ${psbtInfo.networkType}\n`;
        }
        
        // Show output details if available
        if (psbtInfo.outputs && psbtInfo.outputs.length > 0) {
          result += `\n💰 输出详情:\n`;
          psbtInfo.outputs.forEach((output, index) => {
            const btcAmount = (output.value / 100000000).toFixed(8);
            result += `  ${index + 1}. ${btcAmount} BTC → ${output.address}\n`;
          });
          
          if (psbtInfo.totalOutputValue > 0) {
            const totalBTC = (psbtInfo.totalOutputValue / 100000000).toFixed(8);
            result += `  总计: ${totalBTC} BTC\n`;
          }
        }
        
        result += `📊 数据大小: ${u8.length} 字节\n`;
        
        if (psbtInfo.hasSignatures) {
          result += `\n🎯 此交易已签名，可以广播到比特币网络\n`;
        } else {
          result += `\n⏳ 此交易尚未签名，需要使用钱包进行签名\n`;
        }
      } else {
        result += `❌ PSBT 解析失败\n`;
        result += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        result += `错误: ${psbtInfo.error}\n`;
        result += `数据大小: ${u8.length} 字节\n`;
      }
      
    } catch (error) {
      result += `❌ PSBT 分析失败\n`;
      result += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      result += `错误: ${error.message}\n`;
      result += `数据大小: ${u8.length} 字节\n`;
    }
  } else {
    // For other file types, show basic info
    result += `📄 文件类型: ${typeLabels[fileType] || fileType}\n`;
    result += `📊 数据大小: ${u8.length} 字节\n`;
    result += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    if (fileType === 'U') {
      const text = new TextDecoder().decode(u8);
      result += `📝 内容:\n${text}`;
    } else if (fileType === 'J') {
      const text = new TextDecoder().decode(u8);
      try {
        const parsed = JSON.parse(text);
        result += `✅ JSON 内容:\n${JSON.stringify(parsed, null, 2)}`;
      } catch (e) {
        result += `⚠️ JSON 解析失败:\n${text}`;
      }
    } else {
      result += `📁 二进制数据，大小: ${u8.length} 字节`;
    }
  }
  
  return result;
}

// Enhanced PSBT Analysis Function
function analyzePSBT(data) {
  try {
    // Check PSBT magic bytes: "psbt" + 0xff separator
    const magicBytes = new Uint8Array([0x70, 0x73, 0x62, 0x74, 0xff]);
    
    if (data.length < 5) {
      return {
        isValid: false,
        error: 'PSBT 数据太短'
      };
    }
    
    // Check magic bytes
    const hasValidMagic = data[0] === magicBytes[0] && 
                         data[1] === magicBytes[1] && 
                         data[2] === magicBytes[2] && 
                         data[3] === magicBytes[3] && 
                         data[4] === magicBytes[4];
    
    if (!hasValidMagic) {
      return {
        isValid: false,
        error: '不是有效的 PSBT 格式'
      };
    }
    
    // Enhanced parsing for transaction details
    let inputCount = 0;
    let outputCount = 0;
    let hasSignatures = false;
    let version = null;
    let outputs = [];
    let totalOutputValue = 0;
    
    try {
      // Parse global map to find unsigned transaction
      let unsignedTx = null;
      let globalOffset = 5;
      
      while (globalOffset < data.length - 1) {
        const keyLen = data[globalOffset];
        if (keyLen === 0x00) {
          globalOffset++;
          break; // End of global map
        }
        
        // Check if this is the unsigned transaction key (0x00)
        if (keyLen === 1 && data[globalOffset + 1] === 0x00) {
          globalOffset += 2; // Skip key
          const valueLen = readVarint(data, globalOffset);
          globalOffset += getVarintSize(data, globalOffset);
          
          // Extract unsigned transaction
          unsignedTx = data.slice(globalOffset, globalOffset + valueLen.value);
          globalOffset += valueLen.value;
          console.log('Found unsigned transaction, length:', unsignedTx.length);
        } else {
          // Skip this key-value pair
          globalOffset += keyLen + 1; // Skip key
          if (globalOffset >= data.length) break;
          
          const valueLen = readVarint(data, globalOffset);
          globalOffset += getVarintSize(data, globalOffset) + valueLen.value;
        }
        
        if (globalOffset >= data.length) break;
      }
      
      // Parse unsigned transaction if found
      if (unsignedTx && unsignedTx.length > 10) {
        let txOffset = 0;
        
        // Read version (4 bytes, little endian)
        version = unsignedTx[txOffset] | (unsignedTx[txOffset + 1] << 8) | 
                 (unsignedTx[txOffset + 2] << 16) | (unsignedTx[txOffset + 3] << 24);
        txOffset += 4;
        
        // Read input count
        const inputCountVarint = readVarint(unsignedTx, txOffset);
        inputCount = inputCountVarint.value;
        txOffset += getVarintSize(unsignedTx, txOffset);
        
        // Skip inputs
        for (let i = 0; i < inputCount && txOffset < unsignedTx.length - 8; i++) {
          txOffset += 32; // Previous output hash
          txOffset += 4;  // Previous output index
          
          if (txOffset >= unsignedTx.length) break;
          
          // Skip script
          const scriptLen = readVarint(unsignedTx, txOffset);
          txOffset += getVarintSize(unsignedTx, txOffset) + scriptLen.value;
          
          if (txOffset >= unsignedTx.length) break;
          txOffset += 4; // Sequence
        }
        
        // Read output count
        if (txOffset < unsignedTx.length) {
          const outputCountVarint = readVarint(unsignedTx, txOffset);
          outputCount = outputCountVarint.value;
          txOffset += getVarintSize(unsignedTx, txOffset);
          
          // Parse outputs
          console.log('Parsing outputs, count:', outputCount, 'txOffset:', txOffset);
          for (let i = 0; i < outputCount && txOffset < unsignedTx.length - 8; i++) {
            if (txOffset + 8 >= unsignedTx.length) break;
            
            // Read value (8 bytes, little endian)
            let value = 0;
            for (let j = 0; j < 8; j++) {
              value += unsignedTx[txOffset + j] * Math.pow(256, j);
            }
            txOffset += 8;
            
            // Read script
            const scriptLen = readVarint(unsignedTx, txOffset);
            txOffset += getVarintSize(unsignedTx, txOffset);
            
            if (txOffset + scriptLen.value > unsignedTx.length) break;
            
            const script = unsignedTx.slice(txOffset, txOffset + scriptLen.value);
            txOffset += scriptLen.value;
            
            // Try to decode address from script
            const address = decodeScriptToAddress(script);
            
            console.log(`Output ${i + 1}: value=${value}, address=${address}, scriptLen=${scriptLen.value}`);
            
            outputs.push({
              value: value,
              address: address,
              script: Array.from(script).map(b => b.toString(16).padStart(2, '0')).join('')
            });
            
            totalOutputValue += value;
          }
          console.log('Total outputs parsed:', outputs.length, 'totalOutputValue:', totalOutputValue);
        }
      }
      
      // Look for signatures in the PSBT data
      for (let i = 5; i < data.length - 8; i++) {
        if (data[i] === 0x30) {
          const derLen = data[i + 1];
          if (derLen >= 0x44 && derLen <= 0x48 && i + derLen + 2 < data.length) {
            if (data[i + 2] === 0x02) {
              hasSignatures = true;
              break;
            }
          }
        }
      }
      
    } catch (parseError) {
      console.warn('Enhanced PSBT parsing failed, using basic info:', parseError);
    }
    
    // If we couldn't parse details, provide basic info
    if (inputCount === 0 && outputCount === 0) {
      inputCount = '无法解析';
      outputCount = '无法解析';
    }
    
    return {
      isValid: true,
      version: version,
      inputCount: inputCount,
      outputCount: outputCount,
      outputs: outputs,
      totalOutputValue: totalOutputValue,
      hasSignatures: hasSignatures,
      networkType: 'Bitcoin',
      error: null
    };
    
  } catch (error) {
    return {
      isValid: false,
      error: `解析失败: ${error.message}`
    };
  }
}

// Helper functions for PSBT parsing
function readVarint(data, offset) {
  if (offset >= data.length) return { value: 0, size: 1 };
  
  const first = data[offset];
  if (first < 0xfd) {
    return { value: first, size: 1 };
  } else if (first === 0xfd) {
    if (offset + 2 >= data.length) return { value: 0, size: 1 };
    return { 
      value: data[offset + 1] | (data[offset + 2] << 8), 
      size: 3 
    };
  } else if (first === 0xfe) {
    if (offset + 4 >= data.length) return { value: 0, size: 1 };
    return { 
      value: data[offset + 1] | (data[offset + 2] << 8) | 
             (data[offset + 3] << 16) | (data[offset + 4] << 24), 
      size: 5 
    };
  }
  return { value: 0, size: 1 };
}

function getVarintSize(data, offset) {
  if (offset >= data.length) return 1;
  const first = data[offset];
  if (first < 0xfd) return 1;
  else if (first === 0xfd) return 3;
  else if (first === 0xfe) return 5;
  else return 9;
}

function decodeScriptToAddress(script) {
  if (!script || script.length === 0) return '未知地址';
  
  try {
    // P2PKH (Pay to Public Key Hash) - starts with OP_DUP OP_HASH160
    if (script.length === 25 && script[0] === 0x76 && script[1] === 0xa9 && script[2] === 0x14) {
      const hash160 = script.slice(3, 23);
      return `1${Array.from(hash160).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 8)}...`;
    }
    
    // P2SH (Pay to Script Hash) - starts with OP_HASH160
    if (script.length === 23 && script[0] === 0xa9 && script[1] === 0x14) {
      const hash160 = script.slice(2, 22);
      return `3${Array.from(hash160).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 8)}...`;
    }
    
    // P2WPKH (Pay to Witness Public Key Hash) - OP_0 + 20 bytes
    if (script.length === 22 && script[0] === 0x00 && script[1] === 0x14) {
      return `bc1q${Array.from(script.slice(2)).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 8)}...`;
    }
    
    // P2WSH (Pay to Witness Script Hash) - OP_0 + 32 bytes
    if (script.length === 34 && script[0] === 0x00 && script[1] === 0x20) {
      return `bc1q${Array.from(script.slice(2)).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 8)}...`;
    }
    
    // P2TR (Pay to Taproot) - OP_1 + 32 bytes
    if (script.length === 34 && script[0] === 0x51 && script[1] === 0x20) {
      return `bc1p${Array.from(script.slice(2)).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 8)}...`;
    }
    
    return `脚本地址 (${script.length}字节)`;
  } catch (error) {
    return '地址解析失败';
  }
}

// Copy functionality
async function handleCopyClick() {
  if (!state.lastDecodedData) {
    alert('没有可复制的数据');
    return;
  }
  
  try {
    const result = formatDecodeResult(
      state.lastDecodedData.fileType, 
      state.lastDecodedData.raw, 
      true
    );
    
    await navigator.clipboard.writeText(result);
    
    const originalText = elements.copyBtn.textContent;
    elements.copyBtn.textContent = '✅ 已复制';
    elements.copyBtn.classList.remove('gradient-button-success');
    elements.copyBtn.classList.add('bg-green-600');
    
    setTimeout(() => {
      elements.copyBtn.textContent = originalText;
      elements.copyBtn.classList.add('gradient-button-success');
      elements.copyBtn.classList.remove('bg-green-600');
    }, 2000);
    
  } catch (error) {
    console.error('Copy failed:', error);
    alert('复制失败，请手动选择文本复制');
  }
}

// Browser detection utilities
function isSafari() {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

// Camera functionality
async function getCameraStream() {
  const constraints = {
    video: {
      facingMode: 'environment',
      width: { ideal: 1280, max: 1920 },
      height: { ideal: 720, max: 1080 },
      frameRate: { ideal: 30, max: 60 }
    },
    audio: false
  };
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log('Camera stream obtained:', stream.getVideoTracks()[0].getSettings());
    return stream;
  } catch (error) {
    console.error('Camera access error:', error);
    
    // Try with basic constraints as fallback
    try {
      const basicConstraints = {
        video: { facingMode: 'environment' },
        audio: false
      };
      const stream = await navigator.mediaDevices.getUserMedia(basicConstraints);
      console.log('Camera stream obtained with basic constraints');
      return stream;
    } catch (fallbackError) {
      console.error('Basic camera access also failed:', fallbackError);
      throw fallbackError;
    }
  }
}

function stopCameraStream() {
  if (state.camera.stream) {
    state.camera.stream.getTracks().forEach(track => {
      track.stop();
      console.log('Camera track stopped:', track.kind);
    });
    state.camera.stream = null;
  }
  
  state.camera.isScanning = false;
  state.camera.scanCount = 0;
  
  // Hide camera interface
  if (elements.video) {
    elements.video.classList.add('hidden');
  }
  if (elements.cameraContainer) {
    elements.cameraContainer.classList.add('hidden');
  }
  if (elements.scanStatus) {
    elements.scanStatus.classList.add('hidden');
  }
  if (elements.stopScanBtn) {
    elements.stopScanBtn.classList.add('hidden');
  }
  if (elements.scanBtn) {
    elements.scanBtn.classList.remove('hidden');
    elements.scanBtn.disabled = false;
    elements.scanBtn.textContent = '📷 开始相机扫描';
  }
  state.camera.parts = [];
}

// Camera scanning functionality
async function handleScanClick() {
  clearContainer(elements.decodeOutput);
  elements.copyBtn.classList.add('hidden');
  
  elements.scanBtn.disabled = true;
  elements.scanBtn.textContent = '初始化相机...';
  
  try {
    // Check HTTPS requirement on iOS
    const isDevelopment = location.hostname === 'localhost' || 
                         location.hostname === '127.0.0.1' ||
                         location.hostname.startsWith('192.168.') ||
                         location.hostname.startsWith('10.') ||
                         location.hostname.endsWith('.local');
    
    if (isIOS() && location.protocol !== 'https:' && !isDevelopment) {
      throw new Error('Camera requires HTTPS on iOS devices. For testing, use localhost or HTTPS.');
    }

    showStatus(elements.decodeOutput, '正在启动相机...', 'info');
    
    state.camera.stream = await getCameraStream();
    if (!state.camera.stream) {
      throw new Error('Failed to get camera stream');
    }
    
    elements.video.srcObject = state.camera.stream;
    
    // Show camera container and video
    if (elements.cameraContainer) {
      elements.cameraContainer.classList.remove('hidden');
    }
    elements.video.classList.remove('hidden');
    
    // Show stop button, hide start button
    if (elements.stopScanBtn) {
      elements.stopScanBtn.classList.remove('hidden');
    }
    elements.scanBtn.classList.add('hidden');
    
    // iOS Safari specific settings
    if (isIOS()) {
      elements.video.setAttribute('webkit-playsinline', 'true');
      elements.video.setAttribute('playsinline', 'true');
    }
    
    // Wait for video to load
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Video load timeout'));
      }, 10000);
      
      elements.video.onloadedmetadata = () => {
        clearTimeout(timeout);
        resolve();
      };
      elements.video.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Video load error'));
      };
    });
    
    await elements.video.play();
    await new Promise(resolve => setTimeout(resolve, 500)); // Stabilization delay
    
    // Set canvas size
    elements.canvas.width = elements.video.videoWidth || 640;
    elements.canvas.height = elements.video.videoHeight || 480;
    
    // Reset camera state
    state.camera.isScanning = true;
    state.camera.scanCount = 0;
    state.camera.parts = [];
    
    // Show scan status in the camera view
    if (elements.scanStatus) {
      elements.scanStatus.classList.remove('hidden');
      elements.scanStatus.innerHTML = `
        <div class="text-center">
          <div class="text-white font-bold text-lg mb-1">
            0/? 准备扫描
          </div>
          <div class="text-white text-xs opacity-90">
            请将相机对准 BBQr 码
          </div>
        </div>
      `;
    }
    
    startScanLoop();
    
  } catch (error) {
    handleScanError(error);
  }
}

function startScanLoop() {
  const maxScans = 600; // 20 seconds at ~30fps
  let lastScanTime = 0;

  function scanFrame(timestamp) {
    // Throttle to ~10fps for better performance
    if (timestamp - lastScanTime < 100) {
      if (state.camera.scanCount < maxScans && state.camera.isScanning) {
        requestAnimationFrame(scanFrame);
      }
      return;
    }
    lastScanTime = timestamp;
    
    state.camera.scanCount++;
    
    // Check for timeout or manual stop
    if (!state.camera.isScanning || state.camera.scanCount > maxScans) {
      if (state.camera.scanCount > maxScans) {
        if (elements.scanStatus) {
          elements.scanStatus.innerHTML = '<div class="p-3 bg-red-50 text-red-800 border border-red-200 rounded-xl text-sm font-medium">⏰ 扫描超时，请重试</div>';
        }
        setTimeout(() => {
          stopCameraStream();
        }, 2000);
      } else {
        stopCameraStream();
      }
      return;
    }
    
    // Check if video is ended or paused
    if (elements.video.paused || elements.video.ended) {
      stopCameraStream();
      return;
    }
    
    try {
      if (elements.video.readyState === elements.video.HAVE_ENOUGH_DATA) {
        elements.ctx.drawImage(elements.video, 0, 0, elements.canvas.width, elements.canvas.height);
        const imageData = elements.ctx.getImageData(0, 0, elements.canvas.width, elements.canvas.height);
        const code = jsQR(imageData.data, elements.canvas.width, elements.canvas.height);
        
        if (code?.data && !state.camera.parts.includes(code.data)) {
          state.camera.parts.push(code.data);
          
          // Update scan status with enhanced progress
          if (elements.scanStatus) {
            // Try to determine expected total parts from first QR code
            let expectedParts = '?';
            try {
              // BBQr format typically includes part info in the QR data
              const firstPart = state.camera.parts[0];
              if (firstPart && firstPart.includes('/')) {
                const match = firstPart.match(/(\d+)\/(\d+)/);
                if (match) {
                  expectedParts = match[2];
                }
              }
            } catch (e) {
              // Ignore parsing errors
            }
            
            elements.scanStatus.innerHTML = `
              <div class="text-center">
                <div class="text-green-400 font-bold text-lg mb-1">
                  ${state.camera.parts.length}/${expectedParts} 已完成
                </div>
                <div class="text-white text-xs opacity-90">
                  继续扫描 QR 码片段...
                </div>
              </div>
            `;
          }
          
          // Try to join parts
          try {
            const { fileType, raw } = joinQRs(state.camera.parts);
            const u8 = raw instanceof Uint8Array ? raw : new Uint8Array(raw);
            
            // Success! Store and display result
            state.lastDecodedData = { fileType, raw: u8 };
            
            // Show completion status with PSBT details
            if (elements.scanStatus) {
              let statusContent = `
                <div class="text-center">
                  <div class="text-green-400 font-bold text-lg mb-2">
                    ✅ ${state.camera.parts.length}/${state.camera.parts.length} 扫描完成
                  </div>
              `;
              
              // Add PSBT details if it's a PSBT
              if (fileType === 'P') {
                try {
                  const psbtInfo = analyzePSBT(u8);
                  if (psbtInfo.isValid) {
                    statusContent += `
                      <div class="text-white text-xs space-y-1 opacity-90">
                        <div>📥 输入: ${psbtInfo.inputCount} 个</div>
                        <div>📤 输出: ${psbtInfo.outputCount} 个</div>
                    `;
                    
                    // Show output addresses and amounts
                    if (psbtInfo.outputs && psbtInfo.outputs.length > 0) {
                      statusContent += `<div class="mt-2 space-y-1">`;
                      psbtInfo.outputs.forEach((output, index) => {
                        const btcAmount = (output.value / 100000000).toFixed(8);
                        statusContent += `
                          <div class="text-xs">
                            <div>💰 ${btcAmount} BTC</div>
                            <div class="text-gray-300">${output.address}</div>
                          </div>
                        `;
                      });
                      statusContent += `</div>`;
                    }
                    
                    statusContent += `
                        <div class="mt-1">
                          ${psbtInfo.hasSignatures ? '✅ 已签名' : '❌ 未签名'}
                        </div>
                      </div>
                    `;
                  }
                } catch (e) {
                  console.warn('Failed to analyze PSBT for status:', e);
                }
              }
              
              statusContent += `</div>`;
              elements.scanStatus.innerHTML = statusContent;
            }
            
            // Wait a moment then hide camera and show results
            setTimeout(() => {
              // Hide camera interface
              if (elements.cameraContainer) {
                elements.cameraContainer.classList.add('hidden');
              }
              if (elements.scanStatus) {
                elements.scanStatus.classList.add('hidden');
              }
              if (elements.stopScanBtn) {
                elements.stopScanBtn.classList.add('hidden');
              }
              elements.scanBtn.classList.remove('hidden');
              
              // Show enhanced results
              const result = formatDecodeResult(fileType, u8, true);
              
              if (elements.decodeOutput) {
                elements.decodeOutput.textContent = result;
                elements.decodeOutput.classList.remove('hidden');
              }
              
              if (elements.noResults) {
                elements.noResults.classList.add('hidden');
              }
              
              if (elements.resultActions) {
                elements.resultActions.classList.remove('hidden');
              }
              
              elements.copyBtn.classList.remove('hidden');
              
              // Stop camera
              stopCameraStream();
              
            }, 2000);
            
            return; // Exit scan loop
            
          } catch (joinError) {
            // Not enough parts yet, continue scanning
            console.log('Join failed, need more parts:', joinError.message);
          }
        }
      }
    } catch (error) {
      console.error('Scan frame error:', error);
    }
    
    // Continue scanning
    if (state.camera.scanCount < maxScans && state.camera.isScanning) {
      requestAnimationFrame(scanFrame);
    }
  }
  
  requestAnimationFrame(scanFrame);
}

function handleScanError(error) {
  console.error('Camera scan error:', error);
  
  let errorMsg = '📷 相机扫描失败\n\n';
  
  switch (error.name) {
    case 'NotAllowedError':
      errorMsg += '相机权限被拒绝，请允许相机访问';
      break;
    case 'NotFoundError':
      errorMsg += '未找到相机设备';
      break;
    case 'NotSupportedError':
      errorMsg += '浏览器不支持相机功能';
      break;
    case 'NotReadableError':
      errorMsg += '相机正在被其他应用使用';
      break;
    case 'OverconstrainedError':
      errorMsg += '相机约束无法满足';
      break;
    default:
      errorMsg += error.message;
  }
  
  // iOS-specific guidance
  if (isIOS()) {
    errorMsg += '\n\n📱 iOS 设备注意事项:\n• 请使用 Safari 浏览器\n• 允许相机权限\n• 确保使用 HTTPS (非 HTTP)';
  }
  
  // Show error in scan status if available, otherwise in decode output
  if (elements.scanStatus) {
    elements.scanStatus.innerHTML = `<div class="p-3 bg-red-50 text-red-800 border border-red-200 rounded-xl text-sm font-medium">${errorMsg}</div>`;
    setTimeout(() => {
      stopCameraStream();
    }, 3000);
  } else {
    clearContainer(elements.decodeOutput);
    showStatus(elements.decodeOutput, errorMsg, 'error');
    stopCameraStream();
  }
}

// Clear decode results
function clearDecodeResults() {
  if (elements.decodeOutput) {
    elements.decodeOutput.classList.add('hidden');
    elements.decodeOutput.textContent = '';
  }
  if (elements.noResults) {
    elements.noResults.classList.remove('hidden');
  }
  if (elements.resultActions) {
    elements.resultActions.classList.add('hidden');
  }
  state.lastDecodedData = null;
}

// Initialize BBQr Reader functionality
function initBBQrReader() {
  initializeElements();
  
  // Elements specific to reader (camera scanning only)
  const readerElements = [
    'decodeOutput', 'copyBtn', 'scanBtn'
  ];
  
  const missingElements = readerElements.filter(name => !elements[name]);
  if (missingElements.length > 0) {
    console.error('Missing required reader elements:', missingElements);
    return;
  }
  
  // Set up reader event listeners (camera scanning only)
  elements.copyBtn.addEventListener('click', handleCopyClick);
  elements.scanBtn.addEventListener('click', handleScanClick);
  
  if (elements.stopScanBtn) {
    elements.stopScanBtn.addEventListener('click', () => {
      stopCameraStream();
      elements.scanBtn.disabled = false;
      elements.stopScanBtn.classList.add('hidden');
      elements.scanBtn.classList.remove('hidden');
    });
  }
  
  if (elements.clearBtn) {
    elements.clearBtn.addEventListener('click', () => {
      clearDecodeResults();
    });
  }
  
  // Clean up camera stream when page is hidden/unloaded
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.camera.isScanning) {
      stopCameraStream();
      elements.scanBtn.disabled = false;
      elements.scanBtn.textContent = '扫描相机';
    }
  });
  
  window.addEventListener('beforeunload', () => {
    stopCameraStream();
  });
  
  console.log('BBQr Reader initialized successfully');
}

// Expose functions to window for page initialization
window.initBBQrReader = initBBQrReader;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (window.initBBQrReader) {
    window.initBBQrReader();
  }
}); 