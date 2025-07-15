// Bitcoin to 1 Million CNY Progress Tracker
const TARGET_PRICE_CNY = 1000000; // 1 million CNY

// Translations
const translations = {
  en: {
    title: 'Bitcoin to 1 Million CNY Progress',
    subtitle: 'Tracking Bitcoin\'s journey to ¥1,000,000',
    currentPrice: 'Current Price',
    targetPrice: 'Target Price',
    remaining: 'Remaining',
    progressPercent: 'Progress',
    toTarget: 'to target',
    priceInUSD: 'Price in USD',
    exchangeRate: 'CNY/USD Rate',
    neededGrowth: 'Needed Growth',
    increase: 'increase',
    lastUpdate: 'Last updated: ',
    loading: 'Loading Bitcoin price data...',
    error: 'Failed to load price data. Please try again.',
    retry: 'Retry'
  },
  zh: {
    title: '比特币百万人民币进度',
    subtitle: '追踪比特币到达¥1,000,000的进程',
    currentPrice: '当前价格',
    targetPrice: '目标价格',
    remaining: '还需要',
    progressPercent: '进度',
    toTarget: '到目标',
    priceInUSD: '美元价格',
    exchangeRate: '人民币汇率',
    neededGrowth: '需要增长',
    increase: '增长',
    lastUpdate: '最后更新: ',
    loading: '正在加载比特币价格数据...',
    error: '加载价格数据失败，请重试。',
    retry: '重试'
  }
};

let currentLanguage = localStorage.getItem('language') || 'en';
let updateInterval;

// Language switching
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
}

// Format number with commas
function formatNumber(num) {
  return num.toLocaleString();
}

// Format currency
function formatCurrency(amount, currency = 'CNY') {
  if (currency === 'CNY') {
    return `¥${formatNumber(Math.round(amount))}`;
  } else if (currency === 'USD') {
    return `$${formatNumber(Math.round(amount))}`;
  }
  return formatNumber(Math.round(amount));
}

// Fetch Bitcoin price in USD
async function fetchBitcoinPrice() {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
    const data = await response.json();
    return data.bitcoin.usd;
  } catch (error) {
    console.error('Error fetching Bitcoin price:', error);
    throw error;
  }
}

// Fetch USD to CNY exchange rate
async function fetchExchangeRate() {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await response.json();
    return data.rates.CNY;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    // Fallback to approximate rate if API fails
    return 7.2;
  }
}

// Calculate progress and update UI
function updateProgress(btcPriceUSD, exchangeRate) {
  const btcPriceCNY = btcPriceUSD * exchangeRate;
  const progress = (btcPriceCNY / TARGET_PRICE_CNY) * 100;
  const remaining = TARGET_PRICE_CNY - btcPriceCNY;
  const neededGrowth = ((TARGET_PRICE_CNY - btcPriceCNY) / btcPriceCNY) * 100;

  // Update current price
  document.getElementById('currentPrice').textContent = formatCurrency(btcPriceCNY);
  
  // Update remaining amount
  document.getElementById('remaining').textContent = formatCurrency(remaining);
  
  // Update progress bar
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const clampedProgress = Math.min(progress, 100);
  
  progressBar.style.width = `${clampedProgress}%`;
  progressText.textContent = `${progress.toFixed(2)}%`;
  
  // Update stats cards
  document.getElementById('progressPercent').textContent = `${progress.toFixed(2)}%`;
  document.getElementById('priceUSD').textContent = formatCurrency(btcPriceUSD, 'USD');
  document.getElementById('exchangeRate').textContent = exchangeRate.toFixed(2);
  document.getElementById('neededGrowth').textContent = `${neededGrowth.toFixed(1)}%`;
  
  // Update last update time
  const now = new Date();
  const timeString = now.toLocaleTimeString();
  document.getElementById('lastUpdateTime').textContent = timeString;
}

// Show error message
function showError() {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('content').style.display = 'none';
  document.getElementById('error').style.display = 'block';
}

// Show content
function showContent() {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('error').style.display = 'none';
  document.getElementById('content').style.display = 'block';
}

// Main data fetching function
async function fetchData() {
  try {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('error').style.display = 'none';
    document.getElementById('content').style.display = 'none';
    
    // Fetch both Bitcoin price and exchange rate in parallel
    const [btcPriceUSD, exchangeRate] = await Promise.all([
      fetchBitcoinPrice(),
      fetchExchangeRate()
    ]);
    
    updateProgress(btcPriceUSD, exchangeRate);
    showContent();
    
  } catch (error) {
    console.error('Error fetching data:', error);
    showError();
  }
}

// Auto-refresh data every 30 seconds
function startAutoRefresh() {
  updateInterval = setInterval(fetchData, 30000);
}

function stopAutoRefresh() {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
}

// Initialize page
function init() {
  updateLanguage();
  fetchData();
  startAutoRefresh();
  
  // Handle visibility change to pause/resume updates
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      stopAutoRefresh();
    } else {
      startAutoRefresh();
    }
  });
}

// Start when page loads
document.addEventListener('DOMContentLoaded', init);

// Handle page unload
window.addEventListener('beforeunload', stopAutoRefresh);

// Global functions for HTML onclick handlers
window.toggleLanguage = toggleLanguage;
window.fetchData = fetchData; 