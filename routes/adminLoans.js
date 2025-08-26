const express = require('express');
const router = express.Router();
const Loan = require('../models/loan.model');
const SocietyMember = require('../models/societyMember.model');
const { authenticateAdmin, requirePermission } = require('../middleware/auth');
const { handleUploadError } = require('../middleware/upload');

// Get all loans with filtering and pagination
router.get('/', authenticateAdmin, requirePermission('manage_loans'), async (req, res) => {
  try {
    const {
      status,
      loanType,
      memberId,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const filter = {};
    
    if (status) filter.status = status.toUpperCase();
    if (loanType) filter.loanType = loanType.toUpperCase();
    if (memberId) filter.member = memberId;
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const skip = (page - 1) * limit;
    const loans = await Loan.find(filter)
      .populate('member', 'firstName lastName memberAccountNumber email phone')
      .populate('approvedBy', 'firstName lastName')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Loan.countDocuments(filter);
    
    // Get admin view for each loan
    const loanData = loans.map(loan => loan.getAdminView());
    
    res.json({
      success: true,
      data: {
        loans: loanData,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalLoans: total,
          hasNext: skip + loans.length < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get all loans error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get specific loan details (admin view)
router.get('/:loanId', authenticateAdmin, requirePermission('manage_loans'), async (req, res) => {
  try {
    const loan = await Loan.findOne({ loanId: req.params.loanId })
      .populate('member', 'firstName lastName memberAccountNumber email phone address')
      .populate('approvedBy', 'firstName lastName')
      .populate('notes.addedBy', 'firstName lastName');
    
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }
    
    res.json({
      success: true,
      data: loan.getAdminView()
    });
  } catch (error) {
    console.error('Get loan details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Approve loan application
router.post('/:loanId/approve', authenticateAdmin, requirePermission('manage_loans'), async (req, res) => {
  try {
    const { startDate, notes } = req.body;
    
    const loan = await Loan.findOne({ loanId: req.params.loanId })
      .populate('member', 'firstName lastName memberAccountNumber');
    
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }
    
    // Update loan status
    loan.status = 'APPROVED';
    loan.startDate = startDate ? new Date(startDate) : new Date();
    loan.approvedBy = req.admin._id;
    loan.approvedAt = new Date();
    
    // Generate payment schedule
    loan.generatePaymentSchedule();
    
    // Add note if provided
    if (notes) {
      loan.notes.push({
        note: notes,
        addedBy: req.admin._id
      });
    }
    
    await loan.save();
    
    res.json({
      success: true,
      message: 'Loan approved successfully',
      data: {
        loanId: loan.loanId,
        status: loan.status,
        startDate: loan.startDate,
        expectedEndDate: loan.expectedEndDate,
        emiAmount: loan.emiAmount,
        totalAmount: loan.totalAmount,
        approvedBy: req.admin._id,
        approvedAt: loan.approvedAt
      }
    });
  } catch (error) {
    console.error('Approve loan error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Reject loan application
router.post('/:loanId/reject', authenticateAdmin, requirePermission('manage_loans'), async (req, res) => {
  try {
    const { reason, notes } = req.body;
    
    const loan = await Loan.findOne({ loanId: req.params.loanId })
      .populate('member', 'firstName lastName memberAccountNumber');
    
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }
    

    
    // Update loan status
    loan.status = 'REJECTED';
    loan.rejectionReason = reason;
    
    // Add note if provided
    if (notes) {
      loan.notes.push({
        note: notes,
        addedBy: req.admin._id
      });
    }
    
    await loan.save();
    
    res.json({
      success: true,
      message: 'Loan rejected successfully',
      data: {
        loanId: loan.loanId,
        status: loan.status,
        rejectionReason: loan.rejectionReason,
        rejectedAt: loan.updatedAt
      }
    });
  } catch (error) {
    console.error('Reject loan error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Activate approved loan
router.post('/:loanId/activate', authenticateAdmin, requirePermission('manage_loans'), async (req, res) => {
  try {
    const loan = await Loan.findOne({ loanId: req.params.loanId })
      .populate('member', 'firstName lastName memberAccountNumber');
    
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }
    

    
    // Update loan status
    loan.status = 'ACTIVE';
    loan.currentBalance = loan.totalAmount;
    
    await loan.save();
    
    res.json({
      success: true,
      message: 'Loan activated successfully',
      data: {
        loanId: loan.loanId,
        status: loan.status,
        startDate: loan.startDate,
        expectedEndDate: loan.expectedEndDate,
        activatedAt: loan.updatedAt
      }
    });
  } catch (error) {
    console.error('Activate loan error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update loan interest rate
router.put('/:loanId/interest-rate', authenticateAdmin, requirePermission('manage_loans'), async (req, res) => {
  try {
    const { interestRate, notes } = req.body;
    
    const loan = await Loan.findOne({ loanId: req.params.loanId });
    
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }
    
    // Update interest rate
    loan.interestRate = parseFloat(interestRate);
    
    // Recalculate amounts if loan is approved
    if (loan.status === 'APPROVED' && loan.startDate) {
      const monthlyRate = loan.interestRate / 12 / 100;
      const totalMonths = loan.duration;
      
      if (monthlyRate > 0) {
        loan.emiAmount = (loan.amount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
                        (Math.pow(1 + monthlyRate, totalMonths) - 1);
      } else {
        loan.emiAmount = loan.amount / totalMonths;
      }
      
      loan.totalInterest = (loan.emiAmount * totalMonths) - loan.amount;
      loan.totalAmount = loan.amount + loan.totalInterest;
      
      // Round to 2 decimal places
      loan.emiAmount = Math.round(loan.emiAmount * 100) / 100;
      loan.totalInterest = Math.round(loan.totalInterest * 100) / 100;
      loan.totalAmount = Math.round(loan.totalAmount * 100) / 100;
      
      // Regenerate payment schedule
      loan.generatePaymentSchedule();
    }
    
    // Add note if provided
    if (notes) {
      loan.notes.push({
        note: `Interest rate updated to ${interestRate}% - ${notes}`,
        addedBy: req.admin._id
      });
    }
    
    await loan.save();
    
    res.json({
      success: true,
      message: 'Interest rate updated successfully',
      data: {
        loanId: loan.loanId,
        interestRate: loan.interestRate,
        emiAmount: loan.emiAmount,
        totalAmount: loan.totalAmount,
        updatedAt: loan.updatedAt
      }
    });
  } catch (error) {
    console.error('Update interest rate error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Record loan payment
router.post('/:loanId/payment', authenticateAdmin, requirePermission('manage_loans'), async (req, res) => {
  try {
    const {
      installmentNumber,
      amount,
      paymentMethod,
      transactionId,
      notes
    } = req.body;
    
    const loan = await Loan.findOne({ loanId: req.params.loanId });
    
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }
    
    // Find the installment
    const installment = loan.paymentSchedule.find(p => p.installmentNumber === parseInt(installmentNumber));
    
    if (!installment) {
      return res.status(404).json({
        success: false,
        message: 'Installment not found'
      });
    }
    
    // Record payment
    const payment = {
      installmentNumber: parseInt(installmentNumber),
      amount: parseFloat(amount),
      paymentMethod: paymentMethod.toUpperCase(),
      transactionId: transactionId || null,
      receivedBy: req.admin._id
    };
    
    loan.payments.push(payment);
    
    // Update installment status
    installment.status = 'PAID';
    installment.paidAt = new Date();
    
    // Update current balance
    loan.currentBalance = Math.max(0, loan.currentBalance - parseFloat(amount));
    
    // Check if loan is completed
    const paidInstallments = loan.paymentSchedule.filter(p => p.status === 'PAID');
    if (paidInstallments.length === loan.paymentSchedule.length) {
      loan.status = 'COMPLETED';
      loan.actualEndDate = new Date();
    }
    
    // Add note if provided
    if (notes) {
      loan.notes.push({
        note: `Payment recorded for installment ${installmentNumber} - ${notes}`,
        addedBy: req.admin._id
      });
    }
    
    await loan.save();
    
    res.json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        loanId: loan.loanId,
        installmentNumber: parseInt(installmentNumber),
        amount: parseFloat(amount),
        paymentMethod: paymentMethod.toUpperCase(),
        currentBalance: loan.currentBalance,
        status: loan.status,
        recordedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add note to loan
router.post('/:loanId/notes', authenticateAdmin, requirePermission('manage_loans'), async (req, res) => {
  try {
    const { note } = req.body;
    
    const loan = await Loan.findOne({ loanId: req.params.loanId });
    
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }
    
    // Add note
    loan.notes.push({
      note: note.trim(),
      addedBy: req.admin._id
    });
    
    await loan.save();
    
    res.json({
      success: true,
      message: 'Note added successfully',
      data: {
        loanId: loan.loanId,
        note: note.trim(),
        addedBy: req.admin._id,
        addedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get loan dashboard statistics
router.get('/dashboard/stats', authenticateAdmin, requirePermission('manage_loans'), async (req, res) => {
  try {
    const totalLoans = await Loan.countDocuments();
    const pendingLoans = await Loan.countDocuments({ status: 'PENDING' });
    const approvedLoans = await Loan.countDocuments({ status: 'APPROVED' });
    const activeLoans = await Loan.countDocuments({ status: 'ACTIVE' });
    const completedLoans = await Loan.countDocuments({ status: 'COMPLETED' });
    const rejectedLoans = await Loan.countDocuments({ status: 'REJECTED' });
    
    // Calculate total loan amounts
    const totalAmount = await Loan.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const activeAmount = await Loan.aggregate([
      { $match: { status: 'ACTIVE' } },
      { $group: { _id: null, total: { $sum: '$currentBalance' } } }
    ]);
    
    // Get loans by type
    const loansByType = await Loan.aggregate([
      { $group: { _id: '$loanType', count: { $sum: 1 } } }
    ]);
    
    // Get overdue loans
    const overdueLoans = await Loan.find({ status: 'ACTIVE' });
    let overdueCount = 0;
    let totalOverdueAmount = 0;
    
    overdueLoans.forEach(loan => {
      if (loan.isOverdue()) {
        overdueCount++;
        const overdueData = loan.calculateOverdueAmount();
        totalOverdueAmount += overdueData.overdueAmount;
      }
    });
    
    res.json({
      success: true,
      data: {
        totalLoans,
        pendingLoans,
        approvedLoans,
        activeLoans,
        completedLoans,
        rejectedLoans,
        totalAmount: totalAmount[0]?.total || 0,
        activeAmount: activeAmount[0]?.total || 0,
        overdueCount,
        totalOverdueAmount: Math.round(totalOverdueAmount * 100) / 100,
        loansByType: loansByType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get loans by member ID
router.get('/member/:memberId', authenticateAdmin, requirePermission('manage_loans'), async (req, res) => {
  try {
    const loans = await Loan.find({ member: req.params.memberId })
      .populate('member', 'firstName lastName memberAccountNumber email phone')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    if (loans.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No loans found for this member'
      });
    }
    
    // Get admin view for each loan
    const loanData = loans.map(loan => loan.getAdminView());
    
    res.json({
      success: true,
      data: {
        member: {
          id: loans[0].member._id,
          firstName: loans[0].member.firstName,
          lastName: loans[0].member.lastName,
          memberAccountNumber: loans[0].member.memberAccountNumber,
          email: loans[0].member.email,
          phone: loans[0].member.phone
        },
        loans: loanData,
        totalLoans: loans.length,
        activeLoans: loans.filter(l => l.status === 'ACTIVE').length,
        completedLoans: loans.filter(l => l.status === 'COMPLETED').length
      }
    });
  } catch (error) {
    console.error('Get member loans error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Mark loan as defaulted
router.post('/:loanId/mark-defaulted', authenticateAdmin, requirePermission('manage_loans'), async (req, res) => {
  try {
    const { notes } = req.body;
    
    const loan = await Loan.findOne({ loanId: req.params.loanId });
    
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }
    

    
    // Update loan status
    loan.status = 'DEFAULTED';
    
    // Mark overdue installments as defaulted
    loan.paymentSchedule.forEach(installment => {
      if (installment.status === 'PENDING' && installment.dueDate < new Date()) {
        installment.status = 'DEFAULTED';
      }
    });
    
    // Add note if provided
    if (notes) {
      loan.notes.push({
        note: `Loan marked as defaulted - ${notes}`,
        addedBy: req.admin._id
      });
    }
    
    await loan.save();
    
    res.json({
      success: true,
      message: 'Loan marked as defaulted successfully',
      data: {
        loanId: loan.loanId,
        status: loan.status,
        markedAt: loan.updatedAt
      }
    });
  } catch (error) {
    console.error('Mark loan defaulted error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
