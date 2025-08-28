const express = require('express');
const router = express.Router();
const Receipt = require('../models/receipt.model');
const SocietyMember = require('../models/societyMember.model');
const Admin = require('../models/admin.model');
const { authenticateAdmin } = require('../middleware/auth');

// ==================== ADMIN RECEIPT ROUTES ====================

// Get All Receipts (Admin)
router.get('/all', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, receiptType, memberId } = req.query;
    
    const query = {};
    
    if (status) query.status = status;
    if (receiptType) query.receiptType = receiptType;
    if (memberId) query.societyMember = memberId;

    const receipts = await Receipt.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('societyMember', 'firstName lastName memberAccountNumber email')
      .populate('reviewedBy', 'firstName lastName');

    const total = await Receipt.countDocuments(query);

    res.json({
      success: true,
      data: {
        receipts: receipts.map(receipt => receipt.getAdminView()),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalReceipts: total,
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get all receipts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get Receipts by Member (Admin)
router.get('/member/:memberId', authenticateAdmin, async (req, res) => {
  try {
    const { memberId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    // Verify member exists
    const member = await SocietyMember.findById(memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Society member not found'
      });
    }

    const query = { societyMember: memberId };
    if (status) query.status = status;

    const receipts = await Receipt.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('reviewedBy', 'firstName lastName');

    const total = await Receipt.countDocuments(query);

    res.json({
      success: true,
      data: {
        member: {
          id: member._id,
          firstName: member.firstName,
          lastName: member.lastName,
          memberAccountNumber: member.memberAccountNumber,
          email: member.email
        },
        receipts: receipts.map(receipt => receipt.getAdminView()),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalReceipts: total,
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get member receipts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get Single Receipt (Admin)
router.get('/:receiptId', authenticateAdmin, async (req, res) => {
  try {
    const { receiptId } = req.params;

    const receipt = await Receipt.findOne({ receiptId: receiptId.toUpperCase() })
      .populate('societyMember', 'firstName lastName memberAccountNumber email')
      .populate('reviewedBy', 'firstName lastName');

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Receipt not found'
      });
    }

    res.json({
      success: true,
      data: {
        receipt: receipt.getAdminView()
      }
    });

  } catch (error) {
    console.error('Get receipt error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Review Receipt (Admin)
router.put('/:receiptId/review', authenticateAdmin, async (req, res) => {
  try {
    const { receiptId } = req.params;
    const { status, reviewNotes } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either approved or rejected'
      });
    }

    const receipt = await Receipt.findOne({ receiptId: receiptId.toUpperCase() });
    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Receipt not found'
      });
    }

    receipt.status = status;
    receipt.reviewedBy = req.admin._id;
    receipt.reviewedAt = new Date();
    receipt.reviewNotes = reviewNotes || '';

    await receipt.save();

    res.json({
      success: true,
      message: `Receipt ${status} successfully`,
      data: {
        receipt: receipt.getAdminView()
      }
    });

  } catch (error) {
    console.error('Review receipt error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Mark Receipt as Paid (Admin) - Simple One-Click API
router.post('/:receiptId/mark-paid', authenticateAdmin, async (req, res) => {
  try {
    const { receiptId } = req.params;

    const receipt = await Receipt.findOne({ receiptId: receiptId.toUpperCase() });
    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Receipt not found'
      });
    }

    // Check if receipt is already paid
    if (receipt.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Receipt is already marked as paid'
      });
    }

    // No approval requirement - can mark any receipt as paid

    // Mark receipt as paid
    receipt.status = 'paid';
    receipt.paidBy = req.admin._id;
    receipt.paidAt = new Date();

    await receipt.save();

    res.json({
      success: true,
      message: 'Receipt marked as paid successfully',
      data: {
        receipt: receipt.getAdminView()
      }
    });

  } catch (error) {
    console.error('Mark receipt as paid error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get Receipt Statistics (Admin)
router.get('/stats/overview', authenticateAdmin, async (req, res) => {
  try {
    const totalReceipts = await Receipt.countDocuments();
    const pendingReceipts = await Receipt.countDocuments({ status: 'pending' });
    const approvedReceipts = await Receipt.countDocuments({ status: 'approved' });
    const rejectedReceipts = await Receipt.countDocuments({ status: 'rejected' });
    const paidReceipts = await Receipt.countDocuments({ status: 'paid' });

    // Get receipts by type
    const receiptsByType = await Receipt.aggregate([
      {
        $group: {
          _id: '$receiptType',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent receipts
    const recentReceipts = await Receipt.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('societyMember', 'firstName lastName memberAccountNumber');

    res.json({
      success: true,
      data: {
        overview: {
          totalReceipts,
          pendingReceipts,
          approvedReceipts,
          rejectedReceipts,
          paidReceipts
        },
        receiptsByType,
        recentReceipts: recentReceipts.map(receipt => receipt.getReceiptSummary())
      }
    });

  } catch (error) {
    console.error('Get receipt stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
