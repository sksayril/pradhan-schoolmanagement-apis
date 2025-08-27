const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Loan = require('../models/loan.model');
const SocietyMember = require('../models/societyMember.model');
const { authenticateSocietyMember, requireKycApproved } = require('../middleware/auth');
const { handleUploadError } = require('../middleware/upload');

// Apply for a new loan
router.post('/apply', authenticateSocietyMember, requireKycApproved, async (req, res) => {
  try {
    const {
      loanType,
      amount,
      duration,
      purpose,
      // Gold loan specific fields
      collateralType,
      collateralWeight,
      collateralPurity,
      collateralEstimatedValue,
      // Education loan specific fields
      institution,
      course,
      courseDuration,
      // Emergency loan specific fields
      emergencyType,
      urgency,
      // Personal loan specific fields
      employmentType,
      monthlyIncome,
      existingObligations
    } = req.body;

    // Set default interest rates based on loan type (admin can modify later)
    let defaultInterestRate = 12; // 12% per annum
    switch (loanType) {
      case 'GOLD':
        defaultInterestRate = 10; // Lower rate for secured loans
        break;
      case 'EDUCATION':
        defaultInterestRate = 8; // Lower rate for education
        break;
      case 'EMERGENCY':
        defaultInterestRate = 15; // Higher rate for emergency
        break;
      case 'PERSONAL':
        defaultInterestRate = 14; // Standard rate for personal loans
        break;
    }

    // Create loan data
    const loanData = {
      member: req.societyMember._id,
      loanType,
      amount: parseFloat(amount),
      duration: parseInt(duration),
      purpose: purpose ? purpose.trim() : '',
      interestRate: defaultInterestRate
    };

    // Add loan type specific details
    if (loanType === 'GOLD') {
      loanData.collateral = {
        type: collateralType,
        weight: parseFloat(collateralWeight) || 0,
        purity: parseFloat(collateralPurity) || 0,
        estimatedValue: parseFloat(collateralEstimatedValue) || 0
      };
    } else if (loanType === 'EDUCATION') {
      loanData.educationDetails = {
        institution: institution ? institution.trim() : '',
        course: course ? course.trim() : '',
        duration: courseDuration ? courseDuration.trim() : ''
      };
    } else if (loanType === 'EMERGENCY') {
      loanData.emergencyDetails = {
        emergencyType,
        urgency
      };
    } else if (loanType === 'PERSONAL') {
      loanData.personalDetails = {
        employmentType,
        monthlyIncome: parseFloat(monthlyIncome) || 0,
        existingObligations: parseFloat(existingObligations) || 0
      };
    }

    // Create the loan
    const loan = new Loan(loanData);
    await loan.save();

    res.status(201).json({
      success: true,
      message: 'Loan application submitted successfully. It will be reviewed by admin.',
      data: {
        loanId: loan.loanId,
        loanType: loan.loanType,
        amount: loan.amount,
        duration: loan.duration,
        purpose: loan.purpose,
        status: loan.status,
        emiAmount: loan.emiAmount,
        totalAmount: loan.totalAmount,
        appliedAt: loan.createdAt
      }
    });
  } catch (error) {
    console.error('Loan application error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all loans for the authenticated member
router.get('/my-loans', authenticateSocietyMember, requireKycApproved, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { member: req.societyMember._id };
    
    if (status) {
      filter.status = status.toUpperCase();
    }
    
    const skip = (page - 1) * limit;
    const loans = await Loan.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Loan.countDocuments(filter);
    
    // Get member view for each loan
    const loanData = loans.map(loan => loan.getMemberView());
    
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
    console.error('Get my loans error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get specific loan details
router.get('/:loanId', authenticateSocietyMember, requireKycApproved, async (req, res) => {
  try {
    const { loanId } = req.params;
    const memberId = req.societyMember._id;
    
    let loan;
    
    // Try to find by _id first (if it's a valid ObjectId)
    if (mongoose.Types.ObjectId.isValid(loanId)) {
      loan = await Loan.findOne({
        _id: loanId,
        member: memberId
      });
    }
    
    // If not found by _id, try to find by loanId (custom string field)
    if (!loan) {
      loan = await Loan.findOne({
        loanId: loanId,
        member: memberId
      });
    }
    
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }
    
    res.json({
      success: true,
      data: loan.getMemberView()
    });
  } catch (error) {
    console.error('Get loan details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
      });
    }
  });

// Get loan payment schedule
router.get('/:loanId/payment-schedule', authenticateSocietyMember, requireKycApproved, async (req, res) => {
  try {
    const { loanId } = req.params;
    const memberId = req.societyMember._id;
    
    let loan;
    
    // Try to find by _id first (if it's a valid ObjectId)
    if (mongoose.Types.ObjectId.isValid(loanId)) {
      loan = await Loan.findOne({
        _id: loanId,
        member: memberId
      });
    }
    
    // If not found by _id, try to find by loanId (custom string field)
    if (!loan) {
      loan = await Loan.findOne({
        loanId: loanId,
        member: memberId
      });
    }
    
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }
    
    if (loan.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'Payment schedule is only available for active loans'
      });
    }
    
    // Calculate overdue amounts if any
    loan.calculateOverdueAmount();
    
    res.json({
      success: true,
      data: {
        loanId: loan.loanId,
        loanType: loan.loanType,
        totalAmount: loan.totalAmount,
        currentBalance: loan.currentBalance,
        overdueAmount: loan.overdueAmount,
        totalLateFee: loan.totalLateFee,
        paymentSchedule: loan.paymentSchedule.map(installment => ({
          installmentNumber: installment.installmentNumber,
          dueDate: installment.dueDate,
          amount: installment.amount,
          principal: installment.principal,
          interest: installment.interest,
          status: installment.status,
          lateFee: installment.lateFee
        }))
      }
    });
  } catch (error) {
    console.error('Get payment schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get loan payment history
router.get('/:loanId/payment-history', authenticateSocietyMember, requireKycApproved, async (req, res) => {
  try {
    const { loanId } = req.params;
    const memberId = req.societyMember._id;
    
    let loan;
    
    // Try to find by _id first (if it's a valid ObjectId)
    if (mongoose.Types.ObjectId.isValid(loanId)) {
      loan = await Loan.findOne({
        _id: loanId,
        member: memberId
      });
    }
    
    // If not found by _id, try to find by loanId (custom string field)
    if (!loan) {
      loan = await Loan.findOne({
        loanId: loanId,
        member: memberId
      });
    }
    
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        loanId: loan.loanId,
        loanType: loan.loanType,
        payments: loan.payments.map(payment => ({
          installmentNumber: payment.installmentNumber,
          amount: payment.amount,
          paymentDate: payment.paymentDate,
          paymentMethod: payment.paymentMethod,
          transactionId: payment.transactionId
        }))
      }
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get loan summary and statistics
router.get('/:loanId/summary', authenticateSocietyMember, requireKycApproved, async (req, res) => {
  try {
    const { loanId } = req.params;
    const memberId = req.societyMember._id;
    
    let loan;
    
    // Try to find by _id first (if it's a valid ObjectId)
    if (mongoose.Types.ObjectId.isValid(loanId)) {
      loan = await Loan.findOne({
        _id: loanId,
        member: memberId
      });
    }
    
    // If not found by _id, try to find by loanId (custom string field)
    if (!loan) {
      loan = await Loan.findOne({
        loanId: loanId,
        member: memberId
      });
    }
    
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }
    
    // Calculate overdue amounts if any
    loan.calculateOverdueAmount();
    
    const summary = {
      loanId: loan.loanId,
      loanType: loan.loanType,
      amount: loan.amount,
      duration: loan.duration,
      emiAmount: loan.emiAmount,
      totalAmount: loan.totalAmount,
      purpose: loan.purpose,
      status: loan.status,
      startDate: loan.startDate,
      expectedEndDate: loan.expectedEndDate,
      currentBalance: loan.currentBalance,
      overdueAmount: loan.overdueAmount,
      totalLateFee: loan.totalLateFee,
      isOverdue: loan.isOverdue(),
      nextPayment: loan.paymentSchedule.find(p => p.status === 'PENDING'),
      totalInstallments: loan.paymentSchedule.length,
      paidInstallments: loan.paymentSchedule.filter(p => p.status === 'PENDING').length,
      pendingInstallments: loan.paymentSchedule.filter(p => p.status === 'PENDING').length,
      overdueInstallments: loan.paymentSchedule.filter(p => p.status === 'PENDING' && p.dueDate < new Date()).length,
      progressPercentage: loan.paymentSchedule.length > 0 ? 
        Math.round((loan.paymentSchedule.filter(p => p.status === 'PAID').length / loan.paymentSchedule.length) * 100) : 0
    };
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Get loan summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get loan eligibility check
router.get('/eligibility/check', authenticateSocietyMember, requireKycApproved, async (req, res) => {
  try {
    const { loanType, amount, duration } = req.query;
    
    // Calculate estimated EMI
    const defaultInterestRate = 12; // 12% per annum
    const monthlyRate = defaultInterestRate / 12 / 100;
    let estimatedEMI = 0;
    
    const amountNum = parseFloat(amount) || 0;
    const durationNum = parseInt(duration) || 1;
    
    if (monthlyRate > 0) {
      estimatedEMI = (amountNum * monthlyRate * Math.pow(1 + monthlyRate, durationNum)) / 
                    (Math.pow(1 + monthlyRate, durationNum) - 1);
    } else {
      estimatedEMI = amountNum / durationNum;
    }
    
    estimatedEMI = Math.round(estimatedEMI * 100) / 100;
    
    res.json({
      success: true,
      data: {
        eligible: true,
        loanType: loanType || 'PERSONAL',
        amount: amountNum,
        duration: durationNum,
        estimatedEMI,
        estimatedTotalAmount: Math.round((estimatedEMI * durationNum) * 100) / 100,
        estimatedInterest: Math.round(((estimatedEMI * durationNum) - amountNum) * 100) / 100
      }
    });
  } catch (error) {
    console.error('Check eligibility error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get loan types and their requirements
router.get('/types/info', async (req, res) => {
  try {
    const loanTypes = {
      GOLD: {
        name: 'Gold Loan',
        description: 'Secured loan against gold ornaments, coins, or bars',
        minAmount: 1000,
        maxAmount: 1000000,
        minDuration: 1,
        maxDuration: 120,
        interestRate: '10% per annum',
        requirements: [
          'Gold ornaments, coins, or bars as collateral',
          'Gold purity certificate',
          'Weight and estimated value details',
          'KYC documents'
        ],
        advantages: [
          'Lower interest rate (secured loan)',
          'Quick approval process',
          'Flexible repayment options'
        ]
      },
      EDUCATION: {
        name: 'Education Loan',
        description: 'Loan for educational purposes including courses and training',
        minAmount: 5000,
        maxAmount: 500000,
        minDuration: 6,
        maxDuration: 84,
        interestRate: '8% per annum',
        requirements: [
          'Admission letter from educational institution',
          'Course details and duration',
          'Fee structure',
          'KYC documents',
          'Income proof of parent/guardian'
        ],
        advantages: [
          'Lower interest rate for education',
          'Extended repayment period',
          'No prepayment penalty'
        ]
      },
      PERSONAL: {
        name: 'Personal Loan',
        description: 'Unsecured loan for personal needs',
        minAmount: 10000,
        maxAmount: 500000,
        minDuration: 12,
        maxDuration: 60,
        interestRate: '14% per annum',
        requirements: [
          'Employment proof',
          'Income proof',
          'Bank statements (6 months)',
          'KYC documents',
          'No existing loan obligations'
        ],
        advantages: [
          'No collateral required',
          'Quick disbursement',
          'Flexible end-use'
        ]
      },
      EMERGENCY: {
        name: 'Emergency Loan',
        description: 'Quick loan for emergency situations',
        minAmount: 1000,
        maxAmount: 100000,
        minDuration: 3,
        maxDuration: 24,
        interestRate: '15% per annum',
        requirements: [
          'Emergency situation proof',
          'Urgency level assessment',
          'Supporting documents',
          'KYC documents'
        ],
        advantages: [
          'Quick approval and disbursement',
          'Flexible documentation',
          'Emergency-focused processing'
        ]
      }
    };
    
    res.json({
      success: true,
      data: loanTypes
    });
  } catch (error) {
    console.error('Get loan types info error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Cancel loan application (only if status is PENDING)
router.put('/:loanId/cancel', authenticateSocietyMember, requireKycApproved, async (req, res) => {
  try {
    const { loanId } = req.params;
    const memberId = req.societyMember._id;
    
    let loan;
    
    // Try to find by _id first (if it's a valid ObjectId)
    if (mongoose.Types.ObjectId.isValid(loanId)) {
      loan = await Loan.findOne({
        _id: loanId,
        member: memberId
      });
    }
    
    // If not found by _id, try to find by loanId (custom string field)
    if (!loan) {
      loan = await Loan.findOne({
        loanId: loanId,
        member: memberId
      });
    }
    
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }
    
    if (loan.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Only pending loans can be cancelled'
      });
    }
    
    loan.status = 'CANCELLED';
    await loan.save();
    
    res.json({
      success: true,
      message: 'Loan application cancelled successfully',
      data: {
        loanId: loan.loanId,
        status: loan.status,
        cancelledAt: loan.updatedAt
      }
    });
  } catch (error) {
    console.error('Cancel loan error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get loan penalty details (for society members)
router.get('/:loanId/penalty-details', authenticateSocietyMember, requireKycApproved, async (req, res) => {
  try {
    const { loanId } = req.params;
    const memberId = req.societyMember._id;
    
    // First verify the loan belongs to this member
    let loan;
    
    // Try to find by _id first (if it's a valid ObjectId)
    if (mongoose.Types.ObjectId.isValid(loanId)) {
      loan = await Loan.findOne({ 
        _id: loanId, 
        member: memberId 
      });
    }
    
    // If not found by _id, try to find by loanId (custom string field)
    if (!loan) {
      loan = await Loan.findOne({ 
        loanId: loanId, 
        member: memberId 
      });
    }
    
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }
    
    // Now get penalty details using the loan's _id
    const { getLoanPenaltyDetails } = require('../utilities/loanPenaltyCalculator');
    const result = await getLoanPenaltyDetails(loan._id);
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message
      });
    }
    
    res.json({
      success: true,
      data: result.data
    });
    
  } catch (error) {
    console.error('Error getting loan penalty details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Admin endpoint to manually trigger penalty processing
router.post('/admin/process-penalties', async (req, res) => {
  try {
    const { triggerManualProcessing } = require('../utilities/loanPenaltyScheduler');
    const result = await triggerManualProcessing();
    
    res.json({
      success: true,
      message: 'Penalty processing completed',
      data: result
    });
    
  } catch (error) {
    console.error('Error processing penalties:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
