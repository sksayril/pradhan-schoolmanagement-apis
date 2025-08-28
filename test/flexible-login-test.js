/**
 * Test flexible login field names
 */

const request = require('supertest');
const app = require('../app');

async function testFlexibleLogin() {
  console.log('🧪 Testing Flexible Login Field Names...\n');

  // Test 1: Standard field names
  console.log('Test 1: Standard field names (email, password)');
  try {
    const response = await request(app)
      .post('/api/society-member/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    console.log('Status:', response.status);
    console.log('Response:', response.body.message || response.body);
  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('---\n');

  // Test 2: Capitalized field names
  console.log('Test 2: Capitalized field names (Email, Password)');
  try {
    const response = await request(app)
      .post('/api/society-member/login')
      .send({
        Email: 'test@example.com',
        Password: 'password123'
      });
    
    console.log('Status:', response.status);
    console.log('Response:', response.body.message || response.body);
  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('---\n');

  // Test 3: Alternative field names
  console.log('Test 3: Alternative field names (username, pwd)');
  try {
    const response = await request(app)
      .post('/api/society-member/login')
      .send({
        username: 'test@example.com',
        pwd: 'password123'
      });
    
    console.log('Status:', response.status);
    console.log('Response:', response.body.message || response.body);
  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('---\n');

  // Test 4: Member account number with standard field names
  console.log('Test 4: Member account number with standard field names');
  try {
    const response = await request(app)
      .post('/api/society-member/login')
      .send({
        memberAccountNumber: 'MEM2024000001',
        password: 'password123'
      });
    
    console.log('Status:', response.status);
    console.log('Response:', response.body.message || response.body);
  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('---\n');

  // Test 5: Member account number with alternative field names
  console.log('Test 5: Member account number with alternative field names (id, Password)');
  try {
    const response = await request(app)
      .post('/api/society-member/login')
      .send({
        id: 'MEM2024000001',
        Password: 'password123'
      });
    
    console.log('Status:', response.status);
    console.log('Response:', response.body.message || response.body);
  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('---\n');

  // Test 6: Empty request body
  console.log('Test 6: Empty request body');
  try {
    const response = await request(app)
      .post('/api/society-member/login')
      .send({});
    
    console.log('Status:', response.status);
    console.log('Response:', response.body.message || response.body);
  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('---\n');

  // Test 7: Only password
  console.log('Test 7: Only password');
  try {
    const response = await request(app)
      .post('/api/society-member/login')
      .send({
        password: 'password123'
      });
    
    console.log('Status:', response.status);
    console.log('Response:', response.body.message || response.body);
  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('\n✅ Flexible login tests completed!');
}

// Run the test if this file is executed directly
if (require.main === module) {
  testFlexibleLogin().catch(console.error);
}

module.exports = { testFlexibleLogin };
