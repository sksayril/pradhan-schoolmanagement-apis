const express = require('express');
const router = express.Router();
const Receipt = require('../models/receipt.model');
const SocietyMember = require('../models/societyMember.model');
const { authenticateSocietyMember } = require('../middleware/auth');
const { receiptImageUpload, handleUploadError } = require('../middleware/upload');

// Normalize filesystem path to web URL path under /uploads
function toWebPath(filePath) {
  if (!filePath) return filePath;
  const parts = String(filePath).split('uploads');
  const rel = parts.length > 1 ? parts[1] : '';
  return ('/uploads' + rel).replace(/\\/g, '/');
}

// ==================== SOCIETY MEMBER ROUTES ====================

// Upload Receipt Image
router.post('/upload', authenticateSocietyMember, receiptImageUpload, handleUploadError, async (req, res) => {
  try {
    const { title, description, receiptType, amount, receiptDate } = req.body;
    const receiptImage = req.file;

    if (!receiptImage) {
      return res.status(400).json({
        success: false,
        message: 'Receipt image is required'
      });
    }

    // Create receipt
    const receipt = new Receipt({
      societyMember: req.societyMember._id,
      imageUrl: toWebPath(receiptImage.path),
      title: title || 'Receipt',
      description: description || '',
      receiptType: receiptType || 'other',
      amount: amount ? parseFloat(amount) : undefined,
      receiptDate: receiptDate ? new Date(receiptDate) : new Date()
    });

    await receipt.save();

    res.status(201).json({
      success: true,
      message: 'Receipt uploaded successfully',
      data: {
        receipt: receipt.getReceiptSummary()
      }
    });

  } catch (error) {
    console.error('Receipt upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get Society Member's Receipts
router.get('/my-receipts', authenticateSocietyMember, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, receiptType } = req.query;
    
    const query = { societyMember: req.societyMember._id };
    
    if (status) query.status = status;
    if (receiptType) query.receiptType = receiptType;

    const receipts = await Receipt.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('reviewedBy', 'firstName lastName');

    const total = await Receipt.countDocuments(query);

    res.json({
      success: true,
      data: {
        receipts: receipts.map(receipt => receipt.getReceiptSummary()),
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
    console.error('Get receipts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get Single Receipt (Society Member)
router.get('/:receiptId', authenticateSocietyMember, async (req, res) => {
  try {
    const { receiptId } = req.params;

    const receipt = await Receipt.findOne({
      receiptId: receiptId.toUpperCase(),
      societyMember: req.societyMember._id
    }).populate('reviewedBy', 'firstName lastName');

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Receipt not found'
      });
    }

    res.json({
      success: true,
      data: {
        receipt: receipt.getReceiptSummary()
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



module.exports = router;
