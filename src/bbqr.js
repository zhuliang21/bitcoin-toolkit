const { splitQRs, renderQRImage } = window.BBQr;

document.addEventListener('DOMContentLoaded', () => {
  const textarea = document.getElementById('text-input');
  const fileInput = document.getElementById('file-input');
  const generateBtn = document.getElementById('generate-btn');
  const output = document.getElementById('output');
  // store uploaded PSBT until user clicks GenerateBBQr
  let uploadedBBqrRaw = null;
  let uploadedBBqrType = null;

  // Core generation logic
  async function generateBBQR(raw, fileType) {
    output.innerHTML = '';
    try {
      const splitResult = splitQRs(raw, fileType, {
        encoding: 'Z',
        minSplit: 1,
        maxSplit: 1295,
        minVersion: 5,
        maxVersion: 40
      });
      const imgBuffer = await renderQRImage(splitResult.parts, splitResult.version, {
        frameDelay: 300,
        randomizeOrder: false
      });
      const base64 = btoa(String.fromCharCode(...new Uint8Array(imgBuffer)));
      const img = document.createElement('img');
      img.src = `data:image/png;base64,${base64}`;
      output.appendChild(img);
    } catch (e) {
      output.textContent = 'Error: ' + e.message;
    }
  }

  generateBtn.addEventListener('click', async () => {
    // if a PSBT was uploaded, use it first
    if (uploadedBBqrRaw) {
      const raw = uploadedBBqrRaw;
      const fileType = uploadedBBqrType;
      // clear after use
      uploadedBBqrRaw = null;
      output.innerHTML = '';
      return generateBBQR(raw, fileType);
    }
    // otherwise use text input
    const text = textarea.value.trim();
    if (!text) {
      output.textContent = '请输入文本或上传文件';
      return;
    }
    // treat as text input
    const encoder = new TextEncoder();
    const raw = encoder.encode(text);
    let fileType = 'U';
    try { JSON.parse(text); fileType = 'J'; } catch {}
    await generateBBQR(raw, fileType);
  });

  // handle PSBT file upload
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    output.textContent = 'PSBT 上传成功，请点击生成';
    try {
      const buffer = new Uint8Array(await file.arrayBuffer());
      const detected = await window.BBQr.detectFileType(buffer);
      if (detected.fileType !== 'P') {
        output.textContent = '文件类型非 PSBT';
        return;
      }
      // defer actual generation for BBQr
      uploadedBBqrRaw = detected.raw;
      uploadedBBqrType = detected.fileType;
    } catch (e) {
      output.textContent = 'Error: ' + e.message;
    }
  });
});