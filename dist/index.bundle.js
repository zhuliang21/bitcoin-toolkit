/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/***/ (() => {

eval("// Index page internationalization\nvar translations = {\n  en: {\n    mainTitle: '🔧 Bitcoin Toolkit',\n    mainSubtitle: 'Essential tools for Bitcoin development and testing',\n    securityNotice: 'For educational and testing purposes only. Use at your own risk.',\n    brainWalletTitle: 'Brain Wallet Generator',\n    brainWalletDesc: 'Generate Bitcoin wallets from memorable text using deterministic algorithms.',\n    qrTitle: 'QR Code Generator',\n    qrDesc: 'Create QR codes for text and URLs with instant download.',\n    bbqrHelperTitle: 'BBQr Helper',\n    bbqrHelperDesc: 'Complete PSBT to ColdCard to Broadcast workflow with BBQr codes.',\n    priceTitle: 'Price Tracker',\n    priceDesc: 'Track Bitcoin prices with real-time updates and alerts.',\n    footerText: '© 2024 Bitcoin Toolkit. All rights reserved.'\n  },\n  zh: {\n    mainTitle: '🔧 比特币工具包',\n    mainSubtitle: '比特币开发和测试的必备工具',\n    securityNotice: '仅供教育和测试目的使用，风险自负。',\n    brainWalletTitle: '脑钱包生成器',\n    brainWalletDesc: '使用确定性算法从可记忆的文本生成比特币钱包。',\n    qrTitle: '二维码生成器',\n    qrDesc: '为文本和网址创建二维码，支持即时下载。',\n    bbqrHelperTitle: 'BBQr 助手',\n    bbqrHelperDesc: '完整的 PSBT 到 ColdCard 到广播工作流程，使用 BBQr 码。',\n    priceTitle: '价格追踪器',\n    priceDesc: '实时更新和提醒追踪比特币价格。',\n    footerText: '© 2024 比特币工具包。保留所有权利。'\n  }\n};\nvar currentLanguage = localStorage.getItem('language') || 'en';\n\n// Language switching function\nfunction toggleLanguage() {\n  currentLanguage = currentLanguage === 'en' ? 'zh' : 'en';\n  localStorage.setItem('language', currentLanguage);\n  updateLanguage();\n}\nfunction updateLanguage() {\n  var langToggle = document.querySelector('.language-toggle');\n  if (langToggle) {\n    langToggle.textContent = currentLanguage === 'en' ? '中文' : 'ENG';\n  }\n\n  // Update all elements with data-i18n attributes\n  document.querySelectorAll('[data-i18n]').forEach(function (element) {\n    var key = element.getAttribute('data-i18n');\n    if (translations[currentLanguage][key]) {\n      element.textContent = translations[currentLanguage][key];\n    }\n  });\n\n  // Update document title\n  document.title = translations[currentLanguage].mainTitle;\n\n  // Update document language attribute\n  document.documentElement.lang = currentLanguage;\n}\n\n// Make toggleLanguage available globally\nwindow.toggleLanguage = toggleLanguage;\n\n// Initialize app\nfunction initializeApp() {\n  // Initialize language immediately\n  updateLanguage();\n}\n\n// Make the initialization function available globally for coordination\nwindow.initializeBundleApp = initializeApp;\n\n// Check if page is ready, otherwise wait\nif (window.pageReady) {\n  // Page is already ready, initialize immediately\n  initializeApp();\n} else {\n  // Wait for page ready signal or use fallback timing\n  var _checkPageReady = function checkPageReady() {\n    if (window.pageReady) {\n      initializeApp();\n    } else {\n      setTimeout(_checkPageReady, 10); // Check every 10ms\n    }\n  };\n\n  // Start checking, but also have a fallback timeout\n  setTimeout(function () {\n    if (!window.pageReady) {\n      console.log('Fallback: initializing index app after timeout');\n      initializeApp();\n    }\n  }, 200); // Fallback after 200ms\n\n  _checkPageReady();\n}\n\n//# sourceURL=webpack://bitcoin-toolkit/./src/index.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./src/index.js"]();
/******/ 	
/******/ })()
;