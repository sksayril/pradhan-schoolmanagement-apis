/**
 * Society Member Login Examples
 * Demonstrates login using both email and memberAccountNumber
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/society-member';

// Example 1: Login with Email
async function loginWithEmail() {
  try {
    console.log('🔐 Logging in with email...');
    
    const response = await axios.post(`${BASE_URL}/login`, {
      email: 'john.doe@example.com',
      password: 'password123'
    });

    console.log('✅ Login successful with email');
    console.log('📧 Email:', response.data.data.member.email);
    console.log('🆔 Member Account Number:', response.data.data.member.memberAccountNumber);
    console.log('🔑 Token:', response.data.data.token.substring(0, 50) + '...');
    
    return response.data.data.token;
  } catch (error) {
    console.error('❌ Login with email failed:', error.response?.data?.message || error.message);
  }
}

// Example 2: Login with Member Account Number
async function loginWithMemberAccountNumber() {
  try {
    console.log('🔐 Logging in with member account number...');
    
    const response = await axios.post(`${BASE_URL}/login`, {
      memberAccountNumber: 'MEM2024000001',
      password: 'password123'
    });

    console.log('✅ Login successful with member account number');
    console.log('📧 Email:', response.data.data.member.email);
    console.log('🆔 Member Account Number:', response.data.data.member.memberAccountNumber);
    console.log('🔑 Token:', response.data.data.token.substring(0, 50) + '...');
    
    return response.data.data.token;
  } catch (error) {
    console.error('❌ Login with member account number failed:', error.response?.data?.message || error.message);
  }
}

// Example 3: Login with Case-Insensitive Member Account Number
async function loginWithCaseInsensitiveMemberAccountNumber() {
  try {
    console.log('🔐 Logging in with case-insensitive member account number...');
    
    const response = await axios.post(`${BASE_URL}/login`, {
      memberAccountNumber: 'mem2024000001', // lowercase
      password: 'password123'
    });

    console.log('✅ Login successful with case-insensitive member account number');
    console.log('📧 Email:', response.data.data.member.email);
    console.log('🆔 Member Account Number:', response.data.data.member.memberAccountNumber);
    console.log('🔑 Token:', response.data.data.token.substring(0, 50) + '...');
    
    return response.data.data.token;
  } catch (error) {
    console.error('❌ Login with case-insensitive member account number failed:', error.response?.data?.message || error.message);
  }
}

// Example 4: Failed Login Scenarios
async function demonstrateFailedLogins() {
  console.log('\n🚫 Demonstrating failed login scenarios...\n');

  // Missing password
  try {
    await axios.post(`${BASE_URL}/login`, {
      email: 'john.doe@example.com'
    });
  } catch (error) {
    console.log('❌ Missing password:', error.response?.data?.message);
  }

  // Missing both email and memberAccountNumber
  try {
    await axios.post(`${BASE_URL}/login`, {
      password: 'password123'
    });
  } catch (error) {
    console.log('❌ Missing credentials:', error.response?.data?.message);
  }

  // Invalid email
  try {
    await axios.post(`${BASE_URL}/login`, {
      email: 'nonexistent@example.com',
      password: 'password123'
    });
  } catch (error) {
    console.log('❌ Invalid email:', error.response?.data?.message);
  }

  // Invalid member account number
  try {
    await axios.post(`${BASE_URL}/login`, {
      memberAccountNumber: 'INVALID123',
      password: 'password123'
    });
  } catch (error) {
    console.log('❌ Invalid member account number:', error.response?.data?.message);
  }

  // Wrong password
  try {
    await axios.post(`${BASE_URL}/login`, {
      email: 'john.doe@example.com',
      password: 'wrongpassword'
    });
  } catch (error) {
    console.log('❌ Wrong password:', error.response?.data?.message);
  }
}

// Main function to run all examples
async function runExamples() {
  console.log('🚀 Society Member Login Examples\n');
  console.log('=' .repeat(50));

  // Run successful login examples
  await loginWithEmail();
  console.log();
  
  await loginWithMemberAccountNumber();
  console.log();
  
  await loginWithCaseInsensitiveMemberAccountNumber();
  console.log();

  // Run failed login examples
  await demonstrateFailedLogins();
  
  console.log('\n' + '=' .repeat(50));
  console.log('✨ Examples completed!');
}

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples().catch(console.error);
}

module.exports = {
  loginWithEmail,
  loginWithMemberAccountNumber,
  loginWithCaseInsensitiveMemberAccountNumber,
  demonstrateFailedLogins,
  runExamples
};
