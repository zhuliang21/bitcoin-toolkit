// Index page internationalization
const translations = {
  en: {
    mainTitle: '🔧 Bitcoin Toolkit',
    mainSubtitle: 'Open-source, pure frontend tools - Use at your own risk',
    securityNotice: 'For educational and testing purposes only. Use at your own risk.',
    qrTitle: 'QR Code Generator',
    qrDesc: 'Create QR codes for text and URLs with instant download.',
    priceTitle: 'Price Tracker',
    priceDesc: 'Track Bitcoin prices with real-time updates and alerts.',
    marketCapTitle: 'Market Cap Comparison',
    marketCapDesc: 'Compare Bitcoin\'s market cap with major tech companies like Apple, Google, and Amazon.',
    footerText: '© 2024 Bitcoin Toolkit. All rights reserved.'
  },
  zh: {
    mainTitle: '🔧 比特币工具包',
    mainSubtitle: '开源纯前端工具 - 风险自负',
    securityNotice: '仅供教育和测试目的使用，风险自负。',
    qrTitle: '二维码生成器',
    qrDesc: '为文本和网址创建二维码，支持即时下载。',
    priceTitle: '价格追踪器',
    priceDesc: '实时更新和提醒追踪比特币价格。',
    marketCapTitle: '市值比较',
    marketCapDesc: '将比特币的市值与苹果、谷歌和亚马逊等主要科技公司进行比较。',
    footerText: '© 2024 比特币工具包。保留所有权利。'
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
  
  // Update document title
  document.title = translations[currentLanguage].mainTitle;
  
  // Update document language attribute
  document.documentElement.lang = currentLanguage;

  // Add loaded class once language has been updated to avoid layout shift
  if (!document.documentElement.classList.contains('loaded')) {
    document.documentElement.classList.add('loaded');
    document.body.classList.add('loaded');
  }
}

// Make toggleLanguage available globally
window.toggleLanguage = toggleLanguage;

// Initialize app
function initializeApp() {
  // Initialize language immediately
  updateLanguage();
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
      console.log('Fallback: initializing index app after timeout');
      initializeApp();
    }
  }, 200); // Fallback after 200ms
  
  checkPageReady();
}

// Immediately update language once script is executed (DOM already parsed when script is at the end)
if (document.readyState !== 'loading') {
  updateLanguage();
} else {
  document.addEventListener('DOMContentLoaded', updateLanguage);
} 