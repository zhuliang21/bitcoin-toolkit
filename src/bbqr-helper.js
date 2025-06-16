// BBQr Helper - Complete PSBT to ColdCard to Broadcast Workflow
// Integrates functionality from psbt-signer.js and bbqr-reader.js

import { splitQRs, joinQRs, detectFileType } from 'bbqr';
import QRious from 'qrious';
import jsQR from 'jsqr';
import * as bitcoin from 'bitcoinjs-lib';

// Global state
const state = {
  currentStep: 1,
  psbtData: null,
  signedPsbtData: null,
  finalizedTx: null,
  bbqrCodes: [],
  camera: {
    stream: null,
    isScanning: false,
    scanCount: 0,
    parts: []
  }
};

// Language support
const translations = {
  en: {
    title: 'BBQr Helper',
    subtitle: 'Complete PSBT to ColdCard to Broadcast Workflow',
    step1: 'Import PSBT',
    step2: 'Generate BBQr',
    step3: 'Scan Signed',
    step4: 'Broadcast',
    importTitle: 'Import PSBT',
    fileLabel: 'Upload PSBT File',
    uploadText: 'Click to upload PSBT',
    supportedFormats: 'PSBT, TXT files supported',
    manualLabel: 'Or Paste PSBT (Base64)',
    psbtPlaceholder: 'Enter PSBT in Base64 format...',
    parseBtn: '🔍 Parse PSBT',
    clearBtn: '🗑️ Clear',
    analysisTitle: 'PSBT Analysis',
    proceedBtn: '➡️ Generate BBQr Codes',
    errorTitle: 'PSBT Parse Error',
    bbqrTitle: 'Generate BBQr for ColdCard',
    bbqrDesc: 'Scan these QR codes with your ColdCard to sign the transaction',
    backBtn: '← Back',
    proceedScanBtn: '➡️ Scan Signed PSBT',
    scanTitle: 'Scan Signed PSBT',
    scanDesc: 'After signing with ColdCard, scan the signed PSBT BBQr codes',
    startScanBtn: '📷 Start Camera Scan',
    scanResultTitle: 'Signed PSBT Received!',
    scanResultDesc: 'Successfully scanned signed PSBT. Ready to finalize and broadcast.',
    proceedFinalizeBtn: '➡️ Finalize & Broadcast',
    finalizeTitle: 'Finalize & Broadcast Transaction',
    txSummaryTitle: 'Transaction Summary',
    finalizeBtn: '🔨 Finalize Transaction',
    finalizedTitle: 'Transaction Ready',
    txidLabel: 'Transaction ID',
    rawHexLabel: 'Raw Transaction',
    copyTxidBtn: '📋 Copy TXID',
    copyHexBtn: '📋 Copy Hex',
    broadcastBtn: '📡 Broadcast Transaction',
    restartBtn: '🔄 Start New Transaction',
    broadcastSuccess: 'Transaction broadcasted successfully!',
    broadcastError: 'Failed to broadcast transaction',
    broadcastConfirm: 'Are you sure you want to broadcast this transaction? This action cannot be undone.',
    broadcasting: '📡 Broadcasting...',
    downloadBtn: '📥 Download PNG',
    quickActionsTitle: 'Quick Actions',
    quickActionsDesc: 'Skip BBQr generation if you already have a signed PSBT',
    quickSkipBtn: '📷 Skip to Scan Signed'
  },
  zh: {
    title: 'BBQr 助手',
    subtitle: '完整的 PSBT 到 ColdCard 到广播工作流程',
    step1: '导入 PSBT',
    step2: '生成 BBQr',
    step3: '扫描已签名',
    step4: '广播',
    importTitle: '导入 PSBT',
    fileLabel: '上传 PSBT 文件',
    uploadText: '点击上传 PSBT',
    supportedFormats: '支持 PSBT, TXT 文件',
    manualLabel: '或粘贴 PSBT (Base64)',
    psbtPlaceholder: '输入 Base64 格式的 PSBT...',
    parseBtn: '🔍 解析 PSBT',
    clearBtn: '🗑️ 清除',
    analysisTitle: 'PSBT 分析',
    proceedBtn: '➡️ 生成 BBQr 码',
    errorTitle: 'PSBT 解析错误',
    bbqrTitle: '为 ColdCard 生成 BBQr',
    bbqrDesc: '用你的 ColdCard 扫描这些 QR 码来签名交易',
    backBtn: '← 返回',
    proceedScanBtn: '➡️ 扫描已签名 PSBT',
    scanTitle: '扫描已签名 PSBT',
    scanDesc: '使用 ColdCard 签名后，扫描已签名的 PSBT BBQr 码',
    startScanBtn: '📷 开始相机扫描',
    scanResultTitle: '已接收签名 PSBT！',
    scanResultDesc: '成功扫描已签名 PSBT。准备完成和广播。',
    proceedFinalizeBtn: '➡️ 完成并广播',
    finalizeTitle: '完成并广播交易',
    txSummaryTitle: '交易摘要',
    finalizeBtn: '🔨 完成交易',
    finalizedTitle: '交易就绪',
    txidLabel: '交易 ID',
    rawHexLabel: '原始交易',
    copyTxidBtn: '📋 复制 TXID',
    copyHexBtn: '📋 复制十六进制',
    broadcastBtn: '📡 广播交易',
    restartBtn: '🔄 开始新交易',
    broadcastSuccess: '交易广播成功！',
    broadcastError: '交易广播失败',
    broadcastConfirm: '确定要广播这个交易吗？此操作无法撤销。',
    broadcasting: '📡 正在广播...',
    downloadBtn: '📥 下载PNG',
    quickActionsTitle: '快速操作',
    quickActionsDesc: '如果你已有已签名的 PSBT，可跳过 BBQr 生成',
    quickSkipBtn: '📷 跳过，直接扫描签名'
  }
};

let currentLanguage = localStorage.getItem('language') || 'en';

// Initialize BBQr Helper
function initBBQrHelper() {
  console.log('BBQr Helper initializing...');
  
  // Initialize language
  updateTexts();
  
  // Setup language toggle
  setupLanguageToggle();
  
  // Setup independent Quick Actions button
  setupQuickActions();
  
  // Render initial step
  renderStep(1);
  
  console.log('BBQr Helper initialized successfully');
}

// Language functions
function updateTexts() {
  const texts = translations[currentLanguage];
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (texts[key]) {
      element.textContent = texts[key];
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    if (texts[key]) {
      element.placeholder = texts[key];
    }
  });

  const toggleBtn = document.querySelector('.language-toggle');
  if (toggleBtn) {
    toggleBtn.textContent = currentLanguage === 'en' ? '中文' : 'ENG';
  }

  document.documentElement.lang = currentLanguage;
}

function setupLanguageToggle() {
  window.toggleLanguage = function() {
    currentLanguage = currentLanguage === 'en' ? 'zh' : 'en';
    localStorage.setItem('language', currentLanguage);
    updateTexts();
  };
}

// Step management
function updateStepIndicator(step) {
  for (let i = 1; i <= 4; i++) {
    const indicator = document.getElementById(`step${i}-indicator`);
    if (indicator) {
      indicator.className = 'step-indicator';
      if (i < step) {
        indicator.className += ' step-completed';
      } else if (i === step) {
        indicator.className += ' step-active';
      } else {
        indicator.className += ' step-inactive';
      }
    }
  }
}

function goToStep(step) {
  if (step < 1 || step > 4) return;
  
  state.currentStep = step;
  updateStepIndicator(step);
  renderStep(step);
}

function renderStep(step) {
  const container = document.getElementById('steps-container');
  
  switch (step) {
    case 1:
      container.innerHTML = renderStep1();
      setupStep1Events();
      break;
    case 2:
      container.innerHTML = renderStep2();
      setupStep2Events();
      break;
    case 3:
      container.innerHTML = renderStep3();
      setupStep3Events();
      break;
    case 4:
      container.innerHTML = renderStep4();
      setupStep4Events();
      // Show transaction summary when entering step 4
      setTimeout(() => {
        showTransactionSummary();
      }, 100);
      break;
  }
  
  updateTexts();
}

// Step 1: Import PSBT
function renderStep1() {
  return `
    <!-- Import PSBT Card -->
    <div class="glass-card rounded-2xl md:rounded-3xl 
                p-6 md:p-8 lg:p-10 transition-all duration-300 ease-out
                shadow-xl shadow-slate-300/25 hover:shadow-2xl hover:shadow-slate-400/40
                bg-white/20 backdrop-blur-xl border border-white/30 hover:border-white/50
                ring-1 ring-white/20 hover:ring-white/35 ring-inset
                animate-fadeInUp"
         style="animation-delay: 0.3s;">
      
      <h2 class="text-2xl md:text-3xl font-bold text-slate-700 tracking-tight mb-6 md:mb-8" data-i18n="importTitle">
        📥 Import PSBT
      </h2>
      
      <!-- File Upload -->
      <div class="mb-6 md:mb-8">
        <label for="psbt-file" class="block text-sm md:text-base font-semibold text-slate-600 mb-3 md:mb-4 tracking-tight" data-i18n="fileLabel">
          📁 Upload PSBT File
        </label>
        <div class="flex items-center justify-center w-full">
          <label for="psbt-file" class="flex flex-col items-center justify-center w-full h-32 md:h-40 
                                         border-2 border-dashed border-white/40 rounded-xl md:rounded-2xl cursor-pointer 
                                         bg-white/30 hover:bg-white/40 backdrop-blur-xl
                                         transition-all duration-300 hover:border-white/60 hover:scale-[1.02]
                                         ring-1 ring-white/20 hover:ring-white/30 ring-inset">
            <div class="flex flex-col items-center justify-center pt-5 pb-6">
              <svg class="w-8 h-8 md:w-10 md:h-10 mb-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
              </svg>
              <p class="mb-2 text-sm md:text-base text-slate-600">
                <span class="font-semibold" data-i18n="uploadText">Click to upload PSBT</span>
              </p>
              <p class="text-xs md:text-sm text-slate-500" data-i18n="supportedFormats">PSBT, TXT files supported</p>
            </div>
            <input id="psbt-file" type="file" class="hidden" accept=".psbt,.txt,.dat" />
          </label>
        </div>
      </div>

      <!-- Manual Input -->
      <div class="mb-6 md:mb-8">
        <label for="psbt-input" class="block text-sm md:text-base font-semibold text-slate-600 mb-3 md:mb-4 tracking-tight" data-i18n="manualLabel">
          📝 Or Paste PSBT (Base64)
        </label>
        <textarea 
          id="psbt-input"
          rows="6"
          class="w-full px-4 py-3 md:px-6 md:py-4 lg:px-6 lg:py-5
                 bg-white/50 backdrop-blur-xl border border-white/40
                 rounded-xl md:rounded-2xl text-slate-700 placeholder-slate-400
                 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-300
                 transition-all duration-300 hover:bg-white/60
                 text-sm md:text-base font-mono resize-y"
          placeholder="Enter PSBT in Base64 format..."
          data-i18n-placeholder="psbtPlaceholder">
        </textarea>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-4 md:gap-6 pt-4 md:pt-6">
        <button 
          id="parse-psbt-btn"
          class="gradient-button-primary flex-1"
          data-i18n="parseBtn">
          🔍 Parse PSBT
        </button>
        <button 
          id="clear-psbt-btn"
          class="gradient-button-secondary"
          data-i18n="clearBtn">
          🗑️ Clear
        </button>
      </div>

      <!-- PSBT Analysis -->
      <div id="psbt-analysis" class="hidden mt-6 md:mt-8 p-4 md:p-6 glass-card rounded-xl md:rounded-2xl
                                     bg-gradient-to-r from-emerald-50/50 to-teal-50/50 backdrop-blur-xl 
                                     border border-emerald-200/40 ring-1 ring-emerald-100/30 ring-inset">
        <h3 class="text-lg md:text-xl font-semibold text-emerald-900 mb-4 md:mb-6" data-i18n="analysisTitle">
          ✅ PSBT Analysis
        </h3>
        <div id="psbt-details" class="space-y-3 text-sm md:text-base text-emerald-800">
          <!-- PSBT details will be inserted here -->
        </div>
        <div class="mt-6 md:mt-8">
          <button 
            id="proceed-to-bbqr-btn"
            class="gradient-button-success"
            data-i18n="proceedBtn">
            ➡️ Generate BBQr Codes
          </button>
        </div>
      </div>

      <!-- Error Display -->
      <div id="psbt-error" class="hidden mt-6 md:mt-8 p-4 md:p-6 glass-card rounded-xl md:rounded-2xl
                                  bg-gradient-to-r from-red-50/50 to-rose-50/50 backdrop-blur-xl 
                                  border border-red-200/40 ring-1 ring-red-100/30 ring-inset">
        <div class="flex items-center">
          <div class="text-red-400 mr-3 text-xl">⚠️</div>
          <div class="text-red-800 font-semibold text-base md:text-lg" data-i18n="errorTitle">PSBT Parse Error</div>
        </div>
        <div id="psbt-error-message" class="text-red-700 text-sm md:text-base mt-2 md:mt-3"></div>
      </div>
    </div>
  `;
}

function setupStep1Events() {
  const psbtFile = document.getElementById('psbt-file');
  const psbtInput = document.getElementById('psbt-input');
  const parsePsbtBtn = document.getElementById('parse-psbt-btn');
  const clearPsbtBtn = document.getElementById('clear-psbt-btn');
  const proceedToBbqrBtn = document.getElementById('proceed-to-bbqr-btn');

  // File upload
  psbtFile?.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      psbtInput.value = e.target.result.trim();
    };
    reader.readAsText(file);
  });

  // Parse PSBT
  parsePsbtBtn?.addEventListener('click', () => {
    const psbtData = psbtInput.value.trim();
    if (!psbtData) {
      showError('请输入 PSBT 数据');
      return;
    }

    try {
      const analysis = decodePSBT(psbtData);
      state.psbtData = psbtData;
      displayPSBTAnalysis(analysis);
    } catch (error) {
      showError(error.message);
    }
  });

  // Clear
  clearPsbtBtn?.addEventListener('click', () => {
    psbtInput.value = '';
    psbtFile.value = '';
    document.getElementById('psbt-analysis')?.classList.add('hidden');
    document.getElementById('psbt-error')?.classList.add('hidden');
    state.psbtData = null;
  });

  // Proceed to BBQr
  proceedToBbqrBtn?.addEventListener('click', () => {
    console.log('🖱️ Generate BBQr Codes button clicked');
    console.log('🔍 Current state.psbtData:', state.psbtData ? `exists (${state.psbtData.length} chars)` : 'null');
    goToStep(2);
    // Generate BBQr codes after switching to step 2
    setTimeout(() => {
      generateBBQrCodes();
    }, 100);
  });
}

// Step 2: Generate BBQr
function renderStep2() {
  return `
    <div class="glass-card rounded-2xl md:rounded-3xl 
                p-6 md:p-8 lg:p-10 transition-all duration-300 ease-out
                shadow-xl shadow-slate-300/25 hover:shadow-2xl hover:shadow-slate-400/40
                bg-white/20 backdrop-blur-xl border border-white/30 hover:border-white/50
                ring-1 ring-white/20 hover:ring-white/35 ring-inset
                animate-fadeInUp"
         style="animation-delay: 0.3s;">
      
      <h2 class="text-2xl md:text-3xl font-bold text-slate-700 tracking-tight mb-4 md:mb-6" data-i18n="bbqrTitle">
        🔥 Generate BBQr for ColdCard
      </h2>
      <p class="text-slate-500 text-sm md:text-base leading-relaxed mb-6 md:mb-8" data-i18n="bbqrDesc">
        Scan these QR codes with your ColdCard to sign the transaction
      </p>
      
      <div id="bbqr-output" class="text-center mb-8 md:mb-12">
        <!-- BBQr codes will be generated here -->
      </div>

      <div class="flex flex-col sm:flex-row gap-4 md:gap-6">
        <button 
          id="back-to-step1-btn"
          class="gradient-button-secondary"
          data-i18n="backBtn">
          ← Back
        </button>
        <button 
          id="proceed-to-scan-btn"
          class="gradient-button-primary flex-1"
          data-i18n="proceedScanBtn">
          ➡️ Scan Signed PSBT
        </button>
      </div>
    </div>
  `;
}

function setupStep2Events() {
  console.log('🔧 Setting up Step 2 events...');
  
  const backToStep1Btn = document.getElementById('back-to-step1-btn');
  const proceedToScanBtn = document.getElementById('proceed-to-scan-btn');

  console.log('🔍 Step 2 buttons check:');
  console.log('backToStep1Btn:', backToStep1Btn ? 'found' : 'NOT FOUND');
  console.log('proceedToScanBtn:', proceedToScanBtn ? 'found' : 'NOT FOUND');

  backToStep1Btn?.addEventListener('click', () => {
    console.log('🖱️ Back to Step 1 clicked');
    goToStep(1);
  });
  proceedToScanBtn?.addEventListener('click', () => {
    console.log('🖱️ Proceed to Scan clicked');
    goToStep(3);
  });
  
  console.log('✅ Step 2 events setup completed');
}

// Generate BBQr codes
function generateBBQrCodes() {
  console.log('🚀 generateBBQrCodes() called');
  
  // Clear any existing auto play and cache
  stopAutoPlay();
  clearQRCache();
  
  if (!state.psbtData) {
    console.log('❌ No PSBT data in state');
    return;
  }
  console.log('✅ PSBT data exists, length:', state.psbtData.length);

  try {
    console.log('🔄 Converting PSBT to binary...');
    // Convert PSBT to binary format for BBQr
    const psbtBinary = Uint8Array.from(atob(state.psbtData), c => c.charCodeAt(0));
    console.log('📦 PSBT binary length:', psbtBinary.length, 'bytes');
    
    console.log('🔄 Calling splitQRs...');
    console.log('splitQRs function type:', typeof splitQRs);
    
    // Split into BBQr parts
    const result = splitQRs(psbtBinary, 'P', {
      maxSplit: 50,
      minSplit: 3,
      maxBytes: 1000
    });

    console.log('✅ splitQRs returned:', typeof result);
    console.log('📊 Result keys:', Object.keys(result));
    console.log('📊 Result structure:', result);
    
    // Extract parts from the result object
    const parts = result.parts || result;
    console.log('📊 Parts type:', typeof parts);
    console.log('📊 Parts is array:', Array.isArray(parts));
    console.log('📊 Parts count:', parts ? parts.length : 'undefined');
    
    if (parts && Array.isArray(parts)) {
      parts.forEach((part, index) => {
        console.log(`📄 Part ${index + 1}: length=${part.length}, preview="${part.substring(0, 20)}..."`);
      });
    } else {
      console.log('❌ Parts is not an array, trying to handle as object...');
      if (typeof parts === 'object' && parts !== null) {
        console.log('📊 Parts object keys:', Object.keys(parts));
      }
    }

    const output = document.getElementById('bbqr-output');
    console.log('🖼️ BBQr output element:', output ? 'found' : 'NOT FOUND');
    if (!output) return;

    console.log('🎨 Creating HTML structure...');
    output.innerHTML = `
      <div class="mb-6">
        <h3 class="text-lg font-semibold mb-2">BBQr Codes (${parts.length} parts)</h3>
        <p class="text-sm text-slate-600 mb-4">Auto-playing at 1 second intervals - scan with your ColdCard</p>
      </div>
      
      <!-- QR Code Display Area -->
      <div class="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
        <div class="text-center mb-4">
          <div id="qr-counter" class="text-lg font-semibold text-slate-700">
            Part <span id="current-part">1</span> of ${parts.length}
          </div>
        </div>
        
        <!-- Single QR Code Container -->
        <div class="flex justify-center mb-4">
          <canvas id="current-qr" class="border border-gray-200 rounded"></canvas>
        </div>
        
        <!-- Progress Indicator -->
        <div class="flex justify-center space-x-2">
          ${parts.map((_, index) => `
            <div 
              id="dot-${index}" 
              class="w-3 h-3 rounded-full transition-all duration-200 ${index === 0 ? 'bg-purple-600' : 'bg-slate-300'}">
            </div>
          `).join('')}
        </div>
      </div>
      
      <!-- Auto-play Status -->
      <div class="text-center mt-4">
        <div class="text-sm text-slate-600">
          🔄 Auto-playing every 1 second
        </div>
      </div>
    `;
    console.log('✅ HTML structure created');

    // Initialize QR navigation
    console.log('⏰ Setting timeout for QR navigation setup...');
    setTimeout(() => {
      console.log('🎨 Setting up QR navigation...');
      setupQRNavigation(parts);
      
      // Show first QR code and start auto-play
      showQRPart(0);
      startAutoPlay(parts);
    }, 100);

    state.bbqrCodes = parts;
    console.log('✅ BBQr codes saved to state');
    
  } catch (error) {
    console.error('💥 BBQr generation error:', error);
    console.error('💥 Error stack:', error.stack);
    showError('BBQr 生成失败: ' + error.message);
  }
}

// QR Navigation functions
let currentQRIndex = 0;
let autoPlayInterval = null;
let qrCache = []; // Cache for generated QR code canvases

function setupQRNavigation(parts) {
  console.log('🔧 Setting up QR navigation for', parts.length, 'parts');
  
  // Pre-generate and cache all QR codes
  qrCache = [];
  console.log('🎨 Pre-generating all QR codes for caching...');
  
  for (let i = 0; i < parts.length; i++) {
    try {
      console.log(`🎨 Generating QR ${i + 1}/${parts.length}...`);
      
      // Create a temporary canvas for this QR code
      const tempCanvas = document.createElement('canvas');
      const qr = new QRious({
        element: tempCanvas,
        value: parts[i],
        size: 250,
        level: 'M'
      });
      
      // Store the canvas data URL for fast display
      qrCache[i] = tempCanvas.toDataURL();
      console.log(`✅ QR ${i + 1} cached successfully`);
      
    } catch (qrError) {
      console.error(`💥 QR ${i + 1} generation error:`, qrError);
      
      // Create error canvas
      const errorCanvas = document.createElement('canvas');
      errorCanvas.width = 250;
      errorCanvas.height = 250;
      const ctx = errorCanvas.getContext('2d');
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(0, 0, 250, 250);
      ctx.fillStyle = '#fff';
      ctx.font = '16px Arial';
      ctx.fillText(`QR Error ${i + 1}`, 10, 30);
      ctx.fillText(qrError.message.substring(0, 20), 10, 60);
      
      qrCache[i] = errorCanvas.toDataURL();
    }
  }
  
  console.log(`✅ All ${parts.length} QR codes cached successfully`);
}

function showQRPart(index) {
  console.log(`🎯 Showing cached QR part ${index + 1}`);
  
  if (!state.bbqrCodes || index < 0 || index >= state.bbqrCodes.length || !qrCache[index]) {
    console.log('❌ Invalid QR index, no codes available, or cache miss');
    return;
  }
  
  currentQRIndex = index;
  
  // Update counter
  const currentPartSpan = document.getElementById('current-part');
  if (currentPartSpan) {
    currentPartSpan.textContent = index + 1;
  }
  
  // Update dots
  for (let i = 0; i < state.bbqrCodes.length; i++) {
    const dot = document.getElementById(`dot-${i}`);
    if (dot) {
      dot.className = `w-3 h-3 rounded-full transition-all duration-200 ${
        i === index ? 'bg-purple-600' : 'bg-slate-300'
      }`;
    }
  }
  
  // Display cached QR code
  const canvas = document.getElementById('current-qr');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
      canvas.width = 250;
      canvas.height = 250;
      ctx.clearRect(0, 0, 250, 250);
      ctx.drawImage(img, 0, 0);
      console.log(`✅ Cached QR ${index + 1} displayed`);
    };
    
    img.src = qrCache[index];
  } else {
    console.log('❌ Current QR canvas not found');
  }
}

function startAutoPlay(parts) {
  // Clear any existing auto play
  if (autoPlayInterval) {
    clearInterval(autoPlayInterval);
  }
  
  // Start auto play with 1 second interval
  autoPlayInterval = setInterval(() => {
    const nextIndex = (currentQRIndex + 1) % parts.length;
    showQRPart(nextIndex);
  }, 1000);
  
  console.log('▶️ Auto play started (1s interval)');
}

function stopAutoPlay() {
  if (autoPlayInterval) {
    clearInterval(autoPlayInterval);
    autoPlayInterval = null;
    console.log('⏹️ Auto play stopped');
  }
}

function clearQRCache() {
  qrCache = [];
  console.log('🗑️ QR cache cleared');
}

// Make showQRPart globally available for onclick handlers
window.showQRPart = showQRPart;

// Helper functions
function displayPSBTAnalysis(analysis) {
  const analysisDiv = document.getElementById('psbt-analysis');
  const detailsDiv = document.getElementById('psbt-details');
  const errorDiv = document.getElementById('psbt-error');

  if (!analysisDiv || !detailsDiv) return;

  errorDiv?.classList.add('hidden');
  analysisDiv.classList.remove('hidden');

  detailsDiv.innerHTML = `
    <div>
      <strong>Signature Status:</strong> 
      <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        analysis.signatureStatus === 'Fully Signed' ? 'bg-emerald-100 text-emerald-800' :
        analysis.signatureStatus === 'Partially Signed' ? 'bg-orange-100 text-orange-800' :
        'bg-yellow-100 text-yellow-800'
      }">
        ${analysis.signatureStatus}
      </span>
    </div>
    <div><strong>Transaction Fee:</strong> ${formatBitcoinAmount(analysis.fee)}</div>
    <div><strong>Outputs:</strong> ${analysis.outputs.length}</div>
    ${analysis.outputs.map((output, index) => `
      <div class="ml-4 p-2 bg-white rounded border">
                    <div class="text-xs text-slate-600">Output ${index + 1}:</div>
        <div class="font-mono text-xs">${output.address}</div>
        <div class="text-sm font-medium">${formatBitcoinAmount(output.amount)}</div>
      </div>
    `).join('')}
  `;
}

function showError(message) {
  const errorDiv = document.getElementById('psbt-error');
  const errorMessage = document.getElementById('psbt-error-message');
  const analysisDiv = document.getElementById('psbt-analysis');

  if (errorDiv && errorMessage) {
    analysisDiv?.classList.add('hidden');
    errorDiv.classList.remove('hidden');
    errorMessage.textContent = message;
  }
}

// Step 3: Scan Signed PSBT
function renderStep3() {
  return `
    <div class="glass-card rounded-2xl md:rounded-3xl 
                p-6 md:p-8 lg:p-10 transition-all duration-300 ease-out
                shadow-xl shadow-slate-300/25 hover:shadow-2xl hover:shadow-slate-400/40
                bg-white/20 backdrop-blur-xl border border-white/30 hover:border-white/50
                ring-1 ring-white/20 hover:ring-white/35 ring-inset
                animate-fadeInUp"
         style="animation-delay: 0.3s;">
      
      <h2 class="text-2xl md:text-3xl font-bold text-slate-700 tracking-tight mb-4 md:mb-6" data-i18n="scanTitle">
        📷 Scan Signed PSBT
      </h2>
      <p class="text-slate-500 text-sm md:text-base leading-relaxed mb-6 md:mb-8" data-i18n="scanDesc">
        After signing with ColdCard, scan the signed PSBT BBQr codes
      </p>

      <!-- Camera Controls -->
      <div class="text-center mb-6 md:mb-8">
        <button 
          id="start-scan-btn"
          class="gradient-button-primary"
          data-i18n="startScanBtn">
          📷 Start Camera Scan
        </button>
      </div>

      <!-- Camera Container -->
      <div id="camera-container" class="relative hidden rounded-xl md:rounded-2xl overflow-hidden glass-card
                                         bg-black/20 backdrop-blur-xl border border-white/30
                                         ring-1 ring-white/20 ring-inset shadow-xl shadow-slate-300/25" 
           style="height: 60vh; min-height: 400px;">
        <video 
          id="camera-video" 
          autoplay 
          playsinline 
          webkit-playsinline 
          muted
          class="w-full h-full object-cover bg-black rounded-xl md:rounded-2xl">
        </video>
        
        <!-- Camera Overlay -->
        <div class="absolute inset-0 pointer-events-none">
          <!-- Viewfinder -->
          <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-80 md:h-80">
            <div class="w-full h-full border-4 border-white/90 rounded-3xl shadow-2xl backdrop-blur-sm"></div>
            <div class="absolute -top-2 -left-2 w-10 h-10 border-l-4 border-t-4 border-purple-400 rounded-tl-lg shadow-lg"></div>
            <div class="absolute -top-2 -right-2 w-10 h-10 border-r-4 border-t-4 border-purple-400 rounded-tr-lg shadow-lg"></div>
            <div class="absolute -bottom-2 -left-2 w-10 h-10 border-l-4 border-b-4 border-purple-400 rounded-bl-lg shadow-lg"></div>
            <div class="absolute -bottom-2 -right-2 w-10 h-10 border-r-4 border-b-4 border-purple-400 rounded-br-lg shadow-lg"></div>
          </div>
          
          <!-- Stop Button -->
          <button 
            id="stop-scan-btn"
            class="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 
                   text-white w-10 h-10 md:w-12 md:h-12 rounded-full text-lg font-bold 
                   transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 hidden z-20 
                   flex items-center justify-center backdrop-blur-xl border border-white/20"
            title="Stop Scanning">
            ✕
          </button>
          
          <!-- Status -->
          <div id="scan-status" class="absolute top-6 left-1/2 transform -translate-x-1/2 
                                      glass-card bg-black/80 text-white px-4 py-2 md:px-6 md:py-3 
                                      rounded-xl md:rounded-2xl text-center font-medium backdrop-blur-xl 
                                      shadow-xl border border-white/20 max-w-xs text-xs md:text-sm z-10">
            Ready to scan...
          </div>
        </div>
      </div>

      <!-- Canvas for scanning -->
      <canvas id="camera-canvas" class="hidden"></canvas>

      <!-- Scan Results -->
      <div id="scan-results" class="hidden mt-6 md:mt-8 p-4 md:p-6 glass-card rounded-xl md:rounded-2xl
                                   bg-gradient-to-r from-emerald-50/50 to-teal-50/50 backdrop-blur-xl 
                                   border border-emerald-200/40 ring-1 ring-emerald-100/30 ring-inset">
        <h3 class="text-lg md:text-xl font-semibold text-emerald-900 mb-4 md:mb-6" data-i18n="scanResultTitle">
          ✅ Signed PSBT Received!
        </h3>
        <div class="text-sm md:text-base text-emerald-800 mb-4 md:mb-6" data-i18n="scanResultDesc">
          Successfully scanned signed PSBT. Ready to finalize and broadcast.
        </div>
        <textarea id="signed-psbt-data" readonly 
                  class="w-full h-32 md:h-40 px-4 py-3 md:px-6 md:py-4 
                         bg-white/50 backdrop-blur-xl border border-emerald-200/40
                         rounded-xl md:rounded-2xl font-mono text-xs md:text-sm 
                         resize-none mb-4 md:mb-6 text-slate-700"></textarea>
        
        <div class="flex flex-col sm:flex-row gap-4 md:gap-6">
          <button 
            id="proceed-to-finalize-btn"
            class="gradient-button-success flex-1"
            data-i18n="proceedFinalizeBtn">
            ➡️ Finalize & Broadcast
          </button>
        </div>
      </div>

      <!-- Navigation -->
      <div class="flex flex-col sm:flex-row gap-4 md:gap-6 mt-6 md:mt-8">
        <button 
          id="back-to-step2-btn"
          class="gradient-button-secondary"
          data-i18n="backBtn">
          ← Back
        </button>
      </div>
    </div>
  `;
}

function setupStep3Events() {
  const startScanBtn = document.getElementById('start-scan-btn');
  const stopScanBtn = document.getElementById('stop-scan-btn');
  const backToStep2Btn = document.getElementById('back-to-step2-btn');
  const proceedToFinalizeBtn = document.getElementById('proceed-to-finalize-btn');

  startScanBtn?.addEventListener('click', startCameraScan);
  stopScanBtn?.addEventListener('click', stopCameraScan);
  backToStep2Btn?.addEventListener('click', () => goToStep(2));
  proceedToFinalizeBtn?.addEventListener('click', () => goToStep(4));
}

// Step 4: Finalize & Broadcast
function renderStep4() {
  return `
    <div class="glass-card rounded-2xl md:rounded-3xl 
                p-6 md:p-8 lg:p-10 transition-all duration-300 ease-out
                shadow-xl shadow-slate-300/25 hover:shadow-2xl hover:shadow-slate-400/40
                bg-white/20 backdrop-blur-xl border border-white/30 hover:border-white/50
                ring-1 ring-white/20 hover:ring-white/35 ring-inset
                animate-fadeInUp"
         style="animation-delay: 0.3s;">
      
      <h2 class="text-2xl md:text-3xl font-bold text-slate-700 tracking-tight mb-6 md:mb-8" data-i18n="finalizeTitle">
        📡 Finalize & Broadcast Transaction
      </h2>
      
      <!-- Transaction Summary -->
      <div id="tx-summary" class="mb-6 md:mb-8 p-4 md:p-6 glass-card rounded-xl md:rounded-2xl
                                  bg-gradient-to-r from-blue-50/50 to-indigo-50/50 backdrop-blur-xl 
                                  border border-blue-200/40 ring-1 ring-blue-100/30 ring-inset">
        <h3 class="text-lg md:text-xl font-semibold text-blue-900 mb-4 md:mb-6" data-i18n="txSummaryTitle">
          📊 Transaction Summary
        </h3>
        <div id="tx-summary-details" class="space-y-3 md:space-y-4 text-sm md:text-base text-blue-800">
          <!-- Transaction summary will be inserted here -->
        </div>
      </div>

      <!-- Finalize Button -->
      <div class="mb-6 md:mb-8">
        <button 
          id="finalize-tx-btn"
          class="gradient-button-primary"
          data-i18n="finalizeBtn">
          🔨 Finalize Transaction
        </button>
      </div>

      <!-- Finalized Transaction -->
      <div id="finalized-tx" class="hidden">
        <div class="mb-6 md:mb-8 p-4 md:p-6 glass-card rounded-xl md:rounded-2xl
                    bg-gradient-to-r from-emerald-50/50 to-teal-50/50 backdrop-blur-xl 
                    border border-emerald-200/40 ring-1 ring-emerald-100/30 ring-inset">
          <h3 class="text-lg md:text-xl font-semibold text-emerald-900 mb-4 md:mb-6" data-i18n="finalizedTitle">
            ✅ Transaction Ready
          </h3>
          
          <!-- TXID -->
          <div class="mb-4 md:mb-6">
            <label class="block text-sm md:text-base font-semibold text-emerald-800 mb-2 md:mb-3" data-i18n="txidLabel">
              Transaction ID
            </label>
            <div class="bg-white/50 backdrop-blur-xl border border-emerald-200/40 rounded-xl md:rounded-2xl p-3 md:p-4">
              <div id="final-txid" class="font-mono text-sm md:text-base text-slate-700 break-all"></div>
            </div>
          </div>
          
          <!-- Raw Hex -->
          <div class="mb-6 md:mb-8">
            <label class="block text-sm md:text-base font-semibold text-emerald-800 mb-2 md:mb-3" data-i18n="rawHexLabel">
              Raw Transaction
            </label>
            <textarea id="final-hex" readonly 
                      class="w-full h-32 md:h-40 px-4 py-3 md:px-6 md:py-4 
                             bg-white/50 backdrop-blur-xl border border-emerald-200/40
                             rounded-xl md:rounded-2xl font-mono text-xs md:text-sm 
                             resize-none text-slate-700"></textarea>
          </div>
          
          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row gap-4 md:gap-6">
            <button 
              id="copy-txid-btn"
              class="gradient-button-primary"
              data-i18n="copyTxidBtn">
              📋 Copy TXID
            </button>
            <button 
              id="copy-hex-btn"
              class="gradient-button-secondary"
              data-i18n="copyHexBtn">
              📋 Copy Hex
            </button>
            <button 
              id="broadcast-tx-btn"
              class="gradient-button-success flex-1"
              data-i18n="broadcastBtn">
              📡 Broadcast Transaction
            </button>
          </div>
        </div>

        <!-- Broadcast Status -->
        <div id="broadcast-status" class="hidden mt-6 md:mt-8">
          <!-- Broadcast status will appear here -->
        </div>
      </div>

      <!-- Navigation -->
      <div class="flex flex-col sm:flex-row gap-4 md:gap-6 mt-6 md:mt-8">
        <button 
          id="back-to-step3-btn"
          class="gradient-button-secondary"
          data-i18n="backBtn">
          ← Back
        </button>
        <button 
          id="restart-workflow-btn"
          class="gradient-button-secondary"
          data-i18n="restartBtn">
          🔄 Start New Transaction
        </button>
      </div>
    </div>
  `;
}

function setupStep4Events() {
  const finalizeTxBtn = document.getElementById('finalize-tx-btn');
  const copyTxidBtn = document.getElementById('copy-txid-btn');
  const copyHexBtn = document.getElementById('copy-hex-btn');
  const broadcastTxBtn = document.getElementById('broadcast-tx-btn');
  const backToStep3Btn = document.getElementById('back-to-step3-btn');
  const restartWorkflowBtn = document.getElementById('restart-workflow-btn');

  finalizeTxBtn?.addEventListener('click', finalizeTransaction);
  copyTxidBtn?.addEventListener('click', () => copyToClipboard(document.getElementById('final-txid').textContent));
  copyHexBtn?.addEventListener('click', () => copyToClipboard(document.getElementById('final-hex').value));
  broadcastTxBtn?.addEventListener('click', broadcastTransaction);
  backToStep3Btn?.addEventListener('click', () => goToStep(3));
  restartWorkflowBtn?.addEventListener('click', () => {
    // Reset state
    state.psbtData = null;
    state.signedPsbtData = null;
    state.finalizedTx = null;
    state.bbqrCodes = [];
    goToStep(1);
  });
}

// Camera scanning functions
async function startCameraScan() {
  const video = document.getElementById('camera-video');
  const canvas = document.getElementById('camera-canvas');
  const cameraContainer = document.getElementById('camera-container');
  const startBtn = document.getElementById('start-scan-btn');
  const stopBtn = document.getElementById('stop-scan-btn');
  const scanStatus = document.getElementById('scan-status');

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'environment' } 
    });
    
    state.camera.stream = stream;
    state.camera.isScanning = true;
    state.camera.parts = [];
    
    video.srcObject = stream;
    cameraContainer.classList.remove('hidden');
    startBtn.classList.add('hidden');
    stopBtn.classList.remove('hidden');
    
    canvas.width = 640;
    canvas.height = 480;
    
    scanLoop();
  } catch (error) {
    console.error('Camera error:', error);
    alert('Camera access failed: ' + error.message);
  }
}

function stopCameraScan() {
  const cameraContainer = document.getElementById('camera-container');
  const startBtn = document.getElementById('start-scan-btn');
  const stopBtn = document.getElementById('stop-scan-btn');

  if (state.camera.stream) {
    state.camera.stream.getTracks().forEach(track => track.stop());
    state.camera.stream = null;
  }
  
  state.camera.isScanning = false;
  cameraContainer.classList.add('hidden');
  startBtn.classList.remove('hidden');
  stopBtn.classList.add('hidden');
}

function scanLoop() {
  if (!state.camera.isScanning) return;

  const video = document.getElementById('camera-video');
  const canvas = document.getElementById('camera-canvas');
  const ctx = canvas.getContext('2d');
  const scanStatus = document.getElementById('scan-status');

  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, canvas.width, canvas.height);

    if (code?.data && !state.camera.parts.includes(code.data)) {
      state.camera.parts.push(code.data);
      
      // Try to get total parts from BBQr format
      let totalParts = '?';
      try {
        // BBQr format: B$HP[total][current][data]
        // Try to parse the BBQr header from the scanned data
        const qrData = code.data;
        
        // BBQr format starts with "B$" followed by encoding and file type
        // Format: B$HP[total-base36][current-base36][data]
        if (qrData.startsWith('B$') && qrData.length >= 8) {
          const header = qrData.substring(0, 8);
          console.log(`📊 BBQr header: ${header}`);
          
          // Extract total parts (positions 4-5, base 36)
          const totalStr = header.substring(4, 6);
          const totalBase36 = parseInt(totalStr, 36);
          
          if (!isNaN(totalBase36) && totalBase36 > 0) {
            totalParts = totalBase36;
            console.log(`📊 BBQr total parts detected from header: ${totalParts}`);
          }
        }
        
        // If we couldn't parse from BBQr header, try other detection methods
        if (totalParts === '?') {
          // Try to use detectFileType to get more info
          try {
            const fileInfo = detectFileType(qrData);
            console.log('📊 BBQr file info:', fileInfo);
          } catch (e) {
            console.log('📊 Could not detect BBQr file type');
          }
          
          // Fallback: try to join and see if we get an error with expected count
          try {
            const result = joinQRs(state.camera.parts);
            totalParts = state.camera.parts.length; // If successful, we have all parts
          } catch (error) {
            // Parse error message for expected count
            const errorMsg = error.message.toLowerCase();
            const match = errorMsg.match(/expected (\d+)/);
            if (match) {
              totalParts = parseInt(match[1]);
              console.log(`📊 Total parts from error: ${totalParts}`);
            } else {
              totalParts = `${state.camera.parts.length}+`;
            }
          }
        }
      } catch (error) {
        console.log('📊 Error parsing BBQr format:', error);
        totalParts = `${state.camera.parts.length}+`;
      }
      
      scanStatus.textContent = `${state.camera.parts.length}/${totalParts} 已扫描`;

      // Try to join the parts
      try {
        const { raw, fileType } = joinQRs(state.camera.parts);
        
        if (fileType === 'P') {
          // Successfully joined PSBT
          const base64 = btoa(String.fromCharCode.apply(null, new Uint8Array(raw)));
          state.signedPsbtData = base64;
          
          // Update final status
          scanStatus.textContent = `${state.camera.parts.length}/${state.camera.parts.length} 扫描完成`;
          
          stopCameraScan();
          showScanResults(base64);
          return;
        }
      } catch (error) {
        // Not enough parts yet, continue scanning
        console.log('Still need more parts:', error.message);
      }
    }
  }

  requestAnimationFrame(scanLoop);
}

function showScanResults(signedPsbt) {
  const scanResults = document.getElementById('scan-results');
  const signedPsbtData = document.getElementById('signed-psbt-data');

  if (scanResults && signedPsbtData) {
    signedPsbtData.value = signedPsbt;
    scanResults.classList.remove('hidden');
  }
}

// Transaction functions
function finalizeTransaction() {
  if (!state.signedPsbtData) {
    alert('No signed PSBT data available');
    return;
  }

  try {
    const result = finalizePSBT(state.signedPsbtData);
    
    if (result.success) {
      state.finalizedTx = result;
      
      document.getElementById('final-txid').textContent = result.txid;
      document.getElementById('final-hex').value = result.hex;
      document.getElementById('finalized-tx').classList.remove('hidden');
      
      // Show transaction summary
      showTransactionSummary();
    } else {
      alert('Finalization failed: ' + result.error);
    }
  } catch (error) {
    alert('Finalization error: ' + error.message);
  }
}

function showTransactionSummary() {
  console.log('🔍 showTransactionSummary called');
  console.log('📊 state.signedPsbtData exists:', !!state.signedPsbtData);
  
  if (!state.signedPsbtData) {
    console.log('❌ No signed PSBT data available');
    const summaryDetails = document.getElementById('tx-summary-details');
    if (summaryDetails) {
      summaryDetails.innerHTML = `
        <div class="text-orange-600">
          <strong>⚠️ No signed PSBT data available</strong>
          <div class="text-sm mt-2">Please scan a signed PSBT first.</div>
        </div>
      `;
    }
    return;
  }

  try {
    console.log('🔄 Decoding PSBT...');
    const analysis = decodePSBT(state.signedPsbtData);
    console.log('✅ PSBT analysis:', analysis);
    
    const summaryDetails = document.getElementById('tx-summary-details');
    console.log('🖼️ Summary details element:', summaryDetails ? 'found' : 'NOT FOUND');
    
    if (summaryDetails) {
      // Determine signature status and readiness
      const isFullySigned = analysis.signatureStatus === 'Fully Signed';
      const isPartiallySigned = analysis.signatureStatus === 'Partially Signed';
      const canFinalize = isFullySigned;
      
      // Get status color and message
      let statusColor = 'text-red-600';
      let statusMessage = 'Not signed - cannot finalize';
      if (isFullySigned) {
        statusColor = 'text-emerald-600';
        statusMessage = 'Fully signed - ready to finalize';
      } else if (isPartiallySigned) {
        statusColor = 'text-orange-600';
        statusMessage = 'Partially signed - needs more signatures';
      }
      
      summaryDetails.innerHTML = `
        <div class="mb-4 p-3 rounded-lg ${canFinalize ? 'bg-emerald-50 border border-emerald-200' : 'bg-orange-50 border border-orange-200'}">
          <div><strong>Signature Status:</strong> 
            <span class="${statusColor} font-medium">${analysis.signatureStatus}</span>
          </div>
          <div class="text-sm mt-1 ${statusColor}">${statusMessage}</div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div><strong>Transaction Fee:</strong> ${formatBitcoinAmount(analysis.fee)}</div>
          <div><strong>Total Outputs:</strong> ${analysis.outputs.length}</div>
          <div><strong>Input Count:</strong> ${analysis.inputs ? analysis.inputs.length : 'N/A'}</div>
          <div><strong>Can Finalize:</strong> 
            <span class="${canFinalize ? 'text-emerald-600' : 'text-red-600'} font-medium">
              ${canFinalize ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
        
        <div class="mb-3">
          <strong>Transaction Outputs:</strong>
        </div>
        ${analysis.outputs.map((output, index) => {
          // Determine payment type
          let paymentType = 'Unknown';
          let typeColor = 'text-slate-600';
          
          if (output.address) {
            if (output.address.startsWith('bc1q')) {
              paymentType = 'P2WPKH (Native SegWit)';
              typeColor = 'text-blue-600';
            } else if (output.address.startsWith('bc1p')) {
              paymentType = 'P2TR (Taproot)';
              typeColor = 'text-purple-600';
            } else if (output.address.startsWith('3')) {
              paymentType = 'P2SH (Script Hash)';
              typeColor = 'text-green-600';
            } else if (output.address.startsWith('1')) {
              paymentType = 'P2PKH (Legacy)';
              typeColor = 'text-orange-600';
            }
          }
          
          return `
            <div class="ml-4 p-3 bg-white rounded border mt-2">
              <div class="flex justify-between items-start mb-2">
                <div class="text-xs text-slate-600">Output ${index + 1}</div>
                <div class="text-xs ${typeColor} font-medium">${paymentType}</div>
              </div>
              <div class="font-mono text-xs break-all mb-2">${output.address}</div>
              <div class="text-sm font-medium text-slate-900">${formatBitcoinAmount(output.amount)}</div>
            </div>
          `;
        }).join('')}
      `;
      
      // Update finalize button state
      const finalizeBtn = document.getElementById('finalize-tx-btn');
      if (finalizeBtn) {
        finalizeBtn.disabled = !canFinalize;
        if (!canFinalize) {
          finalizeBtn.textContent = '🔒 Cannot Finalize (Needs Signatures)';
          finalizeBtn.className = 'gradient-button-secondary cursor-not-allowed opacity-60';
        } else {
          finalizeBtn.textContent = '🔨 Finalize Transaction';
          finalizeBtn.className = 'gradient-button-primary';
        }
      }
      
      console.log('✅ Transaction summary updated');
    }
  } catch (error) {
    console.error('💥 Error showing transaction summary:', error);
    const summaryDetails = document.getElementById('tx-summary-details');
    if (summaryDetails) {
      summaryDetails.innerHTML = `
        <div class="text-red-600">
          <strong>❌ Error analyzing transaction</strong>
          <div class="text-sm mt-2">${error.message}</div>
        </div>
      `;
    }
  }
}

async function broadcastTransaction() {
  if (!state.finalizedTx?.hex) {
    alert('No finalized transaction to broadcast');
    return;
  }

  const broadcastBtn = document.getElementById('broadcast-tx-btn');
  const broadcastStatus = document.getElementById('broadcast-status');
  
  // Confirm before broadcasting
  const confirmMsg = translations[currentLanguage].broadcastConfirm;
  if (!confirm(confirmMsg)) {
    return;
  }

  const originalText = broadcastBtn.textContent;
  broadcastBtn.textContent = translations[currentLanguage].broadcasting;
  broadcastBtn.disabled = true;

  try {
    const response = await fetch('https://mempool.space/api/tx', {
      method: 'POST',
      body: state.finalizedTx.hex
    });

    if (response.ok) {
      const txid = await response.text();
      showBroadcastStatus(`${translations[currentLanguage].broadcastSuccess}\nTXID: ${txid}`, true);
    } else {
      const errorText = await response.text();
      const friendlyError = parseErrorMessage(errorText);
      showBroadcastStatus(`${translations[currentLanguage].broadcastError}\n${friendlyError}`, false);
    }
  } catch (error) {
    showBroadcastStatus(`${translations[currentLanguage].broadcastError}\n${error.message}`, false);
  } finally {
    broadcastBtn.textContent = originalText;
    broadcastBtn.disabled = false;
  }
}

function showBroadcastStatus(message, isSuccess) {
  const statusDiv = document.getElementById('broadcast-status');
  if (!statusDiv) return;
  
  statusDiv.classList.remove('hidden');
  const statusClass = isSuccess ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800';
  statusDiv.innerHTML = `
    <div class="p-4 rounded-xl border ${statusClass}">
      <div class="font-medium whitespace-pre-line">${message}</div>
    </div>
  `;
}

function parseErrorMessage(errorText) {
  const errorTranslations = {
    'bad-txns-inputs-missingorspent': currentLanguage === 'en' ? 
      'Transaction inputs have already been spent or do not exist. This usually means the transaction was already broadcasted successfully.' :
      '交易输入已被花费或不存在。这通常意味着交易已经成功广播过了。',
    'txn-already-known': currentLanguage === 'en' ? 
      'Transaction is already known to the network.' :
      '网络已知此交易。',
    'Transaction already in block chain': currentLanguage === 'en' ?
      'Transaction has already been confirmed on the blockchain.' :
      '交易已在区块链上确认。'
  };

  for (const [key, translation] of Object.entries(errorTranslations)) {
    if (errorText.toLowerCase().includes(key.toLowerCase())) {
      return translation;
    }
  }

  return errorText;
}

// Utility functions
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    // Show visual feedback would be nice here
  } catch (error) {
    console.error('Copy failed:', error);
  }
}

// PSBT Processing Functions
function decodePSBT(psbtBase64) {
  try {
    // Decode base64 PSBT
    let psbtBuffer;
    try {
      psbtBuffer = Buffer.from(psbtBase64, 'base64');
    } catch (e) {
      // Try hex decoding if base64 fails
      try {
        psbtBuffer = Buffer.from(psbtBase64, 'hex');
      } catch (e2) {
        throw new Error('Invalid PSBT format: not valid base64 or hex encoding');
      }
    }

    // Check minimum PSBT size
    if (psbtBuffer.length < 10) {
      throw new Error('PSBT data too short to be valid');
    }

    // Parse PSBT
    const psbt = bitcoin.Psbt.fromBuffer(psbtBuffer);
    
    // Use PSBT's built-in properties instead of trying to access internal data
    const inputCount = psbt.inputCount;
    const txOutputs = psbt.txOutputs || [];
    const txInputs = psbt.txInputs || [];

    // Calculate total input amount and determine signature status
    let totalInputAmount = 0;
    let allInputsSigned = true;
    let anyInputSigned = false;
    
    const inputsInfo = [];
    
    // Process inputs using PSBT methods
    for (let i = 0; i < inputCount; i++) {
      try {
        // Get input data from PSBT
        const inputData = psbt.data.inputs[i] || {};
        const txInput = txInputs[i] || {};
        
        // Get input amount from witness UTXO or non-witness UTXO
        let inputAmount = 0;
        if (inputData.witnessUtxo && inputData.witnessUtxo.value !== undefined) {
          inputAmount = inputData.witnessUtxo.value;
        } else if (inputData.nonWitnessUtxo) {
          try {
            const prevTx = bitcoin.Transaction.fromBuffer(inputData.nonWitnessUtxo);
            if (prevTx.outs && prevTx.outs[txInput.vout] !== undefined) {
              inputAmount = prevTx.outs[txInput.vout].value;
            }
          } catch (error) {
            // Silently continue if unable to parse
          }
        }
        
        totalInputAmount += inputAmount;
        
        // Check signature status
        const hasSignature = inputData.partialSig && Object.keys(inputData.partialSig).length > 0;
        if (hasSignature) {
          anyInputSigned = true;
        } else {
          allInputsSigned = false;
        }
        
        inputsInfo.push({
          txid: txInput.hash ? Buffer.from(txInput.hash).reverse().toString('hex') : 'unknown',
          vout: txInput.vout !== undefined ? txInput.vout : 0,
          amount: inputAmount.toString()
        });
        
      } catch (error) {
        allInputsSigned = false;
      }
    }

    // Calculate total output amount and fee
    let totalOutputAmount = 0;
    const outputsInfo = [];
    
    for (let i = 0; i < txOutputs.length; i++) {
      try {
        const output = txOutputs[i];
        
        const outputValue = output.value || 0;
        totalOutputAmount += outputValue;
        
        // Try to decode address
        let address = 'Unknown';
        let outputType = 'Payment';
        
        if (output.script) {
          try {
            address = bitcoin.address.fromOutputScript(output.script, bitcoin.networks.bitcoin);
          } catch (e) {
            try {
              // Try testnet
              address = bitcoin.address.fromOutputScript(output.script, bitcoin.networks.testnet);
            } catch (e2) {
              try {
                // Try regtest
                address = bitcoin.address.fromOutputScript(output.script, bitcoin.networks.regtest);
              } catch (e3) {
                address = 'Unable to decode address';
              }
            }
          }
        } else {
          address = 'No script data';
        }
        
        // Simple heuristic to detect change outputs (this is not always accurate)
        // In a real implementation, you might need additional context
        if (i === txOutputs.length - 1 && txOutputs.length > 1) {
          outputType = 'Change';
        }
        
        outputsInfo.push({
          address: address,
          amount: outputValue.toString(),
          type: outputType
        });
        
      } catch (error) {
        // Silently continue if unable to process output
      }
    }

    const fee = totalInputAmount - totalOutputAmount;
    
    // Determine signature status
    let signatureStatus;
    if (allInputsSigned) {
      signatureStatus = 'Fully Signed';
    } else if (anyInputSigned) {
      signatureStatus = 'Partially Signed';
    } else {
      signatureStatus = 'Unsigned';
    }

    // Determine transaction type based on outputs
    let transactionType = 'Payment';
    if (txOutputs.length === 1) {
      transactionType = 'Single Output';
    } else if (txOutputs.length > 2) {
      transactionType = 'Multi-Output';
    }

    return {
      type: transactionType,
      isSigned: allInputsSigned,
      signatureStatus: signatureStatus,
      totalAmount: totalOutputAmount.toString(),
      totalInputAmount: totalInputAmount.toString(),
      fee: fee.toString(),
      outputs: outputsInfo,
      inputs: inputsInfo,
      version: psbt.version || 2,
      locktime: psbt.locktime || 0
    };

  } catch (error) {
    console.error('PSBT decode error:', error);
    throw new Error('Failed to decode PSBT: ' + error.message);
  }
}

// Format Bitcoin amount
function formatBitcoinAmount(satoshis) {
  const btc = parseInt(satoshis) / 100000000;
  return `${btc.toFixed(8)} BTC (${parseInt(satoshis).toLocaleString()} sats)`;
}

// Finalize PSBT and return transaction hex
function finalizePSBT(psbtBase64) {
  try {
    
    // Decode PSBT
    let psbtBuffer;
    try {
      psbtBuffer = Buffer.from(psbtBase64, 'base64');
    } catch (e) {
      try {
        psbtBuffer = Buffer.from(psbtBase64, 'hex');
      } catch (e2) {
        throw new Error('Invalid PSBT format: not valid base64 or hex encoding');
      }
    }

    // Parse PSBT
    const psbt = bitcoin.Psbt.fromBuffer(psbtBuffer);

    // Check if PSBT is ready to finalize
    let canFinalize = true;
    let missingSignatures = [];

    for (let i = 0; i < psbt.inputCount; i++) {
      const input = psbt.data.inputs[i] || {};
      const hasSignature = input.partialSig && Object.keys(input.partialSig).length > 0;
      
      if (!hasSignature) {
        canFinalize = false;
        missingSignatures.push(i);
      }
    }

    if (!canFinalize) {
      throw new Error(`Cannot finalize: missing signatures for inputs: ${missingSignatures.join(', ')}`);
    }

    // Finalize all inputs
    for (let i = 0; i < psbt.inputCount; i++) {
      try {
        psbt.finalizeInput(i);
      } catch (error) {
        throw new Error(`Failed to finalize input ${i}: ${error.message}`);
      }
    }

    // Extract the final transaction
    const finalTx = psbt.extractTransaction();

    // Convert to hex
    const txHex = finalTx.toHex();

    return {
      success: true,
      hex: txHex,
      size: Math.ceil(txHex.length / 2), // Size in bytes
      txid: finalTx.getId()
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Setup independent Quick Actions
function setupQuickActions() {
  const quickSkipToScanBtn = document.getElementById('quick-skip-to-scan-btn');
  
  quickSkipToScanBtn?.addEventListener('click', () => {
    console.log('🖱️ Quick Skip to Scan button clicked');
    goToStep(3);
  });
}

// Export for initialization
window.initBBQrHelper = initBBQrHelper;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (window.initBBQrHelper) {
    window.initBBQrHelper();
  }
}); 