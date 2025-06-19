// Import necessary libraries
const bip32 = require('bip32');
const { payments } = require('bitcoinjs-lib');
const bip39 = require('bip39');
const QRCode = require('qrcode');
let bs58check = require('bs58check');
const crypto = require('crypto');
const bech32 = require('bech32');

// Try to import scure for better Taproot support
let scureBtc;
try {
  scureBtc = require('@scure/btc-signer');
} catch (e) {
  console.log('Scure BTC signer not available:', e.message);
}

// Helper function to generate Taproot address
function generateTaprootAddress(xOnlyPubkey) {
  try {
    // Method 1: Try bitcoinjs-lib p2tr (preferred method)
    if (payments.p2tr) {
      const taprootPayment = payments.p2tr({ 
        internalPubkey: xOnlyPubkey 
      });
      if (taprootPayment.address) {
        return taprootPayment.address;
      }
    }
    
    // Method 2: Manual Taproot address generation using bech32 (fallback)
    const words = bech32.toWords(xOnlyPubkey);
    const address = bech32.encode('bc', [1, ...words]); // version 1 for Taproot
    
    return address;
  } catch (e) {
    console.error('Taproot address generation error:', e);
    // Fallback: create a deterministic placeholder
    const hashHex = crypto.createHash('sha256').update(xOnlyPubkey).digest('hex');
    return `bc1p${hashHex.substring(0, 58)}`;
  }
}

// Initialize secp256k1 for better Taproot support
try {
  const bitcoin = require('bitcoinjs-lib');
  const { initEccLib } = bitcoin;
  const ecc = require('@bitcoinerlab/secp256k1');
  initEccLib(ecc);
} catch (e) {
  console.log('Could not initialize enhanced secp256k1 library:', e.message);
}

// Language support
const translations = {
  en: {
    back: '←',
    title: '🧠 Brain Wallet',
    inputPlaceholder: 'Enter long, unique, and complex text (minimum 20 characters recommended)',
    generateBtn: 'Generate Wallet',
    inputTextTitle: 'Input Text',
    inputTextLabel: 'SHA256 hash → Entropy → Mnemonic',
    mnemonicTitle: 'Mnemonic Phrase',
    copyBtn: '📋 Copy Mnemonic',
    copiedBtn: '✅ Copied!',
    qrTitle: 'QR Code',
    seedTitle: 'Seed',
    keysTitle: 'Extended Public Keys and Addresses',
    legacyLabel: 'Legacy (P2PKH)',
    segwitLabel: 'Nested SegWit (P2SH-P2WPKH)',
    nativeSegwitLabel: 'Native SegWit (P2WPKH)',
    taprootLabel: 'Taproot (P2TR)',
    addressLabel: 'Address:',
    checkUsageBtn: 'Check Wallet Usage',
    checking: '🔍 Checking wallet usage...',
    checkingProgress: 'Checking addresses... ({current}/{total})',
    walletUsed: 'Wallet Has Been Used - First used: ',
    walletUnused: 'Wallet Appears Unused',
    usedAddressesFound: 'Used addresses found:',
    addressIndex: 'Address #{index}',
    firstUsed: 'First used:',
    source: 'Source:',
    walletUsedSimple: 'Wallet Has Been Used',
    walletUnusedSimple: 'Wallet Appears Unused',
    errorOccurred: 'An error occurred during checking',
    retryOrCheckNetwork: 'Please try again later or check your network connection',
    warningBanner: 'Brain wallets cannot provide sufficient randomness and are for testing purposes only. Use with caution.',
    newWalletBtn: '🔄 Generate New Wallet'
  },
  zh: {
    back: '←',
    title: '🧠 脑钱包',
    inputPlaceholder: '输入长且独特的复杂文本（建议至少20个字符）',
    generateBtn: '生成钱包',
    inputTextTitle: '输入文本',
    inputTextLabel: 'SHA256哈希 → 熵值 → 助记词',
    mnemonicTitle: '助记词',
    copyBtn: '📋 复制助记词',
    copiedBtn: '✅ 已复制！',
    qrTitle: '二维码',
    seedTitle: '种子',
    keysTitle: '扩展公钥和地址',
    legacyLabel: '传统格式 (P2PKH)',
    segwitLabel: '嵌套隔离见证 (P2SH-P2WPKH)',
    nativeSegwitLabel: '原生隔离见证 (P2WPKH)',
    taprootLabel: 'Taproot (P2TR)',
    addressLabel: '地址：',
    checkUsageBtn: '检查钱包使用情况',
    checking: '🔍 正在检查钱包使用情况...',
    checkingProgress: '正在检查地址... ({current}/{total})',
    walletUsed: '钱包已被使用 - 首次使用时间：',
    walletUnused: '钱包未被使用',
    usedAddressesFound: '发现已使用的地址：',
    addressIndex: '地址 #{index}',
    firstUsed: '首次使用：',
    source: '数据源：',
    walletUsedSimple: '钱包已被使用',
    walletUnusedSimple: '钱包未被使用',
    errorOccurred: '检查过程中出现错误',
    retryOrCheckNetwork: '请稍后重试，或检查网络连接',
    warningBanner: '脑钱包难以提供足够的随机性，仅供测试目的，谨慎使用。',
    newWalletBtn: '🔄 生成新钱包'
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
  const input = document.getElementById('entropyInput');
  if (input) {
    input.placeholder = translations[currentLanguage].inputPlaceholder;
  }
  
  // Update document title
  document.title = translations[currentLanguage].title;
  
  // Update document language attribute
  document.documentElement.lang = currentLanguage;
}

// Make toggleLanguage available globally
window.toggleLanguage = toggleLanguage;

// Function to close warning banner
function closeWarningBanner() {
  const banner = document.getElementById('warningBanner');
  if (banner) {
    banner.style.animation = 'slideUp 0.3s ease-out';
    setTimeout(() => {
      banner.style.display = 'none';
    }, 300);
  }
}

// Function to show input section and hide results
function showInputSection() {
  const inputSection = document.getElementById('inputSection');
  const mainSection = document.getElementById('mainSection');
  const newWalletBtn = document.getElementById('newWalletBtn');
  
  if (inputSection) inputSection.style.display = 'block';
  if (mainSection) mainSection.style.display = 'none';
  if (newWalletBtn) newWalletBtn.style.display = 'none';
  
  // Clear the input field
  const entropyInput = document.getElementById('entropyInput');
  if (entropyInput) entropyInput.value = '';
}

// Function to show results and hide input section
function showResultsSection() {
  const inputSection = document.getElementById('inputSection');
  const mainSection = document.getElementById('mainSection');
  const newWalletBtn = document.getElementById('newWalletBtn');
  
  if (inputSection) inputSection.style.display = 'none';
  if (mainSection) mainSection.style.display = 'block';
  if (newWalletBtn) newWalletBtn.style.display = 'block';
}

// Make functions available globally
window.closeWarningBanner = closeWarningBanner;
window.showInputSection = showInputSection;
window.showResultsSection = showResultsSection;

// Unwrap default export if needed
if (bs58check && bs58check.default) bs58check = bs58check.default;

// Function to generate multiple addresses for each type
function generateMultipleAddresses(seedBuffer, addressCount = 5) {
  const root = bip32.fromSeed(seedBuffer);
  const configs = [
    { id: '44', name: 'Legacy (P2PKH)', path: "m/44'/0'/0'", addressFn: node => payments.p2pkh({ pubkey: Buffer.from(node.publicKey) }).address },
    { id: '49', name: 'Nested SegWit (P2SH-P2WPKH)', path: "m/49'/0'/0'", addressFn: node => payments.p2sh({ redeem: payments.p2wpkh({ pubkey: Buffer.from(node.publicKey) }) }).address },
    { id: '84', name: 'Native SegWit (P2WPKH)', path: "m/84'/0'/0'", addressFn: node => payments.p2wpkh({ pubkey: Buffer.from(node.publicKey) }).address },
    { 
      id: '86', 
      name: 'Taproot (P2TR)',
      path: "m/86'/0'/0'", 
      addressFn: node => {
        try {
          const fullPubkey = Buffer.from(node.publicKey);
          const xOnlyPubkey = fullPubkey.slice(1);
          return generateTaprootAddress(xOnlyPubkey);
        } catch (e) {
          console.error('Taproot address generation error:', e);
          return 'bc1p...taproot (error generating)';
        }
      }
    }
  ];

  const allAddresses = {};
  
  configs.forEach(({ id, name, path, addressFn }) => {
    const account = root.derivePath(path);
    allAddresses[id] = {
      name,
      addresses: []
    };
    
    // Generate first 5 addresses for each type
    for (let i = 0; i < addressCount; i++) {
      const child = account.derive(0).derive(i);
      const address = addressFn(child);
      allAddresses[id].addresses.push({
        index: i,
        address,
        path: `${path}/0/${i}`
      });
    }
  });
  
  return allAddresses;
}

// Function to check addresses with rate limiting and batching
async function checkAddressesWithRateLimit(addresses, onProgress = null) {
  const BATCH_SIZE = 3; // Process 3 addresses at a time
  const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds delay between batches
  const DELAY_BETWEEN_APIS = 1000; // 1 second delay between different APIs
  
  let allResults = [];
  let processedCount = 0;
  const totalCount = addresses.length;
  
  // Helper function to delay execution
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Helper function to check a single address
  const checkSingleAddress = async (addr) => {
    console.log(`Checking address: ${addr}`);
    const result = {
      address: addr,
      hasTransactions: false,
      earliestDate: null,
      source: null
    };
    
    try {
      // Try mempool.space first
      console.log(`Fetching from mempool.space for ${addr}`);
      const res1 = await fetch(`https://mempool.space/api/address/${addr}/txs`);
      console.log(`Mempool response status: ${res1.status}`);
      if (res1.ok) {
        const txs1 = await res1.json();
        console.log(`Mempool returned ${txs1.length} transactions`);
        if (txs1 && txs1.length > 0) {
          result.hasTransactions = true;
          result.source = 'mempool.space';
          const earliest = txs1.reduce((a, b) => a.status.block_time < b.status.block_time ? a : b).status.block_time;
          result.earliestDate = new Date(earliest * 1000);
          return result;
        }
      }
      
      // Delay between API calls
      await delay(DELAY_BETWEEN_APIS);
      
      // Try blockstream.info if no transactions found
      console.log(`Fetching from blockstream.info for ${addr}`);
      const res2 = await fetch(`https://blockstream.info/api/address/${addr}/txs`);
      console.log(`Blockstream response status: ${res2.status}`);
      if (res2.ok) {
        const txs2 = await res2.json();
        console.log(`Blockstream returned ${txs2.length} transactions`);
        if (txs2 && txs2.length > 0) {
          result.hasTransactions = true;
          result.source = 'blockstream.info';
          const earliest = txs2.reduce((a, b) => a.status.block_time < b.status.block_time ? a : b).status.block_time;
          result.earliestDate = new Date(earliest * 1000);
        }
      }
    } catch (e) {
      console.log(`Error checking ${addr}:`, e);
    }
    
    console.log(`Finished checking ${addr}, result:`, result);
    return result;
  };
  
  // Process addresses in batches
  console.log(`Starting to process ${addresses.length} addresses in batches of ${BATCH_SIZE}`);
  for (let i = 0; i < addresses.length; i += BATCH_SIZE) {
    const batch = addresses.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1}, addresses:`, batch);
    
    // Process current batch in parallel
    const batchPromises = batch.map(addr => checkSingleAddress(addr));
    const batchResults = await Promise.all(batchPromises);
    
    allResults.push(...batchResults);
    processedCount += batch.length;
    console.log(`Completed batch, processedCount: ${processedCount}, totalCount: ${totalCount}`);
    
    // Call progress callback
    if (onProgress) {
      console.log(`Calling progress callback with ${processedCount}/${totalCount}`);
      onProgress(processedCount, totalCount);
    }
    
    // Delay between batches (except for the last batch)
    if (i + BATCH_SIZE < addresses.length) {
      console.log(`Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
      await delay(DELAY_BETWEEN_BATCHES);
    }
  }
  
  return allResults;
}

// Function to generate and display extended public keys and addresses
function generateKeysAndAddresses(seedBuffer) {
  const root = bip32.fromSeed(seedBuffer);
  const configs = [
    { id: '44', path: "m/44'/0'/0'", addressFn: node => payments.p2pkh({ pubkey: Buffer.from(node.publicKey) }).address },
    { id: '49', path: "m/49'/0'/0'", addressFn: node => payments.p2sh({ redeem: payments.p2wpkh({ pubkey: Buffer.from(node.publicKey) }) }).address },
    { id: '84', path: "m/84'/0'/0'", addressFn: node => payments.p2wpkh({ pubkey: Buffer.from(node.publicKey) }).address },
    { 
      id: '86', 
      path: "m/86'/0'/0'", 
      addressFn: node => {
        try {
          // Extract x-only public key (remove the 0x02/0x03 prefix byte)
          const fullPubkey = Buffer.from(node.publicKey);
          const xOnlyPubkey = fullPubkey.slice(1); // Remove first byte to get 32-byte x-only key
          
          return generateTaprootAddress(xOnlyPubkey);
        } catch (e) {
          console.error('Taproot address generation error:', e);
          return 'bc1p...taproot (error generating)';
        }
      }
    }
  ];
  configs.forEach(({ id, path, addressFn }) => {
    const account = root.derivePath(path);
    // Extended public key
    let extPub = account.neutered().toBase58();
    document.getElementById(`xpub${id}`).innerText = extPub;
    const child = account.derive(0).derive(0);
    document.getElementById(`addr${id}`).innerText = addressFn(child);
    // Store for later usage checking (for all id types)
    window.extPubs = window.extPubs || {};
    window.extPubs[id] = extPub;
  });
}

// UI Logic - Initialize as early as possible
function initializeApp() {
  // Initialize language immediately
  updateLanguage();
  
  // Add new wallet button event listener
  const newWalletBtn = document.getElementById('newWalletBtn');
  if (newWalletBtn) {
    newWalletBtn.addEventListener('click', showInputSection);
  }
  
  document.getElementById('genMnemonic').addEventListener('click', () => {
    const text = document.getElementById('entropyInput').value.trim();
    if (!text) return;
    document.getElementById('mainSection').style.display = 'block';
    const usageDiv = document.getElementById('usageResults');
    if (usageDiv) { usageDiv.innerHTML = ''; usageDiv.style.display = 'none'; }

    // Display input text in the new card
    const inputTextDisplay = document.getElementById('inputTextDisplay');
    const inputTextLength = document.getElementById('inputTextLength');
    if (inputTextDisplay && inputTextLength) {
      inputTextDisplay.textContent = text;
      const lengthText = currentLanguage === 'zh' ? `${text.length} 个字符` : `${text.length} characters`;
      inputTextLength.textContent = lengthText;
    }

    const hash = crypto.createHash('sha256').update(text).digest();
    const entropyHex = hash.slice(0, 16).toString('hex');
    const newMnemonic = bip39.entropyToMnemonic(entropyHex);

    document.getElementById('mnemonic').value = newMnemonic;
    
    // Generate mnemonic grid
    const mnemonicGrid = document.getElementById('mnemonicGrid');
    if (mnemonicGrid) {
      const words = newMnemonic.split(' ');
      mnemonicGrid.innerHTML = '';
      words.forEach((word, index) => {
        const wordDiv = document.createElement('div');
        wordDiv.className = 'mnemonic-word';
        wordDiv.innerHTML = `
          <span class="word-number">${index + 1}</span>
          <span class="word-text">${word}</span>
        `;
        mnemonicGrid.appendChild(wordDiv);
      });
    }
    
    // Setup copy button
    const copyBtn = document.getElementById('copyMnemonic');
    if (copyBtn) {
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(newMnemonic).then(() => {
          const originalText = copyBtn.textContent;
          copyBtn.textContent = translations[currentLanguage].copiedBtn;
          copyBtn.classList.add('copied');
          setTimeout(() => {
            copyBtn.textContent = translations[currentLanguage].copyBtn;
            copyBtn.classList.remove('copied');
          }, 2000);
        }).catch(() => {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = newMnemonic;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          
          const originalText = copyBtn.textContent;
          copyBtn.textContent = translations[currentLanguage].copiedBtn;
          copyBtn.classList.add('copied');
          setTimeout(() => {
            copyBtn.textContent = translations[currentLanguage].copyBtn;
            copyBtn.classList.remove('copied');
          }, 2000);
        });
      };
    }
    
    const seedBuf = bip39.mnemonicToSeedSync(newMnemonic);
    document.getElementById('seed').value = seedBuf.toString('hex');
    QRCode.toCanvas(document.getElementById('qrcode'), newMnemonic, { errorCorrectionLevel: 'H' });
    generateKeysAndAddresses(seedBuf);
    
    // Switch to results view
    showResultsSection();

    const fetchBtn = document.getElementById('fetchUsage');
    if (fetchBtn && usageDiv) {
      fetchBtn.onclick = async () => {
        // Prefer querying via xpubs first
        const xpubsList = Object.values(window.extPubs || {});
        if (xpubsList.length === 4) {
          usageDiv.style.display = 'block';
          usageDiv.innerHTML = `<div style="display:flex;justify-content:center;"><div style="display:inline-flex;align-items:center;gap:12px;padding:16px 24px;background:rgba(255,255,255,0.8);border:1px solid rgba(255,255,255,0.4);border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,0.1);color:#4f46e5;font-weight:500;"><span style="font-size:18px;">🔍</span><span>${translations[currentLanguage].checking}</span></div></div>`;

          fetchBtn.disabled = true;
          fetchBtn.textContent = translations[currentLanguage].checkingProgress.replace('{current}', '0').replace('{total}', xpubsList.length);

          try {
            const xpubResults = await checkXpubsWithRateLimit(xpubsList, (c, t) => {
              fetchBtn.textContent = translations[currentLanguage].checkingProgress.replace('{current}', c).replace('{total}', t);
            });

            // Evaluate results
            const anyUsed = xpubResults.some(r => r.hasTransactions);
            let earliestDate = null;
            xpubResults.forEach(r => {
              if (r.earliestDate && (!earliestDate || r.earliestDate < earliestDate)) earliestDate = r.earliestDate;
            });

            const resultDiv = document.createElement('div');
            resultDiv.style.cssText = 'display:flex;justify-content:center;';

            const totalBalance = xpubResults.reduce((acc,r)=>acc+(r.final_balance||0),0);
            const balanceText = `${(totalBalance/1e8).toFixed(8)} BTC`;

            if (anyUsed) {
              const formatted = earliestDate ? earliestDate.toLocaleDateString(currentLanguage === 'zh' ? 'zh-CN':'en-US',{year:'numeric',month:'long',day:'numeric'}) : '';
              resultDiv.innerHTML = `<div style="display:inline-flex;flex-direction:column;gap:8px;padding:16px 24px;background:rgba(254,242,242,0.9);border:1px solid rgba(252,165,165,0.5);border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,0.1);color:#dc2626;">
                <div style="display:flex;align-items:center;gap:12px;font-weight:600;"><span style="font-size:20px;">⚠️</span><span>${translations[currentLanguage].walletUsedSimple}</span></div>
                <div>${formatted}</div>
                <div>${currentLanguage==='zh'?'余额：':'Balance:'} ${balanceText}</div>
              </div>`;
            } else {
              resultDiv.innerHTML = `<div style="display:inline-flex;flex-direction:column;gap:8px;padding:16px 24px;background:rgba(240,253,244,0.9);border:1px solid rgba(134,239,172,0.5);border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,0.1);color:#16a34a;">
                <div style="display:flex;align-items:center;gap:12px;font-weight:600;"><span style="font-size:20px;">✅</span><span>${translations[currentLanguage].walletUnusedSimple}</span></div>
                <div>${currentLanguage==='zh'?'余额：':'Balance:'} ${balanceText}</div>
              </div>`;
            }

            usageDiv.innerHTML = '';
            usageDiv.appendChild(resultDiv);
          } catch(err) {
            console.error(err);
            usageDiv.innerHTML = `<div style="color:#dc2626;text-align:center;">${translations[currentLanguage].errorOccurred}</div>`;
          } finally {
            fetchBtn.disabled = false;
            fetchBtn.textContent = translations[currentLanguage].checkUsageBtn;
          }

          return; // Skip old per-address logic
        }

        // Fallback to old per-address checking if xpubs unavailable
        const allAddresses = generateMultipleAddresses(seedBuf, 5);
        
        // Collect all addresses into a flat array for checking
        const addressesToCheck = [];
        Object.keys(allAddresses).forEach(typeId => {
          allAddresses[typeId].addresses.forEach(addrInfo => {
            addressesToCheck.push({
              ...addrInfo,
              type: typeId,
              typeName: allAddresses[typeId].name
            });
          });
        });
        
        usageDiv.style.display = 'block';
        usageDiv.innerHTML = `
          <div style="display: flex; justify-content: center;">
            <div style="display: inline-flex; align-items: center; gap: 12px; padding: 16px 24px; 
                        background: rgba(255, 255, 255, 0.8); border: 1px solid rgba(255, 255, 255, 0.4); 
                        border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                        color: #4f46e5; font-weight: 500;">
              <span style="font-size: 18px;">🔍</span>
              <span>${translations[currentLanguage].checking}</span>
            </div>
          </div>
        `;
        
        // Disable the button during checking
        fetchBtn.disabled = true;
        fetchBtn.textContent = translations[currentLanguage].checkingProgress.replace('{current}', '0').replace('{total}', addressesToCheck.length);
        
        try {
          // Check addresses with rate limiting
          const results = await checkAddressesWithRateLimit(
            addressesToCheck.map(a => a.address),
            (current, total) => {
              // Update progress
              fetchBtn.textContent = translations[currentLanguage].checkingProgress.replace('{current}', current).replace('{total}', total);
            }
          );
          
          // Process results
          let hasUsage = false;
          let earliestUsageDate = null;
          const usedAddresses = [];
          
          results.forEach((result, index) => {
            if (result.hasTransactions) {
              hasUsage = true;
              const addressInfo = addressesToCheck[index];
              usedAddresses.push({
                ...addressInfo,
                earliestDate: result.earliestDate,
                source: result.source
              });
              
              if (!earliestUsageDate || result.earliestDate < earliestUsageDate) {
                earliestUsageDate = result.earliestDate;
              }
            }
          });
          
          // Display results with inline styles
          const resultDiv = document.createElement('div');
          resultDiv.style.cssText = 'display: flex; justify-content: center;';
          
          if (hasUsage) {
            const formattedDate = earliestUsageDate.toLocaleDateString(currentLanguage === 'zh' ? 'zh-CN' : 'en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
            
            resultDiv.innerHTML = `
              <div style="display: inline-flex; align-items: center; gap: 12px; padding: 16px 24px; max-width: 400px;
                          background: rgba(254, 242, 242, 0.9); border: 1px solid rgba(252, 165, 165, 0.5); 
                          border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                          color: #dc2626;">
                <span style="font-size: 20px; flex-shrink: 0;">⚠️</span>
                <div style="font-weight: 600;">
                  ${translations[currentLanguage].walletUsedSimple}
                </div>
              </div>
            `;
          } else {
            resultDiv.innerHTML = `
              <div style="display: inline-flex; align-items: center; gap: 12px; padding: 16px 24px; max-width: 400px;
                          background: rgba(240, 253, 244, 0.9); border: 1px solid rgba(134, 239, 172, 0.5); 
                          border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                          color: #16a34a;">
                <span style="font-size: 20px; flex-shrink: 0;">✅</span>
                <div style="font-weight: 600;">
                  ${translations[currentLanguage].walletUnusedSimple}
                </div>
              </div>
            `;
          }
          
          usageDiv.innerHTML = '';
          usageDiv.appendChild(resultDiv);
          
        } catch (error) {
          console.error('Error during address checking:', error);
          usageDiv.innerHTML = `
            <div style="display: flex; justify-content: center;">
              <div style="display: inline-flex; align-items: flex-start; gap: 12px; padding: 16px 24px; max-width: 400px;
                          background: rgba(254, 242, 242, 0.9); border: 1px solid rgba(252, 165, 165, 0.5); 
                          border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                          color: #dc2626;">
                <span style="font-size: 20px; flex-shrink: 0; margin-top: 2px;">❌</span>
                <div>
                  <div style="font-weight: 600; margin-bottom: 8px;">
                    ${translations[currentLanguage].errorOccurred}
                  </div>
                  <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 0;">
                    ${translations[currentLanguage].retryOrCheckNetwork}
                  </p>
                </div>
              </div>
            </div>
          `;
        } finally {
          // Re-enable the button
          fetchBtn.disabled = false;
          fetchBtn.textContent = translations[currentLanguage].checkUsageBtn;
        }
      };
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

// New: Check usage for a list of xpubs with simple rate-limiting
async function checkXpubsWithRateLimit(xpubs, onProgress = null) {
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  const results = [];
  let processed = 0;
  for (const xpub of xpubs) {
    try {
      const url = `https://blockchain.info/multiaddr?active=${xpub}&n=1`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const addrInfo = (data.addresses && data.addresses[0]) || {};
      const n_tx = addrInfo.n_tx || 0;
      const final_balance = addrInfo.final_balance || 0;
      let earliestDate = null;
      if (data.txs && data.txs.length > 0) {
        const ts = data.txs[data.txs.length - 1].time || data.txs[0].time;
        earliestDate = ts ? new Date(ts * 1000) : null;
      }
      results.push({
        xpub,
        hasTransactions: n_tx > 0,
        n_tx,
        final_balance,
        earliestDate,
        source: 'blockchain.info'
      });
    } catch (err) {
      console.error('Error checking xpub', xpub, err);
      results.push({ xpub, error: err });
    }
    processed++;
    if (onProgress) onProgress(processed, xpubs.length);
    // simple delay to avoid rate limiting
    await delay(1100);
  }
  return results;
}
