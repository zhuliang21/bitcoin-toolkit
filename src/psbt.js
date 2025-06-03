const bitcoin = require('bitcoinjs-lib');

// Expose function to decode PSBT Base64
window.decodePSBT = function(psbtBase64) {
  let psbt;
  try {
    psbt = bitcoin.Psbt.fromBase64(psbtBase64.trim());
  } catch (e) {
    return { error: 'Invalid PSBT: ' + e.message };
  }

  const result = {
    inputs: [],
    outputs: [],
    fee: null,
    debug: {}
  };

  try {
    // Get transaction info
    const tx = psbt.data.globalMap.unsignedTx;
    result.debug.hasTx = !!tx;
    
    if (tx) {
      result.version = tx.version;
      result.locktime = tx.locktime;
      result.debug.hasOuts = !!tx.outs;
      result.debug.hasIns = !!tx.ins;
      result.debug.outsLength = tx.outs ? tx.outs.length : 0;
      result.debug.insLength = tx.ins ? tx.ins.length : 0;
      
      // Process outputs with addresses
      if (tx.outs && Array.isArray(tx.outs)) {
        tx.outs.forEach((out, index) => {
          let address = null;
          try {
            address = bitcoin.address.fromOutputScript(out.script, bitcoin.networks.bitcoin);
          } catch (e) {
            // Couldn't decode address
          }
          
          result.outputs.push({
            index,
            value: out.value,
            valueInBTC: (out.value / 100000000).toFixed(8),
            script: out.script.toString('hex'),
            address
          });
        });
      }
      
      // Process inputs 
      if (tx.ins && Array.isArray(tx.ins)) {
        tx.ins.forEach((input, index) => {
          result.inputs.push({
            index,
            txid: Buffer.from(input.hash).reverse().toString('hex'),
            vout: input.index,
            sequence: input.sequence,
            script: input.script.toString('hex')
          });
        });
      }
    }

    // Try to get fee if possible
    try {
      result.fee = psbt.getFee();
    } catch (e) {
      result.debug.feeError = e.message;
    }

    // Also try to get input/output info from PSBT data
    if (psbt.data && psbt.data.inputs) {
      result.debug.psbtInputsLength = psbt.data.inputs.length;
      
      // If we didn't get inputs from tx, try from PSBT data
      if (result.inputs.length === 0) {
        psbt.data.inputs.forEach((input, index) => {
          const inputInfo = { index };
          if (input.witnessUtxo) {
            inputInfo.witnessUtxo = {
              value: input.witnessUtxo.value,
              valueInBTC: (input.witnessUtxo.value / 100000000).toFixed(8),
              script: input.witnessUtxo.script.toString('hex')
            };
            // Try to get address from witness UTXO
            try {
              inputInfo.witnessUtxo.address = bitcoin.address.fromOutputScript(input.witnessUtxo.script, bitcoin.networks.bitcoin);
            } catch (e) {
              // Couldn't decode address
            }
          }
          if (input.nonWitnessUtxo) {
            inputInfo.nonWitnessUtxo = input.nonWitnessUtxo.toString('hex');
          }
          result.inputs.push(inputInfo);
        });
      }
    }
    if (psbt.data && psbt.data.outputs) {
      result.debug.psbtOutputsLength = psbt.data.outputs.length;
    }

  } catch (e) {
    result.parseError = e.message;
  }

  return result;
};
