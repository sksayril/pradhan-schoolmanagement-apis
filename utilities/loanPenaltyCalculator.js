const mongoose = require('mongoose');
const Loan = require('../models/loan.model');

/**
 * Loan Penalty Calculator Utility
 * Automatically calculates and applies penalties for overdue loans
 */

// Calculate penalty amount (2% of loan amount)
const calculatePenalty = (loanAmount, penaltyRate = 2) => {
  return (loanAmount * penaltyRate) / 100;
};

// Check if loan is overdue
const isLoanOverdue = (expectedEndDate) => {
  const today = new Date();
  const endDate = new Date(expectedEndDate);
  return today > endDate;
};

// Calculate days overdue
const calculateDaysOverdue = (expectedEndDate) => {
  const today = new Date();
  const endDate = new Date(expectedEndDate);
  const diffTime = today - endDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

// Apply penalty to loan
const applyPenaltyToLoan = async (loanId) => {
  try {
    let loan;
    
    // Try to find by _id first (if it's a valid ObjectId)
    if (mongoose.Types.ObjectId.isValid(loanId)) {
      loan = await Loan.findById(loanId);
    }
    
    // If not found by _id, try to find by loanId (custom string field)
    if (!loan) {
      loan = await Loan.findOne({ loanId: loanId });
    }
    
    if (!loan) {
      throw new Error('Loan not found');
    }

    // Check if loan is overdue
    if (!isLoanOverdue(loan.expectedEndDate)) {
      return {
        success: false,
        message: 'Loan is not overdue yet',
        loanId: loan.loanId
      };
    }

    // Calculate penalty (2% of original loan amount)
    const penaltyAmount = calculatePenalty(loan.amount);
    const daysOverdue = calculateDaysOverdue(loan.expectedEndDate);
    
    // Update loan with penalty information
    const updatedLoan = await Loan.findByIdAndUpdate(
      loanId,
      {
        $set: {
          overdueAmount: loan.overdueAmount + penaltyAmount,
          totalLateFee: loan.totalLateFee + penaltyAmount,
          status: 'OVERDUE'
        },
        $push: {
          notes: {
            note: `Penalty of ₹${penaltyAmount} applied for ${daysOverdue} days overdue (2% of loan amount)`,
            addedBy: null, // System generated
            addedAt: new Date()
          }
        }
      },
      { new: true }
    );

    return {
      success: true,
      message: 'Penalty applied successfully',
      loanId: loan.loanId,
      originalAmount: loan.amount,
      penaltyAmount: penaltyAmount,
      newOverdueAmount: updatedLoan.overdueAmount,
      newTotalLateFee: updatedLoan.totalLateFee,
      daysOverdue: daysOverdue
    };

  } catch (error) {
    console.error('Error applying penalty to loan:', error);
    return {
      success: false,
      message: 'Error applying penalty',
      error: error.message
    };
  }
};

// Process all overdue loans
const processAllOverdueLoans = async () => {
  try {
    console.log('🔄 Processing overdue loans for penalties...');
    
    // Find all active loans that are overdue
    const overdueLoans = await Loan.find({
      status: { $in: ['ACTIVE', 'APPROVED'] },
      expectedEndDate: { $lt: new Date() }
    });

    console.log(`📊 Found ${overdueLoans.length} overdue loans to process`);

    let processedCount = 0;
    let errorCount = 0;
    let totalPenaltyApplied = 0;

    for (const loan of overdueLoans) {
      try {
        const result = await applyPenaltyToLoan(loan._id);
        if (result.success) {
          processedCount++;
          totalPenaltyApplied += result.penaltyAmount;
          console.log(`✅ Penalty applied to loan ${loan.loanId}: ₹${result.penaltyAmount}`);
        } else {
          errorCount++;
          console.log(`⚠️  Could not apply penalty to loan ${loan.loanId}: ${result.message}`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Error processing loan ${loan.loanId}:`, error.message);
      }
    }

    console.log(`🎉 Penalty processing completed: ${processedCount} processed, ${errorCount} errors`);
    console.log(`💰 Total penalty applied: ₹${totalPenaltyApplied}`);
    
    return {
      success: true,
      processed: processedCount,
      errors: errorCount,
      total: overdueLoans.length,
      totalPenaltyApplied: totalPenaltyApplied
    };

  } catch (error) {
    console.error('❌ Error processing overdue loans:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get penalty details for a specific loan
const getLoanPenaltyDetails = async (loanId) => {
  try {
    let loan;
    
    // Try to find by _id first (if it's a valid ObjectId)
    if (mongoose.Types.ObjectId.isValid(loanId)) {
      loan = await Loan.findById(loanId);
    }
    
    // If not found by _id, try to find by loanId (custom string field)
    if (!loan) {
      loan = await Loan.findOne({ loanId: loanId });
    }
    
    if (!loan) {
      return {
        success: false,
        message: 'Loan not found'
      };
    }

    const daysOverdue = calculateDaysOverdue(loan.expectedEndDate);
    const penaltyAmount = calculatePenalty(loan.amount);
    const isOverdue = isLoanOverdue(loan.expectedEndDate);

    const penaltyInfo = {
      loanId: loan.loanId,
      originalAmount: loan.amount,
      totalAmount: loan.totalAmount,
      currentBalance: loan.currentBalance,
      overdueAmount: loan.overdueAmount || 0,
      totalLateFee: loan.totalLateFee || 0,
      isOverdue: isOverdue,
      daysOverdue: daysOverdue,
      expectedEndDate: loan.expectedEndDate,
      status: loan.status,
      // Calculate potential penalty if not yet applied
      potentialPenalty: isOverdue ? penaltyAmount : 0,
      totalAmountWithPenalty: isOverdue ? (loan.totalAmount + penaltyAmount) : loan.totalAmount
    };

    return {
      success: true,
      data: penaltyInfo
    };

  } catch (error) {
    console.error('Error getting loan penalty details:', error);
    return {
      success: false,
      message: 'Error retrieving penalty details',
      error: error.message
    };
  }
};

// Manual penalty calculation for testing
const calculateManualPenalty = (loanAmount, daysOverdue, penaltyRate = 2) => {
  const penaltyAmount = calculatePenalty(loanAmount, penaltyRate);
  const totalAmountWithPenalty = loanAmount + penaltyAmount;
  
  return {
    originalAmount: loanAmount,
    penaltyAmount: penaltyAmount,
    totalAmountWithPenalty: totalAmountWithPenalty,
    penaltyRate: penaltyRate,
    daysOverdue: daysOverdue
  };
};

module.exports = {
  calculatePenalty,
  isLoanOverdue,
  calculateDaysOverdue,
  applyPenaltyToLoan,
  processAllOverdueLoans,
  getLoanPenaltyDetails,
  calculateManualPenalty
};
