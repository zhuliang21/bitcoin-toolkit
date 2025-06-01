// Import necessary libraries
const bip32 = require('bip32');
const { payments } = require('bitcoinjs-lib');
const bip39 = require('bip39');
const QRCode = require('qrcode');
let bs58check = require('bs58check');
const crypto = require('crypto');

// Language support
const translations = {
  en: {
    back: '← Back to Tools',
    title: 'Brain Wallet Generator',
    inputPlaceholder: 'Enter any text to generate wallet',
    generateBtn: 'Generate Wallet',
    mnemonicTitle: 'Mnemonic Phrase',
    copyBtn: '📋 Copy Mnemonic',
    copiedBtn: '✅ Copied!',
    qrTitle: 'QR Code',
    seedTitle: 'Seed',
    keysTitle: 'Extended Public Keys and Addresses',
    legacyLabel: 'Legacy (P2PKH)',
    segwitLabel: 'Nested SegWit (P2SH-P2WPKH)',
    nativeSegwitLabel: 'Native SegWit (P2WPKH)',
    addressLabel: 'Address:',
    checkUsageBtn: 'Check Wallet Usage',
    checking: '🔍 Checking wallet usage across all addresses...',
    walletUsed: 'Wallet Has Been Used - First used: ',
    walletUnused: 'Wallet Appears Unused'
  },
  zh: {
    back: '← 返回工具列表',
    title: '脑钱包生成器',
    inputPlaceholder: '输入任意文本生成钱包',
    generateBtn: '生成钱包',
    mnemonicTitle: '助记词',
    copyBtn: '📋 复制助记词',
    copiedBtn: '✅ 已复制！',
    qrTitle: '二维码',
    seedTitle: '种子',
    keysTitle: '扩展公钥和地址',
    legacyLabel: '传统格式 (P2PKH)',
    segwitLabel: '嵌套隔离见证 (P2SH-P2WPKH)',
    nativeSegwitLabel: '原生隔离见证 (P2WPKH)',
    addressLabel: '地址：',
    checkUsageBtn: '检查钱包使用情况',
    checking: '🔍 正在检查所有地址的使用情况...',
    walletUsed: '钱包已被使用 - 首次使用时间：',
    walletUnused: '钱包未被使用'
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
    langToggle.textContent = currentLanguage === 'en' ? '中文' : 'English';
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
}

// Make toggleLanguage available globally
window.toggleLanguage = toggleLanguage;

// Unwrap default export if needed
if (bs58check && bs58check.default) bs58check = bs58check.default;

// Function to generate and display extended public keys and addresses
function generateKeysAndAddresses(seedBuffer) {
  const root = bip32.fromSeed(seedBuffer);
  const configs = [
    { id: '44', path: "m/44'/0'/0'", addressFn: node => payments.p2pkh({ pubkey: Buffer.from(node.publicKey) }).address },
    { id: '49', path: "m/49'/0'/0'", addressFn: node => payments.p2sh({ redeem: payments.p2wpkh({ pubkey: Buffer.from(node.publicKey) }) }).address },
    { id: '84', path: "m/84'/0'/0'", addressFn: node => payments.p2wpkh({ pubkey: Buffer.from(node.publicKey) }).address }
  ];
  configs.forEach(({ id, path, addressFn }) => {
    const account = root.derivePath(path);
    // Extended public key
    let extPub = account.neutered().toBase58();
    if (id === '84') {
      const data = bs58check.decode(extPub);
      const zver = Buffer.from([0x04, 0xb2, 0x47, 0x46]);
      extPub = bs58check.encode(Buffer.concat([zver, data.slice(4)]));
    }
    document.getElementById(`xpub${id}`).innerText = extPub;
    const child = account.derive(0).derive(0);
    document.getElementById(`addr${id}`).innerText = addressFn(child);
  });
}

// UI Logic
window.addEventListener('load', () => {
  // Initialize language
  updateLanguage();
  
  document.getElementById('genMnemonic').addEventListener('click', () => {
    const text = document.getElementById('entropyInput').value.trim();
    if (!text) return;
    document.getElementById('mainSection').style.display = 'block';
    const usageDiv = document.getElementById('usageResults');
    if (usageDiv) { usageDiv.innerHTML = ''; usageDiv.style.display = 'none'; }

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

    const fetchBtn = document.getElementById('fetchUsage');
    if (fetchBtn && usageDiv) {
      fetchBtn.onclick = async () => {
        const addrs = ['addr44','addr49','addr84']
          .map(id => document.getElementById(id))
          .filter(el => el)
          .map(el => el.innerText);
        
        usageDiv.style.display = 'block';
        usageDiv.innerHTML = `<p class="checking-status">${translations[currentLanguage].checking}</p>`;
        
        let earliestUsageDate = null;
        let hasUsage = false;
        
        // Check all addresses for usage
        for (const addr of addrs) {
          try {
            // Try mempool.space first
            const res1 = await fetch(`https://mempool.space/api/address/${addr}/txs`);
            if (res1.ok) {
              const txs1 = await res1.json();
              if (txs1 && txs1.length) {
                hasUsage = true;
                const earliest = txs1.reduce((a, b) => a.status.block_time < b.status.block_time ? a : b).status.block_time;
                const usageDate = new Date(earliest * 1000);
                if (!earliestUsageDate || usageDate < earliestUsageDate) {
                  earliestUsageDate = usageDate;
                }
                continue; // Skip second API if we found transactions
              }
            }
          } catch (e) {
            console.log(`Error checking ${addr} on mempool.space:`, e);
          }
          
          // If no transactions found on mempool.space, try blockstream.info
          try {
            const res2 = await fetch(`https://blockstream.info/api/address/${addr}/txs`);
            if (res2.ok) {
              const txs2 = await res2.json();
              if (txs2 && txs2.length) {
                hasUsage = true;
                const earliest = txs2.reduce((a, b) => a.status.block_time < b.status.block_time ? a : b).status.block_time;
                const usageDate = new Date(earliest * 1000);
                if (!earliestUsageDate || usageDate < earliestUsageDate) {
                  earliestUsageDate = usageDate;
                }
              }
            }
          } catch (e) {
            console.log(`Error checking ${addr} on blockstream.info:`, e);
          }
        }
        
        // Display simplified aggregated result
        const resultDiv = document.createElement('div');
        resultDiv.className = 'usage-result';
        
        if (hasUsage) {
          const formattedDate = earliestUsageDate.toLocaleDateString(currentLanguage === 'zh' ? 'zh-CN' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          resultDiv.innerHTML = `
            <div class="usage-status used">
              <span class="status-icon">⚠️</span>
              <div class="status-text">
                <strong>${translations[currentLanguage].walletUsed}${formattedDate}</strong>
              </div>
            </div>
          `;
        } else {
          resultDiv.innerHTML = `
            <div class="usage-status unused">
              <span class="status-icon">✅</span>
              <div class="status-text">
                <strong>${translations[currentLanguage].walletUnused}</strong>
              </div>
            </div>
          `;
        }
        
        usageDiv.innerHTML = '';
        usageDiv.appendChild(resultDiv);
      };
    }
  });
});
