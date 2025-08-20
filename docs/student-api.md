# Student API Documentation

## Base URL
```
http://localhost:3000/api/student
```

## Authentication
All protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### 1. Student Signup
**POST** `/signup`

Register a new student account. KYC documents are not required during signup and can be uploaded separately.

**Request Body:**
```json
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

**Response:**
```json
{
  "success": true,
  "message": "Student registered successfully. Please complete KYC to access courses.",
  "data": {
    "student": {
      "id": "student_id",
      "studentId": "STU20240001",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "kycStatus": "pending",
      "isKycApproved": false,
      "isAccountActive": true
    },
    "token": "jwt_token_here"
  }
}
```

### 2. Student Login
**POST** `/login`

Authenticate student and get access token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "student": {
      "id": "student_id",
      "studentId": "STU20240001",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "kycStatus": "approved",
      "isKycApproved": true,
      "isAccountActive": true
    },
    "token": "jwt_token_here"
  }
}
```

### 3. Upload KYC Documents
**POST** `/kyc-upload`

Upload KYC documents. Aadhar and Profile Photo are required. PAN is optional.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body:**
```
aadharNumber: "123456789012"
panNumber: "ABCDE1234F" (optional)
aadharDocument: <file>
panDocument: <file> (optional)
profilePhoto: <file>
```

**Response:**
```json
{
  "success": true,
  "message": "KYC documents uploaded successfully. Your documents are under review.",
  "data": {
    "kycStatus": "submitted",
    "isKycApproved": false
  }
}
```

### 4. Get KYC Status
**GET** `/kyc-status`

Get the current KYC status and details for the authenticated student.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "kycStatus": "submitted",
    "isKycApproved": false,
    "kycRejectionReason": null,
    "hasDocuments": true
  }
}
```

**Possible KYC Status Values:**
- `pending`: KYC not yet submitted
- `submitted`: KYC documents uploaded, waiting for admin approval
- `approved`: KYC approved by admin
- `rejected`: KYC rejected by admin

### 5. Get Student Profile
**GET** `/profile`

Get student's complete profile information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "student_id",
    "studentId": "STU20240001",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "dateOfBirth": "1995-01-01T00:00:00.000Z",
    "gender": "male",
    "address": {
      "street": "123 Main St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001"
    },
    "kycStatus": "approved",
    "isKycApproved": true,
    "isAccountActive": true,
    "kycDocuments": {
      "aadharCard": {
        "number": "123456789012",
        "document": "/uploads/kyc/aadhar.pdf"
      },
      "panCard": {
        "number": "ABCDE1234F",
        "document": "/uploads/kyc/pan.pdf"
      },
      "profilePhoto": "/uploads/kyc/profile.jpg"
    },
    "enrollments": [
      {
        "course": {
          "_id": "course_id",
          "title": "JavaScript Fundamentals",
          "courseType": "online"
        },
        "batch": {
          "_id": "batch_id",
          "name": "Morning Batch",
          "startDate": "2024-01-15T00:00:00.000Z",
          "endDate": "2024-03-15T00:00:00.000Z"
        },
        "enrollmentDate": "2024-01-10T00:00:00.000Z",
        "paymentStatus": "completed",
        "paymentAmount": 2999,
        "paymentMethod": "online",
        "isActive": true
      }
    ]
  }
}
```

### 6. Update Student Profile
**PUT** `/profile`

Update student's profile information.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "9876543211",
  "address": {
    "street": "456 New St",
    "city": "Delhi",
    "state": "Delhi",
    "pincode": "110001"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "student_id",
    "studentId": "STU20240001",
    "firstName": "John",
    "lastName": "Smith",
    "email": "john@example.com",
    "phone": "9876543211",
    "address": {
      "street": "456 New St",
      "city": "Delhi",
      "state": "Delhi",
      "pincode": "110001"
    }
  }
}
```

### 7. Get Available Courses
**GET** `/courses`

Get list of available courses with optional filters. Requires KYC approval.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `category` (optional): Course category
- `courseType` (optional): "online" or "offline"
- `level` (optional): "beginner", "intermediate", "advanced"

**Example:**
```
GET /courses?category=programming&courseType=online&level=beginner
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "course_id",
      "title": "JavaScript Fundamentals",
      "description": "Learn JavaScript from scratch",
      "courseType": "online",
      "category": "programming",
      "level": "beginner",
      "price": 2999,
      "originalPrice": 3999,
      "discountPercentage": 25,
      "thumbnail": "/uploads/courses/thumbnail.jpg",
      "createdBy": {
        "_id": "admin_id",
        "firstName": "Admin",
        "lastName": "User"
      }
    }
  ]
}
```

### 8. Get Course Details
**GET** `/courses/:courseId`

Get detailed information about a specific course. Requires KYC approval.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "course_id",
    "title": "JavaScript Fundamentals",
    "description": "Learn JavaScript from scratch",
    "shortDescription": "Complete JavaScript course for beginners",
    "courseType": "online",
    "category": "programming",
    "subcategory": "web-development",
    "duration": 40,
    "level": "beginner",
    "language": "English",
    "price": 2999,
    "originalPrice": 3999,
    "discountPercentage": 25,
    "syllabus": [
      {
        "week": 1,
        "title": "Introduction to JavaScript",
        "description": "Basic concepts and setup",
        "topics": ["Variables", "Data Types", "Functions"]
      }
    ],
    "prerequisites": ["Basic HTML", "Basic CSS"],
    "learningOutcomes": ["Build web applications", "Understand JavaScript concepts"],
    "thumbnail": "/uploads/courses/thumbnail.jpg",
    "banner": "/uploads/courses/banner.jpg",
    "onlineCourse": {
      "pdfContent": "/uploads/courses/course.pdf",
      "videoContent": [
        {
          "title": "Introduction Video",
          "description": "Welcome to the course",
          "videoUrl": "https://example.com/video1.mp4",
          "duration": 15
        }
      ],
      "downloadableResources": [
        {
          "title": "Course Materials",
          "description": "All course materials",
          "fileUrl": "/uploads/courses/materials.zip",
          "fileSize": 25
        }
      ]
    },
    "totalEnrollments": 150,
    "averageRating": 4.5,
    "totalRatings": 45,
    "createdBy": {
      "_id": "admin_id",
      "firstName": "Admin",
      "lastName": "User"
    }
  }
}
```

### 9. Enroll in Online Course
**POST** `/enroll/online/:courseId`

Enroll in an online course and create payment order. Requires KYC approval.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Enrollment initiated",
  "data": {
    "orderId": "order_123456789",
    "amount": 2999,
    "currency": "INR"
  }
}
```

### 10. Verify Payment
**POST** `/verify-payment`

Verify payment and complete enrollment. Requires KYC approval.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "orderId": "order_123456789",
  "paymentId": "pay_123456789",
  "signature": "payment_signature_here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified and enrollment completed successfully"
}
```

### 11. Get Student Enrollments
**GET** `/enrollments`

Get all enrollments for the authenticated student. Requires KYC approval.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "course": {
        "_id": "course_id",
        "title": "JavaScript Fundamentals",
        "description": "Learn JavaScript from scratch",
        "courseType": "online",
        "thumbnail": "/uploads/courses/thumbnail.jpg"
      },
      "batch": {
        "_id": "batch_id",
        "name": "Morning Batch",
        "startDate": "2024-01-15T00:00:00.000Z",
        "endDate": "2024-03-15T00:00:00.000Z",
        "schedule": [
          {
            "day": "monday",
            "startTime": "09:00",
            "endTime": "11:00",
            "room": "Room 101"
          }
        ]
      },
      "enrollmentDate": "2024-01-10T00:00:00.000Z",
      "paymentStatus": "completed",
      "paymentAmount": 2999,
      "paymentMethod": "online",
      "razorpayOrderId": "order_123456789",
      "razorpayPaymentId": "pay_123456789",
      "isActive": true
    }
  ]
}
```

### 12. Get Student Marksheets
**GET** `/marksheets`

Get all marksheets for the authenticated student. Requires KYC approval.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "course": {
        "_id": "course_id",
        "title": "JavaScript Fundamentals"
      },
      "marks": 85,
      "grade": "A",
      "issuedDate": "2024-03-15T00:00:00.000Z",
      "issuedBy": {
        "_id": "admin_id",
        "firstName": "Admin",
        "lastName": "User"
      }
    }
  ]
}
```

### 13. Get Student Certificates
**GET** `/certificates`

Get all certificates for the authenticated student. Requires KYC approval.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "course": {
        "_id": "course_id",
        "title": "JavaScript Fundamentals"
      },
      "certificateNumber": "CERT20240001",
      "issuedDate": "2024-03-15T00:00:00.000Z",
      "issuedBy": {
        "_id": "admin_id",
        "firstName": "Admin",
        "lastName": "User"
      },
      "certificateUrl": "/uploads/certificates/certificate.pdf"
    }
  ]
}
```

## KYC Process Flow

1. **Signup**: Student registers with basic information (no KYC documents required)
2. **KYC Upload**: Student uploads required documents (Aadhar + Profile Photo). PAN is optional.
3. **Admin Review**: Admin reviews the submitted documents
4. **Approval/Rejection**: Admin approves or rejects the KYC with reason
5. **Course Access**: Only approved students can access courses and enrollments

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "KYC verification required before accessing this resource."
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Course not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

## File Upload Requirements

### KYC Documents
- **Aadhar Document**: PDF, JPG, JPEG, PNG (max 10MB) — required
- **PAN Document**: PDF, JPG, JPEG, PNG (max 10MB) — optional
- **Profile Photo**: JPG, JPEG, PNG, WEBP (max 10MB) — required

### Course Content
- **Course PDF**: PDF only (max 10MB)
- **Course Videos**: MP4, AVI, MOV, WMV (max 10MB)
- **Thumbnail**: JPG, JPEG, PNG, WEBP (max 10MB)
- **Banner**: JPG, JPEG, PNG, WEBP (max 10MB)

## Status Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **500**: Internal Server Error 