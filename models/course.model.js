const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    maxlength: [200, 'Course title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
    maxlength: [2000, 'Course description cannot exceed 2000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [500, 'Short description cannot exceed 500 characters']
  },
  
  // Course Type and Category
  courseType: {
    type: String,
    enum: ['online', 'offline'],
    required: [true, 'Course type is required']
  },
  category: {
    type: String,
    required: [true, 'Course category is required'],
    enum: [
      'programming',
      'design',
      'marketing',
      'business',
      'language',
      'music',
      'art',
      'technology',
      'health',
      'other'
    ]
  },
  subcategory: {
    type: String,
    trim: true
  },
  
  // Course Details
  duration: {
    type: Number, // in hours
    required: [true, 'Course duration is required'],
    min: [1, 'Duration must be at least 1 hour']
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: [true, 'Course level is required']
  },
  language: {
    type: String,
    default: 'English'
  },
  
  // Pricing
  price: {
    type: Number,
    required: [true, 'Course price is required'],
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
  
  // Online Course Specific Fields
  onlineCourse: {
    pdfContent: {
      type: String // File path to PDF
    },
    videoContent: [{
      title: String,
      description: String,
      videoUrl: String,
      duration: Number // in minutes
    }],
    downloadableResources: [{
      title: String,
      description: String,
      fileUrl: String,
      fileSize: Number // in MB
    }],
    razorpayProductId: String,
    razorpayPriceId: String
  },
  
  // Offline Course Specific Fields
  offlineCourse: {
    location: {
      address: String,
      city: String,
      state: String,
      pincode: String
    },
    maxStudents: {
      type: Number,
      min: [1, 'Maximum students must be at least 1']
    },
    currentStudents: {
      type: Number,
      default: 0
    }
  },
  
  // Course Content
  syllabus: [{
    week: Number,
    title: String,
    description: String,
    topics: [String]
  }],
  
  // Requirements and Outcomes
  prerequisites: [String],
  learningOutcomes: [String],
  
  // Media
  thumbnail: {
    type: String // File path
  },
  banner: {
    type: String // File path
  },
  
  // Status and Visibility
  isActive: {
    type: Boolean,
    default: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  featured: {
    type: Boolean,
    default: false
  },
  
  // Statistics
  totalEnrollments: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  
  // Course ID
  courseId: {
    type: String,
    unique: true,
    sparse: true
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

// Generate course ID before saving
courseSchema.pre('save', async function(next) {
  if (this.isNew) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments();
    this.courseId = `CRS${year}${String(count + 1).padStart(4, '0')}`;
  }
  
  // Calculate discount percentage if original price is set
  if (this.originalPrice && this.price) {
    this.discountPercentage = Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  
  next();
});

// Virtual for formatted course ID (for display purposes)
courseSchema.virtual('formattedCourseId').get(function() {
  return this.courseId || (this._id ? `CRS${this._id.toString().slice(-6)}` : null);
});

// Method to check if course is full (for offline courses)
courseSchema.methods.isFull = function() {
  if (this.courseType === 'offline' && this.offlineCourse) {
    return this.offlineCourse.currentStudents >= this.offlineCourse.maxStudents;
  }
  return false;
};

// Method to get discounted price
courseSchema.methods.getDiscountedPrice = function() {
  if (this.originalPrice && this.discountPercentage) {
    return this.originalPrice - (this.originalPrice * this.discountPercentage / 100);
  }
  return this.price;
};

module.exports = mongoose.model('Course', courseSchema); 