const Razorpay = require('razorpay');

// Initialize Razorpay instance with fallback dummy keys for development
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy_key_id_12345',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_razorpay_secret_key_67890'
});

// Validate Razorpay configuration
const validateRazorpayConfig = () => {
  const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy_key_id_12345';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || 'dummy_razorpay_secret_key_67890';
  
  // Check if using dummy keys
  if (keyId === 'rzp_test_dummy_key_id_12345' || keySecret === 'dummy_razorpay_secret_key_67890') {
    console.warn('⚠️  Using dummy Razorpay keys. Please set proper RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment variables.');
    return false;
  }
  
  return true;
};

// Create order for online course payment
const createOrder = async (amount, currency = 'INR', receipt = null) => {
  try {
    // Check if using dummy keys
    if (!validateRazorpayConfig()) {
      // Return a mock order for development/testing
      const mockOrder = {
        id: `order_${Date.now()}_mock`,
        amount: amount * 100,
        currency: currency,
        receipt: receipt || `receipt_${Date.now()}`,
        status: 'created',
        created_at: Date.now()
      };
      
      console.log('📝 Using mock Razorpay order for development');
      return {
        success: true,
        order: mockOrder,
        isMock: true
      };
    }

    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency: currency,
      receipt: receipt || `receipt_${Date.now()}`,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);
    return {
      success: true,
      order: order,
      isMock: false
    };
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    
    // If it's an authentication error, provide helpful message
    if (error.statusCode === 401) {
      return {
        success: false,
        error: 'Razorpay authentication failed. Please check your API keys.',
        details: error.error?.description || error.message
      };
    }
    
    return {
      success: false,
      error: error.message
    };
  }
};

// Verify payment signature
const verifyPayment = (orderId, paymentId, signature) => {
  try {
    const text = orderId + '|' + paymentId;
    const crypto = require('crypto');
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    if (generatedSignature === signature) {
      return {
        success: true,
        message: 'Payment verified successfully'
      };
    } else {
      return {
        success: false,
        message: 'Invalid payment signature'
      };
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Create product in Razorpay (for online courses)
const createProduct = async (name, description) => {
  try {
    const product = await razorpay.products.create({
      name: name,
      description: description
    });
    return {
      success: true,
      product: product
    };
  } catch (error) {
    console.error('Razorpay product creation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Create price for product
const createPrice = async (productId, amount, currency = 'INR') => {
  try {
    const price = await razorpay.prices.create({
      product_id: productId,
      unit_amount: amount * 100, // Convert to paise
      currency: currency
    });
    return {
      success: true,
      price: price
    };
  } catch (error) {
    console.error('Razorpay price creation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get payment details
const getPaymentDetails = async (paymentId) => {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return {
      success: true,
      payment: payment
    };
  } catch (error) {
    console.error('Razorpay payment fetch error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Refund payment
const refundPayment = async (paymentId, amount = null, reason = 'Refund requested') => {
  try {
    const refundOptions = {
      payment_id: paymentId,
      reason: reason
    };

    if (amount) {
      refundOptions.amount = amount * 100; // Convert to paise
    }

    const refund = await razorpay.payments.refund(paymentId, refundOptions);
    return {
      success: true,
      refund: refund
    };
  } catch (error) {
    console.error('Razorpay refund error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  razorpay,
  createOrder,
  verifyPayment,
  createProduct,
  createPrice,
  getPaymentDetails,
  refundPayment
}; 