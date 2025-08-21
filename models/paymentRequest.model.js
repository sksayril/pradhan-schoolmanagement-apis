const mongoose = require('mongoose');
const { calculatePaymentSummary, calculateLateFee } = require('../utilities/paymentCalculator');

const paymentRequestSchema = new mongoose.Schema({
  // Basic Information
  requestId: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Society Member Information
  societyMember: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SocietyMember',
    required: true
  },
  
  // Admin who created the request
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  
  // Payment Type (RD/FD/OD/CD)
  paymentType: {
    type: String,
    enum: ['RD', 'FD', 'OD', 'CD'],
    required: true
  },
  
  // Amount Details
  amount: {
    type: Number,
    required: true,
    min: [1, 'Amount must be at least 1']
  },
  
  // Interest Rate (hidden from society member)
  interestRate: {
    type: Number,
    required: true,
    min: [0, 'Interest rate cannot be negative'],
    max: [100, 'Interest rate cannot exceed 100%']
  },
  
  // Duration for RD/FD (in months)
  duration: {
    type: Number,
    required: function() {
      return ['RD', 'FD'].includes(this.paymentType);
    },
    min: [1, 'Duration must be at least 1 month'],
    max: [120, 'Duration cannot exceed 120 months']
  },
  
  // Maturity Date (calculated based on duration)
  maturityDate: {
    type: Date
  },
  
  // Payment Method
  paymentMethod: {
    type: String,
    enum: ['UPI', 'RAZORPAY', 'CASH'],
    required: true
  },
  
  // Payment Status
  status: {
    type: String,
    enum: ['PENDING', 'PAID', 'FAILED', 'CANCELLED'],
    default: 'PENDING'
  },
  
  // Payment Details
  paymentDetails: {
    transactionId: String,
    paymentDate: Date,
    razorpayOrderId: String,
    razorpayPaymentId: String,
    upiTransactionId: String,
    cashReceiptNumber: String,
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    }
  },
  
  // Description/Notes
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Due Date
  dueDate: {
    type: Date,
    required: true
  },
  
  // Late Fee (if payment is delayed)
  lateFee: {
    type: Number,
    default: 0,
    min: [0, 'Late fee cannot be negative']
  },
  
  // Total Amount (including late fee)
  totalAmount: {
    type: Number,
    default: 0
  },
  
  // Recurring Payment Details (for RD)
  recurringDetails: {
    frequency: {
      type: String,
      enum: ['MONTHLY', 'WEEKLY', 'DAILY'],
      default: 'MONTHLY'
    },
    nextDueDate: Date,
    installmentsPaid: {
      type: Number,
      default: 0
    },
    totalInstallments: {
      type: Number,
      required: function() {
        return this.paymentType === 'RD';
      }
    }
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  paidAt: Date
}, {
  timestamps: true
});

// Generate request ID before saving
paymentRequestSchema.pre('save', function(next) {
  try {
    // Generate request ID before saving
    if (this.isNew && !this.requestId) {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const timestamp = Date.now().toString().slice(-6);
      this.requestId = `PR${year}${month}${timestamp}`;
    }
    
    // Calculate maturity date for RD/FD
    if (['RD', 'FD'].includes(this.paymentType) && this.duration) {
      const maturityDate = new Date();
      maturityDate.setMonth(maturityDate.getMonth() + this.duration);
      this.maturityDate = maturityDate;
    }
    
    // Ensure lateFee is initialized
    if (this.lateFee === undefined) {
      this.lateFee = 0;
    }
    
    // Calculate total amount (amount + lateFee)
    this.totalAmount = (this.amount || 0) + (this.lateFee || 0);
    
    // Set next due date for RD
    if (this.isNew && this.paymentType === 'RD' && this.recurringDetails) {
      const nextDue = new Date();
      if (this.recurringDetails.frequency === 'WEEKLY') {
        nextDue.setDate(nextDue.getDate() + 7);
      } else if (this.recurringDetails.frequency === 'DAILY') {
        nextDue.setDate(nextDue.getDate() + 1);
      } else {
        nextDue.setMonth(nextDue.getMonth() + 1);
      }
      this.recurringDetails.nextDueDate = nextDue;
    }
    
    // Ensure all required fields are set before validation
    if (this.isNew) {
      // Set default values for required fields that might be undefined
      if (!this.status) this.status = 'PENDING';
      if (!this.lateFee) this.lateFee = 0;
      if (!this.totalAmount) this.totalAmount = this.amount || 0;
      
      // For RD/FD, ensure maturityDate is set even if duration is missing
      if (['RD', 'FD'].includes(this.paymentType)) {
        if (!this.maturityDate && this.duration) {
          const maturityDate = new Date();
          maturityDate.setMonth(maturityDate.getMonth() + this.duration);
          this.maturityDate = maturityDate;
        } else if (!this.maturityDate) {
          // Set a default maturity date if duration is missing
          const maturityDate = new Date();
          maturityDate.setMonth(maturityDate.getMonth() + 12); // Default to 12 months
          this.maturityDate = maturityDate;
        }
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check if payment is overdue
paymentRequestSchema.methods.isOverdue = function() {
  return new Date() > this.dueDate && this.status === 'PENDING';
};

// Method to calculate late fee
paymentRequestSchema.methods.calculateLateFee = function() {
  if (this.status !== 'PENDING' || !this.isOverdue()) {
    return 0;
  }
  
  const daysLate = Math.ceil((new Date() - this.dueDate) / (1000 * 60 * 60 * 24));
  return calculateLateFee(this.amount, daysLate);
};

// Method to get payment summary (for society member view)
paymentRequestSchema.methods.getPaymentSummary = function() {
  return {
    requestId: this.requestId,
    paymentType: this.paymentType,
    amount: this.amount,
    totalAmount: this.totalAmount,
    dueDate: this.dueDate,
    status: this.status,
    paymentMethod: this.paymentMethod,
    description: this.description,
    isOverdue: this.isOverdue(),
    lateFee: this.lateFee,
    maturityDate: this.maturityDate,
    duration: this.duration,
    recurringDetails: this.paymentType === 'RD' ? {
      frequency: this.recurringDetails.frequency,
      nextDueDate: this.recurringDetails.nextDueDate,
      installmentsPaid: this.recurringDetails.installmentsPaid,
      totalInstallments: this.recurringDetails.totalInstallments
    } : undefined
  };
};

// Method to get admin view (includes interest rate)
paymentRequestSchema.methods.getAdminView = function() {
  return {
    ...this.getPaymentSummary(),
    interestRate: this.interestRate,
    paymentDetails: this.paymentDetails,
    societyMember: this.societyMember,
    createdBy: this.createdBy
  };
};

// Method to calculate maturity amount
paymentRequestSchema.methods.calculateMaturityAmount = function() {
  try {
    const options = {};
    if (this.paymentType === 'RD' && this.recurringDetails) {
      options.frequency = this.recurringDetails.frequency;
    }
    
    return calculatePaymentSummary(
      this.paymentType,
      this.amount,
      this.interestRate,
      this.duration || 0,
      options
    );
  } catch (error) {
    console.error('Error calculating maturity amount:', error);
    return null;
  }
};

// Index for better query performance
paymentRequestSchema.index({ societyMember: 1, status: 1 });
paymentRequestSchema.index({ status: 1, dueDate: 1 });
paymentRequestSchema.index({ requestId: 1 });

module.exports = mongoose.model('PaymentRequest', paymentRequestSchema);
