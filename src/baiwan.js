// Simplified Bitcoin progress tracker - only progress bar
import html2canvas from 'html2canvas';

let currentPrice = 0;
const targetPrice = 1000000; // 一百万人民币
let updateInterval;
let timeInterval;

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

// Format current time
function formatCurrentTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  
  return `（${year}-${month}-${day} ${hour}:${minute}）`;
}

// Update current time display
function updateCurrentTime() {
  const currentTimeElement = document.getElementById('currentTime');
  if (currentTimeElement) {
    currentTimeElement.textContent = formatCurrentTime();
  }
}

// Convert SVG to image for better html2canvas compatibility
function convertSVGToImg(svgElement) {
  return new Promise((resolve, reject) => {
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(svgUrl);
      resolve(img);
    };
    img.onerror = reject;
    img.src = svgUrl;
  });
}

// Download screenshot functionality
async function downloadScreenshot() {
  const downloadBtn = document.getElementById('downloadBtn');
  const originalHTML = downloadBtn.innerHTML;
  
  try {
    // Show loading state
    downloadBtn.classList.add('downloading');
    downloadBtn.innerHTML = `
      <svg class="download-icon" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/>
      </svg>
    `;
    
    // Wait for any ongoing animations to complete
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Pre-process SVG images
    const svgElements = document.querySelectorAll('svg');
    const svgProcessPromises = Array.from(svgElements).map(async (svg) => {
      if (svg.closest('.download-button')) return; // Skip download button SVG
      
      try {
        const img = await convertSVGToImg(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = svg.getBoundingClientRect().width * 2;
        canvas.height = svg.getBoundingClientRect().height * 2;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Replace SVG with canvas temporarily
        const dataURL = canvas.toDataURL('image/png');
        const replacement = document.createElement('img');
        replacement.src = dataURL;
        replacement.style.width = svg.style.width || svg.getBoundingClientRect().width + 'px';
        replacement.style.height = svg.style.height || svg.getBoundingClientRect().height + 'px';
        replacement.className = 'svg-replacement';
        
        svg.parentNode.replaceChild(replacement, svg);
        
        return { original: svg, replacement };
      } catch (error) {
        console.warn('SVG processing failed:', error);
        return null;
      }
    });
    
    const svgReplacements = (await Promise.all(svgProcessPromises)).filter(Boolean);
    
    // Configure html2canvas options for square output
    const squareSize = 800; // Square dimensions for mobile-friendly viewing
    const options = {
      backgroundColor: '#0f1419', // Use page background color
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
      width: squareSize,
      height: squareSize,
      scrollX: 0,
      scrollY: 0,
      ignoreElements: (element) => {
        // Ignore download button and its contents
        return element.closest('.download-button') !== null;
      },
      onclone: (clonedDoc) => {
        // Ensure cloned document has the same styling
        const clonedBody = clonedDoc.body;
        clonedBody.style.margin = '0';
        clonedBody.style.padding = '20px';
        clonedBody.style.background = 'linear-gradient(135deg, #0f1419, #1a1f2e)';
        clonedBody.style.minHeight = squareSize + 'px';
        clonedBody.style.width = squareSize + 'px';
        clonedBody.style.display = 'flex';
        clonedBody.style.alignItems = 'center';
        clonedBody.style.justifyContent = 'center';
        
        // Remove download button from clone
        const clonedBtn = clonedDoc.getElementById('downloadBtn');
        if (clonedBtn) {
          clonedBtn.remove();
        }
        
        // Adjust content container for square format
        const contentContainer = clonedDoc.querySelector('.content-container');
        if (contentContainer) {
          contentContainer.style.position = 'relative';
          contentContainer.style.zIndex = '1';
          contentContainer.style.maxWidth = (squareSize - 80) + 'px';
          contentContainer.style.padding = '20px';
        }
      }
    };
    
    // Generate canvas from the entire body for square format
    const canvas = await html2canvas(document.body, options);
    
    // Restore SVG elements
    svgReplacements.forEach(({ original, replacement }) => {
      replacement.parentNode.replaceChild(original, replacement);
    });
    
    // Create download link
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    link.download = `一币一百万_${timestamp}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show success state
    downloadBtn.innerHTML = `
      <svg class="download-icon" viewBox="0 0 24 24">
        <path d="M20 6L9 17l-5-5"/>
      </svg>
    `;
    
    // Reset after 2 seconds
    setTimeout(() => {
      downloadBtn.classList.remove('downloading');
      downloadBtn.innerHTML = originalHTML;
    }, 2000);
    
  } catch (error) {
    console.error('Screenshot failed:', error);
    
    // Show error state
    downloadBtn.innerHTML = `
      <svg class="download-icon" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    `;
    
    // Reset after 2 seconds
    setTimeout(() => {
      downloadBtn.classList.remove('downloading');
      downloadBtn.innerHTML = originalHTML;
    }, 2000);
  }
}

// Make download function available globally
window.downloadScreenshot = downloadScreenshot;

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
  updateCurrentTime(); // Initial time update
  
  if (updateInterval) {
    clearInterval(updateInterval);
  }
  if (timeInterval) {
    clearInterval(timeInterval);
  }
  
  updateInterval = setInterval(updatePrice, 30000); // Update every 30 seconds
  timeInterval = setInterval(updateCurrentTime, 60000); // Update time every minute
}

// Stop updates
function stopUpdates() {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
  if (timeInterval) {
    clearInterval(timeInterval);
    timeInterval = null;
  }
}

// Initialize
function init() {
  startUpdates();
  
  // Pause updates when page is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopUpdates();
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