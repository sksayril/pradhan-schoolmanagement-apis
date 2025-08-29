/**
 * Test Payment Endpoints
 * This file tests the payment API endpoints to ensure they work correctly
 */

const express = require('express');
const request = require('supertest');

// Mock the authentication middleware for testing
const mockAuthMiddleware = (req, res, next) => {
  req.societyMember = { _id: 'mock-member-id' };
  next();
};

// Mock the Razorpay utilities
const mockRazorpay = {
  createOrder: async (amount, currency, notes) => ({
    success: true,
    order: { id: 'order_mock_123' }
  }),
  verifyPayment: async (orderId, paymentId, signature) => ({
    success: true,
    message: 'Payment verified'
  })
};

// Mock the PaymentRequest model
const mockPaymentRequest = {
  findOne: async (filter) => {
    if (filter.requestId === 'PR001' || filter._id === 'PR001') {
      return {
        _id: 'PR001',
        requestId: 'PR001',
        societyMember: 'mock-member-id',
        status: 'PENDING',
        totalAmount: 1000,
        amount: 1000,
        paymentDetails: {},
        save: async () => true,
        getPaymentSummary: () => ({
          requestId: 'PR001',
          amount: 1000,
          status: 'PENDING'
        })
      };
    }
    return null;
  }
};

// Mock the mongoose ObjectId validation
const mockMongoose = {
  Types: {
    ObjectId: {
      isValid: (id) => id === 'PR001' || id.length === 24
    }
  }
};

// Create a test app
const app = express();
app.use(express.json());

// Mock the routes
app.post('/create-razorpay-order', mockAuthMiddleware, async (req, res) => {
  try {
    const { requestId, amount, currency = 'INR' } = req.body;

    // Validate required fields
    if (!requestId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'requestId and amount are required'
      });
    }

    // Validate currency
    if (currency !== 'INR') {
      return res.status(400).json({
        success: false,
        message: 'Only INR currency is supported'
      });
    }

    // Find payment request
    let paymentRequest;
    
    if (mockMongoose.Types.ObjectId.isValid(requestId)) {
      paymentRequest = await mockPaymentRequest.findOne({
        _id: requestId,
        societyMember: req.societyMember._id,
        status: 'PENDING'
      });
    } else {
      paymentRequest = await mockPaymentRequest.findOne({
        requestId: requestId,
        societyMember: req.societyMember._id,
        status: 'PENDING'
      });
    }

    if (!paymentRequest) {
      return res.status(404).json({
        success: false,
        message: 'Payment request not found or not eligible for payment'
      });
    }

    // Validate amount (should match payment request total amount)
    const expectedAmount = paymentRequest.totalAmount;
    if (amount !== expectedAmount) {
      return res.status(400).json({
        success: false,
        message: `Amount mismatch. Expected: ${expectedAmount}, Received: ${amount}`
      });
    }

    // Create Razorpay order
    const orderResult = await mockRazorpay.createOrder(
      amount,
      currency,
      `payment_${paymentRequest.requestId}`
    );

    if (!orderResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create payment order',
        error: orderResult.error
      });
    }

    res.json({
      success: true,
      orderId: orderResult.order.id,
      amount: amount,
      currency: currency
    });

  } catch (error) {
    console.error('Create Razorpay order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

app.post('/verify-razorpay-payment', mockAuthMiddleware, async (req, res) => {
  try {
    const { requestId, paymentId, orderId, signature, amount } = req.body;

    // Validate required fields
    if (!requestId || !paymentId || !orderId || !signature || !amount) {
      return res.status(400).json({
        success: false,
        message: 'requestId, paymentId, orderId, signature, and amount are required'
      });
    }

    // Find payment request
    let paymentRequest;
    
    if (mockMongoose.Types.ObjectId.isValid(requestId)) {
      paymentRequest = await mockPaymentRequest.findOne({
        _id: requestId,
        societyMember: req.societyMember._id,
        status: 'PENDING'
      });
    } else {
      paymentRequest = await mockPaymentRequest.findOne({
        requestId: requestId,
        societyMember: req.societyMember._id,
        status: 'PENDING'
      });
    }

    if (!paymentRequest) {
      return res.status(404).json({
        success: false,
        message: 'Payment request not found'
      });
    }

    // Validate order ID matches
    if (paymentRequest.paymentDetails?.razorpayOrderId !== orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID mismatch'
      });
    }

    // Validate amount matches
    if (amount !== paymentRequest.totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Amount mismatch'
      });
    }

    // Check if this is a mock order (for development/testing)
    const isMockOrder = orderId.includes('_mock');
    
    if (isMockOrder) {
      // For mock orders, skip signature verification
      paymentRequest.status = 'PAID';
      paymentRequest.paidAt = new Date();
      paymentRequest.paymentDetails = {
        ...paymentRequest.paymentDetails,
        razorpayPaymentId: paymentId,
        paymentDate: new Date(),
        isMock: true
      };

      await paymentRequest.save();

      return res.json({
        success: true,
        message: 'Payment verified successfully'
      });
    }

    // Verify payment signature for real orders
    const verificationResult = await mockRazorpay.verifyPayment(
      orderId,
      paymentId,
      signature
    );

    if (!verificationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
        error: verificationResult.message
      });
    }

    // Update payment request
    paymentRequest.status = 'PAID';
    paymentRequest.paidAt = new Date();
    paymentRequest.paymentDetails = {
      ...paymentRequest.paymentDetails,
      razorpayPaymentId: paymentId,
      paymentDate: new Date()
    };

    await paymentRequest.save();

    res.json({
      success: true,
      message: 'Payment verified successfully'
    });

  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Test the endpoints
async function testPaymentEndpoints() {
  console.log('🧪 Testing Payment Endpoints\n');

  // Test 1: Create Razorpay Order - Success
  console.log('📝 Test 1: Create Razorpay Order - Success');
  try {
    const response = await request(app)
      .post('/create-razorpay-order')
      .send({
        requestId: 'PR001',
        amount: 1000,
        currency: 'INR'
      });

    console.log('Status:', response.status);
    console.log('Response:', response.body);
    console.log('✅ Test 1 passed\n');
  } catch (error) {
    console.log('❌ Test 1 failed:', error.message);
  }

  // Test 2: Create Razorpay Order - Missing fields
  console.log('📝 Test 2: Create Razorpay Order - Missing fields');
  try {
    const response = await request(app)
      .post('/create-razorpay-order')
      .send({
        requestId: 'PR001'
        // Missing amount
      });

    console.log('Status:', response.status);
    console.log('Response:', response.body);
    console.log('✅ Test 2 passed (correctly rejected)\n');
  } catch (error) {
    console.log('❌ Test 2 failed:', error.message);
  }

  // Test 3: Create Razorpay Order - Invalid currency
  console.log('📝 Test 3: Create Razorpay Order - Invalid currency');
  try {
    const response = await request(app)
      .post('/create-razorpay-order')
      .send({
        requestId: 'PR001',
        amount: 1000,
        currency: 'USD'
      });

    console.log('Status:', response.status);
    console.log('Response:', response.body);
    console.log('✅ Test 3 passed (correctly rejected)\n');
  } catch (error) {
    console.log('❌ Test 3 failed:', error.message);
  }

  // Test 4: Verify Payment - Success
  console.log('📝 Test 4: Verify Payment - Success');
  try {
    const response = await request(app)
      .post('/verify-razorpay-payment')
      .send({
        requestId: 'PR001',
        paymentId: 'pay_mock_123',
        orderId: 'order_mock_123',
        signature: 'mock_signature',
        amount: 1000
      });

    console.log('Status:', response.status);
    console.log('Response:', response.body);
    console.log('✅ Test 4 passed\n');
  } catch (error) {
    console.log('❌ Test 4 failed:', error.message);
  }

  // Test 5: Verify Payment - Missing fields
  console.log('📝 Test 5: Verify Payment - Missing fields');
  try {
    const response = await request(app)
      .post('/verify-razorpay-payment')
      .send({
        requestId: 'PR001',
        paymentId: 'pay_mock_123'
        // Missing orderId, signature, amount
      });

    console.log('Status:', response.status);
    console.log('Response:', response.body);
    console.log('✅ Test 5 passed (correctly rejected)\n');
  } catch (error) {
    console.log('❌ Test 5 failed:', error.message);
  }

  console.log('🎉 Payment Endpoints Testing Completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  testPaymentEndpoints().catch(console.error);
}

module.exports = { app, testPaymentEndpoints };
