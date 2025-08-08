const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  // Batch ID
  batchId: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Basic Information
  name: {
    type: String,
    required: [true, 'Batch name is required'],
    trim: true,
    maxlength: [100, 'Batch name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Course Reference
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required']
  },
  
  // Schedule Information
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  
  // Class Schedule
  schedule: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      required: true
    },
    startTime: {
      type: String,
      required: true,
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter time in HH:MM format']
    },
    endTime: {
      type: String,
      required: true,
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter time in HH:MM format']
    },
    room: String,
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    }
  }],
  
  // Capacity and Enrollment
  maxStudents: {
    type: Number,
    required: [true, 'Maximum students is required'],
    min: [1, 'Maximum students must be at least 1']
  },
  currentStudents: {
    type: Number,
    default: 0
  },
  
  // Pricing for this batch
  batchPrice: {
    type: Number,
    required: [true, 'Batch price is required'],
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative']
  },
  discountPercentage: {
    type: Number,
    min: [0, 'Discount percentage cannot be negative'],
    max: [100, 'Discount percentage cannot exceed 100']
  },
  
  // Status
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Created By
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
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

// Generate batch ID before saving
batchSchema.pre('save', async function(next) {
  if (this.isNew) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments();
    this.batchId = `BAT${year}${String(count + 1).padStart(4, '0')}`;
  }
  
  // Calculate discount percentage if original price is set
  if (this.originalPrice && this.batchPrice) {
    this.discountPercentage = Math.round(((this.originalPrice - this.batchPrice) / this.originalPrice) * 100);
  }
  
  next();
});

// Virtual for formatted batch ID (for display purposes)
batchSchema.virtual('formattedBatchId').get(function() {
  return this.batchId || (this._id ? `BAT${this._id.toString().slice(-6)}` : null);
});

// Method to check if batch is full
batchSchema.methods.isFull = function() {
  return this.currentStudents >= this.maxStudents;
};

// Method to check if batch is available for enrollment
batchSchema.methods.isAvailableForEnrollment = function() {
  const now = new Date();
  return this.status === 'upcoming' && 
         this.isActive && 
         !this.isFull() && 
         this.startDate > now;
};

// Method to get available seats
batchSchema.methods.getAvailableSeats = function() {
  return Math.max(0, this.maxStudents - this.currentStudents);
};

// Method to get discounted price
batchSchema.methods.getDiscountedPrice = function() {
  if (this.originalPrice && this.discountPercentage) {
    return this.originalPrice - (this.originalPrice * this.discountPercentage / 100);
  }
  return this.batchPrice;
};

module.exports = mongoose.model('Batch', batchSchema); 