const request = require('supertest');
const app = require('../app');
const Student = require('../models/student.model');

describe('Student Flexible Login Tests', () => {
  let testStudent;

  beforeAll(async () => {
    // Create a test student
    testStudent = new Student({
      firstName: 'Test',
      lastName: 'Student',
      email: 'teststudent@example.com',
      phone: '9876543210',
      dateOfBirth: new Date('1995-01-01'),
      gender: 'male',
      address: {
        street: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456'
      },
      password: 'testpassword123'
    });
    
    await testStudent.save();
  });

  afterAll(async () => {
    // Clean up test student
    if (testStudent) {
      await Student.findByIdAndDelete(testStudent._id);
    }
  });

  describe('POST /api/students/login', () => {
    it('should login with email successfully', async () => {
      const response = await request(app)
        .post('/api/students/login')
        .send({
          email: 'teststudent@example.com',
          password: 'testpassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.student.email).toBe('teststudent@example.com');
      expect(response.body.data.student.studentId).toBe(testStudent.studentId);
      expect(response.body.data.token).toBeDefined();
    });

    it('should login with student ID successfully', async () => {
      const response = await request(app)
        .post('/api/students/login')
        .send({
          studentId: testStudent.studentId,
          password: 'testpassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.student.email).toBe('teststudent@example.com');
      expect(response.body.data.student.studentId).toBe(testStudent.studentId);
      expect(response.body.data.token).toBeDefined();
    });

    it('should reject login with both email and student ID', async () => {
      const response = await request(app)
        .post('/api/students/login')
        .send({
          email: 'teststudent@example.com',
          studentId: testStudent.studentId,
          password: 'testpassword123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Please provide either email or student ID, not both');
    });

    it('should reject login without email or student ID', async () => {
      const response = await request(app)
        .post('/api/students/login')
        .send({
          password: 'testpassword123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Either email or student ID, and password are required');
    });

    it('should reject login without password', async () => {
      const response = await request(app)
        .post('/api/students/login')
        .send({
          email: 'teststudent@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Either email or student ID, and password are required');
    });

    it('should reject login with invalid email', async () => {
      const response = await request(app)
        .post('/api/students/login')
        .send({
          email: 'invalid@example.com',
          password: 'testpassword123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should reject login with invalid student ID', async () => {
      const response = await request(app)
        .post('/api/students/login')
        .send({
          studentId: 'INVALID123',
          password: 'testpassword123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should reject login with wrong password', async () => {
      const response = await request(app)
        .post('/api/students/login')
        .send({
          email: 'teststudent@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });
  });
});