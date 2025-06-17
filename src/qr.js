// QR generation script
const QRCode = require('qrcode');

// Language support
const translations = {
  en: {
    title: '📱 QR Code',
    back: '←',
    textLabel: 'Text/URL',
    textPlaceholder: 'Enter text, URL, or any content',
    tagLabel: 'Tag (Optional)',
    tagPlaceholder: 'Enter tag for organizing',
    generateBtn: 'Generate QR Code',
    downloadBtn: '📥 Download PNG',
    newQrBtn: '🔄 New QR Code'
  },
  zh: {
    title: '📱 二维码',
    back: '←',
    textLabel: '文本/网址',
    textPlaceholder: '输入文本、网址或任何内容',
    tagLabel: '标签（可选）',
    tagPlaceholder: '输入用于组织的标签',
    generateBtn: '生成二维码',
    downloadBtn: '📥 下载PNG',
    newQrBtn: '🔄 生成新二维码'
  }
};

let currentLanguage = localStorage.getItem('language') || 'en';

// Language switching function
function toggleLanguage() {
  currentLanguage = currentLanguage === 'en' ? 'zh' : 'en';
  localStorage.setItem('language', currentLanguage);
  updateLanguage();
}

function updateLanguage() {
  const langToggle = document.querySelector('.language-toggle');
  if (langToggle) {
    langToggle.textContent = currentLanguage === 'en' ? '中' : 'EN';
  }

  // Update all elements with data-i18n attributes
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (translations[currentLanguage][key]) {
      element.textContent = translations[currentLanguage][key];
    }
  });

  // Update placeholder
  const textInput = document.getElementById('text');
  const tagInput = document.getElementById('tag');
  if (textInput) {
    textInput.placeholder = translations[currentLanguage].textPlaceholder;
  }
  if (tagInput) {
    tagInput.placeholder = translations[currentLanguage].tagPlaceholder;
  }
  
  // Update document title
  document.title = translations[currentLanguage].title;
  
  // Update document language attribute
  document.documentElement.lang = currentLanguage;
}

// Make toggleLanguage available globally
window.toggleLanguage = toggleLanguage;

// Show/hide sections
function showQRResult() {
  const formSection = document.getElementById('formSection');
  const qrResult = document.getElementById('qrResult');
  
  if (formSection) {
    formSection.style.display = 'none';
  }
  if (qrResult) {
    qrResult.style.display = 'block';
  }
}

function showFormSection() {
  const formSection = document.getElementById('formSection');
  const qrResult = document.getElementById('qrResult');
  
  if (formSection) {
    formSection.style.display = 'block';
  }
  if (qrResult) {
    qrResult.style.display = 'none';
  }
}

function openModal() {
  const modal = document.getElementById('modal-overlay');
  const modalImage = document.getElementById('modal-image');
  const qrImage = document.getElementById('qr-image');
  
  if (modal && modalImage && qrImage) {
    modalImage.src = qrImage.src;
    modal.style.display = 'block';
  }
}

function closeModal() {
  const modal = document.getElementById('modal-overlay');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Make modal functions available globally
window.openModal = openModal;
window.closeModal = closeModal;

// UI Logic - Initialize as early as possible
function initializeApp() {
  // Initialize language immediately
  updateLanguage();
  
  const textInput = document.getElementById('text');
  const tagInput = document.getElementById('tag');
  const generateBtn = document.getElementById('generate');
  const downloadBtn = document.getElementById('download');
  const newQrBtn = document.getElementById('newQr');
  const canvas = document.getElementById('qr-canvas');
  const qrImage = document.getElementById('qr-image');

  // Close modal on Escape key
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      closeModal();
    }
  });

  function renderQR() {
    const text = textInput.value.trim();
    const tag = tagInput.value.trim();
    if (!text) return;
    
    // Show the result section and hide form
    showQRResult();
    
    // Calculate QR size based on screen size
    const screenWidth = window.innerWidth;
    const maxQRSize = Math.min(400, screenWidth * 0.8);
    const qrSize = Math.max(200, Math.min(maxQRSize, 400));
    
    const margin = 0;
    const fontSize = Math.max(16, Math.min(22, qrSize / 18));
    const options = { 
      errorCorrectionLevel: 'H', 
      width: qrSize, 
      margin,
      color: {
        dark: '#2D3748',
        light: '#FFFFFF'
      }
    };

    QRCode.toDataURL(text, options, (err, url) => {
      if (err) return console.error(err);
      const img = new Image();
      img.onload = () => {
        const dpr = window.devicePixelRatio || 1;
        const padding = Math.max(16, qrSize / 25);
        const tagHeight = tag ? fontSize + 30 : 0;
        const borderRadius = Math.max(12, qrSize / 25);
        const totalW = qrSize + padding * 2;
        const totalH = qrSize + tagHeight + padding * 2;
        
        // High-resolution canvas
        canvas.width = totalW * dpr;
        canvas.height = totalH * dpr;
        
        // 确保canvas保持原始比例，适配屏幕大小
        canvas.style.width = '';
        canvas.style.height = '';
        canvas.style.maxWidth = 'min(400px, 90vw)';
        canvas.style.width = '100%';
        canvas.style.height = 'auto';
        
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        
        // Pure white background
        ctx.fillStyle = '#FFFFFF';
        
        // Rounded background
        ctx.beginPath();
        ctx.moveTo(borderRadius, 0);
        ctx.lineTo(totalW - borderRadius, 0);
        ctx.quadraticCurveTo(totalW, 0, totalW, borderRadius);
        ctx.lineTo(totalW, totalH - borderRadius);
        ctx.quadraticCurveTo(totalW, totalH, totalW - borderRadius, totalH);
        ctx.lineTo(borderRadius, totalH);
        ctx.quadraticCurveTo(0, totalH, 0, totalH - borderRadius);
        ctx.lineTo(0, borderRadius);
        ctx.quadraticCurveTo(0, 0, borderRadius, 0);
        ctx.fill();
        
        // Shadow effect
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetY = 10;
        
        // QR code with rounded corners
        ctx.save();
        const qrRadius = Math.max(8, borderRadius / 2);
        const qrX = padding;
        const qrY = padding;
        
        ctx.beginPath();
        ctx.moveTo(qrX + qrRadius, qrY);
        ctx.lineTo(qrX + qrSize - qrRadius, qrY);
        ctx.quadraticCurveTo(qrX + qrSize, qrY, qrX + qrSize, qrY + qrRadius);
        ctx.lineTo(qrX + qrSize, qrY + qrSize - qrRadius);
        ctx.quadraticCurveTo(qrX + qrSize, qrY + qrSize, qrX + qrSize - qrRadius, qrY + qrSize);
        ctx.lineTo(qrX + qrRadius, qrY + qrSize);
        ctx.quadraticCurveTo(qrX, qrY + qrSize, qrX, qrY + qrSize - qrRadius);
        ctx.lineTo(qrX, qrY + qrRadius);
        ctx.quadraticCurveTo(qrX, qrY, qrX + qrRadius, qrY);
        ctx.clip();
        
        ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
        ctx.restore();
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        
        // Tag text with modern styling
        if (tag) {
          ctx.fillStyle = '#4A5568';
          ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans SC", "PingFang SC", "Microsoft YaHei", monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const textX = totalW / 2;
          const textY = padding + qrSize + tagHeight / 2 + 5;
          ctx.fillText(tag, textX, textY);
        }
        
        downloadBtn.disabled = false;
        
        // 将canvas转换为图片并显示
        const imageDataUrl = canvas.toDataURL('image/png');
        qrImage.src = imageDataUrl;
        qrImage.style.display = 'block';
        canvas.style.display = 'none';
      };
      img.src = url;
    });
  }

  // Setup event listeners
  generateBtn.addEventListener('click', renderQR);

  // New QR Code button - show form again and clear inputs
  newQrBtn?.addEventListener('click', () => {
    showFormSection();
    textInput.value = '';
    tagInput.value = '';
    downloadBtn.disabled = true;
    textInput.focus();
  });

  downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'qrcode.png';
    link.href = canvas.toDataURL();
    link.click();
  });

  // Allow Enter key to generate QR code
  textInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      renderQR();
    }
  });

  tagInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      renderQR();
    }
  });

  // Handle window resize to update QR size
  window.addEventListener('resize', () => {
    // If QR is currently displayed, regenerate with new size
    if (document.getElementById('qrResult').style.display === 'block' && textInput.value.trim()) {
      setTimeout(renderQR, 100); // Small delay to ensure resize is complete
    }
  });
}

// Make the initialization function available globally for coordination
window.initializeBundleApp = initializeApp;

// Check if page is ready, otherwise wait
if (window.pageReady) {
  // Page is already ready, initialize immediately
  initializeApp();
} else {
  // Wait for page ready signal or use fallback timing
  const checkPageReady = () => {
    if (window.pageReady) {
      initializeApp();
    } else {
      setTimeout(checkPageReady, 10); // Check every 10ms
    }
  };
  
  // Start checking, but also have a fallback timeout
  setTimeout(() => {
    if (!window.pageReady) {
      console.log('Fallback: initializing bundle app after timeout');
      initializeApp();
    }
  }, 200); // Fallback after 200ms
  
  checkPageReady();
}