const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const Admin = require('./models/admin.model');
const Student = require('./models/student.model');
const Course = require('./models/course.model');
const Batch = require('./models/batch.model');

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

// Create default super admin
const createDefaultAdmin = async () => {
  try {
    const existingAdmin = await Admin.findOne({ email: 'admin@example.com' });
    
    if (existingAdmin) {
      console.log('ℹ️  Default admin already exists');
      return;
    }

    const adminData = {
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@example.com',
      phone: '9876543210',
      password: 'admin123',
      role: 'super_admin',
      permissions: [
        'manage_students',
        'manage_courses',
        'manage_batches',
        'manage_payments',
        'manage_kyc',
        'manage_marksheets',
        'manage_certificates',
        'manage_loans',
        'manage_society_members',
        'view_reports',
        'manage_admins'
      ]
    };

    const admin = new Admin(adminData);
    await admin.save();

    console.log('✅ Default super admin created successfully');
    console.log('📧 Email: admin@example.com');
    console.log('🔑 Password: admin123');
  } catch (error) {
    console.error('❌ Error creating default admin:', error.message);
  }
};

// Create sample data
const createSampleData = async () => {
  try {
    // Create sample course
    const sampleCourse = new Course({
      title: 'JavaScript Fundamentals',
      description: 'Learn JavaScript from scratch with hands-on projects',
      shortDescription: 'Complete JavaScript course for beginners',
      courseType: 'online',
      category: 'programming',
      subcategory: 'web-development',
      duration: 40,
      level: 'beginner',
      language: 'English',
      price: 2999,
      originalPrice: 3999,
      syllabus: [
        {
          week: 1,
          title: 'Introduction to JavaScript',
          description: 'Basic concepts and setup',
          topics: ['Variables', 'Data Types', 'Functions']
        },
        {
          week: 2,
          title: 'DOM Manipulation',
          description: 'Working with HTML elements',
          topics: ['Selectors', 'Events', 'DOM Methods']
        }
      ],
      prerequisites: ['Basic HTML', 'Basic CSS'],
      learningOutcomes: ['Build web applications', 'Understand JavaScript concepts'],
      isActive: true,
      isPublished: true,
      createdBy: await Admin.findOne({ email: 'admin@example.com' })
    });

    await sampleCourse.save();
    console.log('✅ Sample course created');

    // Create sample batch
    const sampleBatch = new Batch({
      name: 'Morning Batch',
      description: 'Morning session for JavaScript course',
      course: sampleCourse._id,
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-04-01'),
      schedule: [
        {
          day: 'monday',
          startTime: '09:00',
          endTime: '11:00',
          room: 'Room 101'
        },
        {
          day: 'wednesday',
          startTime: '09:00',
          endTime: '11:00',
          room: 'Room 101'
        }
      ],
      maxStudents: 20,
      batchPrice: 3999,
      originalPrice: 4999,
      createdBy: await Admin.findOne({ email: 'admin@example.com' })
    });

    await sampleBatch.save();
    console.log('✅ Sample batch created');

  } catch (error) {
    console.error('❌ Error creating sample data:', error.message);
  }
};

// Main setup function
const setup = async () => {
  console.log('🚀 Starting Student Management System setup...\n');

  // Connect to database
  await connectDB();

  // Create default admin
  await createDefaultAdmin();

  // Create sample data
  await createSampleData();

  console.log('\n✅ Setup completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Copy env.example to .env and configure your environment variables');
  console.log('2. Install dependencies: npm install');
  console.log('3. Start the server: npm start');
  console.log('\n🔗 API Documentation:');
  console.log('- Student API: http://localhost:3000/api/student');
  console.log('- Admin API: http://localhost:3000/api/admin');
  console.log('\n📚 Documentation files:');
  console.log('- docs/student-api.md');
  console.log('- docs/admin-api.md');
  console.log('\n🔐 Admin Access:');
  console.log('- Default Admin: admin@example.com / admin123');
  console.log('- Admin Signup: POST /api/admin/signup');
  console.log('- Admin Login: POST /api/admin/login');
  console.log('\n👥 Student Access:');
  console.log('- Student Signup: POST /api/student/signup');
  console.log('- Student Login: POST /api/student/login');
  console.log('\n🔍 Admin Features:');
  console.log('- View all students with passwords');
  console.log('- Approve KYC documents');
  console.log('- Create and manage courses');
  console.log('- Create and manage batches');
  console.log('- Create marksheets and certificates');
  console.log('- Enroll students in offline courses');

  process.exit(0);
};

// Run setup
setup().catch(error => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
}); 