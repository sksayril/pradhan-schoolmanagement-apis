const Razorpay = require('razorpay');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create order for online course payment
const createOrder = async (amount, currency = 'INR', receipt = null) => {
  try {
    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency: currency,
      receipt: receipt || `receipt_${Date.now()}`,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);
    return {
      success: true,
      order: order
    };
  } catch (error) {
    console.error('Razorpay order creation error:', error);
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