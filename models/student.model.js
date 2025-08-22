const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
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
  
  // Authentication
  studentId: {
    type: String,
    unique: true,
    sparse: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  originalPassword: {
    type: String
  },
  
  // KYC Documents (Optional during signup, required for approval)
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
    default: true // Changed to true by default since KYC is separate
  },
  kycApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  kycApprovedAt: {
    type: Date
  },
  
  // Course Enrollments
  enrollments: [{
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch'
    },
    enrollmentDate: {
      type: Date,
      default: Date.now
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    paymentAmount: {
      type: Number,
      required: true
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'online'],
      required: true
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
  // Academic Records
  marksheets: [{
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    marks: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    grade: {
      type: String,
      enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'],
      required: true
    },
    issuedDate: {
      type: Date,
      default: Date.now
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true
    }
  }],
  
  certificates: [{
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    certificateNumber: {
      type: String,
      required: true
    },
    issuedDate: {
      type: Date,
      default: Date.now
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true
    },
    certificateUrl: String
  }],
  
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

// Generate student ID before saving
studentSchema.pre('save', async function(next) {
  if (this.isNew && !this.studentId) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments();
    this.studentId = `STU${year}${String(count + 1).padStart(4, '0')}`;
  }
  
  // Store original password and hash the password field
  if (this.isModified('password') && this.password) {
    this.originalPassword = this.password;
    this.password = await bcrypt.hash(this.password, 12);
  }
  
  next();
});

// Method to compare password
studentSchema.methods.comparePassword = async function(candidatePassword) {
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
studentSchema.methods.getFullName = function() {
  return `${this.firstName} ${this.lastName}`;
};

// Method to check if KYC is complete
// PAN is optional now. Only Aadhar (number + document) and profile photo are required.
studentSchema.methods.isKycComplete = function() {
  const hasAadhar = Boolean(
    this.kycDocuments?.aadharCard?.number && this.kycDocuments?.aadharCard?.document
  );
  const hasProfile = Boolean(this.kycDocuments?.profilePhoto);
  return hasAadhar && hasProfile;
};

// Create a sparse compound index for certificate numbers to ensure uniqueness
// This will only index documents that have certificates with certificateNumber
studentSchema.index({ 'certificates.certificateNumber': 1 }, { 
  unique: true, 
  sparse: true,
  partialFilterExpression: { 'certificates.certificateNumber': { $exists: true, $ne: null } }
});

module.exports = mongoose.model('Student', studentSchema); 