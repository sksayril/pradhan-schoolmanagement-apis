const express = require('express');
const router = express.Router();
const PaymentRequest = require('../models/paymentRequest.model');
const SocietyMember = require('../models/societyMember.model');
const Admin = require('../models/admin.model');
const { createOrder, verifyPayment } = require('../utilities/razorpay');
const { authenticateAdmin, authenticateSocietyMember } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

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

const validateRDRequest = [
  ...validatePaymentRequest,
  body('duration').isInt({ min: 1, max: 120 }).withMessage('Duration must be between 1 and 120 months'),
  body('recurringDetails.frequency').isIn(['MONTHLY', 'WEEKLY', 'DAILY']).withMessage('Frequency must be MONTHLY, WEEKLY, or DAILY'),
  body('recurringDetails.totalInstallments').isInt({ min: 1 }).withMessage('Total installments must be at least 1')
];

// ==================== ADMIN ROUTES ====================

// Create payment request (Admin only)
router.post('/admin/create', authenticateAdmin, async (req, res) => {
  try {

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

    // Validate society member exists
    const societyMember = await SocietyMember.findById(societyMemberId);
    if (!societyMember) {
      return res.status(404).json({
        success: false,
        message: 'Society member not found'
      });
    }

    // Validate payment type specific requirements
    if (['RD', 'FD'].includes(paymentType) && !duration) {
      return res.status(400).json({
        success: false,
        message: 'Duration is required for RD and FD payments'
      });
    }

    if (paymentType === 'RD' && (!recurringDetails || !recurringDetails.totalInstallments)) {
      return res.status(400).json({
        success: false,
        message: 'Recurring details with total installments are required for RD payments'
      });
    }

    // Create payment request
    const paymentRequestData = {
      societyMember: societyMemberId,
      createdBy: req.admin._id,
      paymentType,
      amount,
      interestRate,
      paymentMethod,
      dueDate: new Date(dueDate),
      description,
      duration: ['RD', 'FD'].includes(paymentType) ? duration : undefined,
      recurringDetails: paymentType === 'RD' ? recurringDetails : undefined
    };

    const paymentRequest = new PaymentRequest(paymentRequestData);
    await paymentRequest.save();

    res.status(201).json({
      success: true,
      message: 'Payment request created successfully',
      data: paymentRequest.getAdminView()
    });

  } catch (error) {
    console.error('Create payment request error:', error);
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

    const paymentRequest = await PaymentRequest.findById(req.params.requestId)
      .populate('societyMember', 'firstName lastName email phone memberAccountNumber')
      .populate('createdBy', 'firstName lastName email')
      .populate('paymentDetails.receivedBy', 'firstName lastName');

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

    const { amount, interestRate, dueDate, description, status } = req.body;

    const paymentRequest = await PaymentRequest.findById(req.params.requestId);
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

    const { paymentMethod, transactionId, cashReceiptNumber } = req.body;

    const paymentRequest = await PaymentRequest.findById(req.params.requestId);
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
    const paymentRequest = await PaymentRequest.findOne({
      _id: req.params.requestId,
      societyMember: req.societyMember._id
    });

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

// Create Razorpay order for payment
router.post('/create-razorpay-order', authenticateSocietyMember, async (req, res) => {
  try {
    const { requestId } = req.body;

    const paymentRequest = await PaymentRequest.findOne({
      _id: requestId,
      societyMember: req.societyMember._id,
      status: 'PENDING'
    });

    if (!paymentRequest) {
      return res.status(404).json({
        success: false,
        message: 'Payment request not found or not eligible for payment'
      });
    }

    if (paymentRequest.paymentMethod !== 'RAZORPAY') {
      return res.status(400).json({
        success: false,
        message: 'This payment request does not support Razorpay payment'
      });
    }

    // Create Razorpay order
    const orderResult = await createOrder(
      paymentRequest.totalAmount,
      'INR',
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
    paymentRequest.paymentDetails.razorpayOrderId = orderResult.order.id;
    await paymentRequest.save();

    res.json({
      success: true,
      data: {
        orderId: orderResult.order.id,
        amount: paymentRequest.totalAmount,
        currency: 'INR',
        requestId: paymentRequest.requestId
      }
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

// Verify and process Razorpay payment
router.post('/verify-razorpay-payment', authenticateSocietyMember, async (req, res) => {
  try {
    const { requestId, paymentId, signature } = req.body;

    const paymentRequest = await PaymentRequest.findOne({
      _id: requestId,
      societyMember: req.societyMember._id,
      status: 'PENDING'
    });

    if (!paymentRequest) {
      return res.status(404).json({
        success: false,
        message: 'Payment request not found'
      });
    }

    // Verify payment signature
    const verificationResult = verifyPayment(
      paymentRequest.paymentDetails.razorpayOrderId,
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
      message: 'Payment verified and processed successfully',
      data: paymentRequest.getPaymentSummary()
    });

  } catch (error) {
    console.error('Verify Razorpay payment error:', error);
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

    const paymentRequest = await PaymentRequest.findOne({
      _id: requestId,
      societyMember: req.societyMember._id,
      status: 'PENDING'
    });

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

module.exports = router;
