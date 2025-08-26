const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  // Loan ID
  loanId: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Society Member Reference
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SocietyMember'
  },
  
  // Loan Type
  loanType: {
    type: String
  },
  
  // Loan Amount
  amount: {
    type: Number
  },
  
  // Interest Rate (hidden from member, admin controlled)
  interestRate: {
    type: Number
  },
  
  // Loan Duration (in months)
  duration: {
    type: Number
  },
  
  // EMI Amount (calculated)
  emiAmount: {
    type: Number
  },
  
  // Total Interest Amount
  totalInterest: {
    type: Number
  },
  
  // Total Amount (Principal + Interest)
  totalAmount: {
    type: Number
  },
  
  // Loan Purpose/Description
  purpose: {
    type: String
  },
  
  // Loan Status
  status: {
    type: String,
    default: 'PENDING'
  },
  
  // Approval Details
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  approvedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  
  // Loan Start Date
  startDate: {
    type: Date
  },
  
  // Expected End Date
  expectedEndDate: {
    type: Date
  },
  
  // Actual End Date
  actualEndDate: {
    type: Date
  },
  
  // Collateral Details (for Gold loans)
  collateral: {
    type: {
      type: String
    },
    weight: {
      type: Number
    },
    purity: {
      type: Number
    },
    estimatedValue: {
      type: Number
    }
  },
  
  // Education Loan Specific Fields
  educationDetails: {
    institution: {
      type: String
    },
    course: {
      type: String
    },
    duration: {
      type: String
    }
  },
  
  // Emergency Loan Specific Fields
  emergencyDetails: {
    emergencyType: {
      type: String
    },
    urgency: {
      type: String
    },
    supportingDocuments: [{
      type: String // File paths
    }]
  },
  
  // Personal Loan Specific Fields
  personalDetails: {
    employmentType: {
      type: String
    },
    monthlyIncome: {
      type: Number
    },
    existingObligations: {
      type: Number,
      default: 0
    }
  },
  
  // Payment Schedule
  paymentSchedule: [{
    installmentNumber: {
      type: Number
    },
    dueDate: {
      type: Date
    },
    amount: {
      type: Number
    },
    principal: {
      type: Number
    },
    interest: {
      type: Number
    },
    status: {
      type: String,
      default: 'PENDING'
    },
    paidAt: Date,
    lateFee: {
      type: Number,
      default: 0
    }
  }],
  
  // Payment History
  payments: [{
    installmentNumber: {
      type: Number
    },
    amount: {
      type: Number
    },
    paymentDate: {
      type: Date,
      default: Date.now
    },
    paymentMethod: {
      type: String
    },
    transactionId: String,
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    }
  }],
  
  // Current Balance
  currentBalance: {
    type: Number,
    default: 0
  },
  
  // Overdue Amount
  overdueAmount: {
    type: Number,
    default: 0
  },
  
  // Late Fee Total
  totalLateFee: {
    type: Number,
    default: 0
  },
  
  // Documents
  documents: [{
    type: {
      type: String
    },
    documentUrl: {
      type: String
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Notes/Comments
  notes: [{
    note: {
      type: String
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate loan ID before saving
loanSchema.pre('save', async function(next) {
  try {
    if (this.isNew && !this.loanId) {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const timestamp = Date.now().toString().slice(-6);
      this.loanId = `LOAN${year}${month}${timestamp}`;
    }
    
    // Calculate EMI and total amounts
    if (this.amount && this.interestRate && this.duration) {
      const monthlyRate = this.interestRate / 12 / 100;
      const totalMonths = this.duration;
      
      if (monthlyRate > 0) {
        this.emiAmount = (this.amount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
                        (Math.pow(1 + monthlyRate, totalMonths) - 1);
      } else {
        this.emiAmount = this.amount / totalMonths;
      }
      
      this.totalInterest = (this.emiAmount * totalMonths) - this.amount;
      this.totalAmount = this.amount + this.totalInterest;
      
      // Round to 2 decimal places
      this.emiAmount = Math.round(this.emiAmount * 100) / 100;
      this.totalInterest = Math.round(this.totalInterest * 100) / 100;
      this.totalAmount = Math.round(this.totalAmount * 100) / 100;
    }
    
    // Set expected end date
    if (this.startDate && this.duration) {
      this.expectedEndDate = new Date(this.startDate);
      this.expectedEndDate.setMonth(this.expectedEndDate.getMonth() + this.duration);
    }
    
    // Initialize current balance
    if (this.isNew) {
      this.currentBalance = this.totalAmount || 0;
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check if loan is overdue
loanSchema.methods.isOverdue = function() {
  const today = new Date();
  const overdueInstallments = this.paymentSchedule.filter(installment => 
    installment.status === 'PENDING' && installment.dueDate < today
  );
  return overdueInstallments.length > 0;
};

// Method to calculate overdue amount
loanSchema.methods.calculateOverdueAmount = function() {
  const today = new Date();
  let overdueAmount = 0;
  let totalLateFee = 0;
  
  this.paymentSchedule.forEach(installment => {
    if (installment.status === 'PENDING' && installment.dueDate < today) {
      overdueAmount += installment.amount;
      
      // Calculate late fee (1% per month)
      const monthsLate = Math.ceil((today - installment.dueDate) / (1000 * 60 * 60 * 24 * 30));
      const lateFee = installment.amount * 0.01 * monthsLate;
      installment.lateFee = Math.round(lateFee * 100) / 100;
      totalLateFee += installment.lateFee;
    }
  });
  
  this.overdueAmount = overdueAmount;
  this.totalLateFee = totalLateFee;
  return { overdueAmount, totalLateFee };
};

// Method to get loan summary for member view
loanSchema.methods.getMemberView = function() {
  return {
    loanId: this.loanId,
    loanType: this.loanType,
    amount: this.amount,
    duration: this.duration,
    emiAmount: this.emiAmount,
    totalAmount: this.totalAmount,
    purpose: this.purpose,
    status: this.status,
    startDate: this.startDate,
    expectedEndDate: this.expectedEndDate,
    currentBalance: this.currentBalance,
    overdueAmount: this.overdueAmount,
    totalLateFee: this.totalLateFee,
    isOverdue: this.isOverdue(),
    nextPayment: this.paymentSchedule.find(p => p.status === 'PENDING'),
    totalInstallments: this.paymentSchedule.length,
    paidInstallments: this.paymentSchedule.filter(p => p.status === 'PAID').length,
    pendingInstallments: this.paymentSchedule.filter(p => p.status === 'PENDING').length
  };
};

// Method to get admin view (includes interest rate and sensitive info)
loanSchema.methods.getAdminView = function() {
  return {
    ...this.getMemberView(),
    interestRate: this.interestRate,
    totalInterest: this.totalInterest,
    approvedBy: this.approvedBy,
    approvedAt: this.approvedAt,
    rejectionReason: this.rejectionReason,
    collateral: this.collateral,
    educationDetails: this.educationDetails,
    emergencyDetails: this.emergencyDetails,
    personalDetails: this.personalDetails,
    documents: this.documents,
    notes: this.notes,
    member: this.member
  };
};

// Method to generate payment schedule
loanSchema.methods.generatePaymentSchedule = function() {
  if (!this.startDate || !this.duration || !this.emiAmount) {
    throw new Error('Cannot generate payment schedule: missing required fields');
  }
  
  const schedule = [];
  let remainingBalance = this.totalAmount;
  
  for (let i = 1; i <= this.duration; i++) {
    const dueDate = new Date(this.startDate);
    dueDate.setMonth(dueDate.getMonth() + i);
    
    const installment = {
      installmentNumber: i,
      dueDate: dueDate,
      amount: this.emiAmount,
      principal: 0,
      interest: 0,
      status: 'PENDING'
    };
    
    // Calculate principal and interest for this installment
    const monthlyRate = this.interestRate / 12 / 100;
    if (monthlyRate > 0) {
      installment.interest = Math.round(remainingBalance * monthlyRate * 100) / 100;
      installment.principal = Math.round((this.emiAmount - installment.interest) * 100) / 100;
    } else {
      installment.principal = this.emiAmount;
      installment.interest = 0;
    }
    
    remainingBalance -= installment.principal;
    schedule.push(installment);
  }
  
  this.paymentSchedule = schedule;
  return schedule;
};

// Indexes for better query performance
loanSchema.index({ member: 1, status: 1 });
loanSchema.index({ loanType: 1, status: 1 });
loanSchema.index({ status: 1, startDate: 1 });
loanSchema.index({ loanId: 1 });

module.exports = mongoose.model('Loan', loanSchema);
