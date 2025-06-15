// PSBT Decoder Module using bitcoinjs-lib
import * as bitcoin from 'bitcoinjs-lib';

// PSBT Decoding functionality using bitcoinjs-lib
export function decodePSBT(psbtBase64) {
  try {
    // Decode base64 PSBT
    let psbtBuffer;
    try {
      psbtBuffer = Buffer.from(psbtBase64, 'base64');
    } catch (e) {
      // Try hex decoding if base64 fails
      try {
        psbtBuffer = Buffer.from(psbtBase64, 'hex');
      } catch (e2) {
        throw new Error('Invalid PSBT format: not valid base64 or hex encoding');
      }
    }

    // Check minimum PSBT size
    if (psbtBuffer.length < 10) {
      throw new Error('PSBT data too short to be valid');
    }

    // Parse PSBT
    const psbt = bitcoin.Psbt.fromBuffer(psbtBuffer);
    
    // Use PSBT's built-in properties instead of trying to access internal data
    const inputCount = psbt.inputCount;
    const txOutputs = psbt.txOutputs || [];
    const txInputs = psbt.txInputs || [];

    // Calculate total input amount and determine signature status
    let totalInputAmount = 0;
    let allInputsSigned = true;
    let anyInputSigned = false;
    
    const inputsInfo = [];
    
    // Process inputs using PSBT methods
    for (let i = 0; i < inputCount; i++) {
      try {
        // Get input data from PSBT
        const inputData = psbt.data.inputs[i] || {};
        const txInput = txInputs[i] || {};
        
        // Get input amount from witness UTXO or non-witness UTXO
        let inputAmount = 0;
        if (inputData.witnessUtxo && inputData.witnessUtxo.value !== undefined) {
          inputAmount = inputData.witnessUtxo.value;
        } else if (inputData.nonWitnessUtxo) {
          try {
            const prevTx = bitcoin.Transaction.fromBuffer(inputData.nonWitnessUtxo);
            if (prevTx.outs && prevTx.outs[txInput.vout] !== undefined) {
              inputAmount = prevTx.outs[txInput.vout].value;
            }
          } catch (error) {
            // Silently continue if unable to parse
          }
        }
        
        totalInputAmount += inputAmount;
        
        // Check signature status
        const hasSignature = inputData.partialSig && Object.keys(inputData.partialSig).length > 0;
        if (hasSignature) {
          anyInputSigned = true;
        } else {
          allInputsSigned = false;
        }
        
        inputsInfo.push({
          txid: txInput.hash ? Buffer.from(txInput.hash).reverse().toString('hex') : 'unknown',
          vout: txInput.vout !== undefined ? txInput.vout : 0,
          amount: inputAmount.toString()
        });
        
      } catch (error) {
        allInputsSigned = false;
      }
    }

    // Calculate total output amount and fee
    let totalOutputAmount = 0;
    const outputsInfo = [];
    
    for (let i = 0; i < txOutputs.length; i++) {
      try {
        const output = txOutputs[i];
        
        const outputValue = output.value || 0;
        totalOutputAmount += outputValue;
        
        // Try to decode address
        let address = 'Unknown';
        let outputType = 'Payment';
        
        if (output.script) {
          try {
            address = bitcoin.address.fromOutputScript(output.script, bitcoin.networks.bitcoin);
          } catch (e) {
            try {
              // Try testnet
              address = bitcoin.address.fromOutputScript(output.script, bitcoin.networks.testnet);
            } catch (e2) {
              try {
                // Try regtest
                address = bitcoin.address.fromOutputScript(output.script, bitcoin.networks.regtest);
              } catch (e3) {
                address = 'Unable to decode address';
              }
            }
          }
        } else {
          address = 'No script data';
        }
        
        // Simple heuristic to detect change outputs (this is not always accurate)
        // In a real implementation, you might need additional context
        if (i === txOutputs.length - 1 && txOutputs.length > 1) {
          outputType = 'Change';
        }
        
        outputsInfo.push({
          address: address,
          amount: outputValue.toString(),
          type: outputType
        });
        
      } catch (error) {
        // Silently continue if unable to process output
      }
    }

    const fee = totalInputAmount - totalOutputAmount;
    
    // Determine signature status
    let signatureStatus;
    if (allInputsSigned) {
      signatureStatus = 'Fully Signed';
    } else if (anyInputSigned) {
      signatureStatus = 'Partially Signed';
    } else {
      signatureStatus = 'Unsigned';
    }

    // Determine transaction type based on outputs
    let transactionType = 'Payment';
    if (txOutputs.length === 1) {
      transactionType = 'Single Output';
    } else if (txOutputs.length > 2) {
      transactionType = 'Multi-Output';
    }

    return {
      type: transactionType,
      isSigned: allInputsSigned,
      signatureStatus: signatureStatus,
      totalAmount: totalOutputAmount.toString(),
      totalInputAmount: totalInputAmount.toString(),
      fee: fee.toString(),
      outputs: outputsInfo,
      inputs: inputsInfo,
      version: psbt.version || 2,
      locktime: psbt.locktime || 0
    };

  } catch (error) {
    console.error('PSBT decode error:', error);
    throw new Error('Failed to decode PSBT: ' + error.message);
  }
}

// Format Bitcoin amount
export function formatBitcoinAmount(satoshis) {
  const btc = parseInt(satoshis) / 100000000;
  return `${btc.toFixed(8)} BTC (${parseInt(satoshis).toLocaleString()} sats)`;
}

// Finalize PSBT and return transaction hex
export function finalizePSBT(psbtBase64) {
  try {
    
    // Decode PSBT
    let psbtBuffer;
    try {
      psbtBuffer = Buffer.from(psbtBase64, 'base64');
    } catch (e) {
      try {
        psbtBuffer = Buffer.from(psbtBase64, 'hex');
      } catch (e2) {
        throw new Error('Invalid PSBT format: not valid base64 or hex encoding');
      }
    }

    // Parse PSBT
    const psbt = bitcoin.Psbt.fromBuffer(psbtBuffer);

    // Check if PSBT is ready to finalize
    let canFinalize = true;
    let missingSignatures = [];

    for (let i = 0; i < psbt.inputCount; i++) {
      const input = psbt.data.inputs[i] || {};
      const hasSignature = input.partialSig && Object.keys(input.partialSig).length > 0;
      
      if (!hasSignature) {
        canFinalize = false;
        missingSignatures.push(i);
      }
    }

    if (!canFinalize) {
      throw new Error(`Cannot finalize: missing signatures for inputs: ${missingSignatures.join(', ')}`);
    }

    // Finalize all inputs
    for (let i = 0; i < psbt.inputCount; i++) {
      try {
        psbt.finalizeInput(i);
      } catch (error) {
        throw new Error(`Failed to finalize input ${i}: ${error.message}`);
      }
    }

    // Extract the final transaction
    const finalTx = psbt.extractTransaction();

    // Convert to hex
    const txHex = finalTx.toHex();

    return {
      success: true,
      hex: txHex,
      size: Math.ceil(txHex.length / 2), // Size in bytes
      txid: finalTx.getId()
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Make functions available globally for HTML usage
if (typeof window !== 'undefined') {
  window.psbtDecoder = {
    decodePSBT,
    formatBitcoinAmount,
    finalizePSBT
  };
} 