const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const PaymentRequest = require('../models/paymentRequest.model');
const SocietyMember = require('../models/societyMember.model');
const Admin = require('../models/admin.model');
const { calculatePaymentSummary, validatePaymentParams } = require('../utilities/paymentCalculator');

describe('Payment Requests API', () => {
  let adminToken, memberToken, adminId, memberId;

  beforeAll(async () => {
    // Create test admin
    const admin = new Admin({
      firstName: 'Test',
      lastName: 'Admin',
      email: 'testadmin@example.com',
      password: 'password123',
      role: 'admin'
    });
    await admin.save();
    adminId = admin._id;

    // Create test society member
    const member = new SocietyMember({
      firstName: 'Test',
      lastName: 'Member',
      email: 'testmember@example.com',
      password: 'password123',
      phone: '9876543210',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'male',
      address: {
        street: 'Test Street',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456'
      },
      emergencyContact: {
        name: 'Emergency Contact',
        relationship: 'Father',
        phone: '9876543211'
      }
    });
    await member.save();
    memberId = member._id;

    // Generate tokens (you'll need to implement token generation)
    // adminToken = generateToken(admin);
    // memberToken = generateToken(member);
  });

  afterAll(async () => {
    await PaymentRequest.deleteMany({});
    await SocietyMember.deleteMany({});
    await Admin.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await PaymentRequest.deleteMany({});
  });

  describe('Admin Routes', () => {
    describe('POST /api/payment-requests/admin/create', () => {
      it('should create a new RD payment request', async () => {
        const paymentData = {
          societyMemberId: memberId,
          paymentType: 'RD',
          amount: 5000,
          interestRate: 8.5,
          paymentMethod: 'UPI',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          description: 'Monthly RD contribution',
          duration: 12,
          recurringDetails: {
            frequency: 'MONTHLY',
            totalInstallments: 12
          }
        };

        const response = await request(app)
          .post('/api/payment-requests/admin/create')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(paymentData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.paymentType).toBe('RD');
        expect(response.body.data.amount).toBe(5000);
        expect(response.body.data.interestRate).toBe(8.5);
        expect(response.body.data.status).toBe('PENDING');
      });

      it('should create a new FD payment request', async () => {
        const paymentData = {
          societyMemberId: memberId,
          paymentType: 'FD',
          amount: 100000,
          interestRate: 9.5,
          paymentMethod: 'CASH',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          description: 'Fixed deposit for 12 months',
          duration: 12
        };

        const response = await request(app)
          .post('/api/payment-requests/admin/create')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(paymentData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.paymentType).toBe('FD');
        expect(response.body.data.amount).toBe(100000);
        expect(response.body.data.interestRate).toBe(9.5);
      });

      it('should create a new OD payment request', async () => {
        const paymentData = {
          societyMemberId: memberId,
          paymentType: 'OD',
          amount: 25000,
          interestRate: 12.0,
          paymentMethod: 'UPI',
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
          description: 'Overdraft facility'
        };

        const response = await request(app)
          .post('/api/payment-requests/admin/create')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(paymentData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.paymentType).toBe('OD');
        expect(response.body.data.amount).toBe(25000);
        expect(response.body.data.interestRate).toBe(12.0);
      });

      it('should return 400 for invalid payment type', async () => {
        const paymentData = {
          societyMemberId: memberId,
          paymentType: 'INVALID',
          amount: 5000,
          interestRate: 8.5,
          paymentMethod: 'UPI',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          description: 'Test payment'
        };

        const response = await request(app)
          .post('/api/payment-requests/admin/create')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(paymentData);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should return 400 for missing required fields', async () => {
        const paymentData = {
          societyMemberId: memberId,
          paymentType: 'RD',
          // Missing amount, interestRate, etc.
        };

        const response = await request(app)
          .post('/api/payment-requests/admin/create')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(paymentData);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/payment-requests/admin/requests', () => {
      beforeEach(async () => {
        // Create test payment requests
        const requests = [
          {
            societyMember: memberId,
            createdBy: adminId,
            paymentType: 'RD',
            amount: 5000,
            interestRate: 8.5,
            paymentMethod: 'UPI',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            description: 'RD 1',
            duration: 12,
            recurringDetails: {
              frequency: 'MONTHLY',
              totalInstallments: 12
            }
          },
          {
            societyMember: memberId,
            createdBy: adminId,
            paymentType: 'FD',
            amount: 100000,
            interestRate: 9.5,
            paymentMethod: 'CASH',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            description: 'FD 1',
            duration: 12
          }
        ];

        await PaymentRequest.insertMany(requests);
      });

      it('should get all payment requests with pagination', async () => {
        const response = await request(app)
          .get('/api/payment-requests/admin/requests')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(2);
        expect(response.body.pagination).toBeDefined();
      });

      it('should filter by payment type', async () => {
        const response = await request(app)
          .get('/api/payment-requests/admin/requests?paymentType=RD')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].paymentType).toBe('RD');
      });

      it('should filter by status', async () => {
        const response = await request(app)
          .get('/api/payment-requests/admin/requests?status=PENDING')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(2);
      });
    });

    describe('POST /api/payment-requests/admin/requests/:requestId/mark-paid', () => {
      let requestId;

      beforeEach(async () => {
        const paymentRequest = new PaymentRequest({
          societyMember: memberId,
          createdBy: adminId,
          paymentType: 'RD',
          amount: 5000,
          interestRate: 8.5,
          paymentMethod: 'CASH',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          description: 'Test RD',
          duration: 12,
          recurringDetails: {
            frequency: 'MONTHLY',
            totalInstallments: 12
          }
        });
        await paymentRequest.save();
        requestId = paymentRequest._id;
      });

      it('should mark payment as received', async () => {
        const paymentData = {
          paymentMethod: 'CASH',
          transactionId: 'TXN123456789',
          cashReceiptNumber: 'CR001'
        };

        const response = await request(app)
          .post(`/api/payment-requests/admin/requests/${requestId}/mark-paid`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(paymentData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('PAID');
        expect(response.body.data.paymentDetails.cashReceiptNumber).toBe('CR001');
      });
    });
  });

  describe('Society Member Routes', () => {
    let requestId;

    beforeEach(async () => {
      const paymentRequest = new PaymentRequest({
        societyMember: memberId,
        createdBy: adminId,
        paymentType: 'RD',
        amount: 5000,
        interestRate: 8.5,
        paymentMethod: 'UPI',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        description: 'Monthly RD contribution',
        duration: 12,
        recurringDetails: {
          frequency: 'MONTHLY',
          totalInstallments: 12
        }
      });
      await paymentRequest.save();
      requestId = paymentRequest._id;
    });

    describe('GET /api/payment-requests/member/requests', () => {
      it('should get member payment requests', async () => {
        const response = await request(app)
          .get('/api/payment-requests/member/requests')
          .set('Authorization', `Bearer ${memberToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].paymentType).toBe('RD');
        // Interest rate should not be visible to member
        expect(response.body.data[0].interestRate).toBeUndefined();
      });
    });

    describe('GET /api/payment-requests/member/pending', () => {
      it('should get pending payments for member', async () => {
        const response = await request(app)
          .get('/api/payment-requests/member/pending')
          .set('Authorization', `Bearer ${memberToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.requests).toHaveLength(1);
        expect(response.body.data.totalPendingAmount).toBe(5000);
        expect(response.body.data.totalPendingCount).toBe(1);
      });
    });
  });

  describe('Payment Processing Routes', () => {
    let requestId;

    beforeEach(async () => {
      const paymentRequest = new PaymentRequest({
        societyMember: memberId,
        createdBy: adminId,
        paymentType: 'RD',
        amount: 5000,
        interestRate: 8.5,
        paymentMethod: 'UPI',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        description: 'Test RD',
        duration: 12,
        recurringDetails: {
          frequency: 'MONTHLY',
          totalInstallments: 12
        }
      });
      await paymentRequest.save();
      requestId = paymentRequest._id;
    });



    describe('POST /api/payment-requests/process-upi-payment', () => {
      it('should process UPI payment', async () => {
        // First change payment method to UPI
        await PaymentRequest.findByIdAndUpdate(requestId, {
          paymentMethod: 'UPI'
        });

        const response = await request(app)
          .post('/api/payment-requests/process-upi-payment')
          .set('Authorization', `Bearer ${memberToken}`)
          .send({
            requestId,
            upiTransactionId: 'UPI123456789'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('PAID');
      });
    });
  });
});

describe('Payment Calculator Utility', () => {
  describe('calculatePaymentSummary', () => {
    it('should calculate RD maturity correctly', () => {
      const result = calculatePaymentSummary('RD', 5000, 8.5, 12, { frequency: 'MONTHLY' });
      
      expect(result.totalDeposited).toBe(60000);
      expect(result.interestEarned).toBeGreaterThan(0);
      expect(result.maturityAmount).toBeGreaterThan(result.totalDeposited);
    });

    it('should calculate FD maturity correctly', () => {
      const result = calculatePaymentSummary('FD', 100000, 9.5, 12);
      
      expect(result.principal).toBe(100000);
      expect(result.interestEarned).toBeGreaterThan(0);
      expect(result.maturityAmount).toBeGreaterThan(result.principal);
    });

    it('should calculate OD interest correctly', () => {
      const result = calculatePaymentSummary('OD', 25000, 12.0, 0, { days: 30 });
      
      expect(result.amount).toBe(25000);
      expect(result.interestEarned).toBeGreaterThan(0);
      expect(result.totalAmount).toBeGreaterThan(result.amount);
    });
  });

  describe('validatePaymentParams', () => {
    it('should validate correct parameters', () => {
      const result = validatePaymentParams('RD', 5000, 8.5, 12, { frequency: 'MONTHLY' });
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid parameters', () => {
      const result = validatePaymentParams('RD', -1000, 150, 0, { frequency: 'INVALID' });
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
