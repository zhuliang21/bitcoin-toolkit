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
    progressTitle: 'Workflow Progress',
    progressStatus: 'Step 1 of 5',
    step1: 'Import PSBT',
    step2: 'Generate BBQr',
    step3: 'Import Signed',
    step4: 'Finalize',
    step5: 'Broadcast',
    importTitle: 'Import PSBT',
    fileLabel: 'Import Local PSBT File',
    uploadText: 'Click to import PSBT',
    supportedFormats: 'PSBT, TXT files supported',
    manualLabel: 'Or Paste PSBT (Base64)',
    psbtPlaceholder: 'Enter PSBT in Base64 format...',
    parseBtn: '🔍 Parse PSBT',
    clearBtn: '🗑️ Clear',
    analysisTitle: 'PSBT Analysis',
    proceedBtn: '➡️ Generate BBQr Codes',
    errorTitle: 'PSBT Parse Error',
    bbqrTitle: 'Generate BBQr for ColdCard',
    bbqrDesc: 'ColdCard Q compatible BBQr codes. Scan to sign on your device.',
    psbtSummaryTitle: 'PSBT Summary',
    bbqrCodesTitle: 'BBQr Codes',
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
    quickSkipBtn: '📷 Skip to Scan Signed',
    broadcastTitle: 'Broadcast Transaction',
    proceedBroadcastBtn: '➡️ Proceed to Broadcast',
    scanInstruction: 'Align QR code within the frame',
    scanTip: 'Supports multi-part BBQr auto-assembly'
  },
  zh: {
    title: 'BBQr 助手',
    subtitle: '完整的 PSBT 到 ColdCard 到广播工作流程',
    progressTitle: '工作流程进度',
    progressStatus: '第 1 步，共 5 步',
    step1: '导入 PSBT',
    step2: '生成 BBQr',
    step3: '导入签名',
    step4: '完成交易',
    step5: '广播',
    importTitle: '导入 PSBT',
    fileLabel: '导入本地 PSBT 文件',
    uploadText: '点击导入 PSBT',
    supportedFormats: '支持 PSBT, TXT 文件',
    manualLabel: '或粘贴 PSBT (Base64)',
    psbtPlaceholder: '输入 Base64 格式的 PSBT...',
    parseBtn: '🔍 解析 PSBT',
    clearBtn: '🗑️ 清除',
    analysisTitle: 'PSBT 分析',
    proceedBtn: '➡️ 生成 BBQr 码',
    errorTitle: 'PSBT 解析错误',
    bbqrTitle: '为 ColdCard 生成 BBQr',
    bbqrDesc: 'ColdCard Q 兼容的 BBQr 码。扫描后在设备上签名。',
    psbtSummaryTitle: 'PSBT 摘要',
    bbqrCodesTitle: 'BBQr 码',
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
    quickSkipBtn: '📷 跳过，直接扫描签名',
    broadcastTitle: '广播交易',
    proceedBroadcastBtn: '➡️ 进入广播',
    scanInstruction: '将QR码对准扫描框',
    scanTip: '支持多部分BBQr码自动拼接'
  }
};

let currentLanguage = localStorage.getItem('language') || 'en';

// Utility functions
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function setViewportHeight() {
  // Set CSS custom property for viewport height (mobile Safari fix)
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// Initialize BBQr Helper
function initBBQrHelper() {
  // Prevent double initialization
  if (window.bbqrHelperInitialized) {
    return;
  }
  window.bbqrHelperInitialized = true;
  
  console.log('BBQr Helper initializing...');
  
  // Set viewport height for mobile
  setViewportHeight();
  
  // Update viewport height on resize
  window.addEventListener('resize', setViewportHeight);
  
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
  
  // Cache DOM queries to reduce repeated searches
  const i18nElements = document.querySelectorAll('[data-i18n]');
  const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
  const toggleBtn = document.querySelector('.language-toggle');
  
  // Update text content
  i18nElements.forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (texts[key] && element.textContent !== texts[key]) {
      element.textContent = texts[key];
    }
  });

  // Update placeholders
  placeholderElements.forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    if (texts[key] && element.placeholder !== texts[key]) {
      element.placeholder = texts[key];
    }
  });

  // Update language toggle button
  if (toggleBtn) {
    const newText = currentLanguage === 'en' ? '中文' : 'ENG';
    if (toggleBtn.textContent !== newText) {
      toggleBtn.textContent = newText;
    }
  }

  // Update progress status text based on current step
  const progressStatus = document.querySelector('[data-i18n="progressStatus"]');
  if (progressStatus) {
    const currentStep = state.currentStep || 1;
    if (currentLanguage === 'zh') {
      progressStatus.textContent = `第 ${currentStep} 步，共 5 步`;
    } else {
      progressStatus.textContent = `Step ${currentStep} of 5`;
    }
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
  // Update progress bar
  const progressBar = document.getElementById('progress-bar');
  const progressStatus = document.querySelector('[data-i18n="progressStatus"]');
  
  if (progressBar) {
    const percentage = (step / 5) * 100;
    progressBar.style.width = `${percentage}%`;
    
    // Update progress bar class based on completion
    if (step === 5) {
      progressBar.className = 'progress-bar'; // Completed - green
    } else {
      progressBar.className = 'progress-bar active'; // Active - purple
    }
  }
  
  // Update status text
  if (progressStatus) {
    const texts = translations[currentLanguage];
    if (currentLanguage === 'zh') {
      progressStatus.textContent = `第 ${step} 步，共 5 步`;
    } else {
      progressStatus.textContent = `Step ${step} of 5`;
    }
  }
  
  // Update step dots
  for (let i = 1; i <= 5; i++) {
    const dot = document.getElementById(`step${i}-dot`);
    if (dot) {
      dot.className = 'step-dot';
      if (i < step) {
        dot.className += ' completed';
      } else if (i === step) {
        dot.className += ' active';
      }
    }
  }
  
  // Update document language for CSS selector
  document.documentElement.lang = currentLanguage;
}

function goToStep(step) {
  if (step < 1 || step > 5) return;
  
  state.currentStep = step;
  updateStepIndicator(step);
  renderStep(step);
}

function renderStep(step) {
  const container = document.getElementById('steps-container');
  
  // Prevent re-rendering the same step
  if (container.dataset.currentStep === step.toString()) {
    return;
  }
  
  // Use requestAnimationFrame to prevent flashing
  requestAnimationFrame(() => {
    container.dataset.currentStep = step.toString();
    
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
        break;
      case 5:
        container.innerHTML = renderStep5();
        setupStep5Events();
        // Show transaction summary when entering step 5
        setTimeout(() => {
          showTransactionSummary();
        }, 100);
        break;
    }
    
    updateTexts();
  });
}

// Step 1: Import PSBT
function renderStep1() {
  return `
    <!-- Quick Actions - Only Button -->
    <div style="text-align: center; margin-bottom: 40px;">
      <button id="quick-skip-to-scan-btn" class="gradient-button-primary" data-i18n="quickSkipBtn">📷 Skip to Scan Signed</button>
    </div>

    <!-- Import PSBT - Direct on Background -->
    <div style="max-width: 700px; margin: 0 auto;">
      
      <!-- File Upload and Manual Input Side by Side -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; align-items: start;">
        
        <!-- File Import Section -->
        <div style="text-align: center;">
          <label for="psbt-file" style="color: white; font-size: 16px; font-weight: 600; margin-bottom: 15px; display: block;" data-i18n="fileLabel">📁 Import PSBT File</label>
          <div style="display: flex; align-items: center; justify-content: center; width: 100%;">
            <label id="file-upload-area" for="psbt-file" style="display: flex; flex-direction: column; align-items: center; justify-content: center; 
                                          width: 160px; height: 160px; border: 2px dashed rgba(255, 255, 255, 0.4); 
                                          border-radius: 15px; cursor: pointer; background: rgba(255, 255, 255, 0.3); 
                                          transition: all 0.3s ease; backdrop-filter: blur(10px);"
                   onmouseover="this.style.background='rgba(255, 255, 255, 0.4)'; this.style.borderColor='rgba(255, 255, 255, 0.6)'"
                   onmouseout="this.style.background='rgba(255, 255, 255, 0.3)'; this.style.borderColor='rgba(255, 255, 255, 0.4)'">
              <div id="upload-content" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 15px; text-align: center;">
                <svg id="upload-icon" style="width: 36px; height: 36px; margin-bottom: 12px; color: rgba(255, 255, 255, 0.7);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
                <p style="margin-bottom: 8px; font-size: 13px; color: white; line-height: 1.2; font-weight: 600;" data-i18n="uploadText">Click to import</p>
                <p style="font-size: 11px; color: rgba(255, 255, 255, 0.7); line-height: 1.1;" data-i18n="supportedFormats">PSBT, TXT files</p>
          </div>
              <input id="psbt-file" type="file" style="display: none;" accept=".psbt,.txt,.dat" />
        </label>
          </div>
        </div>

        <!-- Manual Input Section -->
        <div>
          <label for="psbt-input" style="color: white; font-size: 16px; font-weight: 600; margin-bottom: 15px; display: block;" data-i18n="manualLabel">📝 Paste PSBT (Base64)</label>
      <textarea 
        id="psbt-input"
        rows="6"
            style="width: 100%; padding: 15px 20px; background: rgba(255, 255, 255, 0.5); 
                   border: 1px solid rgba(255, 255, 255, 0.4); border-radius: 15px; 
                   color: #334155; font-size: 14px; outline: none; box-sizing: border-box; 
                   transition: all 0.3s ease; resize: vertical; height: 160px;
                   font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
                   line-height: 1.4; word-wrap: break-word; white-space: pre-wrap;"
        placeholder="Enter PSBT in Base64 format..."
            data-i18n-placeholder="psbtPlaceholder"
            spellcheck="false"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"></textarea>
        </div>
      </div>

      <!-- Mobile and Landscape Layout -->
      <style>
        @media (max-width: 768px) {
          div[style*="grid-template-columns"] {
            display: block !important;
          }
          div[style*="grid-template-columns"] > div {
            margin-bottom: 25px;
          }
        }
        
        @media (min-width: 769px) and (max-height: 600px) {
          /* Landscape mode optimizations */
          .step1-buttons {
            max-width: 400px !important;
            margin: 0 auto !important;
          }
        }
      </style>

      <!-- Action Buttons -->
      <div class="step1-buttons" style="display: flex; flex-wrap: wrap; gap: 12px; padding-top: 20px; justify-content: center; max-width: 500px; margin: 0 auto;">
        <button 
          id="parse-psbt-btn"
          class="gradient-button-primary"
          style="flex: 1; min-width: 180px; max-width: 240px; border: 2px solid rgba(255, 255, 255, 0.3);"
          data-i18n="parseBtn">
          🔍 解析PSBT并生成BBQr
        </button>
        <button 
          id="clear-psbt-btn"
          class="gradient-button-secondary"
          style="border: 2px solid rgba(255, 255, 255, 0.3);"
          data-i18n="clearBtn">
          🗑️ Clear
        </button>
      </div>

      <!-- Error Display -->
      <div id="psbt-error" style="display: none; margin-top: 30px; padding: 25px; background: rgba(239, 68, 68, 0.1); 
                                 border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 15px;
                                 backdrop-filter: blur(10px);">
        <div style="display: flex; align-items: center;">
          <div style="color: #ef4444; margin-right: 12px; font-size: 1.2rem;">⚠️</div>
          <div style="color: #dc2626; font-weight: 600; font-size: 1rem;" data-i18n="errorTitle">PSBT Parse Error</div>
        </div>
        <div id="psbt-error-message" style="color: #b91c1c; font-size: 14px; margin-top: 12px;"></div>
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
  const quickSkipBtn = document.getElementById('quick-skip-to-scan-btn');

  // Quick skip to scan button
  quickSkipBtn?.addEventListener('click', () => {
    console.log('🖱️ Quick Skip to Scan button clicked');
    goToStep(3);
  });

  // Enhanced textarea handling
  if (psbtInput) {
    // Prevent multiple cursor positions on focus
    psbtInput.addEventListener('focus', () => {
      // Clear any existing selection and set cursor to end
      setTimeout(() => {
        psbtInput.setSelectionRange(psbtInput.value.length, psbtInput.value.length);
      }, 0);
    });

    // Handle paste events to ensure proper cursor position
    psbtInput.addEventListener('paste', (e) => {
      setTimeout(() => {
        // After paste, move cursor to end
        psbtInput.setSelectionRange(psbtInput.value.length, psbtInput.value.length);
      }, 0);
    });

    // Prevent browser autocomplete/suggestions
    psbtInput.addEventListener('input', () => {
      // Clear any previous errors when user starts typing
      const psbtError = document.getElementById('psbt-error');
      if (psbtError) psbtError.style.display = 'none';
    });
  }

  // File import
  psbtFile?.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      if (psbtInput) {
      psbtInput.value = e.target.result.trim();
        // Clear any previous errors/analysis when new file is loaded
        const psbtAnalysis = document.getElementById('psbt-analysis');
        const psbtError = document.getElementById('psbt-error');
        if (psbtAnalysis) psbtAnalysis.style.display = 'none';
        if (psbtError) psbtError.style.display = 'none';
        // Focus the textarea after loading content
        psbtInput.focus();
        psbtInput.setSelectionRange(psbtInput.value.length, psbtInput.value.length);
        
        // Update upload area to show success
        updateUploadAreaSuccess(file.name);
      }
    };
    reader.readAsText(file);
  });
  
  // Function to update upload area with success state
  function updateUploadAreaSuccess(fileName) {
    const uploadIcon = document.getElementById('upload-icon');
    const uploadContent = document.getElementById('upload-content');
    const fileUploadArea = document.getElementById('file-upload-area');
    
    if (uploadIcon && uploadContent && fileUploadArea) {
      // Change to success styling
      fileUploadArea.style.borderColor = 'rgba(16, 185, 129, 0.6)';
      fileUploadArea.style.background = 'rgba(16, 185, 129, 0.2)';
      
      // Update icon to success checkmark
      uploadIcon.innerHTML = `
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      `;
      uploadIcon.style.color = 'rgba(16, 185, 129, 0.8)';
      
      // Update text
      const uploadText = uploadContent.querySelector('[data-i18n="uploadText"]');
      const supportedFormats = uploadContent.querySelector('[data-i18n="supportedFormats"]');
      
      if (uploadText) {
        uploadText.textContent = '✅ File imported';
        uploadText.style.color = 'rgba(16, 185, 129, 0.9)';
      }
      
      if (supportedFormats) {
        supportedFormats.textContent = fileName;
        supportedFormats.style.color = 'rgba(255, 255, 255, 0.8)';
      }
    }
  }

  // Parse PSBT and go directly to step 2
  parsePsbtBtn?.addEventListener('click', () => {
    const psbtData = psbtInput.value.trim();
    if (!psbtData) {
      showError('请输入 PSBT 数据');
      return;
    }

    try {
      const analysis = decodePSBT(psbtData);
      state.psbtData = psbtData;
      // Go directly to step 2 instead of displaying analysis
      goToStep(2);
      // Generate BBQr codes after switching to step 2
      setTimeout(() => {
        generateBBQrCodes();
      }, 100);
    } catch (error) {
      showError(error.message);
    }
  });

  // Clear
  clearPsbtBtn?.addEventListener('click', () => {
    if (psbtInput) {
    psbtInput.value = '';
      psbtInput.focus();
    }
    if (psbtFile) {
    psbtFile.value = '';
    }
    const psbtAnalysis = document.getElementById('psbt-analysis');
    const psbtError = document.getElementById('psbt-error');
    if (psbtAnalysis) psbtAnalysis.style.display = 'none';
    if (psbtError) psbtError.style.display = 'none';
    state.psbtData = null;
    
    // Reset upload area to initial state
    resetUploadArea();
  });
  
  // Function to reset upload area to initial state
  function resetUploadArea() {
    const uploadIcon = document.getElementById('upload-icon');
    const uploadContent = document.getElementById('upload-content');
    const fileUploadArea = document.getElementById('file-upload-area');
    
    if (uploadIcon && uploadContent && fileUploadArea) {
      // Reset to initial styling
      fileUploadArea.style.borderColor = 'rgba(255, 255, 255, 0.4)';
      fileUploadArea.style.background = 'rgba(255, 255, 255, 0.3)';
      
      // Reset icon to document icon
      uploadIcon.innerHTML = `
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      `;
      uploadIcon.style.color = 'rgba(255, 255, 255, 0.7)';
      
      // Reset text
      const uploadText = uploadContent.querySelector('[data-i18n="uploadText"]');
      const supportedFormats = uploadContent.querySelector('[data-i18n="supportedFormats"]');
      
      if (uploadText) {
        uploadText.textContent = currentLanguage === 'zh' ? '点击导入 PSBT' : 'Click to import PSBT';
        uploadText.style.color = 'white';
      }
      
      if (supportedFormats) {
        supportedFormats.textContent = currentLanguage === 'zh' ? '支持 PSBT, TXT 文件' : 'PSBT, TXT files supported';
        supportedFormats.style.color = 'rgba(255, 255, 255, 0.7)';
      }
    }
  }

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
    <!-- Direct Background Layout -->
    <div style="max-width: 1000px; margin: 0 auto;">
      
      <!-- Two Column Layout: PSBT Summary + BBQr Codes -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; min-height: 400px;">
        
        <!-- PSBT Summary -->
        <div style="display: flex; flex-direction: column; height: fit-content;">
          <div id="psbt-summary-step2" style="background: rgba(255, 255, 255, 0.1); border-radius: 15px; padding: 20px; border: 1px solid rgba(255, 255, 255, 0.2);">
            <!-- PSBT summary will be inserted here -->
          </div>
        </div>

        <!-- BBQr Codes -->
        <div style="display: flex; flex-direction: column; height: fit-content;">
          <div style="background: rgba(255, 255, 255, 0.1); border-radius: 15px; padding: 20px; border: 1px solid rgba(255, 255, 255, 0.2);">
            <h3 style="color: white; font-size: 1.2rem; font-weight: 600; margin-bottom: 20px; text-align: center;" data-i18n="bbqrCodesTitle">
              📱 BBQr Codes
            </h3>
            <div id="bbqr-output" style="text-align: center; min-height: 300px; display: flex; align-items: center; justify-content: center;">
              <!-- BBQr codes will be generated here -->
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile Layout: Stack vertically on small screens -->
      <style>
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
        }
      </style>

      <!-- Navigation -->
      <div style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: center; max-width: 500px; margin: 0 auto;">
        <button 
          id="back-to-step1-btn"
          class="gradient-button-secondary"
          style="border: 2px solid rgba(255, 255, 255, 0.3);"
          data-i18n="backBtn">
          ← Back
        </button>
        <button 
          id="proceed-to-scan-btn"
          class="gradient-button-primary"
          style="flex: 1; min-width: 200px; border: 2px solid rgba(255, 255, 255, 0.3);"
          data-i18n="proceedScanBtn">
          ➡️ Import Signed PSBT
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
  
  // Display PSBT summary in step 2
  displayPSBTSummaryInStep2();
  
  // Auto-generate BBQr codes when entering step 2
  setTimeout(() => {
    generateBBQrCodes();
  }, 100);
  
  console.log('✅ Step 2 events setup completed');
}

// Function to display PSBT summary in step 2
function displayPSBTSummaryInStep2() {
  if (!state.psbtData) {
    console.log('❌ No PSBT data available for summary');
    return;
  }

  try {
    const analysis = decodePSBT(state.psbtData);
    const summaryContainer = document.getElementById('psbt-summary-step2');
    
    if (summaryContainer) {
      // Find the largest output (likely the main transfer, not change)
      const sortedOutputs = [...analysis.outputs].sort((a, b) => b.amount - a.amount);
      const mainOutput = sortedOutputs[0];
      const changeOutputs = sortedOutputs.slice(1);

      const statusIcon = analysis.signatureStatus === 'Fully Signed' ? '✅' : '⏳';
      const statusColor = analysis.signatureStatus === 'Fully Signed' ? '#10b981' : '#f59e0b';
      
      // Format BTC amount: remove leading zero and BTC suffix
      function formatBTC(satoshis) {
        const btc = (parseInt(satoshis) / 100000000).toFixed(8);
        return btc.startsWith('0.') ? btc.substring(1) : btc;
      }

      // Format address with spaces every 4 characters, ensure it fits in 3 lines
      function formatAddress(address) {
        const spacedAddress = address.replace(/(.{4})/g, '$1 ').trim();
        const maxLineLength = Math.ceil(spacedAddress.length / 3);
        const lines = [];
        
        let remaining = spacedAddress;
        for (let i = 0; i < 3 && remaining.length > 0; i++) {
          if (i === 2) {
            // Last line gets all remaining characters
            lines.push(remaining.trim());
          } else {
            // Try to fit as many complete 4-char groups as possible
            let lineLength = 0;
            let cutPoint = 0;
            
            for (let j = 0; j < remaining.length; j += 5) { // 4 chars + 1 space
              const nextGroup = remaining.substring(j, j + 5);
              if (lineLength + nextGroup.length <= maxLineLength) {
                lineLength += nextGroup.length;
                cutPoint = j + nextGroup.length;
              } else {
                break;
              }
            }
            
            if (cutPoint === 0) {
              // If no complete group fits, just cut at max length
              cutPoint = Math.min(maxLineLength, remaining.length);
            }
            
            const line = remaining.substring(0, cutPoint).trim();
            lines.push(line);
            remaining = remaining.substring(cutPoint).trim();
          }
        }
        
        return lines.filter(line => line.length > 0);
      }

      summaryContainer.innerHTML = `
        <h3 style="color: white; font-size: 1.2rem; font-weight: 600; margin-bottom: 20px; text-align: center;" data-i18n="psbtSummaryTitle">
          📊 PSBT Summary
        </h3>
        <div style="background: rgba(255, 255, 255, 0.95); border-radius: 12px; padding: 20px; 
                    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif; 
                    box-shadow: 0 8px 32px rgba(0,0,0,0.12); backdrop-filter: blur(10px); 
                    border: 1px solid rgba(255, 255, 255, 0.3); max-width: 380px; margin: 0 auto;">
          
          <!-- Status -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; margin-bottom: 16px;">
            <span style="font-size: 14px; color: #6b7280; font-weight: 500;">Status</span>
            <span style="font-size: 14px; font-weight: 600; color: ${statusColor};">
              ${statusIcon} ${analysis.signatureStatus}
            </span>
          </div>

                     <!-- Recipients -->
           <div style="margin-bottom: 16px;">
             ${sortedOutputs.map((output, index) => {
               const addressLines = formatAddress(output.address);
               return `
                 ${index > 0 ? '<div style="border-top: 1px dashed rgba(209, 213, 219, 0.8); margin: 12px 0;"></div>' : ''}
                 <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0;">
                   <div style="flex: 1; margin-right: 20px;">
                     <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px; font-weight: 500;">Recipient Address</div>
                     <div style="font-family: 'SF Mono', Monaco, monospace; font-size: 12px; line-height: 1.4; color: #475569; font-weight: 500;">
                       ${addressLines.map(line => `<div>${line}</div>`).join('')}
                     </div>
                   </div>
                   <div style="font-size: 14px; font-weight: 600; color: #1f2937; text-align: right;">
                     ${formatBTC(output.amount)}
                   </div>
                 </div>
               `;
             }).join('')}
           </div>

          <!-- Network Fee -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-top: 1px solid rgba(229, 231, 235, 0.6);">
            <span style="font-size: 14px; color: #6b7280; font-weight: 500;">Network Fee</span>
            <span style="font-size: 14px; font-weight: 600; color: #1f2937;">
              ${formatBTC(analysis.fee)}
            </span>
          </div>

          <!-- Total Cost -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-top: 2px solid rgba(229, 231, 235, 0.6); margin-top: 8px;">
            <span style="font-size: 16px; font-weight: 700; color: #1f2937;">Total Cost</span>
            <span style="font-size: 16px; font-weight: 700; color: #1f2937;">
              ${formatBTC(parseInt(mainOutput.amount) + parseInt(analysis.fee))}
            </span>
          </div>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error displaying PSBT summary in step 2:', error);
  }
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
      <!-- QR Code Display Area -->
      <div style="background: white; padding: 20px; border-radius: 15px; max-width: 280px; margin: 0 auto; display: flex; flex-direction: column; align-items: center;">
        <div style="text-align: center; margin-bottom: 15px; width: 100%;">
          <div id="qr-counter" style="font-size: 14px; font-weight: 600; color: #374151;">
            <span id="current-part">1</span> / ${parts.length}
          </div>
        </div>
        
        <!-- Single QR Code Container -->
        <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 15px; width: 100%;">
          <canvas id="current-qr" style="border: 1px solid #e5e7eb; border-radius: 8px; display: block;"></canvas>
        </div>
        
        <!-- Progress Indicator -->
        <div style="display: flex; justify-content: center; gap: 8px; width: 100%;">
          ${parts.map((_, index) => `
            <div 
              id="dot-${index}" 
              style="width: 8px; height: 8px; border-radius: 50%; transition: all 0.2s; background-color: ${index === 0 ? '#9333ea' : '#d1d5db'};">
            </div>
          `).join('')}
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
      dot.style.cssText = `
        width: 12px; height: 12px; border-radius: 50%; 
        transition: all 0.2s ease;
        background: ${i === index ? '#9333ea' : '#cbd5e1'};
      `;
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

  if (errorDiv) errorDiv.style.display = 'none';
  analysisDiv.style.display = 'block';

  // Find the main output (usually the largest one, not change)
  const sortedOutputs = [...analysis.outputs].sort((a, b) => b.amount - a.amount);
  const mainOutput = sortedOutputs[0];
  const changeOutputs = sortedOutputs.slice(1);

  const statusIcon = analysis.signatureStatus === 'Fully Signed' ? '✅' : 
                    analysis.signatureStatus === 'Partially Signed' ? '⏳' : '❌';
  const statusColor = analysis.signatureStatus === 'Fully Signed' ? '#10b981' : 
                     analysis.signatureStatus === 'Partially Signed' ? '#f59e0b' : '#ef4444';
  
  // Format BTC amount: remove leading zero and BTC suffix
  function formatBTC(satoshis) {
    const btc = (parseInt(satoshis) / 100000000).toFixed(8);
    return btc.startsWith('0.') ? btc.substring(1) : btc;
  }

  // Format address with spaces every 4 characters, ensure it fits in 3 lines
  function formatAddress(address) {
    const spacedAddress = address.replace(/(.{4})/g, '$1 ').trim();
    const maxLineLength = Math.ceil(spacedAddress.length / 3);
    const lines = [];
    
    let remaining = spacedAddress;
    for (let i = 0; i < 3 && remaining.length > 0; i++) {
      if (i === 2) {
        // Last line gets all remaining characters
        lines.push(remaining.trim());
      } else {
        // Try to fit as many complete 4-char groups as possible
        let lineLength = 0;
        let cutPoint = 0;
        
        for (let j = 0; j < remaining.length; j += 5) { // 4 chars + 1 space
          const nextGroup = remaining.substring(j, j + 5);
          if (lineLength + nextGroup.length <= maxLineLength) {
            lineLength += nextGroup.length;
            cutPoint = j + nextGroup.length;
          } else {
            break;
          }
        }
        
        if (cutPoint === 0) {
          // If no complete group fits, just cut at max length
          cutPoint = Math.min(maxLineLength, remaining.length);
        }
        
        const line = remaining.substring(0, cutPoint).trim();
        lines.push(line);
        remaining = remaining.substring(cutPoint).trim();
      }
    }
    
    return lines.filter(line => line.length > 0);
  }

  detailsDiv.innerHTML = `
    <div style="background: white; border-radius: 12px; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif; box-shadow: 0 4px 16px rgba(0,0,0,0.08); max-width: 380px; margin: 0 auto;">
      
      <!-- Status -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; margin-bottom: 16px;">
        <span style="font-size: 14px; color: #6b7280; font-weight: 500;">Status</span>
        <span style="font-size: 14px; font-weight: 600; color: ${statusColor};">
          ${statusIcon} ${analysis.signatureStatus}
        </span>
      </div>

      <!-- Recipients -->
      <div style="margin-bottom: 16px;">
        ${sortedOutputs.map((output, index) => {
          const addressLines = formatAddress(output.address);
          return `
            ${index > 0 ? '<div style="border-top: 1px dashed #d1d5db; margin: 12px 0;"></div>' : ''}
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0;">
              <div style="flex: 1; margin-right: 20px;">
                <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px; font-weight: 500;">Recipient Address</div>
                <div style="font-family: 'SF Mono', Monaco, monospace; font-size: 12px; line-height: 1.4; color: #475569; font-weight: 500;">
                  ${addressLines.map(line => `<div>${line}</div>`).join('')}
                </div>
              </div>
              <div style="font-size: 14px; font-weight: 600; color: #1f2937; text-align: right;">
                ${formatBTC(output.amount)}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Network Fee -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-top: 1px solid #e5e7eb;">
        <span style="font-size: 14px; color: #6b7280; font-weight: 500;">Network Fee</span>
        <span style="font-size: 14px; font-weight: 600; color: #1f2937;">
          ${formatBTC(analysis.fee)}
        </span>
      </div>

      <!-- Total Cost -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-top: 2px solid #e5e7eb; margin-top: 8px;">
        <span style="font-size: 16px; font-weight: 700; color: #1f2937;">Total Cost</span>
        <span style="font-size: 16px; font-weight: 700; color: #1f2937;">
          ${formatBTC(parseInt(mainOutput.amount) + parseInt(analysis.fee))}
        </span>
      </div>
    </div>
  `;
}

function showError(message) {
  const errorDiv = document.getElementById('psbt-error');
  const errorMessage = document.getElementById('psbt-error-message');
  const analysisDiv = document.getElementById('psbt-analysis');

  if (errorDiv && errorMessage) {
    if (analysisDiv) analysisDiv.style.display = 'none';
    errorDiv.style.display = 'block';
    errorMessage.textContent = message;
  }
}

// Step 3: Import Signed PSBT
function renderStep3() {
  return `
    <div style="max-width: 600px; margin: 0 auto;">

      <!-- Camera Controls -->
      <div style="text-align: center; margin-bottom: 30px;">
        <button 
          id="start-scan-btn"
          class="gradient-button-primary"
          style="border: 2px solid rgba(255, 255, 255, 0.3);"
          data-i18n="startScanBtn">
          📷 Start Camera Scan
        </button>
      </div>

      <!-- Camera Container -->
      <div id="camera-container" 
           style="position: relative; width: 70vw; max-width: 300px; height: 70vw; max-height: 300px; 
                  margin: 20px auto; border-radius: 15px; overflow: hidden; 
                  background: #000; border: 2px solid #333; display: none;">
        <video 
          id="camera-video" 
          autoplay 
          playsinline 
          webkit-playsinline 
          muted
          style="width: 100%; height: 100%; object-fit: cover; background: black; border-radius: 15px;">
        </video>
        
                        <!-- Simple Camera Overlay -->
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none;">
          
                                <!-- Top Controls -->
            <div style="position: absolute; top: 8px; left: 8px; right: 8px; display: flex; 
                        justify-content: space-between; align-items: center; pointer-events: auto; z-index: 30;">
          <!-- Stop Button -->
          <button 
            id="stop-scan-btn"
               style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; 
                      width: 32px; height: 32px; border-radius: 50%; font-size: 14px; font-weight: bold; 
                      border: 1px solid rgba(255, 255, 255, 0.2); cursor: pointer; display: none;
                      align-items: center; justify-content: center; backdrop-filter: blur(10px);
                      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);"
            title="Stop Scanning">
            ✕
          </button>
          
             <!-- Expand button for better view -->
             <button 
               id="expand-camera-btn"
               style="background: rgba(0, 0, 0, 0.6); color: white; 
                      width: 32px; height: 32px; border-radius: 50%; font-size: 14px; font-weight: bold; 
                      border: 1px solid rgba(255, 255, 255, 0.2); cursor: pointer; display: none;
                      align-items: center; justify-content: center; backdrop-filter: blur(10px);
                      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);"
               title="Expand View">
               ⛶
             </button>
           </div>
          
                                <!-- Bottom Status -->
            <div style="position: absolute; bottom: 8px; left: 8px; right: 8px; pointer-events: none; z-index: 30;">
              <div id="scan-status" style="margin: 0 auto; max-width: 200px; background: rgba(0, 0, 0, 0.8); 
                                           color: white; padding: 6px 12px; border-radius: 8px; text-align: center; 
                                           font-weight: 500; font-size: 11px; backdrop-filter: blur(10px);
                                           border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">
            Ready to scan...
              </div>
          </div>
        </div>
      </div>

      <!-- Canvas for scanning -->
      <canvas id="camera-canvas" style="display: none;"></canvas>

      <!-- Scan Results -->
      <div id="scan-results" style="display: none; margin-top: 30px; padding: 20px; border-radius: 15px;
                                   background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3);
                                   backdrop-filter: blur(10px); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);">
        <h3 style="font-size: 18px; font-weight: 600; color: #065f46; margin-bottom: 20px;" data-i18n="scanResultTitle">
          ✅ Signed PSBT Received!
        </h3>
        <div style="font-size: 14px; color: #047857; margin-bottom: 20px;" data-i18n="scanResultDesc">
          Successfully scanned signed PSBT. Ready to finalize and broadcast.
        </div>
        <textarea id="signed-psbt-data" readonly 
                  style="width: 100%; height: 120px; padding: 12px; background: rgba(255, 255, 255, 0.5); 
                         border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 10px; 
                         font-family: monospace; font-size: 12px; resize: none; margin-bottom: 20px; 
                         color: #374151; box-sizing: border-box;"></textarea>
        
        <div style="text-align: center;">
          <button 
            id="proceed-to-finalize-btn"
            class="gradient-button-primary"
            style="border: 2px solid rgba(255, 255, 255, 0.3);"
            data-i18n="proceedFinalizeBtn">
            ➡️ Finalize & Broadcast
          </button>
        </div>
      </div>

      <!-- Navigation -->
      <div style="display: flex; justify-content: center; margin-top: 30px;">
        <button 
          id="back-to-step2-btn"
          class="gradient-button-secondary"
          style="border: 2px solid rgba(255, 255, 255, 0.3);"
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
  const expandCameraBtn = document.getElementById('expand-camera-btn');
  const backToStep2Btn = document.getElementById('back-to-step2-btn');
  const proceedToFinalizeBtn = document.getElementById('proceed-to-finalize-btn');

  startScanBtn?.addEventListener('click', startCameraScan);
  stopScanBtn?.addEventListener('click', stopCameraScan);
  expandCameraBtn?.addEventListener('click', expandCameraView);
  backToStep2Btn?.addEventListener('click', () => goToStep(2));
  proceedToFinalizeBtn?.addEventListener('click', () => goToStep(4));
}

// Step 4: Finalize Transaction
function renderStep4() {
  return `
    <div style="max-width: 600px; margin: 0 auto;">
      
      <!-- Transaction Summary -->
      <div id="tx-summary" style="margin-bottom: 30px;">
        <h3 style="color: white; font-size: 18px; font-weight: 600; margin-bottom: 20px;" data-i18n="txSummaryTitle">
          📊 Transaction Summary
        </h3>
        <div id="tx-summary-details" style="color: #1e40af; font-size: 14px; line-height: 1.6;">
          <!-- Transaction summary will be inserted here -->
        </div>
      </div>

      <!-- Finalize Button -->
      <div style="text-align: center; margin-bottom: 30px;">
        <button 
          id="finalize-tx-btn"
          class="gradient-button-primary"
          style="border: 2px solid rgba(255, 255, 255, 0.3);"
          data-i18n="finalizeBtn">
          🔨 Finalize Transaction
        </button>
      </div>

      <!-- Finalized Transaction -->
      <div id="finalized-tx" style="display: none;">
        <div style="margin-bottom: 30px; padding: 20px; background: rgba(16, 185, 129, 0.1); 
                    border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 15px; 
                    backdrop-filter: blur(10px); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);">
          <h3 style="font-size: 18px; font-weight: 600; color: #065f46; margin-bottom: 20px;" data-i18n="finalizedTitle">
            ✅ Transaction Ready
          </h3>
          
          <!-- TXID -->
          <div style="margin-bottom: 20px;">
            <label style="display: block; font-size: 14px; font-weight: 600; color: #047857; margin-bottom: 10px;" data-i18n="txidLabel">
              Transaction ID
            </label>
            <div style="background: rgba(255, 255, 255, 0.5); border: 1px solid rgba(16, 185, 129, 0.4); 
                        border-radius: 12px; padding: 12px; backdrop-filter: blur(10px);">
              <div id="final-txid" style="font-family: monospace; font-size: 14px; color: #334155; word-break: break-all;"></div>
            </div>
          </div>
          
          <!-- Raw Hex -->
          <div style="margin-bottom: 30px;">
            <label style="display: block; font-size: 14px; font-weight: 600; color: #047857; margin-bottom: 10px;" data-i18n="rawHexLabel">
              Raw Transaction
            </label>
            <textarea id="final-hex" readonly 
                      style="width: 100%; height: 120px; padding: 12px; background: rgba(255, 255, 255, 0.5); 
                             border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 12px; 
                             font-family: monospace; font-size: 12px; resize: none; color: #334155; 
                             backdrop-filter: blur(10px); box-sizing: border-box;"></textarea>
          </div>
          
          <!-- Action Buttons -->
          <div style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: center;">
            <button 
              id="copy-txid-btn"
              class="gradient-button-primary"
              style="border: 2px solid rgba(255, 255, 255, 0.3);"
              data-i18n="copyTxidBtn">
              📋 Copy TXID
            </button>
            <button 
              id="copy-hex-btn"
              class="gradient-button-secondary"
              style="border: 2px solid rgba(255, 255, 255, 0.3);"
              data-i18n="copyHexBtn">
              📋 Copy Hex
            </button>
            <button 
              id="proceed-to-broadcast-btn"
              class="gradient-button-success"
              style="border: 2px solid rgba(255, 255, 255, 0.3); flex: 1; min-width: 200px;"
              data-i18n="proceedBroadcastBtn">
              ➡️ Proceed to Broadcast
            </button>
          </div>
        </div>

        <!-- Broadcast Status -->
        <div id="broadcast-status" style="display: none; margin-top: 30px;">
          <!-- Broadcast status will appear here -->
        </div>
      </div>

      <!-- Navigation -->
      <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-top: 30px; justify-content: center; max-width: 500px; margin-left: auto; margin-right: auto;">
        <button 
          id="back-to-step3-btn"
          class="gradient-button-secondary"
          style="border: 2px solid rgba(255, 255, 255, 0.3);"
          data-i18n="backBtn">
          ← Back
        </button>
        <button 
          id="restart-workflow-btn"
          class="gradient-button-secondary"
          style="border: 2px solid rgba(255, 255, 255, 0.3);"
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
  const proceedToBroadcastBtn = document.getElementById('proceed-to-broadcast-btn');
  const backToStep3Btn = document.getElementById('back-to-step3-btn');
  const restartWorkflowBtn = document.getElementById('restart-workflow-btn');

  finalizeTxBtn?.addEventListener('click', finalizeTransaction);
  copyTxidBtn?.addEventListener('click', () => copyToClipboard(document.getElementById('final-txid').textContent));
  copyHexBtn?.addEventListener('click', () => copyToClipboard(document.getElementById('final-hex').value));
  proceedToBroadcastBtn?.addEventListener('click', () => goToStep(5));
  backToStep3Btn?.addEventListener('click', () => goToStep(3));
  restartWorkflowBtn?.addEventListener('click', () => {
    // Reset state
    state.psbtData = null;
    state.signedPsbtData = null;
    state.finalizedTx = null;
    state.bbqrCodes = [];
    goToStep(1);
  });

  // Show transaction summary when step 4 loads
  setTimeout(() => {
    showTransactionSummary();
  }, 100);
}

// Step 5: Broadcast Transaction
function renderStep5() {
  return `
    <div style="max-width: 600px; margin: 0 auto;">
      
      <!-- Transaction Summary -->
      <div id="tx-summary-broadcast" style="margin-bottom: 30px;">
        <h3 style="color: white; font-size: 18px; font-weight: 600; margin-bottom: 20px;" data-i18n="txSummaryTitle">
          📊 Transaction Summary
        </h3>
        <div id="tx-summary-broadcast-details" style="color: #1e40af; font-size: 14px; line-height: 1.6;">
          <!-- Transaction summary will be inserted here -->
        </div>
      </div>

      <!-- Broadcast Button -->
      <div style="text-align: center; margin-bottom: 30px;">
        <button 
          id="broadcast-tx-btn"
          class="gradient-button-success"
          style="border: 2px solid rgba(255, 255, 255, 0.3);"
          data-i18n="broadcastBtn">
          📡 Broadcast Transaction
        </button>
      </div>

      <!-- Broadcast Status -->
      <div id="broadcast-status" style="display: none; margin-top: 30px;">
        <!-- Broadcast status will appear here -->
      </div>

      <!-- Navigation -->
      <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-top: 30px; justify-content: center; max-width: 500px; margin-left: auto; margin-right: auto;">
        <button 
          id="back-to-step4-btn"
          class="gradient-button-secondary"
          style="border: 2px solid rgba(255, 255, 255, 0.3);"
          data-i18n="backBtn">
          ← Back
        </button>
        <button 
          id="restart-workflow-btn-step5"
          class="gradient-button-secondary"
          style="border: 2px solid rgba(255, 255, 255, 0.3);"
          data-i18n="restartBtn">
          🔄 Start New Transaction
        </button>
      </div>
    </div>
  `;
}

function setupStep5Events() {
  const broadcastTxBtn = document.getElementById('broadcast-tx-btn');
  const backToStep4Btn = document.getElementById('back-to-step4-btn');
  const restartWorkflowBtn = document.getElementById('restart-workflow-btn-step5');

  broadcastTxBtn?.addEventListener('click', broadcastTransaction);
  backToStep4Btn?.addEventListener('click', () => goToStep(4));
  restartWorkflowBtn?.addEventListener('click', () => {
    // Reset state
    state.psbtData = null;
    state.signedPsbtData = null;
    state.finalizedTx = null;
    state.bbqrCodes = [];
    goToStep(1);
  });

  // Show transaction summary when step 5 loads
  setTimeout(() => {
    showTransactionSummary();
  }, 100);
}

// Camera scanning functions
async function startCameraScan() {
  const video = document.getElementById('camera-video');
  const canvas = document.getElementById('camera-canvas');
  const cameraContainer = document.getElementById('camera-container');
  const startBtn = document.getElementById('start-scan-btn');
  const stopBtn = document.getElementById('stop-scan-btn');
  const expandBtn = document.getElementById('expand-camera-btn');
  const scanStatus = document.getElementById('scan-status');

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      } 
    });
    
    state.camera.stream = stream;
    state.camera.isScanning = true;
    state.camera.parts = [];
    
    video.srcObject = stream;
    
    // Show camera interface
    cameraContainer.style.display = 'block';
    startBtn.style.display = 'none';
    stopBtn.style.display = 'flex';
    expandBtn.style.display = 'flex';
    
    // Initialize scan status
    if (scanStatus) {
      const readyText = currentLanguage === 'zh' ? '准备扫描...' : 'Ready to scan...';
      scanStatus.textContent = readyText;
    }
    
    canvas.width = 640;
    canvas.height = 480;
    
    // Update text translations
    updateTexts();
    
    // Scroll to camera view
    cameraContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Wait for video to be ready
    video.addEventListener('loadedmetadata', () => {
      console.log('📹 Video loaded, starting scan loop');
    scanLoop();
    });
    
    // Start scan loop immediately if video is already ready
    if (video.readyState >= 2) {
      scanLoop();
    }
    
  } catch (error) {
    console.error('Camera error:', error);
    const errorText = currentLanguage === 'zh' ? 
      '相机访问失败: ' + error.message :
      'Camera access failed: ' + error.message;
    alert(errorText);
  }
}

function stopCameraScan() {
  const cameraContainer = document.getElementById('camera-container');
  const startBtn = document.getElementById('start-scan-btn');
  const stopBtn = document.getElementById('stop-scan-btn');
  const expandBtn = document.getElementById('expand-camera-btn');

  if (state.camera.stream) {
    state.camera.stream.getTracks().forEach(track => track.stop());
    state.camera.stream = null;
  }
  
  state.camera.isScanning = false;
  
  // Hide camera container
  if (cameraContainer) {
    cameraContainer.style.display = 'none';
  }
  
      // Show start button, hide other buttons
    if (startBtn) startBtn.style.display = 'inline-block';
    if (stopBtn) stopBtn.style.display = 'none';
    if (expandBtn) expandBtn.style.display = 'none';
  
  console.log('📹 Camera scan stopped');
}

function expandCameraView() {
  const cameraContainer = document.getElementById('camera-container');
  
  if (cameraContainer) {
    // Toggle between normal and expanded view
    if (cameraContainer.style.width === '85vw') {
      // Return to normal size
      cameraContainer.style.width = '70vw';
      cameraContainer.style.height = '70vw';
      cameraContainer.style.maxWidth = '300px';
      cameraContainer.style.maxHeight = '300px';
    } else {
      // Expand to larger size
      cameraContainer.style.width = '85vw';
      cameraContainer.style.height = '85vw';
      cameraContainer.style.maxWidth = '400px';
      cameraContainer.style.maxHeight = '400px';
      
      // Scroll to center the expanded view
      setTimeout(() => {
        cameraContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }
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
      
      // Update scan status with bilingual support
      const statusText = currentLanguage === 'zh' ? 
        `${state.camera.parts.length}/${totalParts} 已扫描` :
        `${state.camera.parts.length}/${totalParts} scanned`;
      scanStatus.textContent = statusText;

      // Try to join the parts
      try {
        const { raw, fileType } = joinQRs(state.camera.parts);
        
        if (fileType === 'P') {
          // Successfully joined PSBT
          const base64 = btoa(String.fromCharCode.apply(null, new Uint8Array(raw)));
          state.signedPsbtData = base64;
          
          // Update final status with bilingual support
          const completeText = currentLanguage === 'zh' ? 
            `${state.camera.parts.length}/${state.camera.parts.length} 扫描完成` :
            `${state.camera.parts.length}/${state.camera.parts.length} scan complete`;
          scanStatus.textContent = completeText;
          
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
    // Display the full PSBT data
    signedPsbtData.value = signedPsbt;
    scanResults.style.display = 'block';
    
    // Scroll to results
    scanResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    console.log('✅ Scan results displayed, PSBT length:', signedPsbt.length);
  } else {
    console.error('❌ Could not find scan results elements');
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
      const finalizedTx = document.getElementById('finalized-tx');
      if (finalizedTx) finalizedTx.style.display = 'block';
      
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
        <div style="color: #ea580c;">
          <strong>⚠️ No signed PSBT data available</strong>
          <div style="font-size: 14px; margin-top: 8px;">Please scan a signed PSBT first.</div>
        </div>
      `;
    }
    return;
  }

  try {
    console.log('🔄 Decoding PSBT...');
    const analysis = decodePSBT(state.signedPsbtData);
    console.log('✅ PSBT analysis:', analysis);
    
    // Try to find summary details in current step (step 4 or step 5)
    let summaryDetails = document.getElementById('tx-summary-details');
    if (!summaryDetails) {
      summaryDetails = document.getElementById('tx-summary-broadcast-details');
    }
    console.log('🖼️ Summary details element:', summaryDetails ? 'found' : 'NOT FOUND');
    
    if (summaryDetails) {
      // Determine signature status and readiness
      const isFullySigned = analysis.signatureStatus === 'Fully Signed';
      const isPartiallySigned = analysis.signatureStatus === 'Partially Signed';
      const canFinalize = isFullySigned;
      
      // Get status color and message
      let statusColor = '#dc2626';
      let statusMessage = 'Not signed - cannot finalize';
      if (isFullySigned) {
        statusColor = '#059669';
        statusMessage = 'Fully signed - ready to finalize';
      } else if (isPartiallySigned) {
        statusColor = '#ea580c';
        statusMessage = 'Partially signed - needs more signatures';
      }
      
      const bgColor = canFinalize ? '#ecfdf5' : '#fff7ed';
      const borderColor = canFinalize ? '#a7f3d0' : '#fed7aa';
      
      // Find the main output and change outputs
      const sortedOutputs = [...analysis.outputs].sort((a, b) => b.amount - a.amount);
      const mainOutput = sortedOutputs[0];
      const changeOutputs = sortedOutputs.slice(1);

      const statusIcon = isFullySigned ? '✅' : isPartiallySigned ? '⏳' : '❌';
      
      // Format BTC amount: remove leading zero and BTC suffix
      function formatBTC(satoshis) {
        const btc = (parseInt(satoshis) / 100000000).toFixed(8);
        return btc.startsWith('0.') ? btc.substring(1) : btc;
      }

      // Format address with spaces every 4 characters, ensure it fits in 3 lines
      function formatAddress(address) {
        const spacedAddress = address.replace(/(.{4})/g, '$1 ').trim();
        const maxLineLength = Math.ceil(spacedAddress.length / 3);
        const lines = [];
        
        let remaining = spacedAddress;
        for (let i = 0; i < 3 && remaining.length > 0; i++) {
          if (i === 2) {
            // Last line gets all remaining characters
            lines.push(remaining.trim());
          } else {
            // Try to fit as many complete 4-char groups as possible
            let lineLength = 0;
            let cutPoint = 0;
            
            for (let j = 0; j < remaining.length; j += 5) { // 4 chars + 1 space
              const nextGroup = remaining.substring(j, j + 5);
              if (lineLength + nextGroup.length <= maxLineLength) {
                lineLength += nextGroup.length;
                cutPoint = j + nextGroup.length;
              } else {
                break;
              }
            }
            
            if (cutPoint === 0) {
              // If no complete group fits, just cut at max length
              cutPoint = Math.min(maxLineLength, remaining.length);
            }
            
            const line = remaining.substring(0, cutPoint).trim();
            lines.push(line);
            remaining = remaining.substring(cutPoint).trim();
          }
        }
        
        return lines.filter(line => line.length > 0);
      }

      summaryDetails.innerHTML = `
        <div style="background: white; border-radius: 12px; padding: 20px; 
                    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif; 
                    box-shadow: 0 8px 32px rgba(0,0,0,0.12); margin-bottom: 24px; max-width: 380px; margin: 0 auto;">
          
          <!-- Status -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; margin-bottom: 16px;">
            <span style="font-size: 14px; color: #6b7280; font-weight: 500;">Status</span>
            <span style="font-size: 14px; font-weight: 600; color: ${statusColor};">
              ${statusIcon} ${analysis.signatureStatus}
            </span>
          </div>

          <!-- Recipients -->
          <div style="margin-bottom: 16px;">
            ${sortedOutputs.map((output, index) => {
              const addressLines = formatAddress(output.address);
              return `
                ${index > 0 ? '<div style="border-top: 1px dashed #d1d5db; margin: 12px 0;"></div>' : ''}
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0;">
                  <div style="flex: 1; margin-right: 20px;">
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px; font-weight: 500;">Recipient Address</div>
                    <div style="font-family: 'SF Mono', Monaco, monospace; font-size: 12px; line-height: 1.4; color: #475569; font-weight: 500;">
                      ${addressLines.map(line => `<div>${line}</div>`).join('')}
                    </div>
                  </div>
                  <div style="font-size: 14px; font-weight: 600; color: #1f2937; text-align: right;">
                    ${formatBTC(output.amount)}
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Network Fee -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-top: 1px solid #e5e7eb;">
            <span style="font-size: 14px; color: #6b7280; font-weight: 500;">Network Fee</span>
            <span style="font-size: 14px; font-weight: 600; color: #1f2937;">
              ${formatBTC(analysis.fee)}
            </span>
          </div>

          <!-- Total Cost -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-top: 2px solid #e5e7eb; margin-top: 8px;">
            <span style="font-size: 16px; font-weight: 700; color: #1f2937;">Total Cost</span>
            <span style="font-size: 16px; font-weight: 700; color: #1f2937;">
              ${formatBTC(sortedOutputs.reduce((sum, output) => sum + parseInt(output.amount), 0) + parseInt(analysis.fee))}
            </span>
          </div>
        </div>
      `;
      
      // Update finalize button state
      const finalizeBtn = document.getElementById('finalize-tx-btn');
      if (finalizeBtn) {
        finalizeBtn.disabled = !canFinalize;
        if (!canFinalize) {
          finalizeBtn.textContent = '🔒 Cannot Finalize (Needs Signatures)';
          finalizeBtn.style.cssText = 'background: linear-gradient(135deg, #6b7280, #4b5563); color: white; border: none; padding: 15px 30px; border-radius: 25px; font-size: 16px; font-weight: 600; cursor: not-allowed; transition: all 0.3s ease; margin: 8px; opacity: 0.6;';
        } else {
          finalizeBtn.textContent = '🔨 Finalize Transaction';
          finalizeBtn.style.cssText = 'background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; border: none; padding: 15px 30px; border-radius: 25px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; margin: 8px;';
        }
      }
      
      console.log('✅ Transaction summary updated');
    }
  } catch (error) {
    console.error('💥 Error showing transaction summary:', error);
    const summaryDetails = document.getElementById('tx-summary-details');
    if (summaryDetails) {
      summaryDetails.innerHTML = `
        <div style="color: #dc2626;">
          <strong>❌ Error analyzing transaction</strong>
          <div style="font-size: 14px; margin-top: 8px;">${error.message}</div>
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
  
  statusDiv.style.display = 'block';
  const statusStyle = isSuccess ? 
    'background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46;' : 
    'background: #fef2f2; border: 1px solid #fecaca; color: #991b1b;';
  statusDiv.innerHTML = `
    <div style="padding: 16px; border-radius: 12px; ${statusStyle}">
      <div style="font-weight: 500; white-space: pre-line;">${message}</div>
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

// Setup independent Quick Actions - now handled in step 1 events
function setupQuickActions() {
  // Quick actions are now handled in setupStep1Events()
}

// Export for initialization
window.initBBQrHelper = initBBQrHelper;

// Initialize when DOM is loaded - only initialize once
let isInitialized = false;
document.addEventListener('DOMContentLoaded', () => {
  if (!isInitialized && window.initBBQrHelper) {
    isInitialized = true;
    window.initBBQrHelper();
  }
}); 