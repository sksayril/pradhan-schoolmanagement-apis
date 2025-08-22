const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/admin.model');
const SocietyMember = require('../models/societyMember.model');
const Agent = require('../models/agent.model');
const { authenticateAdmin, requirePermission } = require('../middleware/auth');
const { agentUpload, handleUploadError } = require('../middleware/upload');

// Admin Login
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
      { id: admin._id, type: 'admin', role: admin.role },
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
          permissions: admin.permissions,
          isActive: admin.isActive
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

// ==================== SOCIETY MEMBER MANAGEMENT ====================

// Get All Society Members
router.get('/members', authenticateAdmin, requirePermission('manage_students'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, kycStatus, agentCode, search } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) filter.isAccountActive = status === 'active';
    if (kycStatus) filter.kycStatus = kycStatus;
    if (agentCode) filter.agentCode = agentCode.toUpperCase();
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { memberAccountNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const members = await SocietyMember.find(filter)
      .select('-password')
      .populate('referredBy', 'firstName lastName memberAccountNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SocietyMember.countDocuments(filter);

    res.json({
      success: true,
      data: {
        members,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalMembers: total,
          hasNext: skip + members.length < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get Society Member Details
router.get('/members/:memberId', authenticateAdmin, requirePermission('manage_students'), async (req, res) => {
  try {
    const member = await SocietyMember.findById(req.params.memberId)
      .select('-password')
      .populate('referredBy', 'firstName lastName memberAccountNumber')
      .populate('kycApprovedBy', 'firstName lastName');

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Society member not found'
      });
    }

    res.json({
      success: true,
      data: member
    });
  } catch (error) {
    console.error('Get member details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Approve/Reject KYC
router.put('/members/:memberId/kyc', authenticateAdmin, requirePermission('manage_kyc'), async (req, res) => {
  try {
    const { action, rejectionReason } = req.body;
    const member = await SocietyMember.findById(req.params.memberId);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Society member not found'
      });
    }

    if (member.kycStatus !== 'submitted') {
      return res.status(400).json({
        success: false,
        message: 'KYC is not in submitted status'
      });
    }

    if (action === 'approve') {
      member.kycStatus = 'approved';
      member.isKycApproved = true;
      member.kycApprovedBy = req.admin._id;
      member.kycApprovedAt = new Date();
      member.kycRejectionReason = null;
    } else if (action === 'reject') {
      member.kycStatus = 'rejected';
      member.isKycApproved = false;
      member.kycRejectionReason = rejectionReason || 'Documents not meeting requirements';
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Use "approve" or "reject"'
      });
    }

    await member.save();

    res.json({
      success: true,
      message: `KYC ${action}d successfully`,
      data: {
        kycStatus: member.kycStatus,
        isKycApproved: member.isKycApproved,
        kycRejectionReason: member.kycRejectionReason
      }
    });
  } catch (error) {
    console.error('KYC approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update Society Member
router.put('/members/:memberId', authenticateAdmin, requirePermission('manage_students'), async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      address,
      emergencyContact,
      membershipType,
      monthlyContribution,
      isAccountActive,
      isMembershipActive
    } = req.body;

    const member = await SocietyMember.findById(req.params.memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Society member not found'
      });
    }

    // Update allowed fields
    if (firstName) member.firstName = firstName;
    if (lastName) member.lastName = lastName;
    if (phone) member.phone = phone;
    if (address) member.address = address;
    if (emergencyContact) member.emergencyContact = emergencyContact;
    if (membershipType) member.membershipType = membershipType;
    if (monthlyContribution !== undefined) member.monthlyContribution = monthlyContribution;
    if (isAccountActive !== undefined) member.isAccountActive = isAccountActive;
    if (isMembershipActive !== undefined) member.isMembershipActive = isMembershipActive;

    await member.save();

    res.json({
      success: true,
      message: 'Society member updated successfully',
      data: {
        id: member._id,
        memberAccountNumber: member.memberAccountNumber,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        membershipType: member.membershipType,
        isAccountActive: member.isAccountActive,
        isMembershipActive: member.isMembershipActive
      }
    });
  } catch (error) {
    console.error('Update member error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get Pending KYC Requests
router.get('/kyc/pending', authenticateAdmin, requirePermission('manage_kyc'), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const members = await SocietyMember.find({ kycStatus: 'submitted' })
      .select('-password')
      .populate('referredBy', 'firstName lastName memberAccountNumber')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SocietyMember.countDocuments({ kycStatus: 'submitted' });

    res.json({
      success: true,
      data: {
        members,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalPending: total,
          hasNext: skip + members.length < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get pending KYC error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ==================== AGENT MANAGEMENT ====================

// Create Agent
router.post('/agents', authenticateAdmin, requirePermission('manage_students'), agentUpload, handleUploadError, async (req, res) => {
  try {
    const {
      agentCode,
      agentName,
      phone,
      email,
      address,
      commissionRate
    } = req.body;

    const files = req.files;

    // Check if agent code already exists
    const existingAgent = await Agent.findOne({ agentCode: agentCode.toUpperCase() });
    if (existingAgent) {
      return res.status(400).json({
        success: false,
        message: 'Agent code already exists'
      });
    }

    // Create new agent
    const agent = new Agent({
      agentCode: agentCode.toUpperCase(),
      agentName,
      phone,
      email,
      address,
      commissionRate: commissionRate || 5,
      documents: {
        idProof: files?.idProof?.[0]?.path,
        addressProof: files?.addressProof?.[0]?.path,
        profilePhoto: files?.profilePhoto?.[0]?.path
      }
    });

    await agent.save();

    res.status(201).json({
      success: true,
      message: 'Agent created successfully',
      data: {
        id: agent._id,
        agentCode: agent.agentCode,
        agentName: agent.agentName,
        email: agent.email,
        isActive: agent.isActive,
        isVerified: agent.isVerified
      }
    });
  } catch (error) {
    console.error('Create agent error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get All Agents
router.get('/agents', authenticateAdmin, requirePermission('manage_students'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) filter.isActive = status === 'active';
    if (search) {
      filter.$or = [
        { agentName: { $regex: search, $options: 'i' } },
        { agentCode: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const agents = await Agent.find(filter)
      .populate('verifiedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Agent.countDocuments(filter);

    res.json({
      success: true,
      data: {
        agents,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalAgents: total,
          hasNext: skip + agents.length < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get Agent Details
router.get('/agents/:agentId', authenticateAdmin, requirePermission('manage_students'), async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.agentId)
      .populate('verifiedBy', 'firstName lastName');

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    // Get members referred by this agent
    const referredMembers = await SocietyMember.find({ agentCode: agent.agentCode })
      .select('firstName lastName memberAccountNumber createdAt isKycApproved');

    res.json({
      success: true,
      data: {
        agent,
        referredMembers
      }
    });
  } catch (error) {
    console.error('Get agent details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update Agent
router.put('/agents/:agentId', authenticateAdmin, requirePermission('manage_students'), async (req, res) => {
  try {
    const {
      agentName,
      phone,
      email,
      address,
      commissionRate,
      isActive,
      isVerified
    } = req.body;

    const agent = await Agent.findById(req.params.agentId);
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    // Update allowed fields
    if (agentName) agent.agentName = agentName;
    if (phone) agent.phone = phone;
    if (email) agent.email = email;
    if (address) agent.address = address;
    if (commissionRate !== undefined) agent.commissionRate = commissionRate;
    if (isActive !== undefined) agent.isActive = isActive;
    if (isVerified !== undefined) {
      agent.isVerified = isVerified;
      if (isVerified && !agent.verifiedBy) {
        agent.verifiedBy = req.admin._id;
        agent.verifiedAt = new Date();
      }
    }

    await agent.save();

    res.json({
      success: true,
      message: 'Agent updated successfully',
      data: {
        id: agent._id,
        agentCode: agent.agentCode,
        agentName: agent.agentName,
        email: agent.email,
        isActive: agent.isActive,
        isVerified: agent.isVerified
      }
    });
  } catch (error) {
    console.error('Update agent error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ==================== REPORTS & ANALYTICS ====================

// Get Society Dashboard Stats
router.get('/dashboard', authenticateAdmin, requirePermission('view_reports'), async (req, res) => {
  try {
    const totalMembers = await SocietyMember.countDocuments();
    const activeMembers = await SocietyMember.countDocuments({ isAccountActive: true });
    const kycApprovedMembers = await SocietyMember.countDocuments({ isKycApproved: true });
    const pendingKyc = await SocietyMember.countDocuments({ kycStatus: 'submitted' });
    const totalAgents = await Agent.countDocuments();
    const activeAgents = await Agent.countDocuments({ isActive: true });

    // Monthly registrations for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRegistrations = await SocietyMember.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalMembers,
        activeMembers,
        kycApprovedMembers,
        pendingKyc,
        totalAgents,
        activeAgents,
        monthlyRegistrations
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get Agent Performance Report
router.get('/reports/agent-performance', authenticateAdmin, requirePermission('view_reports'), async (req, res) => {
  try {
    const agents = await Agent.find({ isActive: true })
      .select('agentCode agentName totalReferrals activeReferrals totalCommission commissionRate');

    // Get detailed performance for each agent
    const agentPerformance = await Promise.all(
      agents.map(async (agent) => {
        const referredMembers = await SocietyMember.find({ agentCode: agent.agentCode })
          .select('firstName lastName memberAccountNumber isKycApproved createdAt');

        return {
          ...agent.toObject(),
          referredMembers
        };
      })
    );

    res.json({
      success: true,
      data: agentPerformance
    });
  } catch (error) {
    console.error('Get agent performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get KYC Status Report
router.get('/reports/kyc-status', authenticateAdmin, requirePermission('view_reports'), async (req, res) => {
  try {
    const kycStats = await SocietyMember.aggregate([
      {
        $group: {
          _id: '$kycStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const kycByMonth = await SocietyMember.aggregate([
      {
        $match: {
          kycApprovedAt: { $exists: true }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$kycApprovedAt' },
            month: { $month: '$kycApprovedAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        kycStats,
        kycByMonth
      }
    });
  } catch (error) {
    console.error('Get KYC status report error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
