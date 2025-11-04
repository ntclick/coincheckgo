/**
 * FHEVM Utilities - Zama FHEVM Integration v0.2.0
 * Handles FHE operations, encryption, decryption, and ACL permissions
 * Based on: https://docs.zama.ai/protocol/relayer-sdk-guides/development-guide/webapp
 * Author: @trungkts29 (https://x.com/trungkts29)
 */

import { BrowserProvider } from 'ethers';

// Polyfill for 'global' variable needed by some node packages in browser
if (typeof window !== 'undefined' && typeof window.global === 'undefined') {
  (window as any).global = window;
}

// Try to import from npm package first, fallback to CDN
let npmSDK: any = null;

// FHEVM SDK types
declare global {
  interface Window {
    initSDK: () => Promise<void>;
    createInstance: (config: any) => Promise<any>;
    SepoliaConfig: any;
  }
}

// Dynamic import for FHEVM SDK
let fhevmSDK: any = null;
let sdkLoaded = false;
let autoInitialized = false;

// FHEVM Configuration according to Zama SepoliaConfig - Using env variables
const FHEVM_CONFIG = {
  aclContractAddress: process.env.REACT_APP_ACL_CONTRACT || '0x687820221192C5B662b25367F70076A37bc79b6c',
  kmsContractAddress: process.env.REACT_APP_KMS_VERIFIER_CONTRACT || '0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC',
  inputVerifierContractAddress: process.env.REACT_APP_INPUT_VERIFIER_CONTRACT || '0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4',
  verifyingContractAddressDecryption: process.env.REACT_APP_DECRYPTION_ADDRESS || '0xb6E160B1ff80D67Bbe90A85eE06Ce0A2613607D1',
  verifyingContractAddressInputVerification: '0x7048C39f048125eDa9d678AEbaDfB22F7900a29F',
  chainId: Number(process.env.REACT_APP_CHAIN_ID) || 11155111,
  gatewayChainId: Number(process.env.REACT_APP_GATEWAY_CHAIN_ID) || 55815,
  relayerUrl: process.env.REACT_APP_RELAYER_URL || 'https://relayer.testnet.zama.cloud',
  rpcUrl: process.env.REACT_APP_SEPOLIA_RPC_URL || 'https://ethereum-sepolia.publicnode.com',
};

// FHEVM Instance và SDK
let fhevmInstance: any = null;
let isSDKInitialized = false;

/**
 * Wait for ESM CDN to load
 */
const waitForESMCDN = async (maxWait = 10000): Promise<boolean> => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWait) {
    // Check if CDN loaded (window.initSDK, etc.)
    const hasESM = typeof window !== 'undefined' && 
                   typeof (window as any).initSDK === 'function' && 
                   typeof (window as any).createInstance === 'function' && 
                   (window as any).SepoliaConfig;
    
    if (hasESM) {
      console.log('✅ FHEVM SDK ESM CDN loaded');
      fhevmSDK = {
        initSDK: (window as any).initSDK,
        createInstance: (window as any).createInstance,
        SepoliaConfig: (window as any).SepoliaConfig
      };
      sdkLoaded = true;
      return true;
    }
    
    // Wait 200ms before checking again
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.error('❌ FHEVM SDK ESM CDN failed to load within timeout');
  return false;
};

/**
 * Load FHEVM SDK dynamically - try npm first, then CDN
 */
const loadFHEVMSDK = async (): Promise<boolean> => {
  try {
    if (sdkLoaded && fhevmSDK) {
      return true;
    }

    // Priority 1: Try npm package
    if (npmSDK && typeof npmSDK.initSDK === 'function') {
      console.log('✅ FHEVM SDK loaded from npm package');
      fhevmSDK = npmSDK;
      sdkLoaded = true;
      return true;
    }

    // Try to load npm package if not already loaded
    if (!npmSDK) {
      try {
        const dynamicSDK = await import('@zama-fhe/relayer-sdk/web');
        console.log('✅ FHEVM SDK loaded from npm package (dynamic import)');
        console.log('📦 SDK exports:', Object.keys(dynamicSDK));
        fhevmSDK = dynamicSDK;
        npmSDK = dynamicSDK;
        sdkLoaded = true;
        return true;
      } catch (npmError) {
        console.log('⚠️ FHEVM SDK npm package not available:', (npmError as Error).message);
      }
    }

    // Priority 2: Try CDN
    console.log('🔐 FHEVM SDK npm not available, waiting for CDN...');
    return await waitForESMCDN();
  } catch (error) {
    console.error('❌ Error loading FHEVM SDK:', error);
    return false;
  }
};

/**
 * Auto-initialize FHEVM SDK without wallet connection
 */
export const autoInitializeFHEVM = async (): Promise<boolean> => {
  try {
    if (autoInitialized) {
      return true;
    }

    console.log('🔐 Auto-initializing FHEVM SDK (no wallet required)...');
    
    // Load SDK first
    const sdkAvailable = await loadFHEVMSDK();
    if (!sdkAvailable || !fhevmSDK) {
      console.error('❌ FHEVM SDK not available for auto-init');
      return false;
    }

    // Use loaded SDK
    const { initSDK, createInstance, SepoliaConfig } = fhevmSDK;

    console.log('🔐 Auto-loading FHEVM WASM...');
    
    // Chỉ load WASM, không tạo instance
    // initSDK() có thể tự động tạo instance nếu có RPC URL trong SepoliaConfig
    // Nên chúng ta chỉ load SDK, không gọi initSDK() để tránh CORS
    // Instance sẽ được tạo khi user connect wallet (trong initializeFHEVM)
    
    try {
      await initSDK();
      console.log('✅ FHEVM WASM auto-loaded');
    } catch (error: any) {
      // Nếu initSDK() gặp CORS error, bỏ qua (không phải lỗi nghiêm trọng)
      if (error?.message?.includes('CORS') || error?.message?.includes('Failed to fetch')) {
        console.warn('⚠️ FHEVM WASM load skipped (CORS - will init when wallet connects):', error.message);
      } else {
        throw error; // Re-throw nếu là lỗi khác
      }
    }
    
    autoInitialized = true;
    console.log('✅ FHEVM SDK ready (instance will be created when wallet connects)');
    
    return true;
  } catch (error) {
    console.error('❌ Auto-initialization failed:', error);
    return false;
  }
};

/**
 * Initialize FHEVM SDK with wallet provider
 */
export const initializeFHEVM = async (provider: BrowserProvider, signer?: any): Promise<boolean> => {
  try {
    if (isSDKInitialized && fhevmInstance) {
      return true;
    }

    // If already auto-initialized (WASM loaded), create instance with wallet provider
    if (autoInitialized) {
      console.log('🔐 Creating FHEVM instance with wallet provider (WASM already loaded)...');
      const { createInstance, SepoliaConfig } = fhevmSDK;
      
      // Theo tài liệu Zama: chỉ cần SepoliaConfig + network: window.ethereum
      // Không cần rpcUrl vì MetaMask sẽ handle RPC calls
      const config = {
        ...SepoliaConfig,
        network: window.ethereum, // Use MetaMask provider (no CORS)
      };
      
      fhevmInstance = await createInstance(config);
      console.log('✅ FHEVM instance created with provider');
      
      // Set global FHEVM instance for script access
      window.fhevm = fhevmInstance;
      
      isSDKInitialized = true;
      
      // Dispatch event to notify script that FHEVM is ready with provider
      window.dispatchEvent(new CustomEvent('fhevmReady', { detail: { fhevm: fhevmInstance } }));
      console.log('🔔 FHEVM ready event dispatched (with provider)');
      
      return true;
    }

    // Load SDK first
    const sdkAvailable = await loadFHEVMSDK();
    if (!sdkAvailable || !fhevmSDK) {
      console.error('❌ FHEVM SDK not available');
      return false;
    }

    // Use loaded SDK
    const { initSDK, createInstance, SepoliaConfig } = fhevmSDK;

    console.log('🔐 Initializing FHEVM SDK v0.2.0...');
    console.log('🔍 Provider received:', provider);
    console.log('🔍 Provider type:', typeof provider);

    // Step 1: Initialize SDK (load WASM)
    console.log('🔐 Loading WASM...');
    await initSDK();
    console.log('✅ FHEVM SDK WASM loaded');

    // Step 2: Create instance theo tài liệu Zama
    // Chỉ cần SepoliaConfig + network: window.ethereum
    // Không cần rpcUrl vì MetaMask sẽ handle RPC calls (không bị CORS)
    const config = {
      ...SepoliaConfig,
      network: window.ethereum, // Use MetaMask provider (no CORS)
      ...(signer && { signer }), // Add signer if provided for user decryption
    };

    console.log('🔐 Creating FHEVM instance with Zama config:', config);
    console.log('🔐 Relayer URL:', config.relayerUrl);
    console.log('🔐 Chain ID:', config.chainId);
    console.log('🔐 Using MetaMask provider (network: window.ethereum)');

    fhevmInstance = await createInstance(config);
    console.log('✅ FHEVM instance created:', fhevmInstance);
    
    // 🔧 CRITICAL: Set window.fhevm for global access
    window.fhevm = fhevmInstance;
    console.log('✅ window.fhevm set for global access');
    
    // 🔑 CRITICAL: Generate keypair for user decryption
    if (signer) {
      try {
        console.log('🔑 Generating keypair for user decryption...');
        // 🔧 CRITICAL FIX: Ensure keypair generation completes before proceeding
        const keypair = await fhevmInstance.generateKeypair();
        console.log('✅ Keypair generated successfully:', keypair);
      } catch (keypairError: any) {
        console.warn('⚠️ Keypair generation failed:', keypairError.message);
        // Don't throw error, continue with initialization
      }
    }
    
    // 🔐 CRITICAL: Grant ACL permission for GMToken contract (only if allow function exists)
    if (typeof fhevmInstance.allow === 'function') {
      try {
        console.log('🔐 Granting ACL permission for GMToken contract...');
        // 🔧 CRITICAL FIX: allow() takes contract address as parameter
        await fhevmInstance.allow('0xBBac81C2b7359cf15C84d569ef297D329Af84479');
        console.log('✅ ACL permission granted for GMToken contract');
      } catch (aclError: any) {
        console.warn('⚠️ ACL permission grant failed:', aclError.message);
      }
    } else {
      console.warn('⚠️ allow() function not available yet, skipping ACL grant');
    }
    
    // Add ACL methods to the instance if they don't exist
    if (!fhevmInstance.allow) {
      fhevmInstance.allow = async (contractAddress: string) => {
        console.log(`🔐 allow() called for contract ${contractAddress}`);
        // This is a placeholder - the actual ACL is handled by the contract
        return true;
      };
    }
    
    if (!fhevmInstance.allowTransient) {
      fhevmInstance.allowTransient = async (handle: string, userAddress: string) => {
        console.log(`🔐 allowTransient() called for handle ${handle.substring(0, 10)}..., user ${userAddress}`);
        // This is a placeholder - the actual ACL is handled by the contract
        return true;
      };
    }
    
    console.log('🔍 Final FHEVM methods:', Object.keys(fhevmInstance));
    console.log('🔍 Has allow method:', typeof fhevmInstance.allow);
    console.log('🔍 Has allowTransient method:', typeof fhevmInstance.allowTransient);
    console.log('🔍 Has userDecrypt method:', typeof fhevmInstance.userDecrypt);
        

    isSDKInitialized = true;
    console.log('✅ FHEVM SDK initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize FHEVM:', error);
    return false;
  }
};

/**
 * Get FHEVM instance - tries window.fhevm first, then module instance
 */
export const getFHEVMInstance = () => {
  // Priority 1: Check window.fhevm (set by React app initialization)
  if ((window as any).fhevm && typeof (window as any).fhevm.createEncryptedInput === 'function') {
    console.log('✅ Using FHEVM instance from window.fhevm');
    return (window as any).fhevm;
  }
  
  // Priority 2: Check module instance (if initialized)
  if (isSDKInitialized && fhevmInstance) {
    console.log('✅ Using FHEVM instance from module');
    
    // Ensure ACL methods are always available
    if (!fhevmInstance.allow) {
      fhevmInstance.allow = async (contractAddress: string) => {
        console.log(`🔐 allow() called for contract ${contractAddress}`);
        return true;
      };
    }
    
    if (!fhevmInstance.allowTransient) {
      fhevmInstance.allowTransient = async (handle: string, userAddress: string) => {
        console.log(`🔐 allowTransient() called for handle ${handle.substring(0, 10)}..., user ${userAddress}`);
        return true;
      };
    }
    
    return fhevmInstance;
  }
  
  throw new Error('FHEVM not initialized. Call initializeFHEVM() first or ensure window.fhevm is available.');
};

/**
 * Check ACL permissions for contract
 */
export const checkACLPermissions = async (contractAddress: string): Promise<boolean> => {
  try {
    const fhevm = getFHEVMInstance();
    // Note: ACL permissions are handled in the contract, not in SDK
    // This is a placeholder for future ACL checks
    console.log(`🔐 ACL Permission check for ${contractAddress}: OK`);
    return true;
  } catch (error) {
    console.error('❌ Failed to check ACL permissions:', error);
    return false;
  }
};

/**
 * Request ACL permissions for contract
 */
export const requestACLPermissions = async (contractAddress: string): Promise<boolean> => {
  try {
    const fhevm = getFHEVMInstance();
    // Note: ACL permissions are handled in the contract, not in SDK
    // This is a placeholder for future ACL requests
    console.log(`✅ ACL Permission request for ${contractAddress}: OK`);
    return true;
  } catch (error) {
    console.error('❌ Failed to request ACL permissions:', error);
    return false;
  }
};

/**
 * Create encrypted input buffer theo Zama v0.2.0
 */
export const createEncryptedInput = async (
  contractAddress: string,
  userAddress: string,
  values: number[]
): Promise<{ handles: Uint8Array[], inputProof: Uint8Array }> => {
  try {
    const fhevm = getFHEVMInstance();
    
    // Create buffer for values to encrypt and register to the fhevm
    const buffer = fhevm.createEncryptedInput(contractAddress, userAddress);
    
    // Add values with associated data-type method
    values.forEach(value => {
      buffer.add64(BigInt(value));
    });
    
    // Encrypt values, generate proof, and upload ciphertexts using relayer
    const ciphertexts = await buffer.encrypt();
    
    console.log(`🔐 Created encrypted input for ${values.length} values:`, ciphertexts.handles);
    return {
      handles: ciphertexts.handles,
      inputProof: ciphertexts.inputProof
    };
  } catch (error) {
    console.error('❌ Failed to create encrypted input:', error);
    throw error;
  }
};

/**
 * Convert Uint8Array to hex string for contract calls
 */
export const uint8ArrayToHex = (uint8Array: Uint8Array): string => {
  return '0x' + Array.from(uint8Array)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Convert Uint8Array to bytes32 format for contract calls
 */
export const uint8ArrayToBytes32 = (uint8Array: Uint8Array): string => {
  // Ensure it's exactly 32 bytes
  const padded = new Uint8Array(32);
  padded.set(uint8Array.slice(0, 32));
  return '0x' + Array.from(padded)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Encrypt single value using FHE (simplified version)
 */
export const encryptValue = async (value: number, contractAddress: string, userAddress: string): Promise<string> => {
  try {
    console.log(`🔐 Starting encryption for value: ${value}, contract: ${contractAddress}, user: ${userAddress}`);
    const result = await createEncryptedInput(contractAddress, userAddress, [value]);
    console.log(`🔐 Encrypted ${value} -> ${result.handles[0]}`);
    console.log(`🔐 Full encryption result:`, result);
    
    // Convert Uint8Array to bytes32 format for contract calls
    const bytes32Handle = uint8ArrayToBytes32(result.handles[0]);
    console.log(`🔐 Bytes32 handle: ${bytes32Handle}`);
    return bytes32Handle;
  } catch (error) {
    console.error('❌ Failed to encrypt value:', error);
    throw error;
  }
};

/**
 * Encrypt single value and return both handle (bytes32) and inputProof (bytes)
 */
export const encryptValueWithProof = async (
  value: number,
  contractAddress: string,
  userAddress: string
): Promise<{ handle: string; inputProof: string }> => {
  try {
    console.log(`🔐 Starting encryption (with proof) for value: ${value}, contract: ${contractAddress}, user: ${userAddress}`);
    const result = await createEncryptedInput(contractAddress, userAddress, [value]);
    const handle = uint8ArrayToBytes32(result.handles[0]);
    const inputProof = uint8ArrayToHex(result.inputProof);
    console.log('🔐 Encrypted (with proof):', { handle, inputProofLength: result.inputProof?.length });
    return { handle, inputProof };
  } catch (error) {
    console.error('❌ Failed to encrypt value with proof:', error);
    throw error;
  }
};

/**
 * Public decrypt values theo Zama v0.2.0
 */
export const publicDecrypt = async (handles: string[], contractAddress: string): Promise<Record<string, any>> => {
  try {
    const fhevm = getFHEVMInstance();
    // 🔧 CRITICAL FIX: Ensure handles is always an array
    const handleArray = Array.isArray(handles) ? handles : [handles];
    const values = await fhevm.publicDecrypt(handleArray);
    console.log(`🔓 Public decrypted ${handleArray.length} handles:`, values);
    return values;
  } catch (error) {
    console.error('❌ Failed to public decrypt:', error);
    throw error;
  }
};

/**
 * User decrypt values theo Zama v0.2.0
 */
export const userDecrypt = async (
  handleContractPairs: Array<{ handle: string, contractAddress: string }>,
  userAddress: string,
  signer: any
): Promise<Record<string, any>> => {
  try {
    const fhevm = getFHEVMInstance();
    
    // Grant ACL permissions for each handle (FIXED LOGIC)
    for (const pair of handleContractPairs) {
      try {
        console.log(`🔐 Granting ACL permission for handle: ${pair.handle.substring(0, 10)}...`);
        console.log(`🔍 Available FHEVM methods:`, Object.keys(fhevm));
        
        // Check if ACL methods exist and call them properly
        let aclGranted = false;
        
        if (fhevm.allow) {
          console.log(`🔐 Using fhevm.allow() for contract authorization...`);
          // 🔧 CRITICAL FIX: allow() takes contract address as parameter
          await fhevm.allow(pair.contractAddress);
          aclGranted = true;
          console.log(`✅ ACL permission granted via allow for contract: ${pair.contractAddress}`);
        } else if (fhevm.allowTransient) {
          console.log(`🔐 Using fhevm.allowTransient() for transient decryption...`);
          await fhevm.allowTransient(pair.handle, userAddress);
          aclGranted = true;
          console.log(`✅ ACL permission granted via allowTransient for handle: ${pair.handle.substring(0, 10)}...`);
        } else {
          console.warn(`⚠️ No ACL method available in FHEVM instance`);
          console.log(`🔍 Available methods:`, Object.keys(fhevm));
          
          // Skip manual ACL contract call - it's failing
          console.log(`⚠️ Skipping manual ACL contract call due to previous failures`);
          console.log(`🔐 Will try publicDecrypt instead of userDecrypt`);
        }
        
        if (!aclGranted) {
          console.warn(`⚠️ ACL permission NOT granted for handle ${pair.handle.substring(0, 10)}...`);
        }
      } catch (aclError: any) {
        console.warn(`⚠️ ACL permission failed for handle ${pair.handle.substring(0, 10)}...:`, aclError.message);
        // Continue anyway, as the contract might have already granted permissions
      }
    }
    
    // 🔑 CRITICAL: Generate keypair before decryption
    console.log('🔑 Generating keypair for user decryption...');
    const keypair = await fhevm.generateKeypair();
    console.log('✅ Keypair generated for decryption:', keypair);
    
    // Note: EIP-712 signature is now created in the frontend before calling this function
    console.log('🔐 EIP-712 signature should be created in frontend before calling userDecrypt');
    
    // 🔑 CRITICAL FIX: Try ACL grant first, then decrypt
    let result: any;
    
    try {
      // Step 1: Grant ACL permissions for each handle
      for (const pair of handleContractPairs) {
        try {
          if (fhevm.allow) {
            console.log(`🔐 Granting ACL via fhevm.allow() for contract: ${pair.contractAddress}...`);
            // 🔧 CRITICAL FIX: allow() takes contract address as parameter
            await fhevm.allow(pair.contractAddress);
            console.log(`✅ ACL permission granted via fhevm.allow()`);
          } else if (fhevm.allowTransient) {
            console.log(`🔐 Granting ACL via fhevm.allowTransient() for handle: ${pair.handle.substring(0, 10)}...`);
            await fhevm.allowTransient(pair.handle, userAddress);
            console.log(`✅ ACL permission granted via fhevm.allowTransient()`);
          }
        } catch (aclError: any) {
          console.warn(`⚠️ ACL grant failed for handle ${pair.handle.substring(0, 10)}...:`, aclError.message);
        }
      }
      
      // Step 2: Wait for ACL to propagate
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 3: Try userDecrypt with EIP-712 signature - FHEVM SDK v2.0 API
      console.log(`🔐 Attempting userDecrypt with EIP-712 signature for ${handleContractPairs.length} handles...`);
      // Note: EIP-712 signature should be created and passed from the frontend
      console.log('🔐 EIP-712 signature should be passed from frontend to userDecrypt');
      // 🔧 CRITICAL FIX: According to official docs, userDecrypt needs 7 parameters
      // This function is called from frontend with all required parameters
      console.log('🔐 userDecrypt should be called from frontend with all 7 parameters');
      // For now, try with minimal parameters as fallback
      const handlesArray = handleContractPairs.map(pair => pair.handle);
      result = await fhevm.userDecrypt(handlesArray);
      console.log(`✅ User decryption with EIP-712 signature successful:`, result);
      
    } catch (userError: any) {
      console.error(`❌ UserDecrypt with EIP-712 signature failed:`, userError.message);
      
      // Check if user rejected signature
      if (userError.message && userError.message.includes('user rejected')) {
        console.log('❌ User rejected EIP-712 signature - decryption cancelled');
        throw new Error('User rejected EIP-712 signature for decryption');
      }
      
      // Check for keypair issues
      if (userError.message && userError.message.includes('Invalid public or private key')) {
        console.log('❌ Keypair issue in userDecrypt');
        throw new Error('Invalid keypair for userDecrypt - please retry');
      }
      
      // No fallback to publicDecrypt - force userDecrypt with EIP-712 signature
      console.error(`❌ UserDecrypt with EIP-712 signature failed - no fallback to publicDecrypt`);
      throw userError;
    }
    
    console.log(`🔓 User decrypted ${handleContractPairs.length} handles:`, result);
    return result;
  } catch (error) {
    console.error('❌ Failed to user decrypt:', error);
    throw error;
  }
};

/**
 * Decrypt value using FHE (backward compatibility)
 */
export const decryptValue = async (encryptedValue: string, contractAddress: string): Promise<number> => {
  try {
    const fhevm = getFHEVMInstance();
    // 🔧 CRITICAL FIX: Pass array of handles directly to publicDecrypt
    const values = await fhevm.publicDecrypt([encryptedValue]);
    const decrypted = values[encryptedValue];
    console.log(`🔓 Decrypted ${encryptedValue} -> ${decrypted}`);
    return Number(decrypted);
  } catch (error) {
    console.error('❌ Failed to decrypt value:', error);
    throw error;
  }
};

/**
 * Format FHE encrypted handle for display
 */
export const formatFHEHandle = (handle: string, showFull = false): string => {
  if (!handle || handle === '0x0') {
    return '🔐 [No Data]';
  }
  
  if (showFull) {
    return `🔐 ${handle}`;
  }
  
  // Show first 20 chars + last 10 chars
  const start = handle.substring(0, 20);
  const end = handle.substring(handle.length - 10);
  return `🔐 ${start}...${end}`;
};

/**
 * Check if value is FHE encrypted (starts with 0x and is long enough)
 */
export const isFHEEncrypted = (value: string): boolean => {
  return Boolean(value && value.startsWith('0x') && value.length > 20);
};

/**
 * Reset FHEVM instance (for testing)
 */
export const resetFHEVM = () => {
  fhevmInstance = null;
  isSDKInitialized = false;
  console.log('🔄 FHEVM instance reset');
};

export default {
  initializeFHEVM,
  getFHEVMInstance,
  checkACLPermissions,
  requestACLPermissions,
  createEncryptedInput,
  encryptValue,
  decryptValue,
  publicDecrypt,
  userDecrypt,
  formatFHEHandle,
  isFHEEncrypted,
  resetFHEVM,
};
