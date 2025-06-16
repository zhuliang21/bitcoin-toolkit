// Index page internationalization
const translations = {
  en: {
    mainTitle: '🔧 Bitcoin Toolkit',
    mainSubtitle: 'Essential tools for Bitcoin development and testing',
    securityNotice: 'For educational and testing purposes only. Use at your own risk.',
    brainWalletTitle: 'Brain Wallet Generator',
    brainWalletDesc: 'Generate Bitcoin wallets from memorable text using deterministic algorithms.',
    qrTitle: 'QR Code Generator',
    qrDesc: 'Create QR codes for text and URLs with instant download.',
    bbqrHelperTitle: 'BBQr Helper',
    bbqrHelperDesc: 'Complete PSBT to ColdCard to Broadcast workflow with BBQr codes.',
    priceTitle: 'Price Tracker',
    priceDesc: 'Track Bitcoin prices with real-time updates and alerts.',
    footerText: '© 2024 Bitcoin Toolkit. All rights reserved.'
  },
  zh: {
    mainTitle: '🔧 比特币工具包',
    mainSubtitle: '比特币开发和测试的必备工具',
    securityNotice: '仅供教育和测试目的使用，风险自负。',
    brainWalletTitle: '脑钱包生成器',
    brainWalletDesc: '使用确定性算法从可记忆的文本生成比特币钱包。',
    qrTitle: '二维码生成器',
    qrDesc: '为文本和网址创建二维码，支持即时下载。',
    bbqrHelperTitle: 'BBQr 助手',
    bbqrHelperDesc: '完整的 PSBT 到 ColdCard 到广播工作流程，使用 BBQr 码。',
    priceTitle: '价格追踪器',
    priceDesc: '实时更新和提醒追踪比特币价格。',
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
    langToggle.textContent = currentLanguage === 'en' ? '中文' : 'ENG';
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