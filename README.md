# Student Management System API

A comprehensive REST API for managing students, courses, batches, KYC verification, and online/offline course enrollments with payment integration.

## Features

### 🎓 Student Management
- Student registration and authentication
- KYC document upload and verification
- Profile management
- Course enrollment (online/offline)
- Academic records (marksheets, certificates)

### 📚 Course Management
- Create and manage online/offline courses
- Course categorization and pricing
- PDF content upload for online courses
- Course statistics and analytics

### 🕐 Batch Management
- Time-based batch creation
- Schedule management
- Student capacity control
- Batch enrollment tracking

### 💳 Payment Integration
- Razorpay integration for online payments
- Cash payment support for offline courses
- Payment verification and tracking

### 🔐 Security Features
- JWT-based authentication
- Role-based access control
- File upload security
- Rate limiting and CORS protection

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Multer** - File uploads
- **Razorpay** - Payment gateway
- **bcryptjs** - Password hashing

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd student-management-system-api
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp env.example .env
```

4. Configure environment variables in `.env`:
```env
DATABASE_URL=mongodb://localhost:27017/student_management_system
JWT_SECRET=your-super-secret-jwt-key-here
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000
```

5. Start the server:
```bash
npm start
```

## API Documentation

### Authentication

#### Student Signup
```http
POST /api/student/signup
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "dateOfBirth": "1995-01-01",
  "gender": "male",
  "address": {
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  },
  "password": "password123"
}
```

#### Student Login
```http
POST /api/student/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Admin Login
```http
POST /api/admin/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

### Student Routes

#### Upload KYC Documents
```http
POST /api/student/kyc-upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "aadharNumber": "123456789012",
  "panNumber": "ABCDE1234F",
  "aadharDocument": <file>,
  "panDocument": <file>,
  "profilePhoto": <file>
}
```

#### Get Available Courses
```http
GET /api/student/courses?category=programming&courseType=online&level=beginner
Authorization: Bearer <token>
```

#### Enroll in Online Course
```http
POST /api/student/enroll/online/:courseId
Authorization: Bearer <token>
```

#### Verify Payment
```http
POST /api/student/verify-payment
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "order_123",
  "paymentId": "pay_123",
  "signature": "signature_123"
}
```

### Admin Routes

#### Create Course
```http
POST /api/admin/courses
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "title": "JavaScript Fundamentals",
  "description": "Learn JavaScript from scratch",
  "courseType": "online",
  "category": "programming",
  "duration": 40,
  "level": "beginner",
  "price": 2999,
  "syllabus": "[{\"week\": 1, \"title\": \"Introduction\", \"topics\": [\"Variables\", \"Functions\"]}]",
  "thumbnail": <file>,
  "coursePdf": <file>
}
```

#### Create Batch
```http
POST /api/admin/batches
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Morning Batch",
  "courseId": "course_id_here",
  "startDate": "2024-01-15",
  "endDate": "2024-03-15",
  "schedule": "[{\"day\": \"monday\", \"startTime\": \"09:00\", \"endTime\": \"11:00\"}]",
  "maxStudents": 20,
  "batchPrice": 3999
}
```

#### Approve KYC
```http
PUT /api/admin/students/:studentId/approve-kyc
Authorization: Bearer <token>
```

#### Enroll Student in Offline Course
```http
POST /api/admin/enroll-student
Authorization: Bearer <token>
Content-Type: application/json

{
  "studentId": "student_id_here",
  "courseId": "course_id_here",
  "batchId": "batch_id_here",
  "paymentAmount": 3999,
  "paymentMethod": "cash"
}
```

#### Create Marksheet
```http
POST /api/admin/marksheets
Authorization: Bearer <token>
Content-Type: application/json

{
  "studentId": "student_id_here",
  "courseId": "course_id_here",
  "marks": 85,
  "grade": "A"
}
```

#### Create Certificate
```http
POST /api/admin/certificates
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "studentId": "student_id_here",
  "courseId": "course_id_here",
  "certificate": <file>
}
```

## Database Schema

### Student Model
- Basic information (name, email, phone, etc.)
- Address details
- KYC documents (Aadhar, PAN, photo)
- Account status (KYC approved, active)
- Course enrollments
- Academic records (marksheets, certificates)

### Course Model
- Course details (title, description, type)
- Pricing and discounts
- Online course content (PDF, videos)
- Offline course location and capacity
- Statistics and ratings

### Batch Model
- Batch information and schedule
- Student capacity and enrollment
- Pricing for specific batches
- Status tracking

### Admin Model
- Admin information and authentication
- Role-based permissions
- Activity tracking

## File Structure

```
├── models/
│   ├── student.model.js
│   ├── admin.model.js
│   ├── course.model.js
│   └── batch.model.js
├── routes/
│   ├── student.js
│   ├── admin.js
│   └── index.js
├── middleware/
│   ├── auth.js
│   └── upload.js
├── utilities/
│   ├── database.js
│   └── razorpay.js
├── uploads/
│   ├── kyc/
│   ├── courses/
│   ├── profiles/
│   ├── certificates/
│   └── marksheets/
└── app.js
```

## Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcryptjs for password security
- **File Upload Security** - File type and size validation
- **Rate Limiting** - Prevent abuse and DDoS attacks
- **CORS Protection** - Cross-origin request security
- **Input Validation** - Request data validation
- **Error Handling** - Comprehensive error management

## Payment Integration

The system integrates with Razorpay for online course payments:

1. **Order Creation** - Creates payment orders for online courses
2. **Payment Verification** - Verifies payment signatures
3. **Product Management** - Creates Razorpay products and prices
4. **Refund Support** - Handles payment refunds

## Development

### Running in Development
```bash
npm run dev
```

### Running Tests
```bash
npm test
```

### Environment Variables
- `DATABASE_URL` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `RAZORPAY_KEY_ID` - Razorpay public key
- `RAZORPAY_KEY_SECRET` - Razorpay secret key
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `ALLOWED_ORIGINS` - CORS allowed origins

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
