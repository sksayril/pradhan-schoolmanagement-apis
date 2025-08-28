const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
  // Receipt ID
  receiptId: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Society Member Reference
  societyMember: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SocietyMember',
    required: true
  },
  
  // Receipt Image
  imageUrl: {
    type: String,
    required: true
  },
  
  // Receipt Details
  title: {
    type: String,
    default: 'Receipt'
  },
  
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Receipt Type (optional)
  receiptType: {
    type: String,
    enum: ['payment', 'contribution', 'loan', 'other'],
    default: 'other'
  },
  
  // Amount (optional)
  amount: {
    type: Number,
    min: [0, 'Amount cannot be negative']
  },
  
  // Receipt Date
  receiptDate: {
    type: Date,
    default: Date.now
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'paid'],
    default: 'pending'
  },
  
  // Admin Review
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  
  reviewedAt: {
    type: Date
  },
  
  reviewNotes: {
    type: String,
    maxlength: [1000, 'Review notes cannot exceed 1000 characters']
  },
  
  // Payment Information
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  
  paidAt: {
    type: Date
  },
  
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

// Generate receipt ID before saving
receiptSchema.pre('save', async function(next) {
  if (this.isNew && !this.receiptId) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    this.receiptId = `RCPT${year}${month}${timestamp}`;
  }
  next();
});

// Method to get receipt summary
receiptSchema.methods.getReceiptSummary = function() {
  return {
    receiptId: this.receiptId,
    title: this.title,
    description: this.description,
    receiptType: this.receiptType,
    amount: this.amount,
    receiptDate: this.receiptDate,
    status: this.status,
    imageUrl: this.imageUrl,
    createdAt: this.createdAt,
    paidAt: this.paidAt
  };
};

// Method to get admin view
receiptSchema.methods.getAdminView = function() {
  return {
    ...this.getReceiptSummary(),
    societyMember: this.societyMember,
    reviewedBy: this.reviewedBy,
    reviewedAt: this.reviewedAt,
    reviewNotes: this.reviewNotes,
    paidBy: this.paidBy,
    paidAt: this.paidAt
  };
};

// Indexes for better query performance
receiptSchema.index({ societyMember: 1, status: 1 });
receiptSchema.index({ receiptId: 1 });
receiptSchema.index({ status: 1, createdAt: 1 });

module.exports = mongoose.model('Receipt', receiptSchema);
