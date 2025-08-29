/**
 * CD Penalty Calculator Utility
 * Calculates penalties for CD (Certificate of Deposit) payments
 * Penalty: 10 rupees per day after 15 days in a month
 */

/**
 * Calculate CD penalty for a given payment request
 * @param {Date} dueDate - The due date of the CD payment
 * @param {Date} currentDate - Current date (defaults to now)
 * @returns {Object} Penalty calculation result
 */
const calculateCDPenalty = (dueDate, currentDate = new Date()) => {
  try {
    // Convert dates to Date objects if they're strings
    const due = new Date(dueDate);
    const current = new Date(currentDate);
    
    // If payment is not overdue, no penalty
    if (current <= due) {
      return {
        hasPenalty: false,
        penaltyAmount: 0,
        daysLate: 0,
        penaltyPerDay: 10,
        message: 'Payment is not overdue'
      };
    }
    
    // Calculate days late
    const timeDiff = current.getTime() - due.getTime();
    const daysLate = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    // CD penalty rule: 10 rupees per day after 15 days in a month
    // Check if we're past the 15th day of the month
    const dueDayOfMonth = due.getDate();
    const currentDayOfMonth = current.getDate();
    
    let penaltyDays = 0;
    let penaltyAmount = 0;
    
    if (dueDayOfMonth <= 15) {
      // If due date is on or before 15th, penalty starts from 16th
      if (currentDayOfMonth > 15) {
        penaltyDays = currentDayOfMonth - 15;
        penaltyAmount = penaltyDays * 10;
      }
    } else {
      // If due date is after 15th, penalty starts from the day after due date
      if (current > due) {
        penaltyDays = daysLate;
        penaltyAmount = penaltyDays * 10;
      }
    }
    
    return {
      hasPenalty: penaltyAmount > 0,
      penaltyAmount: penaltyAmount,
      daysLate: daysLate,
      penaltyDays: penaltyDays,
      penaltyPerDay: 10,
      dueDate: due,
      currentDate: current,
      message: penaltyAmount > 0 
        ? `Penalty of ₹${penaltyAmount} for ${penaltyDays} days after grace period`
        : 'No penalty applicable'
    };
    
  } catch (error) {
    console.error('Error calculating CD penalty:', error);
    return {
      hasPenalty: false,
      penaltyAmount: 0,
      daysLate: 0,
      penaltyPerDay: 10,
      error: error.message,
      message: 'Error calculating penalty'
    };
  }
};

/**
 * Calculate penalty for multiple CD payments
 * @param {Array} cdPayments - Array of CD payment requests
 * @returns {Array} Array of penalty calculations for each payment
 */
const calculateMultipleCDPenalties = (cdPayments) => {
  try {
    return cdPayments.map(payment => {
      const penalty = calculateCDPenalty(payment.dueDate);
      return {
        requestId: payment.requestId || payment._id,
        paymentType: payment.paymentType,
        amount: payment.amount,
        dueDate: payment.dueDate,
        status: payment.status,
        penalty: penalty,
        totalAmountWithPenalty: payment.amount + penalty.penaltyAmount
      };
    });
  } catch (error) {
    console.error('Error calculating multiple CD penalties:', error);
    return [];
  }
};

/**
 * Get CD penalty summary for a society member
 * @param {Array} cdPayments - Array of CD payment requests for a member
 * @returns {Object} Summary of all CD penalties
 */
const getCDPenaltySummary = (cdPayments) => {
  try {
    const penalties = calculateMultipleCDPenalties(cdPayments);
    
    const totalPenalty = penalties.reduce((sum, item) => sum + item.penalty.penaltyAmount, 0);
    const totalAmount = penalties.reduce((sum, item) => sum + item.amount, 0);
    const totalAmountWithPenalty = totalAmount + totalPenalty;
    
    const overduePayments = penalties.filter(item => item.penalty.hasPenalty);
    const onTimePayments = penalties.filter(item => !item.penalty.hasPenalty);
    
    return {
      totalPayments: penalties.length,
      overduePayments: overduePayments.length,
      onTimePayments: onTimePayments.length,
      totalPenalty: totalPenalty,
      totalAmount: totalAmount,
      totalAmountWithPenalty: totalAmountWithPenalty,
      penaltyBreakdown: penalties,
      summary: {
        message: overduePayments.length > 0 
          ? `Total penalty: ₹${totalPenalty} for ${overduePayments.length} overdue payment(s)`
          : 'All payments are on time',
        hasOverdue: overduePayments.length > 0
      }
    };
    
  } catch (error) {
    console.error('Error getting CD penalty summary:', error);
    return {
      totalPayments: 0,
      overduePayments: 0,
      onTimePayments: 0,
      totalPenalty: 0,
      totalAmount: 0,
      totalAmountWithPenalty: 0,
      penaltyBreakdown: [],
      error: error.message,
      summary: {
        message: 'Error calculating penalty summary',
        hasOverdue: false
      }
    };
  }
};

/**
 * Check if a specific date falls within penalty period
 * @param {Date} dueDate - The due date
 * @param {Date} checkDate - Date to check
 * @returns {boolean} True if penalty applies
 */
const isPenaltyApplicable = (dueDate, checkDate = new Date()) => {
  const penalty = calculateCDPenalty(dueDate, checkDate);
  return penalty.hasPenalty;
};

/**
 * Get next penalty calculation date
 * @param {Date} dueDate - The due date
 * @returns {Date} Next date when penalty will increase
 */
const getNextPenaltyDate = (dueDate) => {
  const due = new Date(dueDate);
  const current = new Date();
  
  if (current <= due) {
    return due;
  }
  
  // If due date is on or before 15th, next penalty date is 16th
  if (due.getDate() <= 15) {
    const nextPenalty = new Date(due);
    nextPenalty.setDate(16);
    return nextPenalty;
  }
  
  // If due date is after 15th, next penalty date is next day
  const nextPenalty = new Date(due);
  nextPenalty.setDate(due.getDate() + 1);
  return nextPenalty;
};

module.exports = {
  calculateCDPenalty,
  calculateMultipleCDPenalties,
  getCDPenaltySummary,
  isPenaltyApplicable,
  getNextPenaltyDate
};
