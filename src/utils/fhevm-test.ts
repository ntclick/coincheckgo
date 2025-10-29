/**
 * FHEVM Test Utilities
 * Simple test functions to verify FHEVM SDK is working
 */

import { initializeFHEVM, encryptValue, getFHEVMInstance } from './fhevm';

// Test contract address
const TEST_CONTRACT_ADDRESS = '0x369Cfea02E6A82f3ea95b874A11AB5D010B58D81'; // GMToken address

/**
 * Test FHEVM SDK functionality
 */
export const testFHEVM = async (provider: any, userAddress: string) => {
  try {
    console.log('🧪 Starting FHEVM Test...');
    
    // Test 1: Initialize FHEVM
    console.log('🧪 Test 1: Initialize FHEVM');
    const initResult = await initializeFHEVM(provider);
    console.log('🧪 Initialize result:', initResult);
    
    if (!initResult) {
      throw new Error('Failed to initialize FHEVM');
    }
    
    // Test 2: Get FHEVM instance
    console.log('🧪 Test 2: Get FHEVM instance');
    const instance = getFHEVMInstance();
    console.log('🧪 FHEVM instance:', instance);
    console.log('🧪 Instance methods:', Object.getOwnPropertyNames(instance));
    
    // Test 3: Test encryption
    console.log('🧪 Test 3: Test encryption');
    const testValue = 123;
    const encrypted = await encryptValue(testValue, TEST_CONTRACT_ADDRESS, userAddress);
    console.log('🧪 Encrypted result:', encrypted);
    
    // Test 4: Test multiple values
    console.log('🧪 Test 4: Test multiple values');
    const values = [100, 200, 300];
    const encryptedValues = [];
    
    for (const value of values) {
      const encrypted = await encryptValue(value, TEST_CONTRACT_ADDRESS, userAddress);
      encryptedValues.push(encrypted);
      console.log(`🧪 Encrypted ${value} -> ${encrypted}`);
    }
    
    console.log('✅ FHEVM Test completed successfully!');
    return {
      success: true,
      initResult,
      instance,
      testEncryption: encrypted,
      multipleEncryptions: encryptedValues
    };
    
  } catch (error) {
    console.error('❌ FHEVM Test failed:', error);
    return {
      success: false,
      error: error
    };
  }
};

/**
 * Quick test function to verify FHEVM is ready
 */
export const quickFHEVMTest = async (provider: any, userAddress: string) => {
  try {
    console.log('⚡ Quick FHEVM Test...');
    
    const initResult = await initializeFHEVM(provider);
    if (!initResult) {
      console.log('❌ Quick test failed: Cannot initialize FHEVM');
      return false;
    }
    
    const instance = getFHEVMInstance();
    if (!instance) {
      console.log('❌ Quick test failed: Cannot get FHEVM instance');
      return false;
    }
    
    console.log('✅ Quick FHEVM Test passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Quick FHEVM Test failed:', error);
    return false;
  }
};

export default {
  testFHEVM,
  quickFHEVMTest
};
