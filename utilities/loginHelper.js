/**
 * Login Helper Utilities
 * Provides helper functions for login validation and user lookup
 */

const SocietyMember = require('../models/societyMember.model');

/**
 * Find society member by email or member account number
 * @param {string} email - User's email address
 * @param {string} memberAccountNumber - User's member account number
 * @returns {Promise<Object|null>} - Found member or null
 */
const findMemberByCredentials = async (email, memberAccountNumber) => {
  try {
    let member = null;

    // Find member by email if provided
    if (email) {
      member = await SocietyMember.findOne({ email: email.toLowerCase() });
    }
    
    // Find member by member account number if email not found and memberAccountNumber provided
    if (!member && memberAccountNumber) {
      member = await SocietyMember.findOne({ 
        memberAccountNumber: memberAccountNumber.toUpperCase() 
      });
    }

    return member;
  } catch (error) {
    console.error('Error finding member by credentials:', error);
    throw error;
  }
};

/**
 * Validate login request body
 * @param {Object} body - Request body
 * @returns {Object} - Validation result with errors array
 */
const validateLoginRequest = (body) => {
  const errors = [];
  const { email, memberAccountNumber, password } = body;

  // Check if password is provided
  if (!password) {
    errors.push('Password is required');
  }

  // Check if at least one identifier is provided
  if (!email && !memberAccountNumber) {
    errors.push('Either email or member account number is required');
  }

  // Validate email format if provided
  if (email && !isValidEmail(email)) {
    errors.push('Please provide a valid email address');
  }

  // Validate member account number format if provided
  if (memberAccountNumber && !isValidMemberAccountNumber(memberAccountNumber)) {
    errors.push('Please provide a valid member account number');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate member account number format
 * @param {string} memberAccountNumber - Member account number to validate
 * @returns {boolean} - True if valid
 */
const isValidMemberAccountNumber = (memberAccountNumber) => {
  // Format: MEMYYYYNNNNNN (e.g., MEM2024000001)
  const memberAccountNumberRegex = /^MEM\d{4}\d{6}$/i;
  return memberAccountNumberRegex.test(memberAccountNumber);
};

/**
 * Sanitize login credentials for security
 * @param {Object} credentials - Login credentials
 * @returns {Object} - Sanitized credentials
 */
const sanitizeLoginCredentials = (credentials) => {
  const sanitized = {};
  
  if (credentials.email) {
    sanitized.email = credentials.email.toLowerCase().trim();
  }
  
  if (credentials.memberAccountNumber) {
    sanitized.memberAccountNumber = credentials.memberAccountNumber.toUpperCase().trim();
  }
  
  if (credentials.password) {
    sanitized.password = credentials.password;
  }
  
  return sanitized;
};

/**
 * Generate login response data
 * @param {Object} member - Society member object
 * @param {string} token - JWT token
 * @returns {Object} - Formatted response data
 */
const generateLoginResponse = (member, token) => {
  return {
    success: true,
    message: 'Login successful',
    data: {
      member: {
        id: member._id,
        memberAccountNumber: member.memberAccountNumber,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        agentCode: member.agentCode,
        referralCode: member.referralCode,
        kycStatus: member.kycStatus,
        isKycApproved: member.isKycApproved,
        isAccountActive: member.isAccountActive,
        membershipStatus: member.getMembershipStatus()
      },
      token
    }
  };
};

/**
 * Generate error response for login failures
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @returns {Object} - Formatted error response
 */
const generateLoginErrorResponse = (message, statusCode = 401) => {
  return {
    success: false,
    message: message || 'Invalid credentials. Please check your email/member account number and password.'
  };
};

module.exports = {
  findMemberByCredentials,
  validateLoginRequest,
  isValidEmail,
  isValidMemberAccountNumber,
  sanitizeLoginCredentials,
  generateLoginResponse,
  generateLoginErrorResponse
};
