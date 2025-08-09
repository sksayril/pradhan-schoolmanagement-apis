const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Student = require('../models/student.model');
const Admin = require('../models/admin.model');
const Course = require('../models/course.model');
const Batch = require('../models/batch.model');
const { authenticateAdmin, checkPermission } = require('../middleware/auth');
const { courseUpload, certificateUpload, marksheetUpload, handleUploadError } = require('../middleware/upload');
const { createProduct, createPrice } = require('../utilities/razorpay');

// Normalize filesystem path to web URL path under /uploads
function toWebPath(filePath) {
  if (!filePath) return filePath;
  const parts = String(filePath).split('uploads');
  const rel = parts.length > 1 ? parts[1] : '';
  return ('/uploads' + rel).replace(/\\/g, '/');
}

// Admin Signup
router.post('/signup', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      role = 'admin',
      permissions = []
    } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin with this email already exists'
      });
    }

    // Create new admin
    const admin = new Admin({
      firstName,
      lastName,
      email,
      phone,
      password,
      role,
      permissions
    });

    await admin.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id, type: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      data: {
        admin: {
          id: admin._id,
          adminId: admin.adminId,
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions
        },
        token
      }
    });
  } catch (error) {
    console.error('Admin signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id, type: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        admin: {
          id: admin._id,
          adminId: admin.adminId,
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions
        },
        token
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get Admin Profile
router.get('/profile', authenticateAdmin, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id).select('-password');
    res.json({
      success: true,
      data: admin
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get All Students (with passwords)
router.get('/students', authenticateAdmin, checkPermission('manage_students'), async (req, res) => {
  try {
    const { status, kycStatus, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (status) filter.isAccountActive = status === 'active';
    if (kycStatus) {
      if (kycStatus === 'approved') {
        filter.isKycApproved = true;
      } else if (kycStatus === 'pending') {
        filter.kycStatus = 'pending';
      } else if (kycStatus === 'submitted') {
        filter.kycStatus = 'submitted';
      } else if (kycStatus === 'rejected') {
        filter.kycStatus = 'rejected';
      }
    }

    const skip = (page - 1) * limit;
    const students = await Student.find(filter)
      .select('+password +originalPassword') // Include password fields
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Student.countDocuments(filter);

    res.json({
      success: true,
      data: {
        students,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalStudents: total,
          hasNext: skip + students.length < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get Student Details (with password)
router.get('/students/:studentId', authenticateAdmin, checkPermission('manage_students'), async (req, res) => {
  try {
    let student;
    
    // Check if the parameter is a valid ObjectId (MongoDB _id)
    if (req.params.studentId.match(/^[0-9a-fA-F]{24}$/)) {
      student = await Student.findById(req.params.studentId)
        .select('+password +originalPassword') // Include password fields
        .populate('enrollments.course', 'title courseType')
        .populate('enrollments.batch', 'name startDate endDate')
        .populate('marksheets.course', 'title')
        .populate('marksheets.issuedBy', 'firstName lastName')
        .populate('certificates.course', 'title')
        .populate('certificates.issuedBy', 'firstName lastName');
    } else {
      // If not ObjectId, treat as studentId
      student = await Student.findOne({ studentId: req.params.studentId })
        .select('+password +originalPassword') // Include password fields
        .populate('enrollments.course', 'title courseType')
        .populate('enrollments.batch', 'name startDate endDate')
        .populate('marksheets.course', 'title')
        .populate('marksheets.issuedBy', 'firstName lastName')
        .populate('certificates.course', 'title')
        .populate('certificates.issuedBy', 'firstName lastName');
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error('Get student details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Approve KYC
router.post('/students/:studentId/approve-kyc', authenticateAdmin, checkPermission('manage_kyc'), async (req, res) => {
  try {
    let student;
    
    // Check if the parameter is a valid ObjectId (MongoDB _id)
    if (req.params.studentId.match(/^[0-9a-fA-F]{24}$/)) {
      student = await Student.findById(req.params.studentId);
    } else {
      // If not ObjectId, treat as studentId
      student = await Student.findOne({ studentId: req.params.studentId });
    }
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    if (student.isKycApproved) {
      return res.status(400).json({
        success: false,
        message: 'KYC is already approved'
      });
    }

    // Check if KYC documents are uploaded and status is submitted
    if (student.kycStatus !== 'submitted') {
      return res.status(400).json({
        success: false,
        message: 'KYC documents must be submitted before approval'
      });
    }

    // PAN is optional now. Require Aadhar document and profile photo only
    if (!student?.kycDocuments?.aadharCard?.document || 
        !student?.kycDocuments?.profilePhoto) {
      return res.status(400).json({
        success: false,
        message: 'KYC documents are not complete (Aadhar document and profile photo required)'
      });
    }

    student.isKycApproved = true;
    student.kycStatus = 'approved';
    student.isAccountActive = true;
    student.kycApprovedBy = req.admin._id;
    student.kycApprovedAt = new Date();
    student.kycRejectionReason = null; // Clear any rejection reason

    await student.save();

    res.json({
      success: true,
      message: 'KYC approved successfully',
      data: {
        studentId: student.studentId,
        kycStatus: student.kycStatus,
        isKycApproved: student.isKycApproved,
        isAccountActive: student.isAccountActive,
        kycApprovedAt: student.kycApprovedAt
      }
    });
  } catch (error) {
    console.error('Approve KYC error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Reject KYC
router.post('/students/:studentId/reject-kyc', authenticateAdmin, checkPermission('manage_kyc'), async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    let student;
    
    // Check if the parameter is a valid ObjectId (MongoDB _id)
    if (req.params.studentId.match(/^[0-9a-fA-F]{24}$/)) {
      student = await Student.findById(req.params.studentId);
    } else {
      // If not ObjectId, treat as studentId
      student = await Student.findOne({ studentId: req.params.studentId });
    }
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    if (student.isKycApproved) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reject already approved KYC'
      });
    }

    if (student.kycStatus !== 'submitted') {
      return res.status(400).json({
        success: false,
        message: 'KYC must be submitted before rejection'
      });
    }

    student.kycStatus = 'rejected';
    student.kycRejectionReason = reason;
    student.isKycApproved = false;

    await student.save();

    res.json({
      success: true,
      message: 'KYC rejected successfully',
      data: {
        studentId: student.studentId,
        kycStatus: student.kycStatus,
        kycRejectionReason: student.kycRejectionReason
      }
    });
  } catch (error) {
    console.error('Reject KYC error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Reset Student Password
router.put('/students/:studentId/reset-password', authenticateAdmin, checkPermission('manage_students'), async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    let student;
    
    // Check if the parameter is a valid ObjectId (MongoDB _id)
    if (req.params.studentId.match(/^[0-9a-fA-F]{24}$/)) {
      student = await Student.findById(req.params.studentId);
    } else {
      // If not ObjectId, treat as studentId
      student = await Student.findOne({ studentId: req.params.studentId });
    }
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Update password (will be hashed automatically by the model)
    student.password = newPassword;
    await student.save();

    res.json({
      success: true,
      message: 'Student password reset successfully',
      data: {
        studentId: student.studentId,
        email: student.email,
        originalPassword: student.originalPassword,
        passwordUpdatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get Student Details with Original Password
router.get('/students/:studentId/with-original-password', authenticateAdmin, checkPermission('manage_students'), async (req, res) => {
  try {
    let student;
    
    // Check if the parameter is a valid ObjectId (MongoDB _id)
    if (req.params.studentId.match(/^[0-9a-fA-F]{24}$/)) {
      student = await Student.findById(req.params.studentId)
        .select('+password +originalPassword') // Include password fields
        .populate('enrollments.course', 'title courseType')
        .populate('enrollments.batch', 'name startDate endDate')
        .populate('marksheets.course', 'title')
        .populate('marksheets.issuedBy', 'firstName lastName')
        .populate('certificates.course', 'title')
        .populate('certificates.issuedBy', 'firstName lastName');
    } else {
      // If not ObjectId, treat as studentId
      student = await Student.findOne({ studentId: req.params.studentId })
        .select('+password +originalPassword') // Include password fields
        .populate('enrollments.course', 'title courseType')
        .populate('enrollments.batch', 'name startDate endDate')
        .populate('marksheets.course', 'title')
        .populate('marksheets.issuedBy', 'firstName lastName')
        .populate('certificates.course', 'title')
        .populate('certificates.issuedBy', 'firstName lastName');
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      data: {
        ...student.toObject(),
        originalPassword: student.originalPassword,
        hashedPassword: student.password,
        signupTime: student.signupTime
      }
    });
  } catch (error) {
    console.error('Get student details with original password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create Course
router.post('/courses', authenticateAdmin, checkPermission('manage_courses'), courseUpload, handleUploadError, async (req, res) => {
  try {
    // Validate required fields
    const {
      title,
      description,
      shortDescription,
      courseType,
      category,
      subcategory,
      duration,
      level,
      language,
      price,
      originalPrice,
      syllabus,
      prerequisites,
      learningOutcomes,
      offlineCourse
    } = req.body;

    // Check required fields
    if (!title || !description || !courseType || !category || !duration || !level || !price) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, description, courseType, category, duration, level, price'
      });
    }

    // Validate course type
    if (!['online', 'offline'].includes(courseType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid courseType. Must be "online" or "offline"'
      });
    }

    // Validate category
    const validCategories = ['programming', 'design', 'marketing', 'business', 'language', 'music', 'art', 'technology', 'health', 'other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      });
    }

    // Validate level
    const validLevels = ['beginner', 'intermediate', 'advanced'];
    if (!validLevels.includes(level)) {
      return res.status(400).json({
        success: false,
        message: `Invalid level. Must be one of: ${validLevels.join(', ')}`
      });
    }

    // Parse and validate numeric fields
    const durationNum = parseInt(duration);
    const priceNum = parseFloat(price);
    const originalPriceNum = originalPrice ? parseFloat(originalPrice) : null;

    if (isNaN(durationNum) || durationNum < 1) {
      return res.status(400).json({
        success: false,
        message: 'Duration must be a positive number'
      });
    }

    if (isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a non-negative number'
      });
    }

    if (originalPriceNum !== null && (isNaN(originalPriceNum) || originalPriceNum < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Original price must be a non-negative number'
      });
    }

    // Parse JSON fields with error handling
    let syllabusData = [];
    let prerequisitesData = [];
    let learningOutcomesData = [];
    let offlineCourseData = null;

    try {
      syllabusData = syllabus ? JSON.parse(syllabus) : [];
      if (!Array.isArray(syllabusData)) {
        return res.status(400).json({
          success: false,
          message: 'Syllabus must be a valid JSON array'
        });
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid syllabus JSON format'
      });
    }

    try {
      prerequisitesData = prerequisites ? JSON.parse(prerequisites) : [];
      if (!Array.isArray(prerequisitesData)) {
        return res.status(400).json({
          success: false,
          message: 'Prerequisites must be a valid JSON array'
        });
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid prerequisites JSON format'
      });
    }

    try {
      learningOutcomesData = learningOutcomes ? JSON.parse(learningOutcomes) : [];
      if (!Array.isArray(learningOutcomesData)) {
        return res.status(400).json({
          success: false,
          message: 'Learning outcomes must be a valid JSON array'
        });
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid learning outcomes JSON format'
      });
    }

    // Parse offline course data if provided
    if (courseType === 'offline' && offlineCourse) {
      try {
        offlineCourseData = JSON.parse(offlineCourse);
        if (typeof offlineCourseData !== 'object' || offlineCourseData === null) {
          return res.status(400).json({
            success: false,
            message: 'Offline course data must be a valid JSON object'
          });
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid offline course JSON format'
        });
      }
    }

    const courseData = {
      title: title.trim(),
      description: description.trim(),
      shortDescription: shortDescription ? shortDescription.trim() : undefined,
      courseType,
      category,
      subcategory: subcategory ? subcategory.trim() : undefined,
      duration: durationNum,
      level,
      language: language || 'English',
      price: priceNum,
      originalPrice: originalPriceNum,
      syllabus: syllabusData,
      prerequisites: prerequisitesData,
      learningOutcomes: learningOutcomesData,
      createdBy: req.admin._id
    };

    // Handle offline course data
    if (courseType === 'offline' && offlineCourseData) {
      courseData.offlineCourse = offlineCourseData;
    }

    // Handle online course data
    if (courseType === 'online') {
      courseData.onlineCourse = {};
      
      // Create Razorpay product and price for online courses
      try {
        const productResult = await createProduct(title, description);
        if (productResult.success) {
          courseData.onlineCourse.razorpayProductId = productResult.product.id;
          
          const priceResult = await createPrice(productResult.product.id, priceNum);
          if (priceResult.success) {
            courseData.onlineCourse.razorpayPriceId = priceResult.price.id;
          }
        }
      } catch (error) {
        console.error('Razorpay integration error:', error);
        // Continue without Razorpay integration if it fails
      }
    }

    // Handle uploaded files
    if (req.files) {
      if (req.files.thumbnail && req.files.thumbnail[0]) {
        courseData.thumbnail = toWebPath(req.files.thumbnail[0].path);
      }
      if (req.files.banner && req.files.banner[0]) {
        courseData.banner = toWebPath(req.files.banner[0].path);
      }
      if (req.files.coursePdf && req.files.coursePdf[0] && courseType === 'online') {
        courseData.onlineCourse.pdfContent = toWebPath(req.files.coursePdf[0].path);
      }
    }

    const course = new Course(courseData);
    await course.save();

    // Calculate discount percentage if original price is set
    let discountPercentage = 0;
    if (course.originalPrice && course.price) {
      discountPercentage = Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100);
    }

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: {
        _id: course._id,
        title: course.title,
        description: course.description,
        courseType: course.courseType,
        category: course.category,
        duration: course.duration,
        level: course.level,
        price: course.price,
        originalPrice: course.originalPrice,
        discountPercentage: discountPercentage,
        thumbnail: course.thumbnail,
        banner: course.banner,
        onlineCourse: course.onlineCourse,
        totalEnrollments: course.totalEnrollments,
        averageRating: course.averageRating,
        totalRatings: course.totalRatings,
        createdBy: course.createdBy,
        createdAt: course.createdAt
      }
    });
  } catch (error) {
    console.error('Create course error:', error);
    
    // Handle specific MongoDB validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Course with this title already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get All Courses
router.get('/courses', authenticateAdmin, checkPermission('manage_courses'), async (req, res) => {
  try {
    const { status, courseType, category, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (status) filter.isActive = status === 'active';
    if (courseType) filter.courseType = courseType;
    if (category) filter.category = category;

    const skip = (page - 1) * limit;
    const courses = await Course.find(filter)
      .populate('createdBy', 'firstName lastName')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Course.countDocuments(filter);

    res.json({
      success: true,
      data: {
        courses,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalCourses: total,
          hasNext: skip + courses.length < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update Course
router.put('/courses/:courseId', authenticateAdmin, checkPermission('manage_courses'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const updateData = req.body;
    Object.keys(updateData).forEach(key => {
      if (key !== 'createdBy' && key !== '_id') {
        course[key] = updateData[key];
      }
    });

    await course.save();

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: course
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create Batch
router.post('/batches', authenticateAdmin, checkPermission('manage_batches'), async (req, res) => {
  try {
    const {
      name,
      description,
      courseId,
      startDate,
      endDate,
      schedule,
      maxStudents,
      batchPrice,
      originalPrice
    } = req.body;

    // Validate required fields
    if (!name || !courseId || !startDate || !endDate || !schedule || !maxStudents || !batchPrice) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, courseId, startDate, endDate, schedule, maxStudents, batchPrice'
      });
    }

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Parse and validate numeric fields
    const maxStudentsNum = parseInt(maxStudents);
    const batchPriceNum = parseFloat(batchPrice);
    const originalPriceNum = originalPrice ? parseFloat(originalPrice) : null;

    if (isNaN(maxStudentsNum) || maxStudentsNum < 1) {
      return res.status(400).json({
        success: false,
        message: 'Max students must be a positive number'
      });
    }

    if (isNaN(batchPriceNum) || batchPriceNum < 0) {
      return res.status(400).json({
        success: false,
        message: 'Batch price must be a non-negative number'
      });
    }

    if (originalPriceNum !== null && (isNaN(originalPriceNum) || originalPriceNum < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Original price must be a non-negative number'
      });
    }

    // Parse schedule JSON with error handling
    let scheduleData = [];
    try {
      scheduleData = JSON.parse(schedule);
      if (!Array.isArray(scheduleData)) {
        return res.status(400).json({
          success: false,
          message: 'Schedule must be a valid JSON array'
        });
      }

      // Validate schedule structure
      const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

      for (let i = 0; i < scheduleData.length; i++) {
        const item = scheduleData[i];
        
        if (!item.day || !validDays.includes(item.day.toLowerCase())) {
          return res.status(400).json({
            success: false,
            message: `Invalid day in schedule item ${i + 1}. Must be one of: ${validDays.join(', ')}`
          });
        }

        if (!item.startTime || !timeRegex.test(item.startTime)) {
          return res.status(400).json({
            success: false,
            message: `Invalid start time in schedule item ${i + 1}. Must be in HH:MM format`
          });
        }

        if (!item.endTime || !timeRegex.test(item.endTime)) {
          return res.status(400).json({
            success: false,
            message: `Invalid end time in schedule item ${i + 1}. Must be in HH:MM format`
          });
        }

        // Normalize day to lowercase
        item.day = item.day.toLowerCase();
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid schedule JSON format'
      });
    }

    // Validate dates
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const now = new Date();

    if (isNaN(startDateObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid start date format'
      });
    }

    if (isNaN(endDateObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid end date format'
      });
    }

    if (startDateObj >= endDateObj) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    const batchData = {
      name: name.trim(),
      description: description ? description.trim() : undefined,
      course: courseId,
      startDate: startDateObj,
      endDate: endDateObj,
      schedule: scheduleData,
      maxStudents: maxStudentsNum,
      batchPrice: batchPriceNum,
      originalPrice: originalPriceNum,
      createdBy: req.admin._id
    };

    const batch = new Batch(batchData);
    await batch.save();

    // Calculate discount percentage if original price is set
    let discountPercentage = 0;
    if (batch.originalPrice && batch.batchPrice) {
      discountPercentage = Math.round(((batch.originalPrice - batch.batchPrice) / batch.originalPrice) * 100);
    }

    res.status(201).json({
      success: true,
      message: 'Batch created successfully',
      data: {
        _id: batch._id,
        name: batch.name,
        description: batch.description,
        course: batch.course,
        startDate: batch.startDate,
        endDate: batch.endDate,
        schedule: batch.schedule,
        maxStudents: batch.maxStudents,
        currentStudents: batch.currentStudents,
        batchPrice: batch.batchPrice,
        originalPrice: batch.originalPrice,
        discountPercentage: discountPercentage,
        status: batch.status,
        isActive: batch.isActive,
        createdBy: batch.createdBy,
        createdAt: batch.createdAt
      }
    });
  } catch (error) {
    console.error('Create batch error:', error);
    
    // Handle specific MongoDB validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Batch with this name already exists for this course'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get All Batches
router.get('/batches', authenticateAdmin, checkPermission('manage_batches'), async (req, res) => {
  try {
    const { status, courseId, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (courseId) filter.course = courseId;

    const skip = (page - 1) * limit;
    const batches = await Batch.find(filter)
      .populate('course', 'title courseType')
      .populate('createdBy', 'firstName lastName')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Batch.countDocuments(filter);

    res.json({
      success: true,
      data: {
        batches,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalBatches: total,
          hasNext: skip + batches.length < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get batches error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Enroll Student in Offline Course/Batch
router.post('/enroll-student', authenticateAdmin, checkPermission('manage_students'), async (req, res) => {
  try {
    const { studentId, courseId, batchId, paymentAmount, paymentMethod } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    if (!student.isKycApproved) {
      return res.status(400).json({
        success: false,
        message: 'Student KYC must be approved before enrollment'
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if already enrolled
    const existingEnrollment = student.enrollments.find(
      e => e.course.toString() === courseId
    );

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Student is already enrolled in this course'
      });
    }

    // Add enrollment
    const enrollment = {
      course: courseId,
      paymentAmount: parseFloat(paymentAmount),
      paymentMethod: paymentMethod,
      paymentStatus: 'completed',
      isActive: true
    };

    if (batchId) {
      const batch = await Batch.findById(batchId);
      if (!batch) {
        return res.status(404).json({
          success: false,
          message: 'Batch not found'
        });
      }

      if (batch.isFull()) {
        return res.status(400).json({
          success: false,
          message: 'Batch is full'
        });
      }

      enrollment.batch = batchId;
      batch.currentStudents += 1;
      await batch.save();
    }

    student.enrollments.push(enrollment);
    await student.save();

    // Update course enrollment count
    course.totalEnrollments += 1;
    await course.save();

    res.json({
      success: true,
      message: 'Student enrolled successfully',
      data: {
        studentId: student.studentId,
        courseTitle: course.title,
        enrollmentDate: enrollment.enrollmentDate
      }
    });
  } catch (error) {
    console.error('Enroll student error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create Marksheet
router.post('/marksheets', authenticateAdmin, checkPermission('manage_marksheets'), async (req, res) => {
  try {
    const { studentId, courseId, marks, grade } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if marksheet already exists
    const existingMarksheet = student.marksheets.find(
      m => m.course.toString() === courseId
    );

    if (existingMarksheet) {
      return res.status(400).json({
        success: false,
        message: 'Marksheet already exists for this course'
      });
    }

    student.marksheets.push({
      course: courseId,
      marks: parseInt(marks),
      grade,
      issuedBy: req.admin._id
    });

    await student.save();

    res.json({
      success: true,
      message: 'Marksheet created successfully',
      data: {
        studentId: student.studentId,
        courseTitle: course.title,
        marks,
        grade
      }
    });
  } catch (error) {
    console.error('Create marksheet error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create Certificate
router.post('/certificates', authenticateAdmin, checkPermission('manage_certificates'), certificateUpload, handleUploadError, async (req, res) => {
  try {
    const { studentId, courseId } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if certificate already exists
    const existingCertificate = student.certificates.find(
      c => c.course.toString() === courseId
    );

    if (existingCertificate) {
      return res.status(400).json({
        success: false,
        message: 'Certificate already exists for this course'
      });
    }

    // Generate certificate number
    const certificateNumber = `CERT${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    const certificate = {
      course: courseId,
      certificateNumber,
      issuedBy: req.admin._id
    };

    if (req.file) {
      certificate.certificateUrl = toWebPath(req.file.path);
    }

    student.certificates.push(certificate);
    await student.save();

    res.json({
      success: true,
      message: 'Certificate created successfully',
      data: {
        studentId: student.studentId,
        courseTitle: course.title,
        certificateNumber
      }
    });
  } catch (error) {
    console.error('Create certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get Dashboard Statistics
router.get('/dashboard', authenticateAdmin, async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const activeStudents = await Student.countDocuments({ isAccountActive: true });
    const pendingKyc = await Student.countDocuments({ kycStatus: 'pending' });
    const submittedKyc = await Student.countDocuments({ kycStatus: 'submitted' });
    const approvedKyc = await Student.countDocuments({ kycStatus: 'approved' });
    const rejectedKyc = await Student.countDocuments({ kycStatus: 'rejected' });
    const totalCourses = await Course.countDocuments();
    const totalBatches = await Batch.countDocuments();
    const totalEnrollments = await Student.aggregate([
      { $unwind: '$enrollments' },
      { $count: 'total' }
    ]);

    res.json({
      success: true,
      data: {
        totalStudents,
        activeStudents,
        kycStats: {
          pending: pendingKyc,
          submitted: submittedKyc,
          approved: approvedKyc,
          rejected: rejectedKyc
        },
        totalCourses,
        totalBatches,
        totalEnrollments: totalEnrollments[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router; 