// Debug version to diagnose the stuck issue
console.log('🔍 Debugging address checking...');

// Test the fetch functionality first
async function testAPI() {
  console.log('Testing API connectivity...');
  
  try {
    // Test with a known address
    const testAddress = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'; // Genesis block address
    console.log(`Testing with address: ${testAddress}`);
    
    console.log('Trying mempool.space...');
    const res1 = await fetch(`https://mempool.space/api/address/${testAddress}/txs`);
    console.log(`mempool.space response status: ${res1.status}`);
    
    if (res1.ok) {
      const data1 = await res1.json();
      console.log(`mempool.space returned ${data1.length} transactions`);
    }
    
    console.log('Trying blockstream.info...');
    const res2 = await fetch(`https://blockstream.info/api/address/${testAddress}/txs`);
    console.log(`blockstream.info response status: ${res2.status}`);
    
    if (res2.ok) {
      const data2 = await res2.json();
      console.log(`blockstream.info returned ${data2.length} transactions`);
    }
    
  } catch (error) {
    console.error('API test failed:', error);
  }
}

// Test progress callback
function testProgressCallback() {
  console.log('Testing progress callback...');
  
  let current = 0;
  const total = 20;
  
  const interval = setInterval(() => {
    current++;
    console.log(`Progress: ${current}/${total}`);
    
    if (current >= total) {
      clearInterval(interval);
      console.log('Progress test completed');
    }
  }, 500);
}

// Run tests
testAPI();
testProgressCallback();
