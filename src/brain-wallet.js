// Import necessary libraries
const bip32 = require('bip32');
const { payments } = require('bitcoinjs-lib');
const bip39 = require('bip39');
const QRCode = require('qrcode');
let bs58check = require('bs58check');
const crypto = require('crypto');

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
        usageDiv.innerHTML = '';
        for (const addr of addrs) {
          const p = document.createElement('p');
          p.textContent = `${addr}: 查询中...`;
          usageDiv.appendChild(p);
          let dateText = '未使用过';
          try {
            const res1 = await fetch(`https://mempool.space/api/address/${addr}/txs`);
            if (res1.ok) {
              const txs1 = await res1.json();
              if (txs1 && txs1.length) {
                const earliest = txs1.reduce((a, b) => a.status.block_time < b.status.block_time ? a : b).status.block_time;
                dateText = new Date(earliest * 1000).toISOString().split('T')[0];
              }
            }
          } catch {}
          if (dateText === '未使用过') {
            try {
              const res2 = await fetch(`https://blockstream.info/api/address/${addr}/txs`);
              if (res2.ok) {
                const txs2 = await res2.json();
                if (txs2 && txs2.length) {
                  const earliest = txs2.reduce((a, b) => a.status.block_time < b.status.block_time ? a : b).status.block_time;
                  dateText = new Date(earliest * 1000).toISOString().split('T')[0];
                }
              }
            } catch {}
          }
          p.textContent = `${addr}: ${dateText}`;
        }
      };
    }
  });
});
