// QR generation script
const QRCode = require('qrcode');

// Language support
const translations = {
  en: {
    title: 'QR Code Generator',
    textLabel: 'Text/URL',
    textPlaceholder: 'Enter text or URL',
    tagLabel: 'Tag (Optional)',
    tagPlaceholder: 'Enter tag for organizing',
    generateBtn: 'Generate QR',
    downloadBtn: 'Download PNG'
  },
  zh: {
    title: '二维码生成器',
    textLabel: '文本/网址',
    textPlaceholder: '输入文本、中文或网址',
    tagLabel: '标签 (可选)',
    tagPlaceholder: '输入标签便于整理',
    generateBtn: '生成二维码',
    downloadBtn: '下载图片'
  }
};

let currentLanguage = localStorage.getItem('qr-language') || 'en';

// Language switching function
function toggleLanguage() {
  currentLanguage = currentLanguage === 'en' ? 'zh' : 'en';
  localStorage.setItem('qr-language', currentLanguage);
  updateLanguage();
}

function updateLanguage() {
  console.log('Updating language to:', currentLanguage);
  const langToggle = document.querySelector('.language-toggle');
  if (langToggle) {
    langToggle.textContent = currentLanguage === 'en' ? '中文' : 'English';
    console.log('Language toggle button updated:', langToggle.textContent);
  } else {
    console.error('Language toggle button not found');
  }

  // Update all elements with data-i18n attributes
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (translations[currentLanguage][key]) {
      element.textContent = translations[currentLanguage][key];
    }
  });

  // Update placeholders
  const textInput = document.getElementById('text');
  const tagInput = document.getElementById('tag');
  if (textInput) {
    textInput.placeholder = translations[currentLanguage].textPlaceholder;
  }
  if (tagInput) {
    tagInput.placeholder = translations[currentLanguage].tagPlaceholder;
  }

  // Update page title
  document.title = translations[currentLanguage].title;
}

// Make toggleLanguage available globally
window.toggleLanguage = toggleLanguage;

document.addEventListener('DOMContentLoaded', () => {
  // Initialize language on page load
  console.log('QR Generator loaded, current language:', currentLanguage);
  updateLanguage();
  
  const textInput = document.getElementById('text');
  const tagInput = document.getElementById('tag');
  const generateBtn = document.getElementById('generate');
  const downloadBtn = document.getElementById('download');
  const canvas = document.getElementById('qr-canvas');
  const qrResult = document.getElementById('qr-result');

  function renderQR() {
    const text = textInput.value.trim();
    const tag = tagInput.value.trim();
    if (!text) return;
    
    // Modern QR styling
    const qrSize = 400;
    const margin = 0;
    const fontSize = 22;
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
        const padding = 32;
        const tagHeight = tag ? fontSize + 30 : 0;
        const borderRadius = 24;
        const totalW = qrSize + padding * 2;
        const totalH = qrSize + tagHeight + padding * 2;
        
        // High-resolution canvas
        canvas.width = totalW * dpr;
        canvas.height = totalH * dpr;
        
        // 确保canvas保持原始比例，不设置固定的style尺寸
        canvas.style.width = '';
        canvas.style.height = '';
        canvas.style.maxWidth = '100%';
        canvas.style.height = 'auto';
        
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        
        // Gradient background
        const gradient = ctx.createLinearGradient(0, 0, totalW, totalH);
        gradient.addColorStop(0, '#F7FAFC');
        gradient.addColorStop(1, '#EDF2F7');
        ctx.fillStyle = gradient;
        
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
        const qrRadius = 16;
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
        qrResult.classList.add('show');
      };
      img.src = url;
    });
  }

  generateBtn.addEventListener('click', renderQR);

  downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    const filename = tagInput.value.trim() || 'qrcode';
    link.download = `${filename}.png`;
    link.click();
  });

  // Add click event for fullscreen view
  canvas.addEventListener('click', () => {
    openModal();
  });
});

// 全屏模态框函数
function openModal() {
  const canvas = document.getElementById('qr-canvas');
  const modalOverlay = document.getElementById('modal-overlay');
  const modalCanvas = document.getElementById('modal-canvas');
  
  if (canvas && modalCanvas) {
    // 复制原始canvas到模态框canvas
    modalCanvas.width = canvas.width;
    modalCanvas.height = canvas.height;
    const modalCtx = modalCanvas.getContext('2d');
    modalCtx.drawImage(canvas, 0, 0);
    
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal() {
  const modalOverlay = document.getElementById('modal-overlay');
  modalOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

// 将函数暴露到全局作用域
window.openModal = openModal;
window.closeModal = closeModal;

// 按ESC键关闭模态框
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
  }
});