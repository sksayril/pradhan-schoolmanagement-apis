const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const SocietyMember = require('../models/societyMember.model');

describe('Society Member Login API', () => {
  let testMember;

  beforeAll(async () => {
    // Create a test society member
    testMember = new SocietyMember({
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

    await testMember.save();
  });

  afterAll(async () => {
    await SocietyMember.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/society-member/login', () => {
    it('should login successfully with email', async () => {
      const response = await request(app)
        .post('/api/society-member/login')
        .send({
          email: 'testmember@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.member.email).toBe('testmember@example.com');
      expect(response.body.data.member.memberAccountNumber).toBeDefined();
      expect(response.body.data.token).toBeDefined();
    });

    it('should login successfully with memberAccountNumber', async () => {
      const response = await request(app)
        .post('/api/society-member/login')
        .send({
          memberAccountNumber: testMember.memberAccountNumber,
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.member.memberAccountNumber).toBe(testMember.memberAccountNumber);
      expect(response.body.data.member.email).toBe('testmember@example.com');
      expect(response.body.data.token).toBeDefined();
    });

    it('should fail when neither email nor memberAccountNumber is provided', async () => {
      const response = await request(app)
        .post('/api/society-member/login')
        .send({
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Either email or member account number is required');
    });

    it('should fail when password is not provided', async () => {
      const response = await request(app)
        .post('/api/society-member/login')
        .send({
          email: 'testmember@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Password is required');
    });

    it('should fail with invalid email', async () => {
      const response = await request(app)
        .post('/api/society-member/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials. Please check your email/member account number and password.');
    });

    it('should fail with invalid memberAccountNumber', async () => {
      const response = await request(app)
        .post('/api/society-member/login')
        .send({
          memberAccountNumber: 'INVALID123',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials. Please check your email/member account number and password.');
    });

    it('should fail with wrong password', async () => {
      const response = await request(app)
        .post('/api/society-member/login')
        .send({
          email: 'testmember@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials. Please check your email/member account number and password.');
    });

    it('should handle case-insensitive memberAccountNumber', async () => {
      const response = await request(app)
        .post('/api/society-member/login')
        .send({
          memberAccountNumber: testMember.memberAccountNumber.toLowerCase(),
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
    });
  });
});
