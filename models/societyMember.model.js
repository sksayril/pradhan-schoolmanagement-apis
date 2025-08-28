const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const societyMemberSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: [true, 'Gender is required']
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
  
  // Society Member Specific Fields
  memberAccountNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  agentCode: {
    type: String,
    required: false,
    uppercase: true,
    trim: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SocietyMember',
    default: null
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Authentication
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  
  // KYC Documents
  kycDocuments: {
    aadharCard: {
      number: {
        type: String,
        match: [/^[0-9]{12}$/, 'Please enter a valid 12-digit Aadhar number']
      },
      document: {
        type: String // File path
      }
    },
    panCard: {
      number: {
        type: String,
        match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Please enter a valid PAN number']
      },
      document: {
        type: String // File path
      }
    },
    profilePhoto: {
      type: String // File path
    }
  },
  
  // Bank Documents
  bankDocuments: {
    accountStatement: {
      type: String, // File path
      default: null
    },
    passbook: {
      type: String, // File path
      default: null
    },
    uploadedAt: {
      type: Date,
      default: null
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SocietyMember',
      default: null
    }
  },
  
  // KYC Status
  kycStatus: {
    type: String,
    enum: ['pending', 'submitted', 'approved', 'rejected'],
    default: 'pending'
  },
  kycRejectionReason: {
    type: String
  },
  
  // Account Status
  isKycApproved: {
    type: Boolean,
    default: false
  },
  isAccountActive: {
    type: Boolean,
    default: true
  },
  kycApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  kycApprovedAt: {
    type: Date
  },
  
  // Society Membership Details
  membershipType: {
    type: String,
    enum: ['regular', 'non-regular'],
    default: 'regular'
  },
  membershipStartDate: {
    type: Date,
    default: Date.now
  },
  membershipEndDate: {
    type: Date
  },
  isMembershipActive: {
    type: Boolean,
    default: true
  },
  
  // Financial Information
  monthlyContribution: {
    type: Number,
    default: 0
  },
  totalContribution: {
    type: Number,
    default: 0
  },
  lastContributionDate: {
    type: Date
  },
  
  // Emergency Contact
  emergencyContact: {
    name: {
      type: String,
      required: [true, 'Emergency contact name is required']
    },
    relationship: {
      type: String,
      required: [true, 'Relationship with emergency contact is required']
    },
    phone: {
      type: String,
      required: [true, 'Emergency contact phone is required'],
      match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
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
  signupTime: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate member account number before saving
societyMemberSchema.pre('save', async function(next) {
  if (this.isNew && !this.memberAccountNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments();
    this.memberAccountNumber = `MEM${year}${String(count + 1).padStart(6, '0')}`;
  }
  
  // Generate referral code if not exists
  if (this.isNew && !this.referralCode) {
    this.referralCode = `REF${this.memberAccountNumber || `TEMP${Date.now()}`}`;
  }
  
  // Hash password if modified
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  
  next();
});

// Method to compare password
societyMemberSchema.methods.comparePassword = async function(candidatePassword) {
  // Safety check for undefined/null candidate password
  if (!candidatePassword || !this.password) {
    return false;
  }
  
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
};

// Method to get full name
societyMemberSchema.methods.getFullName = function() {
  return `${this.firstName} ${this.lastName}`;
};

// Method to check if KYC is complete
societyMemberSchema.methods.isKycComplete = function() {
  return this.kycDocuments.aadharCard.number && 
         this.kycDocuments.aadharCard.document &&
         this.kycDocuments.panCard.number && 
         this.kycDocuments.panCard.document &&
         this.kycDocuments.profilePhoto;
};

// Method to check if membership is active
societyMemberSchema.methods.isMembershipValid = function() {
  if (!this.isMembershipActive) return false;
  if (!this.membershipEndDate) return true;
  return new Date() <= this.membershipEndDate;
};

// Method to get membership status
societyMemberSchema.methods.getMembershipStatus = function() {
  if (!this.isMembershipActive) return 'inactive';
  if (!this.membershipEndDate) return 'active';
  if (new Date() > this.membershipEndDate) return 'expired';
  return 'active';
};

// Indexes for better query performance
societyMemberSchema.index({ email: 1 });
societyMemberSchema.index({ memberAccountNumber: 1 });
societyMemberSchema.index({ agentCode: 1 });

module.exports = mongoose.model('SocietyMember', societyMemberSchema);
