const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const SocietyMember = require('../models/societyMember.model');
const Agent = require('../models/agent.model');
const { authenticateSocietyMember, requireKycApproved } = require('../middleware/auth');
const { kycUpload, handleUploadError, bankDocumentUpload } = require('../middleware/upload');

// Society Member Signup
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
      password,
      agentCode,
      emergencyContact
    } = req.body;

    // Check if member already exists
    const existingMember = await SocietyMember.findOne({ email });
    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'Member with this email already exists'
      });
    }

    // Validate agent code if provided
    let referredBy = null;
    if (agentCode) {
      const agent = await Agent.findOne({ agentCode: agentCode.toUpperCase() });
      if (!agent || !agent.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or inactive agent code'
        });
      }
    }

    // Create new society member
    const member = new SocietyMember({
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      password,
      agentCode: agentCode ? agentCode.toUpperCase() : null,
      emergencyContact
    });

    await member.save();

    // Update agent referral count if agent code was provided
    if (agentCode) {
      const agent = await Agent.findOne({ agentCode: agentCode.toUpperCase() });
      if (agent) {
        agent.totalReferrals += 1;
        agent.activeReferrals += 1;
        await agent.save();
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: member._id, type: 'society_member' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Society member registered successfully. Please complete KYC to access full features.',
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
          isAccountActive: member.isAccountActive
        },
        token
      }
    });
  } catch (error) {
    console.error('Society member signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Society Member Login
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

    // Find member by email
    const member = await SocietyMember.findOne({ email });
    if (!member) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await member.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: member._id, type: 'society_member' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
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
    });
  } catch (error) {
    console.error('Society member login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Upload KYC Documents
router.post('/kyc-upload', authenticateSocietyMember, kycUpload, handleUploadError, async (req, res) => {
  try {
    const member = req.societyMember;
    const { aadharNumber, panNumber } = req.body;
    const files = req.files;

    // Check if all required files are uploaded
    if (!files.aadharDocument || !files.panDocument || !files.profilePhoto) {
      return res.status(400).json({
        success: false,
        message: 'All KYC documents are required: Aadhar document, PAN document, and profile photo'
      });
    }

    // Validate Aadhar number format
    if (!aadharNumber || !/^[0-9]{12}$/.test(aadharNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 12-digit Aadhar number'
      });
    }

    // Validate PAN number format
    if (!panNumber || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid PAN number (e.g., ABCDE1234F)'
      });
    }

    // Update member with KYC documents
    member.kycDocuments = {
      aadharCard: {
        number: aadharNumber,
        document: files.aadharDocument[0].path
      },
      panCard: {
        number: panNumber,
        document: files.panDocument[0].path
      },
      profilePhoto: files.profilePhoto[0].path
    };

    // Update KYC status to submitted
    member.kycStatus = 'submitted';
    member.kycRejectionReason = null; // Clear any previous rejection reason

    await member.save();

    res.json({
      success: true,
      message: 'KYC documents uploaded successfully. Your documents are under review.',
      data: {
        kycStatus: member.kycStatus,
        isKycApproved: member.isKycApproved
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
router.get('/kyc-status', authenticateSocietyMember, async (req, res) => {
  try {
    const member = await SocietyMember.findById(req.societyMember._id)
      .select('kycStatus isKycApproved kycRejectionReason kycDocuments');

    res.json({
      success: true,
      data: {
        kycStatus: member.kycStatus,
        isKycApproved: member.isKycApproved,
        kycRejectionReason: member.kycRejectionReason,
        hasDocuments: member.isKycComplete()
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

// Get Society Member Profile
router.get('/profile', authenticateSocietyMember, async (req, res) => {
  try {
    const member = await SocietyMember.findById(req.societyMember._id)
      .select('-password')
      .populate('referredBy', 'firstName lastName memberAccountNumber');

    res.json({
      success: true,
      data: member
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update Society Member Profile
router.put('/profile', authenticateSocietyMember, async (req, res) => {
  try {
    const { firstName, lastName, phone, address, emergencyContact } = req.body;
    const member = req.societyMember;

    // Update allowed fields
    if (firstName) member.firstName = firstName;
    if (lastName) member.lastName = lastName;
    if (phone) member.phone = phone;
    if (address) member.address = address;
    if (emergencyContact) member.emergencyContact = emergencyContact;

    await member.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: member._id,
        memberAccountNumber: member.memberAccountNumber,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phone: member.phone,
        address: member.address,
        emergencyContact: member.emergencyContact
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

// Get Membership Details
router.get('/membership', authenticateSocietyMember, requireKycApproved, async (req, res) => {
  try {
    const member = await SocietyMember.findById(req.societyMember._id)
      .select('membershipType membershipStartDate membershipEndDate isMembershipActive monthlyContribution totalContribution lastContributionDate');

    res.json({
      success: true,
      data: {
        ...member.toObject(),
        membershipStatus: member.getMembershipStatus(),
        isMembershipValid: member.isMembershipValid()
      }
    });
  } catch (error) {
    console.error('Get membership error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get Referral Information
router.get('/referrals', authenticateSocietyMember, requireKycApproved, async (req, res) => {
  try {
    const member = await SocietyMember.findById(req.societyMember._id)
      .select('referralCode agentCode referredBy');

    // Get members referred by this member
    const referredMembers = await SocietyMember.find({ referredBy: member._id })
      .select('firstName lastName memberAccountNumber createdAt isKycApproved');

    res.json({
      success: true,
      data: {
        referralCode: member.referralCode,
        agentCode: member.agentCode,
        referredBy: member.referredBy,
        referredMembers: referredMembers
      }
    });
  } catch (error) {
    console.error('Get referrals error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Validate Agent Code
router.post('/validate-agent-code', async (req, res) => {
  try {
    const { agentCode } = req.body;

    if (!agentCode) {
      return res.status(400).json({
        success: false,
        message: 'Agent code is required'
      });
    }

    const agent = await Agent.findOne({ agentCode: agentCode.toUpperCase() });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent code not found'
      });
    }

    if (!agent.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Agent code is inactive'
      });
    }

    res.json({
      success: true,
      message: 'Agent code is valid',
      data: {
        agentName: agent.agentName,
        agentCode: agent.agentCode,
        isVerified: agent.isVerified
      }
    });
  } catch (error) {
    console.error('Validate agent code error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get Available Agent Codes
router.get('/agent-codes', async (req, res) => {
  try {
    const agents = await Agent.find({ isActive: true, isVerified: true })
      .select('agentCode agentName phone');

    res.json({
      success: true,
      data: agents
    });
  } catch (error) {
    console.error('Get agent codes error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Change Password
router.put('/change-password', authenticateSocietyMember, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const member = req.societyMember;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Both currentPassword and newPassword are required'
      });
    }

    // Validate password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await member.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    member.password = newPassword;
    await member.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Logout (client-side token removal)
router.post('/logout', authenticateSocietyMember, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Upload Bank Document (Account Statement or Passbook)
router.post('/upload-bank-document', authenticateSocietyMember, bankDocumentUpload, async (req, res) => {
  try {
    const { documentType } = req.body; // 'accountStatement' or 'passbook'
    const member = req.societyMember;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a document'
      });
    }

    if (!documentType || !['accountStatement', 'passbook'].includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: 'Document type must be either "accountStatement" or "passbook"'
      });
    }

    // Update the member's bank document
    member.bankDocuments[documentType] = req.file.path;
    member.bankDocuments.uploadedAt = new Date();
    member.bankDocuments.uploadedBy = member._id;

    await member.save();

    res.json({
      success: true,
      message: `${documentType === 'accountStatement' ? 'Account Statement' : 'Passbook'} uploaded successfully`,
      data: {
        documentType,
        documentPath: req.file.path,
        uploadedAt: member.bankDocuments.uploadedAt
      }
    });
  } catch (error) {
    console.error('Upload bank document error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get Bank Documents (for the authenticated member)
router.get('/bank-documents', authenticateSocietyMember, async (req, res) => {
  try {
    const member = req.societyMember;

    res.json({
      success: true,
      data: {
        accountStatement: member.bankDocuments.accountStatement,
        passbook: member.bankDocuments.passbook,
        uploadedAt: member.bankDocuments.uploadedAt,
        hasDocuments: !!(member.bankDocuments.accountStatement || member.bankDocuments.passbook)
      }
    });
  } catch (error) {
    console.error('Get bank documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete Bank Document
router.delete('/bank-documents/:documentType', authenticateSocietyMember, async (req, res) => {
  try {
    const { documentType } = req.params;
    const member = req.societyMember;

    if (!['accountStatement', 'passbook'].includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document type. Must be "accountStatement" or "passbook"'
      });
    }

    // Remove the document path
    member.bankDocuments[documentType] = null;
    
    // If no documents remain, clear the upload metadata
    if (!member.bankDocuments.accountStatement && !member.bankDocuments.passbook) {
      member.bankDocuments.uploadedAt = null;
      member.bankDocuments.uploadedBy = null;
    }

    await member.save();

    res.json({
      success: true,
      message: `${documentType === 'accountStatement' ? 'Account Statement' : 'Passbook'} removed successfully`
    });
  } catch (error) {
    console.error('Delete bank document error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
