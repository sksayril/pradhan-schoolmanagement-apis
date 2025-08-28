/**
 * Simple test to verify society member login works
 */

const request = require('supertest');
const app = require('../app');

// Test the login endpoint with different scenarios
async function testLogin() {
  console.log('🧪 Testing Society Member Login...\n');

  // Test 1: Missing password
  console.log('Test 1: Missing password');
  try {
    const response = await request(app)
      .post('/api/society-member/login')
      .send({
        email: 'test@example.com'
      });
    
    console.log('Status:', response.status);
    console.log('Response:', response.body.message);
  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('---\n');

  // Test 2: Missing both email and memberAccountNumber
  console.log('Test 2: Missing both email and memberAccountNumber');
  try {
    const response = await request(app)
      .post('/api/society-member/login')
      .send({
        password: 'password123'
      });
    
    console.log('Status:', response.status);
    console.log('Response:', response.body.message);
  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('---\n');

  // Test 3: Valid email format
  console.log('Test 3: Valid email format');
  try {
    const response = await request(app)
      .post('/api/society-member/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    console.log('Status:', response.status);
    if (response.status === 401) {
      console.log('Response:', response.body.message);
    } else {
      console.log('Response:', response.body);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('---\n');

  // Test 4: Valid memberAccountNumber format
  console.log('Test 4: Valid memberAccountNumber format');
  try {
    const response = await request(app)
      .post('/api/society-member/login')
      .send({
        memberAccountNumber: 'MEM2024000001',
        password: 'password123'
      });
    
    console.log('Status:', response.status);
    if (response.status === 401) {
      console.log('Response:', response.body.message);
    } else {
      console.log('Response:', response.body);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('---\n');

  // Test 5: Case insensitive memberAccountNumber
  console.log('Test 5: Case insensitive memberAccountNumber');
  try {
    const response = await request(app)
      .post('/api/society-member/login')
      .send({
        memberAccountNumber: 'mem2024000001',
        password: 'password123'
      });
    
    console.log('Status:', response.status);
    if (response.status === 401) {
      console.log('Response:', response.body.message);
    } else {
      console.log('Response:', response.body);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('\n✅ Login tests completed!');
}

// Run the test if this file is executed directly
if (require.main === module) {
  testLogin().catch(console.error);
}

module.exports = { testLogin };
