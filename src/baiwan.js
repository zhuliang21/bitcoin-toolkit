// Simplified Bitcoin progress tracker - only progress bar
let currentPrice = 0;
const targetPrice = 1000000; // 一百万人民币
let updateInterval;

// Fetch Bitcoin price in CNY
async function fetchBitcoinPrice() {
  try {
    // Try multiple API sources
    const apis = [
      {
        url: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=cny',
        parse: (data) => data.bitcoin.cny
      },
      {
        url: 'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT',
        parse: async (data) => {
          const btcusd = parseFloat(data.price);
          // Get USD/CNY exchange rate
          const exchangeResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
          const exchangeData = await exchangeResponse.json();
          return btcusd * exchangeData.rates.CNY;
        }
      }
    ];

    for (const api of apis) {
      try {
        const response = await fetch(api.url);
        if (!response.ok) continue;
        
        const data = await response.json();
        const price = await api.parse(data);
        
        if (price && price > 0) {
          return price;
        }
      } catch (error) {
        console.warn(`API ${api.url} failed:`, error);
        continue;
      }
    }
    
    throw new Error('All price APIs failed');
  } catch (error) {
    console.error('Error fetching Bitcoin price:', error);
    throw error;
  }
}

// Calculate progress percentage
function calculateProgress(currentPrice, targetPrice) {
  return Math.min((currentPrice / targetPrice) * 100, 100);
}

// Format number for progress percentage
function formatNumber(num) {
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(num);
}

// Format price in millions
function formatPriceInMillions(price) {
  const millions = price / 1000000;
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  }).format(millions);
}

// Update progress bar and price display
function updateDisplay() {
  if (!currentPrice) return;

  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const currentPriceElement = document.getElementById('currentPrice');

  if (!progressBar || !progressText || !currentPriceElement) return;

  const progress = calculateProgress(currentPrice, targetPrice);

  // Update progress bar
  progressBar.style.width = `${progress}%`;
  
  if (progress >= 100) {
    progressText.textContent = '目标达成! 🎉';
  } else {
    progressText.textContent = `${formatNumber(progress)}%`;
  }

  // Update current price display
  const priceInMillions = formatPriceInMillions(currentPrice);
  currentPriceElement.textContent = `人民币现价：${priceInMillions} 百万`;
}

// Update price and progress
async function updatePrice() {
  try {
    const price = await fetchBitcoinPrice();
    currentPrice = price;
    updateDisplay();
  } catch (error) {
    console.error('Failed to update price:', error);
    // Show error in progress text and price
    const progressText = document.getElementById('progressText');
    const currentPriceElement = document.getElementById('currentPrice');
    if (progressText) {
      progressText.textContent = '加载失败';
    }
    if (currentPriceElement) {
      currentPriceElement.textContent = '加载失败';
    }
  }
}

// Start periodic updates
function startUpdates() {
  updatePrice(); // Initial update
  
  if (updateInterval) {
    clearInterval(updateInterval);
  }
  updateInterval = setInterval(updatePrice, 30000); // Update every 30 seconds
}

// Initialize
function init() {
  startUpdates();
  
  // Pause updates when page is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
      }
    } else {
      startUpdates();
    }
  });
}

// Start when DOM is ready
if (document.readyState !== 'loading') {
  init();
} else {
  document.addEventListener('DOMContentLoaded', init);
}