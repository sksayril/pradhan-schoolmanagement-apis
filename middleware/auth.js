const jwt = require('jsonwebtoken');
const Student = require('../models/student.model');
const Admin = require('../models/admin.model');
const SocietyMember = require('../models/societyMember.model');

// Middleware to authenticate admin
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type. Admin access required.'
      });
    }

    const admin = await Admin.findById(decoded.id).select('-password');
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Admin not found.'
      });
    }

    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated.'
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};

// Middleware to authenticate student
const authenticateStudent = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'student') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type. Student access required.'
      });
    }

    const student = await Student.findById(decoded.id).select('-password');
    
    if (!student) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Student not found.'
      });
    }

    if (!student.isAccountActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is not activated. Please complete KYC verification.'
      });
    }

    req.student = student;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};

// Middleware to authenticate society member
const authenticateSocietyMember = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'society_member') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type. Society member access required.'
      });
    }

    const member = await SocietyMember.findById(decoded.id).select('-password');
    
    if (!member) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Society member not found.'
      });
    }

    if (!member.isAccountActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is not activated. Please complete KYC verification.'
      });
    }

    req.societyMember = member;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};

// Middleware to check admin permissions
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!req.admin.hasPermission(permission)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions.'
      });
    }

    next();
  };
};

// Middleware to check if student KYC is approved
const requireKycApproved = async (req, res, next) => {
  try {
    const user = req.student || req.societyMember;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!user.isKycApproved) {
      return res.status(403).json({
        success: false,
        message: 'KYC verification required before accessing this resource.'
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};

module.exports = {
  authenticateAdmin,
  authenticateStudent,
  authenticateSocietyMember,
  requirePermission,
  requireKycApproved
}; 