(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const { splitQRs, renderQRImage } = window.BBQr;

// Application state
const state = {
  uploadedFile: {
    raw: null,
    type: null,
    name: null
  },
  lastDecodedData: null,
  camera: {
    stream: null,
    isScanning: false,
    scanCount: 0,
    parts: []
  }
};

// DOM elements
const elements = {
  textInput: null,
  fileInput: null,
  generateBtn: null,
  output: null,
  decodeInput: null,
  decodeBtn: null,
  decodeOutput: null,
  copyBtn: null,
  scanBtn: null,
  video: null,
  canvas: null,
  ctx: null
};

// Initialize DOM elements
function initializeElements() {
  elements.textInput = document.getElementById('text-input');
  elements.fileInput = document.getElementById('file-input');
  elements.generateBtn = document.getElementById('generate-btn');
  elements.output = document.getElementById('output');
  elements.decodeInput = document.getElementById('decode-input');
  elements.decodeBtn = document.getElementById('decode-btn');
  elements.decodeOutput = document.getElementById('decode-output');
  elements.copyBtn = document.getElementById('copy-btn');
  elements.scanBtn = document.getElementById('scan-btn');
  elements.video = document.getElementById('camera-video');
  elements.canvas = document.getElementById('camera-canvas');
  elements.ctx = elements.canvas?.getContext('2d');
}

// Utility functions
function createStatusMessage(message, type = 'info') {
  const statusEl = document.createElement('div');
  statusEl.className = `status-message status-${type}`;
  statusEl.textContent = message;
  return statusEl;
}

function showStatus(container, message, type = 'info', append = false) {
  if (!append) {
    // Remove existing status messages
    const existingMessages = container.querySelectorAll('.status-message');
    existingMessages.forEach(msg => msg.remove());
  }
  
  const statusEl = createStatusMessage(message, type);
  container.appendChild(statusEl);
  return statusEl;
}

function clearContainer(container) {
  container.innerHTML = '';
}

function updateFileInputStatus(message, type = 'info') {
  showStatus(elements.fileInput.parentNode, message, type);
}

// File type detection and validation
function detectTextFileType(text) {
  try {
    JSON.parse(text);
    return 'J'; // JSON
  } catch {
    return 'U'; // Unicode
  }
}

async function processUploadedFile(file) {
  updateFileInputStatus('正在处理文件...', 'info');
  
  try {
    const buffer = new Uint8Array(await file.arrayBuffer());
    const detected = await window.BBQr.detectFileType(buffer);
    
    state.uploadedFile = {
      raw: detected.fileType === 'P' ? detected.raw : buffer,
      type: detected.fileType === 'P' ? 'P' : 'B',
      name: file.name
    };
    
    const fileTypeLabel = detected.fileType === 'P' ? 'PSBT' : '二进制';
    updateFileInputStatus(
      `${fileTypeLabel} 文件已加载: ${file.name} (${buffer.length} 字节)`, 
      'success'
    );
    
    return true;
  } catch (error) {
    updateFileInputStatus(`文件处理失败: ${error.message}`, 'error');
    state.uploadedFile = { raw: null, type: null, name: null };
    return false;
  }
}

// QR Code generation
async function generateBBQR(raw, fileType) {
  clearContainer(elements.output);
  elements.generateBtn.disabled = true;
  elements.generateBtn.textContent = '生成中...';
  
  try {
    showStatus(elements.output, '正在生成 QR 码...', 'info');
    
    const splitResult = splitQRs(raw, fileType, {
      encoding: 'Z',
      minSplit: 1,
      maxSplit: 1295,
      minVersion: 5,
      maxVersion: 40
    });
    
    const imgBuffer = await renderQRImage(splitResult.parts, splitResult.version, {
      frameDelay: 300,
      randomizeOrder: false
    });
    
    // Clear loading message and show result
    clearContainer(elements.output);
    
    // Create file type badge
    const badge = document.createElement('div');
    badge.className = 'file-type-badge';
    const typeLabels = { 'U': 'Unicode', 'J': 'JSON', 'P': 'PSBT', 'B': '二进制' };
    badge.textContent = `类型: ${typeLabels[fileType] || fileType}`;
    
    // Create QR image
    const base64 = btoa(String.fromCharCode(...new Uint8Array(imgBuffer)));
    const img = document.createElement('img');
    img.src = `data:image/png;base64,${base64}`;
    
    // Add elements to output
    elements.output.appendChild(badge);
    elements.output.appendChild(img);
    
    showStatus(
      elements.output, 
      `成功生成 ${splitResult.parts.length} 个 QR 码 (版本 ${splitResult.version})`, 
      'success',
      true
    );
    
  } catch (error) {
    clearContainer(elements.output);
    showStatus(elements.output, `生成失败: ${error.message}`, 'error');
  } finally {
    elements.generateBtn.disabled = false;
    elements.generateBtn.textContent = '生成 QR 码';
  }
}

// Event handlers
function handleGenerateClick() {
  // Priority: use uploaded file if available
  if (state.uploadedFile.raw) {
    const { raw, type, name } = state.uploadedFile;
    
    // Clear uploaded file state
    state.uploadedFile = { raw: null, type: null, name: null };
    elements.fileInput.value = '';
    updateFileInputStatus('文件已处理，可以重新上传', 'info');
    
    return generateBBQR(raw, type);
  }
  
  // Otherwise use text input
  const text = elements.textInput.value.trim();
  if (!text) {
    showStatus(elements.output, '请输入文本或上传文件', 'error');
    return;
  }
  
  const encoder = new TextEncoder();
  const raw = encoder.encode(text);
  const fileType = detectTextFileType(text);
  
  generateBBQR(raw, fileType);
}

async function handleFileInputChange() {
  const file = elements.fileInput.files[0];
  if (!file) {
    state.uploadedFile = { raw: null, type: null, name: null };
    return;
  }
  
  await processUploadedFile(file);
}

// Decode result formatting
function formatDecodeResult(fileType, raw, isFromCamera = false) {
  const u8 = raw instanceof Uint8Array ? raw : new Uint8Array(raw);
  const prefix = isFromCamera ? '📱 扫描成功!\n\n' : '';
  
  const typeLabels = {
    'U': 'Unicode 文本',
    'J': 'JSON 数据',
    'P': 'PSBT (部分签名比特币交易)',
    'B': '二进制数据'
  };
  
  let result = `${prefix}📄 文件类型: ${typeLabels[fileType] || fileType}\n📊 数据长度: ${u8.length} 字节\n\n`;
  
  if (fileType === 'U') {
    const text = new TextDecoder().decode(u8);
    result += `📝 内容:\n${text}`;
  } else if (fileType === 'J') {
    const text = new TextDecoder().decode(u8);
    try {
      const parsed = JSON.parse(text);
      result += `✅ 格式化 JSON:\n${JSON.stringify(parsed, null, 2)}`;
    } catch (e) {
      result += `⚠️ JSON 解析失败，显示原始内容:\n${text}`;
    }
  } else if (fileType === 'P') {
    const b64 = btoa(String.fromCharCode(...u8));
    result += `📊 Base64 长度: ${b64.length} 字符\n\n🔗 Base64 编码:\n${b64}\n\n🔍 十六进制预览 (前64字节):\n${Array.from(u8.slice(0, 64)).map(b => b.toString(16).padStart(2, '0')).join(' ')}${u8.length > 64 ? '...' : ''}`;
  } else {
    const b64 = btoa(String.fromCharCode(...u8));
    result += `🔗 Base64 编码:\n${b64}`;
  }
  
  return result;
}

// Event handlers
function handleGenerateClick() {
  // Priority: use uploaded file if available
  if (state.uploadedFile.raw) {
    const { raw, type, name } = state.uploadedFile;
    
    // Clear uploaded file state
    state.uploadedFile = { raw: null, type: null, name: null };
    elements.fileInput.value = '';
    updateFileInputStatus('文件已处理，可以重新上传', 'info');
    
    return generateBBQR(raw, type);
  }
  
  // Otherwise use text input
  const text = elements.textInput.value.trim();
  if (!text) {
    showStatus(elements.output, '请输入文本或上传文件', 'error');
    return;
  }
  
  const encoder = new TextEncoder();
  const raw = encoder.encode(text);
  const fileType = detectTextFileType(text);
  
  generateBBQR(raw, fileType);
}

async function handleFileInputChange() {
  const file = elements.fileInput.files[0];
  if (!file) {
    state.uploadedFile = { raw: null, type: null, name: null };
    return;
  }
  
  await processUploadedFile(file);
}

// Decode result formatting
function formatDecodeResult(fileType, raw, isFromCamera = false) {
  const u8 = raw instanceof Uint8Array ? raw : new Uint8Array(raw);
  const prefix = isFromCamera ? '📱 扫描成功!\n\n' : '';
  
  const typeLabels = {
    'U': 'Unicode 文本',
    'J': 'JSON 数据',
    'P': 'PSBT (部分签名比特币交易)',
    'B': '二进制数据'
  };
  
  let result = `${prefix}📄 文件类型: ${typeLabels[fileType] || fileType}\n📊 数据长度: ${u8.length} 字节\n\n`;
  
  if (fileType === 'U') {
    const text = new TextDecoder().decode(u8);
    result += `📝 内容:\n${text}`;
  } else if (fileType === 'J') {
    const text = new TextDecoder().decode(u8);
    try {
      const parsed = JSON.parse(text);
      result += `✅ 格式化 JSON:\n${JSON.stringify(parsed, null, 2)}`;
    } catch (e) {
      result += `⚠️ JSON 解析失败，显示原始内容:\n${text}`;
    }
  } else if (fileType === 'P') {
    const b64 = btoa(String.fromCharCode(...u8));
    result += `📊 Base64 长度: ${b64.length} 字符\n\n🔗 Base64 编码:\n${b64}\n\n🔍 十六进制预览 (前64字节):\n${Array.from(u8.slice(0, 64)).map(b => b.toString(16).padStart(2, '0')).join(' ')}${u8.length > 64 ? '...' : ''}`;
  } else {
    const b64 = btoa(String.fromCharCode(...u8));
    result += `🔗 Base64 编码:\n${b64}`;
  }
  
  return result;
}

// PNG decode functionality
async function handleDecodeClick() {
  clearContainer(elements.decodeOutput);
  elements.copyBtn.classList.add('hidden');
  
  const files = elements.decodeInput.files;
  if (!files || files.length === 0) {
    showStatus(elements.decodeOutput, '请选择 PNG 文件进行解码', 'error');
    return;
  }
  
  elements.decodeBtn.disabled = true;
  elements.decodeBtn.textContent = '解码中...';
  
  try {
    showStatus(elements.decodeOutput, `正在处理 ${files.length} 个文件...`, 'info');
    
    const parts = [];
    for (const file of files) {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error(`无法加载图片: ${file.name}`));
      });
      
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, canvas.width, canvas.height);
      
      if (!code) {
        throw new Error(`在文件 ${file.name} 中未找到 QR 码`);
      }
      
      parts.push(code.data);
      URL.revokeObjectURL(img.src);
    }
    
    // Join QR parts into original data
    const { fileType, raw } = window.BBQr.joinQRs(parts);
    const u8 = raw instanceof Uint8Array ? raw : new Uint8Array(raw);
    
    // Store for copy functionality
    state.lastDecodedData = { fileType, raw: u8 };
    
    // Display result
    clearContainer(elements.decodeOutput);
    const result = formatDecodeResult(fileType, u8);
    elements.decodeOutput.textContent = result;
    
    // Show copy button
    elements.copyBtn.classList.remove('hidden');
    
    showStatus(elements.decodeOutput, '解码完成', 'success', true);
    
  } catch (error) {
    clearContainer(elements.decodeOutput);
    showStatus(elements.decodeOutput, `解码失败: ${error.message}`, 'error');
  } finally {
    elements.decodeBtn.disabled = false;
    elements.decodeBtn.textContent = '解码 PNG';
  }
}

// Copy functionality
async function handleCopyClick() {
  if (!state.lastDecodedData) {
    showStatus(elements.decodeOutput, '没有可复制的数据', 'error', true);
    return;
  }
  
  try {
    const { fileType, raw } = state.lastDecodedData;
    let textToCopy = '';
    
    if (fileType === 'U' || fileType === 'J') {
      textToCopy = new TextDecoder().decode(raw);
    } else {
      textToCopy = btoa(String.fromCharCode(...raw));
    }
    
    await navigator.clipboard.writeText(textToCopy);
    
    const originalText = elements.copyBtn.textContent;
    elements.copyBtn.textContent = '已复制!';
    elements.copyBtn.style.background = '#4caf50';
    
    setTimeout(() => {
      elements.copyBtn.textContent = originalText;
      elements.copyBtn.style.background = '';
    }, 2000);
    
  } catch (error) {
    showStatus(elements.decodeOutput, `复制失败: ${error.message}`, 'error', true);
  }
}

// Camera utilities
function isSafari() {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

async function getCameraStream() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Camera API not supported');
  }

  const isIOSSafari = isIOS() && isSafari();
  
  let constraints = {
    video: {
      facingMode: 'environment',
      width: { ideal: 640, max: 1280 },
      height: { ideal: 480, max: 720 }
    }
  };

  // For iOS Safari, use simpler constraints
  if (isIOSSafari) {
    constraints = { video: { facingMode: 'environment' } };
  }

  try {
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (e) {
    console.log('Back camera failed, trying front camera:', e);
    
    constraints.video.facingMode = 'user';
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (e2) {
      console.log('Front camera failed, trying any camera:', e2);
      return await navigator.mediaDevices.getUserMedia({ video: true });
    }
  }
}

function stopCameraStream() {
  if (state.camera.stream) {
    state.camera.stream.getTracks().forEach(track => track.stop());
    state.camera.stream = null;
  }
  elements.video.style.display = 'none';
  state.camera.isScanning = false;
  state.camera.scanCount = 0;
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
    elements.video.style.display = 'block';
    
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
    
    elements.scanBtn.textContent = '扫描中...';
    showStatus(elements.decodeOutput, '📷 请将相机对准 QR 码...', 'info');
    
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
        showStatus(elements.decodeOutput, '⏰ 扫描超时，请重试', 'error');
      }
      stopCameraStream();
      elements.scanBtn.disabled = false;
      elements.scanBtn.textContent = '扫描相机';
      return;
    }
    
    // Check if video is ended or paused
    if (elements.video.paused || elements.video.ended) {
      stopCameraStream();
      elements.scanBtn.disabled = false;
      elements.scanBtn.textContent = '扫描相机';
      return;
    }
    
    try {
      if (elements.video.readyState === elements.video.HAVE_ENOUGH_DATA) {
        elements.ctx.drawImage(elements.video, 0, 0, elements.canvas.width, elements.canvas.height);
        const imageData = elements.ctx.getImageData(0, 0, elements.canvas.width, elements.canvas.height);
        const code = jsQR(imageData.data, elements.canvas.width, elements.canvas.height);
        
        if (code?.data && !state.camera.parts.includes(code.data)) {
          state.camera.parts.push(code.data);
          showStatus(
            elements.decodeOutput, 
            `📱 发现 ${state.camera.parts.length} 个 QR 码，继续扫描...`, 
            'info'
          );
          
          // Try to join parts
          try {
            const { fileType, raw } = window.BBQr.joinQRs(state.camera.parts);
            const u8 = raw instanceof Uint8Array ? raw : new Uint8Array(raw);
            
            // Success! Store and display result
            state.lastDecodedData = { fileType, raw: u8 };
            
            clearContainer(elements.decodeOutput);
            const result = formatDecodeResult(fileType, u8, true);
            elements.decodeOutput.textContent = result;
            elements.copyBtn.classList.remove('hidden');
            
            showStatus(elements.decodeOutput, '✅ 扫描完成!', 'success', true);
            
            // Stop scanning
            stopCameraStream();
            elements.scanBtn.disabled = false;
            elements.scanBtn.textContent = '扫描相机';
            return;
            
          } catch (e) {
            // Not complete yet, continue scanning
          }
        }
      }
    } catch (e) {
      console.warn('Scan frame error:', e);
    }
    
    requestAnimationFrame(scanFrame);
  }
  
  requestAnimationFrame(scanFrame);
}

function handleScanError(error) {
  console.error('Camera error:', error);
  
  let errorMsg = '📷 相机错误: ';
  
  switch (error.name) {
    case 'NotAllowedError':
      errorMsg += '相机权限被拒绝，请允许相机访问后重试';
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
  
  clearContainer(elements.decodeOutput);
  showStatus(elements.decodeOutput, errorMsg, 'error');
  
  stopCameraStream();
  elements.scanBtn.disabled = false;
  elements.scanBtn.textContent = '扫描相机';
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
  initializeElements();
  
  // Verify all required elements are found
  const requiredElements = [
    'textInput', 'fileInput', 'generateBtn', 'output',
    'decodeInput', 'decodeBtn', 'decodeOutput', 'copyBtn',
    'scanBtn', 'video', 'canvas'
  ];
  
  const missingElements = requiredElements.filter(name => !elements[name]);
  if (missingElements.length > 0) {
    console.error('Missing required elements:', missingElements);
    return;
  }
  
  // Set up event listeners
  elements.generateBtn.addEventListener('click', handleGenerateClick);
  elements.fileInput.addEventListener('change', handleFileInputChange);
  elements.decodeBtn.addEventListener('click', handleDecodeClick);
  elements.copyBtn.addEventListener('click', handleCopyClick);
  elements.scanBtn.addEventListener('click', handleScanClick);
  
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
  
  console.log('BBQr Generator initialized successfully');
});
},{}]},{},[1]);
