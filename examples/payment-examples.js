/**
 * Payment Request System Examples
 * This file demonstrates how to use the payment request system
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000/api';
const ADMIN_TOKEN = 'your_admin_jwt_token';
const MEMBER_TOKEN = 'your_member_jwt_token';

// Example 1: Admin creates an RD payment request
async function createRDPaymentRequest() {
  try {
    const paymentData = {
      societyMemberId: '507f1f77bcf86cd799439011', // Replace with actual member ID
      paymentType: 'RD',
      amount: 5000,
      interestRate: 8.5,
              paymentMethod: 'UPI',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      description: 'Monthly RD contribution for January 2024',
      duration: 12,
      recurringDetails: {
        frequency: 'MONTHLY',
        totalInstallments: 12
      }
    };

    const response = await axios.post(`${BASE_URL}/payment-requests/admin/create`, paymentData, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('RD Payment Request Created:', response.data);
    return response.data.data.requestId;
  } catch (error) {
    console.error('Error creating RD payment request:', error.response?.data || error.message);
  }
}

// Example 2: Admin creates an FD payment request
async function createFDPaymentRequest() {
  try {
    const paymentData = {
      societyMemberId: '507f1f77bcf86cd799439011', // Replace with actual member ID
      paymentType: 'FD',
      amount: 100000,
      interestRate: 9.5,
      paymentMethod: 'CASH',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      description: 'Fixed deposit for 12 months',
      duration: 12
    };

    const response = await axios.post(`${BASE_URL}/payment-requests/admin/create`, paymentData, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('FD Payment Request Created:', response.data);
    return response.data.data.requestId;
  } catch (error) {
    console.error('Error creating FD payment request:', error.response?.data || error.message);
  }
}

// Example 3: Admin creates an OD payment request
async function createODPaymentRequest() {
  try {
    const paymentData = {
      societyMemberId: '507f1f77bcf86cd799439011', // Replace with actual member ID
      paymentType: 'OD',
      amount: 25000,
      interestRate: 12.0,
      paymentMethod: 'UPI',
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      description: 'Overdraft facility for emergency needs'
    };

    const response = await axios.post(`${BASE_URL}/payment-requests/admin/create`, paymentData, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('OD Payment Request Created:', response.data);
    return response.data.data.requestId;
  } catch (error) {
    console.error('Error creating OD payment request:', error.response?.data || error.message);
  }
}

// Example 4: Society member views their payment requests
async function getMemberPaymentRequests() {
  try {
    const response = await axios.get(`${BASE_URL}/payment-requests/member/requests`, {
      headers: {
        'Authorization': `Bearer ${MEMBER_TOKEN}`
      }
    });

    console.log('Member Payment Requests:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('Error getting member payment requests:', error.response?.data || error.message);
  }
}

// Example 5: Society member gets pending payments
async function getPendingPayments() {
  try {
    const response = await axios.get(`${BASE_URL}/payment-requests/member/pending`, {
      headers: {
        'Authorization': `Bearer ${MEMBER_TOKEN}`
      }
    });

    console.log('Pending Payments:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('Error getting pending payments:', error.response?.data || error.message);
  }
}



// Example 7: Society member processes UPI payment
async function processUPIPayment(requestId) {
  try {
    const response = await axios.post(`${BASE_URL}/payment-requests/process-upi-payment`, {
      requestId: requestId,
      upiTransactionId: 'UPI123456789'
    }, {
      headers: {
        'Authorization': `Bearer ${MEMBER_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('UPI Payment Processed:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('Error processing UPI payment:', error.response?.data || error.message);
  }
}

// Example 8: Admin marks payment as received
async function markPaymentAsReceived(requestId) {
  try {
    const paymentData = {
      paymentMethod: 'CASH',
      transactionId: 'TXN123456789',
      cashReceiptNumber: 'CR001'
    };

    const response = await axios.post(`${BASE_URL}/payment-requests/admin/requests/${requestId}/mark-paid`, paymentData, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Payment Marked as Received:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('Error marking payment as received:', error.response?.data || error.message);
  }
}

// Example 9: Admin gets payment statistics
async function getPaymentStatistics() {
  try {
    const response = await axios.get(`${BASE_URL}/payment-requests/admin/statistics`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      }
    });

    console.log('Payment Statistics:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('Error getting payment statistics:', error.response?.data || error.message);
  }
}

// Example 10: Admin gets all payment requests with filters
async function getAllPaymentRequests() {
  try {
    const response = await axios.get(`${BASE_URL}/payment-requests/admin/requests?status=PENDING&paymentType=RD&page=1&limit=10`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      }
    });

    console.log('All Payment Requests:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('Error getting all payment requests:', error.response?.data || error.message);
  }
}

// Example 11: Complete payment workflow
async function completePaymentWorkflow() {
  console.log('=== Starting Payment Workflow ===');
  
  // Step 1: Admin creates RD payment request
  const rdRequestId = await createRDPaymentRequest();
  if (!rdRequestId) return;
  
  // Step 2: Member views their payment requests
  await getMemberPaymentRequests();
  
  // Step 3: Member gets pending payments
  await getPendingPayments();
  

  
  // Step 5: Admin marks payment as received (simulating successful payment)
  await markPaymentAsReceived(rdRequestId);
  
  // Step 6: Admin gets payment statistics
  await getPaymentStatistics();
  
  console.log('=== Payment Workflow Completed ===');
}

// Example 12: Different payment types demonstration
async function demonstratePaymentTypes() {
  console.log('=== Demonstrating Different Payment Types ===');
  
  // Create RD payment request
  await createRDPaymentRequest();
  
  // Create FD payment request
  await createFDPaymentRequest();
  
  // Create OD payment request
  await createODPaymentRequest();
  
  // Get all payment requests
  await getAllPaymentRequests();
  
  console.log('=== Payment Types Demonstration Completed ===');
}

// Run examples
async function runExamples() {
  console.log('Payment Request System Examples');
  console.log('================================');
  
  // Uncomment the examples you want to run
  
  // await completePaymentWorkflow();
  // await demonstratePaymentTypes();
  
  // Individual examples
  // await createRDPaymentRequest();
  // await createFDPaymentRequest();
  // await createODPaymentRequest();
  // await getMemberPaymentRequests();
  // await getPendingPayments();
  // await getPaymentStatistics();
  // await getAllPaymentRequests();
}

// Export functions for use in other files
module.exports = {
  createRDPaymentRequest,
  createFDPaymentRequest,
  createODPaymentRequest,
  getMemberPaymentRequests,
  getPendingPayments,

  processUPIPayment,
  markPaymentAsReceived,
  getPaymentStatistics,
  getAllPaymentRequests,
  completePaymentWorkflow,
  demonstratePaymentTypes
};

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples().catch(console.error);
}
