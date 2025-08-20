const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
  // Agent Information
  agentCode: {
    type: String,
    required: [true, 'Agent code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  agentName: {
    type: String,
    required: [true, 'Agent name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  
  // Address Information
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: {
      type: String,
      required: [true, 'State is required']
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      match: [/^[0-9]{6}$/, 'Please enter a valid 6-digit pincode']
    }
  },
  
  // Agent Status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  verifiedAt: {
    type: Date
  },
  
  // Agent Performance
  totalReferrals: {
    type: Number,
    default: 0
  },
  activeReferrals: {
    type: Number,
    default: 0
  },
  commissionRate: {
    type: Number,
    default: 5, // 5% commission
    min: 0,
    max: 100
  },
  totalCommission: {
    type: Number,
    default: 0
  },
  
  // Agent Documents
  documents: {
    idProof: {
      type: String // File path
    },
    addressProof: {
      type: String // File path
    },
    profilePhoto: {
      type: String // File path
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
  }
}, {
  timestamps: true
});

// Method to get full name
agentSchema.methods.getFullName = function() {
  return this.agentName;
};

// Method to check if agent is eligible for commission
agentSchema.methods.isEligibleForCommission = function() {
  return this.isActive && this.isVerified;
};

// Method to calculate commission
agentSchema.methods.calculateCommission = function(amount) {
  if (!this.isEligibleForCommission()) return 0;
  return (amount * this.commissionRate) / 100;
};

module.exports = mongoose.model('Agent', agentSchema);
