/**
 * Payment Calculator Utility
 * Handles calculations for RD, FD, OD, and CD payments
 */

// Calculate simple interest
const calculateSimpleInterest = (principal, rate, time) => {
  return (principal * rate * time) / 100;
};

// Calculate compound interest
const calculateCompoundInterest = (principal, rate, time, frequency = 1) => {
  const r = rate / 100;
  const n = frequency; // Compounding frequency (1 for annual, 12 for monthly)
  const t = time / 12; // Convert months to years
  
  const amount = principal * Math.pow(1 + r / n, n * t);
  return amount - principal;
};

// Calculate RD maturity amount
const calculateRDMaturity = (monthlyAmount, rate, duration, frequency = 'MONTHLY') => {
  const monthlyRate = rate / 12 / 100;
  const totalMonths = duration;
  
  // Calculate total amount deposited
  const totalDeposited = monthlyAmount * totalMonths;
  
  // Calculate interest earned
  let interestEarned = 0;
  
  if (frequency === 'MONTHLY') {
    // For monthly RD, interest is calculated on reducing balance
    for (let i = 1; i <= totalMonths; i++) {
      const monthsForInterest = totalMonths - i + 1;
      interestEarned += monthlyAmount * monthlyRate * monthsForInterest;
    }
  } else if (frequency === 'WEEKLY') {
    // For weekly RD, convert to weekly calculations
    const weeklyAmount = monthlyAmount / 4; // Approximate
    const weeklyRate = rate / 52 / 100;
    const totalWeeks = duration * 4;
    
    for (let i = 1; i <= totalWeeks; i++) {
      const weeksForInterest = totalWeeks - i + 1;
      interestEarned += weeklyAmount * weeklyRate * weeksForInterest;
    }
  } else if (frequency === 'DAILY') {
    // For daily RD, convert to daily calculations
    const dailyAmount = monthlyAmount / 30; // Approximate
    const dailyRate = rate / 365 / 100;
    const totalDays = duration * 30;
    
    for (let i = 1; i <= totalDays; i++) {
      const daysForInterest = totalDays - i + 1;
      interestEarned += dailyAmount * dailyRate * daysForInterest;
    }
  }
  
  return {
    totalDeposited,
    interestEarned: Math.round(interestEarned * 100) / 100,
    maturityAmount: Math.round((totalDeposited + interestEarned) * 100) / 100
  };
};

// Calculate FD maturity amount
const calculateFDMaturity = (principal, rate, duration) => {
  const timeInYears = duration / 12;
  const interestEarned = calculateCompoundInterest(principal, rate, duration, 12); // Monthly compounding
  
  return {
    principal,
    interestEarned: Math.round(interestEarned * 100) / 100,
    maturityAmount: Math.round((principal + interestEarned) * 100) / 100
  };
};

// Calculate OD interest
const calculateODInterest = (amount, rate, days) => {
  const dailyRate = rate / 365 / 100;
  const interest = amount * dailyRate * days;
  
  return {
    amount,
    interestEarned: Math.round(interest * 100) / 100,
    totalAmount: Math.round((amount + interest) * 100) / 100
  };
};

// Calculate CD interest (simple interest)
const calculateCDInterest = (amount, rate, days) => {
  const dailyRate = rate / 365 / 100;
  const interest = amount * dailyRate * days;
  
  return {
    amount,
    interestEarned: Math.round(interest * 100) / 100,
    totalAmount: Math.round((amount + interest) * 100) / 100
  };
};

// Generate RD payment schedule
const generateRDSchedule = (monthlyAmount, rate, duration, frequency = 'MONTHLY') => {
  const schedule = [];
  const monthlyRate = rate / 12 / 100;
  
  let runningBalance = 0;
  let totalInterest = 0;
  
  for (let i = 1; i <= duration; i++) {
    runningBalance += monthlyAmount;
    
    // Calculate interest for this installment
    const monthsForInterest = duration - i + 1;
    const installmentInterest = monthlyAmount * monthlyRate * monthsForInterest;
    totalInterest += installmentInterest;
    
    schedule.push({
      installment: i,
      amount: monthlyAmount,
      runningBalance: Math.round(runningBalance * 100) / 100,
      interestEarned: Math.round(totalInterest * 100) / 100,
      totalAmount: Math.round((runningBalance + totalInterest) * 100) / 100
    });
  }
  
  return schedule;
};

// Calculate late fee
const calculateLateFee = (amount, daysLate, lateFeeRate = 0.01) => {
  const fee = amount * lateFeeRate * daysLate;
  const maxFee = amount * 0.5; // Maximum 50% of amount
  return Math.min(fee, maxFee);
};

// Calculate EMI for OD
const calculateODEMI = (principal, rate, duration) => {
  const monthlyRate = rate / 12 / 100;
  const totalMonths = duration;
  
  if (monthlyRate === 0) {
    return principal / totalMonths;
  }
  
  const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths) / 
              (Math.pow(1 + monthlyRate, totalMonths) - 1);
  
  return Math.round(emi * 100) / 100;
};

// Generate OD repayment schedule
const generateODSchedule = (principal, rate, duration) => {
  const schedule = [];
  const emi = calculateODEMI(principal, rate, duration);
  let remainingBalance = principal;
  
  for (let i = 1; i <= duration; i++) {
    const interest = remainingBalance * (rate / 12 / 100);
    const principalPaid = emi - interest;
    remainingBalance -= principalPaid;
    
    schedule.push({
      installment: i,
      emi: emi,
      principalPaid: Math.round(principalPaid * 100) / 100,
      interestPaid: Math.round(interest * 100) / 100,
      remainingBalance: Math.round(Math.max(0, remainingBalance) * 100) / 100
    });
  }
  
  return schedule;
};

// Calculate payment summary
const calculatePaymentSummary = (paymentType, amount, rate, duration, options = {}) => {
  switch (paymentType) {
    case 'RD':
      return calculateRDMaturity(
        amount, 
        rate, 
        duration, 
        options.frequency || 'MONTHLY'
      );
    
    case 'FD':
      return calculateFDMaturity(amount, rate, duration);
    
    case 'OD':
      const days = options.days || duration * 30;
      return calculateODInterest(amount, rate, days);
    
    case 'CD':
      const cdDays = options.days || duration * 30;
      return calculateCDInterest(amount, rate, cdDays);
    
    default:
      throw new Error('Invalid payment type');
  }
};

// Validate payment parameters
const validatePaymentParams = (paymentType, amount, rate, duration, options = {}) => {
  const errors = [];
  
  if (!amount || amount <= 0) {
    errors.push('Amount must be greater than 0');
  }
  
  if (!rate || rate < 0 || rate > 100) {
    errors.push('Interest rate must be between 0 and 100');
  }
  
  if (['RD', 'FD'].includes(paymentType)) {
    if (!duration || duration <= 0 || duration > 120) {
      errors.push('Duration must be between 1 and 120 months');
    }
  }
  
  if (paymentType === 'RD') {
    if (!options.frequency || !['MONTHLY', 'WEEKLY', 'DAILY'].includes(options.frequency)) {
      errors.push('Frequency must be MONTHLY, WEEKLY, or DAILY');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
};

// Format percentage
const formatPercentage = (rate) => {
  return `${rate.toFixed(2)}%`;
};

module.exports = {
  calculateSimpleInterest,
  calculateCompoundInterest,
  calculateRDMaturity,
  calculateFDMaturity,
  calculateODInterest,
  calculateCDInterest,
  generateRDSchedule,
  generateODSchedule,
  calculateLateFee,
  calculateODEMI,
  calculatePaymentSummary,
  validatePaymentParams,
  formatCurrency,
  formatPercentage
};
