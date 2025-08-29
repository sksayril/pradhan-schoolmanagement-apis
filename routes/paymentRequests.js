const express = require('express');
const router = express.Router();
const PaymentRequest = require('../models/paymentRequest.model');
const SocietyMember = require('../models/societyMember.model');
const Admin = require('../models/admin.model');
const { createOrder, verifyPayment } = require('../utilities/razorpay');
const { authenticateAdmin, authenticateSocietyMember } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { getCDPenaltySummary, calculateCDPenalty } = require('../utilities/cdPenaltyCalculator');

// Health check route
router.get('/health', (req, res) => {
  // Check Razorpay configuration
  const razorpayConfig = {
    hasKeyId: !!process.env.RAZORPAY_KEY_ID,
    hasKeySecret: !!process.env.RAZORPAY_KEY_SECRET,
    usingDummyKeys: !process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET
  };

  res.json({
    success: true,
    message: 'Payment Requests API is working',
    timestamp: new Date().toISOString(),
    razorpay: {
      configured: razorpayConfig.hasKeyId && razorpayConfig.hasKeySecret,
      status: razorpayConfig.usingDummyKeys ? 'Using dummy keys (development mode)' : 'Properly configured',
      ...razorpayConfig
    }
  });
});

// Validation middleware
const validatePaymentRequest = [
  body('societyMemberId').isMongoId().withMessage('Valid society member ID is required'),
  body('paymentType').isIn(['RD', 'FD', 'OD', 'CD']).withMessage('Payment type must be RD, FD, OD, or CD'),
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least 1'),
  body('interestRate').isFloat({ min: 0, max: 100 }).withMessage('Interest rate must be between 0 and 100'),
  body('paymentMethod').isIn(['UPI', 'RAZORPAY', 'CASH']).withMessage('Payment method must be UPI, RAZORPAY, or CASH'),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters')
];

// ==================== ADMIN ROUTES ====================

// Create payment request (Admin only)
router.post('/admin/create', authenticateAdmin, validatePaymentRequest, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      societyMemberId,
      paymentType,
      amount,
      interestRate,
      paymentMethod,
      dueDate,
      description,
      duration,
      recurringDetails
    } = req.body;

    // Validate that all required fields are present
    if (!amount || !interestRate || !paymentMethod || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: amount, interestRate, paymentMethod, dueDate'
      });
    }

    // Validate society member exists
    const societyMember = await SocietyMember.findById(societyMemberId);
    if (!societyMember) {
      return res.status(404).json({
        success: false,
        message: 'Society member not found'
      });
    }

    // Additional validation for RD/FD payments
    if (['RD', 'FD'].includes(paymentType)) {
      if (!duration || duration < 1 || duration > 120) {
        return res.status(400).json({
          success: false,
          message: 'Duration must be between 1 and 120 months for RD and FD payments'
        });
      }
    }

    // Additional validation for RD payments
    if (paymentType === 'RD') {
      if (!recurringDetails || !recurringDetails.totalInstallments || recurringDetails.totalInstallments < 1) {
        return res.status(400).json({
          success: false,
          message: 'Recurring details with total installments are required for RD payments'
        });
      }
      
      if (!['MONTHLY', 'WEEKLY', 'DAILY'].includes(recurringDetails.frequency)) {
        return res.status(400).json({
          success: false,
          message: 'Frequency must be MONTHLY, WEEKLY, or DAILY for RD payments'
        });
      }
    }

    // Create payment request data with proper defaults
    const paymentRequestData = {
      societyMember: societyMemberId,
      createdBy: req.admin._id,
      paymentType,
      amount: parseFloat(amount),
      interestRate: parseFloat(interestRate),
      paymentMethod,
      dueDate: new Date(dueDate),
      description: description || '',
      lateFee: 0, // Initialize lateFee
      totalAmount: parseFloat(amount), // Will be calculated in pre-save
      status: 'PENDING'
    };

    // Add duration for RD/FD payments
    if (['RD', 'FD'].includes(paymentType)) {
      paymentRequestData.duration = parseInt(duration);
      
      // For RD/FD, set a default maturity date (will be recalculated in pre-save)
      const defaultMaturityDate = new Date();
      defaultMaturityDate.setMonth(defaultMaturityDate.getMonth() + (parseInt(duration) || 12));
      paymentRequestData.maturityDate = defaultMaturityDate;
    }

    // Add recurring details for RD payments
    if (paymentType === 'RD' && recurringDetails) {
      paymentRequestData.recurringDetails = {
        frequency: recurringDetails.frequency || 'MONTHLY',
        totalInstallments: parseInt(recurringDetails.totalInstallments),
        installmentsPaid: 0,
        nextDueDate: null // Will be set in pre-save middleware
      };
    }

    const paymentRequest = new PaymentRequest(paymentRequestData);
    
    // Log the data being saved for debugging
    console.log('Creating payment request with data:', JSON.stringify(paymentRequestData, null, 2));
    console.log('Payment request object before save:', {
      paymentType: paymentRequest.paymentType,
      duration: paymentRequest.duration,
      maturityDate: paymentRequest.maturityDate,
      totalAmount: paymentRequest.totalAmount,
      requestId: paymentRequest.requestId
    });
    
    await paymentRequest.save();
    
    // Log the saved payment request for debugging
    console.log('Payment request created successfully:', paymentRequest.requestId);
    console.log('After save - maturityDate:', paymentRequest.maturityDate);
    console.log('After save - totalAmount:', paymentRequest.totalAmount);

    res.status(201).json({
      success: true,
      message: 'Payment request created successfully',
      data: paymentRequest.getAdminView()
    });

  } catch (error) {
    console.error('Create payment request error:', error);
    
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    // Handle other specific errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate payment request'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get all payment requests (Admin)
router.get('/admin/requests', authenticateAdmin, async (req, res) => {
  try {

    const { page = 1, limit = 10, status, paymentType, societyMemberId } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) filter.status = status;
    if (paymentType) filter.paymentType = paymentType;
    if (societyMemberId) filter.societyMember = societyMemberId;

    const paymentRequests = await PaymentRequest.find(filter)
      .populate('societyMember', 'firstName lastName email phone memberAccountNumber')
      .populate('createdBy', 'firstName lastName email')
      .populate('paymentDetails.receivedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await PaymentRequest.countDocuments(filter);

    res.json({
      success: true,
      data: paymentRequests.map(req => req.getAdminView()),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get payment requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get payment request by ID (Admin)
router.get('/admin/requests/:requestId', authenticateAdmin, async (req, res) => {
  try {
    const { requestId } = req.params;
    
    let paymentRequest;
    
    // Check if it's a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(requestId)) {
      paymentRequest = await PaymentRequest.findById(requestId)
        .populate('societyMember', 'firstName lastName email phone memberAccountNumber')
        .populate('createdBy', 'firstName lastName email')
        .populate('paymentDetails.receivedBy', 'firstName lastName');
    } else {
      // If not ObjectId, search by requestId field
      paymentRequest = await PaymentRequest.findOne({ requestId: requestId })
        .populate('societyMember', 'firstName lastName email phone memberAccountNumber')
        .populate('createdBy', 'firstName lastName email')
        .populate('paymentDetails.receivedBy', 'firstName lastName');
    }

    if (!paymentRequest) {
      return res.status(404).json({
        success: false,
        message: 'Payment request not found'
      });
    }

    res.json({
      success: true,
      data: paymentRequest.getAdminView()
    });

  } catch (error) {
    console.error('Get payment request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Update payment request (Admin)
router.put('/admin/requests/:requestId', authenticateAdmin, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { amount, interestRate, dueDate, description, status } = req.body;

    let paymentRequest;
    
    // Check if it's a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(requestId)) {
      paymentRequest = await PaymentRequest.findById(requestId);
    } else {
      // If not ObjectId, search by requestId field
      paymentRequest = await PaymentRequest.findOne({ requestId: requestId });
    }

    if (!paymentRequest) {
      return res.status(404).json({
        success: false,
        message: 'Payment request not found'
      });
    }

    // Only allow updates if payment is not completed
    if (paymentRequest.status === 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update completed payment request'
      });
    }

    if (amount) paymentRequest.amount = amount;
    if (interestRate) paymentRequest.interestRate = interestRate;
    if (dueDate) paymentRequest.dueDate = new Date(dueDate);
    if (description) paymentRequest.description = description;
    if (status) paymentRequest.status = status;

    await paymentRequest.save();

    res.json({
      success: true,
      message: 'Payment request updated successfully',
      data: paymentRequest.getAdminView()
    });

  } catch (error) {
    console.error('Update payment request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Mark payment as received (Admin)
router.post('/admin/requests/:requestId/mark-paid', authenticateAdmin, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { paymentMethod, transactionId, cashReceiptNumber } = req.body;

    let paymentRequest;
    
    // Check if it's a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(requestId)) {
      paymentRequest = await PaymentRequest.findById(requestId);
    } else {
      // If not ObjectId, search by requestId field
      paymentRequest = await PaymentRequest.findOne({ requestId: requestId });
    }

    if (!paymentRequest) {
      return res.status(404).json({
        success: false,
        message: 'Payment request not found'
      });
    }

    if (paymentRequest.status === 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'Payment request is already marked as paid'
      });
    }

    // Update payment details
    paymentRequest.status = 'PAID';
    paymentRequest.paidAt = new Date();
    paymentRequest.paymentDetails = {
      ...paymentRequest.paymentDetails,
      transactionId,
      paymentDate: new Date(),
      receivedBy: req.admin._id,
      cashReceiptNumber: paymentMethod === 'CASH' ? cashReceiptNumber : undefined
    };

    await paymentRequest.save();

    res.json({
      success: true,
      message: 'Payment marked as received successfully',
      data: paymentRequest.getAdminView()
    });

  } catch (error) {
    console.error('Mark payment received error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get payment statistics (Admin)
router.get('/admin/statistics', authenticateAdmin, async (req, res) => {
  try {

    const { startDate, endDate } = req.query;
    const filter = {};

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const totalRequests = await PaymentRequest.countDocuments(filter);
    const pendingRequests = await PaymentRequest.countDocuments({ ...filter, status: 'PENDING' });
    const paidRequests = await PaymentRequest.countDocuments({ ...filter, status: 'PAID' });
    const totalAmount = await PaymentRequest.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const paymentTypeStats = await PaymentRequest.aggregate([
      { $match: filter },
      { $group: { _id: '$paymentType', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalRequests,
        pendingRequests,
        paidRequests,
        totalAmount: totalAmount[0]?.total || 0,
        paymentTypeStats
      }
    });

  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// ==================== SOCIETY MEMBER ROUTES ====================

// Get society member's payment requests
router.get('/member/requests', authenticateSocietyMember, async (req, res) => {
  try {

    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

          const filter = { societyMember: req.societyMember._id };
    if (status) filter.status = status;

    const paymentRequests = await PaymentRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await PaymentRequest.countDocuments(filter);

    res.json({
      success: true,
      data: paymentRequests.map(req => req.getPaymentSummary()),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get member payment requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get society member's payment request by ID
router.get('/member/requests/:requestId', authenticateSocietyMember, async (req, res) => {
  try {
    const { requestId } = req.params;
    
    let paymentRequest;
    
    // Check if it's a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(requestId)) {
      paymentRequest = await PaymentRequest.findOne({
        _id: requestId,
        societyMember: req.societyMember._id
      });
    } else {
      // If not ObjectId, search by requestId field
      paymentRequest = await PaymentRequest.findOne({
        requestId: requestId,
        societyMember: req.societyMember._id
      });
    }

    if (!paymentRequest) {
      return res.status(404).json({
        success: false,
        message: 'Payment request not found'
      });
    }

    res.json({
      success: true,
      data: paymentRequest.getPaymentSummary()
    });

  } catch (error) {
    console.error('Get member payment request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get pending payments for society member
router.get('/member/pending', authenticateSocietyMember, async (req, res) => {
  try {
    const pendingRequests = await PaymentRequest.find({
      societyMember: req.societyMember._id,
      status: 'PENDING'
    }).sort({ dueDate: 1 });

    const totalPendingAmount = pendingRequests.reduce((sum, req) => sum + req.totalAmount, 0);

    res.json({
      success: true,
      data: {
        requests: pendingRequests.map(req => req.getPaymentSummary()),
        totalPendingAmount,
        totalPendingCount: pendingRequests.length
      }
    });

  } catch (error) {
    console.error('Get pending payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// ==================== PAYMENT PROCESSING ROUTES ====================

// Create Razorpay Order
router.post('/create-razorpay-order', authenticateSocietyMember, async (req, res) => {
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
    
    if (mongoose.Types.ObjectId.isValid(requestId)) {
      paymentRequest = await PaymentRequest.findOne({
        _id: requestId,
        societyMember: req.societyMember._id,
        status: 'PENDING'
      });
    } else {
      paymentRequest = await PaymentRequest.findOne({
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
    const orderResult = await createOrder(
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

    // Update payment request with order ID
    paymentRequest.paymentDetails = paymentRequest.paymentDetails || {};
    paymentRequest.paymentDetails.razorpayOrderId = orderResult.order.id;
    await paymentRequest.save();

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

// Verify Payment
router.post('/verify-razorpay-payment', authenticateSocietyMember, async (req, res) => {
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
    
    if (mongoose.Types.ObjectId.isValid(requestId)) {
      paymentRequest = await PaymentRequest.findOne({
        _id: requestId,
        societyMember: req.societyMember._id,
        status: 'PENDING'
      });
    } else {
      paymentRequest = await PaymentRequest.findOne({
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
    const verificationResult = verifyPayment(
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

// Process UPI payment
router.post('/process-upi-payment', authenticateSocietyMember, async (req, res) => {
  try {
    const { requestId, upiTransactionId } = req.body;

    let paymentRequest;
    
    // Check if it's a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(requestId)) {
      paymentRequest = await PaymentRequest.findOne({
        _id: requestId,
        societyMember: req.societyMember._id,
        status: 'PENDING'
      });
    } else {
      // If not ObjectId, search by requestId field
      paymentRequest = await PaymentRequest.findOne({
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

    if (paymentRequest.paymentMethod !== 'UPI') {
      return res.status(400).json({
        success: false,
        message: 'This payment request does not support UPI payment'
      });
    }

    // Update payment request
    paymentRequest.status = 'PAID';
    paymentRequest.paidAt = new Date();
    paymentRequest.paymentDetails = {
      ...paymentRequest.paymentDetails,
      upiTransactionId,
      paymentDate: new Date()
    };

    await paymentRequest.save();

    res.json({
      success: true,
      message: 'UPI payment processed successfully',
      data: paymentRequest.getPaymentSummary()
    });

  } catch (error) {
    console.error('Process UPI payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// ==================== CD PENALTY ROUTES ====================

// Get CD penalty summary for a society member
router.get('/member/cd-penalties', authenticateSocietyMember, async (req, res) => {
  try {
    // Get all CD payment requests for the member
    const cdPayments = await PaymentRequest.find({
      societyMember: req.societyMember._id,
      paymentType: 'CD'
    }).sort({ dueDate: 1 });

    const penaltySummary = getCDPenaltySummary(cdPayments);

    res.json({
      success: true,
      data: penaltySummary
    });

  } catch (error) {
    console.error('Get CD penalties error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get CD penalty details for a specific payment request
router.get('/member/cd-penalties/:requestId', authenticateSocietyMember, async (req, res) => {
  try {
    const { requestId } = req.params;
    
    let paymentRequest;
    
    // Check if it's a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(requestId)) {
      paymentRequest = await PaymentRequest.findOne({
        _id: requestId,
        societyMember: req.societyMember._id,
        paymentType: 'CD'
      });
    } else {
      // If not ObjectId, search by requestId field
      paymentRequest = await PaymentRequest.findOne({
        requestId: requestId,
        societyMember: req.societyMember._id,
        paymentType: 'CD'
      });
    }

    if (!paymentRequest) {
      return res.status(404).json({
        success: false,
        message: 'CD payment request not found'
      });
    }

    // Calculate current penalty
    const penalty = calculateCDPenalty(paymentRequest.dueDate);
    
    // Update the payment request with current penalty
    paymentRequest.cdPenalty = penalty.penaltyAmount;
    paymentRequest.totalAmount = paymentRequest.amount + paymentRequest.lateFee + paymentRequest.cdPenalty;
    await paymentRequest.save();

    res.json({
      success: true,
      data: {
        paymentRequest: paymentRequest.getPaymentSummary(),
        penaltyDetails: penalty,
        totalAmountWithPenalty: paymentRequest.totalAmount
      }
    });

  } catch (error) {
    console.error('Get CD penalty details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Admin: Get CD penalty summary for all members
router.get('/admin/cd-penalties', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, societyMemberId } = req.query;
    const skip = (page - 1) * limit;

    const filter = { paymentType: 'CD' };
    if (societyMemberId) filter.societyMember = societyMemberId;

    // Get all CD payments with pagination
    const cdPayments = await PaymentRequest.find(filter)
      .populate('societyMember', 'firstName lastName email phone memberAccountNumber')
      .populate('createdBy', 'firstName lastName email')
      .sort({ dueDate: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Calculate penalties for each payment
    const penaltiesWithDetails = cdPayments.map(payment => {
      const penalty = calculateCDPenalty(payment.dueDate);
      return {
        requestId: payment.requestId,
        _id: payment._id,
        societyMember: payment.societyMember,
        createdBy: payment.createdBy,
        amount: payment.amount,
        dueDate: payment.dueDate,
        status: payment.status,
        penalty: penalty,
        totalAmountWithPenalty: payment.amount + penalty.penaltyAmount
      };
    });

    const total = await PaymentRequest.countDocuments(filter);

    res.json({
      success: true,
      data: penaltiesWithDetails,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get admin CD penalties error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Admin: Get CD penalty summary for a specific member
router.get('/admin/cd-penalties/member/:memberId', authenticateAdmin, async (req, res) => {
  try {
    const { memberId } = req.params;

    // Validate member ID
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid member ID'
      });
    }

    // Get all CD payments for the member
    const cdPayments = await PaymentRequest.find({
      societyMember: memberId,
      paymentType: 'CD'
    }).populate('societyMember', 'firstName lastName email phone memberAccountNumber');

    if (cdPayments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No CD payments found for this member'
      });
    }

    const penaltySummary = getCDPenaltySummary(cdPayments);

    res.json({
      success: true,
      data: {
        member: cdPayments[0].societyMember,
        penaltySummary: penaltySummary
      }
    });

  } catch (error) {
    console.error('Get member CD penalties error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Admin: Update CD penalty for a specific payment request
router.post('/admin/cd-penalties/:requestId/update', authenticateAdmin, async (req, res) => {
  try {
    const { requestId } = req.params;
    
    let paymentRequest;
    
    // Check if it's a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(requestId)) {
      paymentRequest = await PaymentRequest.findById(requestId);
    } else {
      // If not ObjectId, search by requestId field
      paymentRequest = await PaymentRequest.findOne({ requestId: requestId });
    }

    if (!paymentRequest) {
      return res.status(404).json({
        success: false,
        message: 'Payment request not found'
      });
    }

    if (paymentRequest.paymentType !== 'CD') {
      return res.status(400).json({
        success: false,
        message: 'This is not a CD payment request'
      });
    }

    // Calculate current penalty
    const penalty = calculateCDPenalty(paymentRequest.dueDate);
    
    // Update the payment request with current penalty
    paymentRequest.cdPenalty = penalty.penaltyAmount;
    paymentRequest.totalAmount = paymentRequest.amount + paymentRequest.lateFee + paymentRequest.cdPenalty;
    await paymentRequest.save();

    res.json({
      success: true,
      message: 'CD penalty updated successfully',
      data: {
        paymentRequest: paymentRequest.getAdminView(),
        penaltyDetails: penalty,
        totalAmountWithPenalty: paymentRequest.totalAmount
      }
    });

  } catch (error) {
    console.error('Update CD penalty error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Admin: Get CD penalty statistics
router.get('/admin/cd-penalties/statistics', authenticateAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { paymentType: 'CD' };

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get all CD payments in the date range
    const cdPayments = await PaymentRequest.find(filter);
    
    // Calculate penalties
    const penalties = cdPayments.map(payment => {
      const penalty = calculateCDPenalty(payment.dueDate);
      return {
        requestId: payment.requestId,
        amount: payment.amount,
        penalty: penalty.penaltyAmount,
        status: payment.status
      };
    });

    const totalPayments = penalties.length;
    const totalAmount = penalties.reduce((sum, item) => sum + item.amount, 0);
    const totalPenalty = penalties.reduce((sum, item) => sum + item.penalty, 0);
    const overduePayments = penalties.filter(item => item.penalty > 0).length;
    const onTimePayments = totalPayments - overduePayments;

    res.json({
      success: true,
      data: {
        totalPayments,
        totalAmount,
        totalPenalty,
        overduePayments,
        onTimePayments,
        penaltyRate: totalPayments > 0 ? ((overduePayments / totalPayments) * 100).toFixed(2) : 0,
        averagePenalty: overduePayments > 0 ? (totalPenalty / overduePayments).toFixed(2) : 0,
        penaltyBreakdown: penalties
      }
    });

  } catch (error) {
    console.error('Get CD penalty statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;
