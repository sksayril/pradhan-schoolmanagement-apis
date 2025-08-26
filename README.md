# Student & Society Management System API

A comprehensive REST API for managing students, courses, batches, KYC verification, online/offline course enrollments with payment integration, and society management with agent-based member registration.

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

### 💰 Payment Request Management System
- **RD (Recurring Deposit)**: Monthly/weekly/daily contributions with maturity calculation
- **FD (Fixed Deposit)**: One-time deposits with compound interest
- **OD (Overdraft)**: Flexible borrowing with EMI calculation
- **CD (Current Deposit)**: Regular savings with simple interest
- **Multi-Payment Methods**: UPI, Razorpay, and Cash payments
- **Interest Rate Management**: Admin-controlled interest rates (hidden from members)
- **Payment Scheduling**: Automatic maturity date and payment schedule calculation
- **Late Fee Calculation**: Intelligent late fee calculation for overdue payments
- **Payment Tracking**: Complete payment status and history tracking

### 🏦 Loan Management System
- **Gold Loans**: Secured loans against gold collateral with lower interest rates
- **Education Loans**: Specialized loans for educational purposes with extended terms
- **Personal Loans**: Unsecured loans for personal needs with flexible repayment
- **Emergency Loans**: Quick loans for urgent situations with fast processing
- **Automatic EMI Calculation**: Built-in EMI and interest calculations
- **Payment Scheduling**: Complete installment schedule generation
- **Payment Tracking**: Real-time payment status and overdue monitoring
- **Admin Management**: Comprehensive loan approval and management workflow

### 🏢 Society Management
- Society member registration with agent codes
- KYC verification for members
- Agent management and performance tracking
- Member account numbers and referral codes
- Membership types and contribution tracking
- Emergency contact management

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
MONGODB_URI=mongodb://localhost:27017/student_management_system
JWT_SECRET=your-super-secret-jwt-key-here
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000
```

5. Setup the database with default data:
```bash
node setupSociety.js
```

6. Start the server:
```bash
npm start
```

## Testing

Run the test suite:
```bash
npm test
```

## Examples

See the examples directory for usage examples:
- [Payment Request Examples](examples/payment-examples.js) - Complete payment workflow examples
- [Test Suite](test/payment-requests.test.js) - Comprehensive test coverage

## API Documentation

### Loan Management System

The system supports comprehensive loan management with four main loan types:

#### Loan Types
- **Gold Loan (GOLD)**: Secured loans against gold collateral with lower interest rates
- **Education Loan (EDUCATION)**: Specialized loans for educational purposes
- **Personal Loan (PERSONAL)**: Unsecured loans for personal needs
- **Emergency Loan (EMERGENCY)**: Quick loans for urgent situations

#### Key Features
- Admin can set custom interest rates for each loan type
- Automatic EMI calculation and payment schedule generation
- Complete payment tracking and overdue monitoring
- Comprehensive admin workflow for loan approval and management
- Real-time loan status updates and notifications

For detailed API documentation, see:
- [Loan Management API Documentation](docs/loan-api.md)

### Payment Request System

The system supports comprehensive payment management with four main payment types:

#### Payment Types
- **RD (Recurring Deposit)**: Regular contributions with maturity benefits
- **FD (Fixed Deposit)**: One-time deposits with higher interest rates
- **OD (Overdraft)**: Flexible borrowing facility
- **CD (Current Deposit)**: Regular savings account type

#### Payment Methods
- **UPI**: Direct UPI payments
- **Razorpay**: Online payment gateway
- **Cash**: Cash payments with receipt tracking

#### Key Features
- Admin can set custom interest rates for each member
- Interest rates are hidden from society members for privacy
- Automatic calculation of maturity amounts and payment schedules
- Late fee calculation for overdue payments
- Complete payment tracking and audit trail

For detailed API documentation, see:
- [Loan Management API Documentation](docs/loan-api.md)
- [Payment Requests API Documentation](docs/payment-requests-api.md)
- [Society Management API Documentation](docs/society-api.md)
- [Student Management API Documentation](docs/student-api.md)
- [Admin API Documentation](docs/admin-api.md)

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

#### Society Member Signup
```http
POST /api/society-member/signup
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "dateOfBirth": "1990-01-01",
  "gender": "male",
  "address": {
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  },
  "password": "password123",
  "agentCode": "AGENT001",
  "emergencyContact": {
    "name": "Jane Doe",
    "relationship": "Spouse",
    "phone": "9876543211"
  }
}
```

#### Society Member Login
```http
POST /api/society-member/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Admin Society Login
```http
POST /api/admin-society/login
Content-Type: application/json

{
  "email": "admin@society.com",
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

### Society Management Routes

#### Upload Society Member KYC
```http
POST /api/society-member/kyc-upload
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

#### Get Society Member Profile
```http
GET /api/society-member/profile
Authorization: Bearer <token>
```

#### Validate Agent Code
```http
POST /api/society-member/validate-agent-code
Content-Type: application/json

{
  "agentCode": "AGENT001"
}
```

#### Get All Society Members (Admin)
```http
GET /api/admin-society/members?page=1&limit=10&status=active&kycStatus=approved
Authorization: Bearer <admin_token>
```

#### Approve/Reject KYC (Admin)
```http
PUT /api/admin-society/members/:memberId/kyc
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "action": "approve"
}
```

#### Create Agent (Admin)
```http
POST /api/admin-society/agents
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

{
  "agentCode": "AGENT001",
  "agentName": "John Agent",
  "phone": "9876543210",
  "email": "agent@example.com",
  "address[street]": "123 Agent St",
  "address[city]": "Mumbai",
  "address[state]": "Maharashtra",
  "address[pincode]": "400001",
  "commissionRate": "5",
  "idProof": <file>,
  "addressProof": <file>,
  "agentProfilePhoto": <file>
}
```

#### Get Dashboard Stats (Admin)
```http
GET /api/admin-society/dashboard
Authorization: Bearer <admin_token>
```

## Database Schema

### Student Model
- Basic information (name, email, phone, etc.)
- Address details
- KYC documents (Aadhar, PAN, photo)
- Account status (KYC approved, active)
- Course enrollments
- Academic records (marksheets, certificates)

### Society Member Model
- Basic information and address
- Member account number (auto-generated)
- Agent code and referral system
- KYC documents and verification status
- Membership types and contribution tracking
- Emergency contact information

### Agent Model
- Agent information and contact details
- Agent code and verification status
- Performance metrics (referrals, commission)
- Document management
- Commission rate and earnings

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
│   ├── societyMember.model.js
│   ├── agent.model.js
│   ├── admin.model.js
│   ├── course.model.js
│   ├── batch.model.js
│   └── loan.model.js
├── routes/
│   ├── student.js
│   ├── societyMember.js
│   ├── adminSociety.js
│   ├── admin.js
│   ├── loans.js
│   ├── adminLoans.js
│   └── index.js
├── middleware/
│   ├── auth.js
│   └── upload.js
├── utilities/
│   ├── database.js
│   └── razorpay.js
├── docs/
│   ├── loan-api.md
│   ├── admin-api.md
│   ├── student-api.md
│   └── society-api.md
├── uploads/
│   ├── kyc/
│   ├── agents/
│   ├── courses/
│   ├── profiles/
│   ├── certificates/
│   └── marksheets/
├── setupSociety.js
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
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `RAZORPAY_KEY_ID` - Razorpay public key
- `RAZORPAY_KEY_SECRET` - Razorpay secret key
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `ALLOWED_ORIGINS` - CORS allowed origins

## Default Credentials

After running `node setupSociety.js`, the following default accounts are created:

### Admin Accounts
- **Super Admin**: admin@society.com / admin123
- **Regular Admin**: manager@society.com / manager123

### Agent Codes
- **AGENT001**: John Agent
- **AGENT002**: Jane Agent  
- **AGENT003**: Mike Agent

## API Documentation

Complete API documentation is available in the `docs/` folder:
- `docs/student-api.md` - Student management APIs
- `docs/admin-api.md` - Admin management APIs
- `docs/society-api.md` - Society management APIs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
