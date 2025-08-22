const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Student = require('../models/student.model');
const Course = require('../models/course.model');
const Batch = require('../models/batch.model');
const { authenticateStudent, requireKycApproved } = require('../middleware/auth');
const { kycUpload, handleUploadError } = require('../middleware/upload');
const { createOrder, verifyPayment } = require('../utilities/razorpay');

// Normalize filesystem path to web URL path under /uploads
function toWebPath(filePath) {
  if (!filePath) return filePath;
  const parts = String(filePath).split('uploads');
  const rel = parts.length > 1 ? parts[1] : '';
  return ('/uploads' + rel).replace(/\\/g, '/');
}

// Student Signup
router.post('/signup', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      password
    } = req.body;

    // Check if student already exists
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Student with this email already exists'
      });
    }

    // Create new student (KYC documents not required during signup)
    const student = new Student({
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      password
    });

    await student.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: student._id, type: 'student' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Student registered successfully. Please complete KYC to access courses.',
      data: {
        student: {
          id: student._id,
          studentId: student.studentId,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          kycStatus: student.kycStatus,
          isKycApproved: student.isKycApproved,
          isAccountActive: student.isAccountActive
        },
        token
      }
    });
  } catch (error) {
    console.error('Student signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Student Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find student by email
    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await student.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: student._id, type: 'student' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        student: {
          id: student._id,
          studentId: student.studentId,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          kycStatus: student.kycStatus,
          isKycApproved: student.isKycApproved,
          isAccountActive: student.isAccountActive
        },
        token
      }
    });
  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Upload KYC Documents
router.post('/kyc-upload', authenticateStudent, kycUpload, handleUploadError, async (req, res) => {
  try {
    const student = req.student;
    const { aadharNumber, panNumber } = req.body;
    const files = req.files;

    // PAN is optional. Require Aadhar document and profile photo only
    if (!files?.aadharDocument || !files?.profilePhoto) {
      return res.status(400).json({
        success: false,
        message: 'Aadhar document and profile photo are required'
      });
    }

    // Validate Aadhar number format
    if (!aadharNumber || !/^[0-9]{12}$/.test(aadharNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 12-digit Aadhar number'
      });
    }

    // PAN is optional. If provided, validate format; otherwise ignore
    if (panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid PAN number (e.g., ABCDE1234F) or leave it empty'
      });
    }

    // Update student with KYC documents
    student.kycDocuments = {
      aadharCard: {
        number: aadharNumber,
        document: toWebPath(files.aadharDocument[0].path)
      },
      // Include PAN only if either number or document is provided
      ...(panNumber || files?.panDocument?.[0]?.path
        ? { panCard: { number: panNumber || undefined, document: toWebPath(files?.panDocument?.[0]?.path) || undefined } }
        : {}),
      profilePhoto: toWebPath(files.profilePhoto[0].path)
    };

    // Update KYC status to submitted
    student.kycStatus = 'submitted';
    student.kycRejectionReason = null; // Clear any previous rejection reason

    await student.save();

    res.json({
      success: true,
      message: 'KYC documents uploaded successfully. Your documents are under review.',
      data: {
        kycStatus: student.kycStatus,
        isKycApproved: student.isKycApproved
      }
    });
  } catch (error) {
    console.error('KYC upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get KYC Status
router.get('/kyc-status', authenticateStudent, async (req, res) => {
  try {
    const student = await Student.findById(req.student._id)
      .select('kycStatus isKycApproved kycRejectionReason kycDocuments');

    res.json({
      success: true,
      data: {
        kycStatus: student.kycStatus,
        isKycApproved: student.isKycApproved,
        kycRejectionReason: student.kycRejectionReason,
        hasDocuments: student.isKycComplete()
      }
    });
  } catch (error) {
    console.error('Get KYC status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get Student Profile
router.get('/profile', authenticateStudent, async (req, res) => {
  try {
    const student = await Student.findById(req.student._id)
      .select('-password')
      .populate('enrollments.course', 'title courseType')
      .populate('enrollments.batch', 'name startDate endDate');

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update Student Profile
router.put('/profile', authenticateStudent, async (req, res) => {
  try {
    const { firstName, lastName, phone, address } = req.body;
    const student = req.student;

    // Update allowed fields
    if (firstName) student.firstName = firstName;
    if (lastName) student.lastName = lastName;
    if (phone) student.phone = phone;
    if (address) student.address = address;

    await student.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: student._id,
        studentId: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        phone: student.phone,
        address: student.address
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get Available Courses
router.get('/courses', authenticateStudent, requireKycApproved, async (req, res) => {
  try {
    const { category, courseType, level } = req.query;
    const filter = { isActive: true, isPublished: true };

    if (category) filter.category = category;
    if (courseType) filter.courseType = courseType;
    if (level) filter.level = level;

    const courses = await Course.find(filter)
      .select('title description courseType category level price originalPrice discountPercentage thumbnail')
      .populate('createdBy', 'firstName lastName');

    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get Course Details
router.get('/courses/:courseId', authenticateStudent, requireKycApproved, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId)
      .populate('createdBy', 'firstName lastName');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Get course details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Enroll in Online Course
router.post('/enroll/online/:courseId', authenticateStudent, requireKycApproved, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (course.courseType !== 'online') {
      return res.status(400).json({
        success: false,
        message: 'This is not an online course'
      });
    }

    // Check if already enrolled
    const existingEnrollment = req.student.enrollments.find(
      enrollment => enrollment.course.toString() === course._id.toString()
    );

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this course'
      });
    }

    // Create Razorpay order
    const orderResult = await createOrder(course.price, 'INR', `course_${course._id}_${req.student._id}`);
    
    if (!orderResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create payment order'
      });
    }

    // Add enrollment with pending payment
    req.student.enrollments.push({
      course: course._id,
      paymentAmount: course.price,
      paymentMethod: 'online',
      razorpayOrderId: orderResult.order.id
    });

    await req.student.save();

    res.json({
      success: true,
      message: 'Enrollment initiated',
      data: {
        orderId: orderResult.order.id,
        amount: course.price,
        currency: 'INR'
      }
    });
  } catch (error) {
    console.error('Online enrollment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Verify Payment and Complete Enrollment
router.post('/verify-payment', authenticateStudent, requireKycApproved, async (req, res) => {
  try {
    const { orderId, paymentId, signature } = req.body;

    // Verify payment signature
    const verificationResult = verifyPayment(orderId, paymentId, signature);
    if (!verificationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    // Find enrollment with this order ID
    const enrollment = req.student.enrollments.find(
      e => e.razorpayOrderId === orderId
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Update enrollment status
    enrollment.paymentStatus = 'completed';
    enrollment.razorpayPaymentId = paymentId;
    enrollment.isActive = true;

    await req.student.save();

    // Update course enrollment count
    const course = await Course.findById(enrollment.course);
    if (course) {
      course.totalEnrollments += 1;
      await course.save();
    }

    res.json({
      success: true,
      message: 'Payment verified and enrollment completed successfully'
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get Student Enrollments
router.get('/enrollments', authenticateStudent, requireKycApproved, async (req, res) => {
  try {
    const student = await Student.findById(req.student._id)
      .populate({
        path: 'enrollments.course',
        select: 'title description courseType thumbnail'
      })
      .populate({
        path: 'enrollments.batch',
        select: 'name startDate endDate schedule'
      });

    res.json({
      success: true,
      data: student.enrollments
    });
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get Student Marksheets
router.get('/marksheets', authenticateStudent, requireKycApproved, async (req, res) => {
  try {
    const student = await Student.findById(req.student._id)
      .populate({
        path: 'marksheets.course',
        select: 'title'
      })
      .populate({
        path: 'marksheets.issuedBy',
        select: 'firstName lastName'
      });

    res.json({
      success: true,
      data: student.marksheets
    });
  } catch (error) {
    console.error('Get marksheets error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get Student Certificates
router.get('/certificates', authenticateStudent, requireKycApproved, async (req, res) => {
  try {
    const student = await Student.findById(req.student._id)
      .populate({
        path: 'certificates.course',
        select: 'title'
      })
      .populate({
        path: 'certificates.issuedBy',
        select: 'firstName lastName'
      });

    res.json({
      success: true,
      data: student.certificates
    });
  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router; 