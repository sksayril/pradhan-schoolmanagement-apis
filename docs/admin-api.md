# Admin API Documentation

## Base URL
```
http://localhost:3000/api/admin
```

## Authentication
All protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Permissions
Admin routes require specific permissions:
- `manage_students` - Manage student accounts
- `manage_courses` - Create and manage courses
- `manage_batches` - Create and manage batches
- `manage_payments` - Handle payment operations
- `manage_kyc` - Approve KYC documents
- `manage_marksheets` - Create and manage marksheets
- `manage_certificates` - Create and manage certificates
- `view_reports` - View system reports
- `manage_admins` - Manage admin accounts

## Endpoints

### 1. Admin Signup
**POST** `/signup`

Register a new admin account.

**Request Body:**
```json
{
  "firstName": "Admin",
  "lastName": "User",
  "email": "admin@example.com",
  "phone": "9876543210",
  "password": "admin123",
  "role": "admin",
  "permissions": [
    "manage_students",
    "manage_courses",
    "manage_batches",
    "manage_kyc",
    "manage_marksheets",
    "manage_certificates"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin registered successfully",
  "data": {
    "admin": {
      "id": "admin_id",
      "adminId": "ADM20240001",
      "firstName": "Admin",
      "lastName": "User",
      "email": "admin@example.com",
      "role": "admin",
      "permissions": [
        "manage_students",
        "manage_courses",
        "manage_batches",
        "manage_kyc",
        "manage_marksheets",
        "manage_certificates"
      ]
    },
    "token": "jwt_token_here"
  }
}
```

### 2. Admin Login
**POST** `/login`

Authenticate admin and get access token.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "admin": {
      "id": "admin_id",
      "adminId": "ADM20240001",
      "firstName": "Admin",
      "lastName": "User",
      "email": "admin@example.com",
      "role": "admin",
      "permissions": ["manage_students", "manage_courses", "manage_batches"]
    },
    "token": "jwt_token_here"
  }
}
```

### 3. Get Admin Profile
**GET** `/profile`

Get admin's profile information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "admin_id",
    "adminId": "ADM20240001",
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@example.com",
    "phone": "9876543210",
    "role": "admin",
    "permissions": ["manage_students", "manage_courses", "manage_batches"],
    "isActive": true,
    "lastLogin": "2024-01-10T10:30:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 4. Get All Students (with passwords)
**GET** `/students`

Get list of all students with passwords included.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): "active" or "inactive"
- `kycStatus` (optional): "approved" or "pending"
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Example:**
```
GET /students?status=active&kycStatus=approved&page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "students": [
      {
        "_id": "student_id",
        "studentId": "STU20240001",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "phone": "9876543210",
        "password": "hashed_password_here",
        "isKycApproved": true,
        "isAccountActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalStudents": 100,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 5. Get Student Details (with password)
**Note**: The `:studentId` parameter can be either the MongoDB `_id` or the `studentId` (e.g., "STU20240001").
**GET** `/students/:studentId`

Get detailed information about a specific student including password.

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
    "password": "hashed_password_here",
    "originalPassword": "password123", // Set automatically by system
    "dateOfBirth": "1995-01-01T00:00:00.000Z",
    "gender": "male",
    "address": {
      "street": "123 Main St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001"
    },
    "kycDocuments": {
      "aadharCard": {
        "number": "123456789012",
        "document": "/uploads/kyc/aadhar.pdf"
      },
      "panCard": {
        "number": "ABCDE1234F",
        "document": "/uploads/kyc/pan.pdf"
      },
      "profilePhoto": "/uploads/profiles/photo.jpg"
    },
    "isKycApproved": true,
    "isAccountActive": true,
    "kycApprovedBy": {
      "_id": "admin_id",
      "firstName": "Admin",
      "lastName": "User"
    },
    "kycApprovedAt": "2024-01-05T00:00:00.000Z",
    "signupTime": "2024-01-01T10:30:00.000Z",
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
    ],
    "marksheets": [
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
    ],
    "certificates": [
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
}
```

### 6. Reset Student Password
**PUT** `/students/:studentId/reset-password`

Reset a student's password and show the original password.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "newPassword": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Student password reset successfully",
  "data": {
    "studentId": "STU20240001",
    "email": "john@example.com",
    "originalPassword": "newpassword123",
    "passwordUpdatedAt": "2024-01-10T10:30:00.000Z"
  }
}
```

### 7. Get Student Details with Original Password
**GET** `/students/:studentId/with-original-password`

Get detailed student information including original password and signup time.

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
    "originalPassword": "password123",
    "hashedPassword": "$2a$12$tuwGTL5jmaiyTgXRzU3aJ.u3SXW1B/JKbQfXf/.8cKBRQFGAOAAca",
    "signupTime": "2024-01-01T10:30:00.000Z",
    "createdAt": "2024-01-01T10:30:00.000Z",
    "updatedAt": "2024-01-10T10:30:00.000Z"
  }
}
```

### 8. Approve KYC
**POST** `/students/:studentId/approve-kyc`

Approve student's KYC documents and activate account. Requires Aadhar document and profile photo. PAN is optional.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "KYC approved successfully",
  "data": {
    "studentId": "STU20240001",
    "kycStatus": "approved",
    "isKycApproved": true,
    "isAccountActive": true,
    "kycApprovedAt": "2024-01-10T10:30:00.000Z"
  }
}
```

### 9. Reject KYC
**POST** `/students/:studentId/reject-kyc`

Reject student's KYC documents with a reason.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "reason": "Documents are unclear and cannot be verified"
}
```

**Response:**
```json
{
  "success": true,
  "message": "KYC rejected successfully",
  "data": {
    "studentId": "STU20240001",
    "kycStatus": "rejected",
    "kycRejectionReason": "Documents are unclear and cannot be verified"
  }
}
```

### 10. Create Course
**POST** `/courses`

Create a new course (online or offline).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body:**
```
title: "JavaScript Fundamentals"
description: "Learn JavaScript from scratch"
shortDescription: "Complete JavaScript course for beginners"
courseType: "online"
category: "programming"
subcategory: "web-development"
duration: 40
level: "beginner"
language: "English"
price: 2999
originalPrice: 3999
syllabus: "[{\"week\": 1, \"title\": \"Introduction\", \"topics\": [\"Variables\", \"Functions\"]}]"
prerequisites: "[\"Basic HTML\", \"Basic CSS\"]"
learningOutcomes: "[\"Build web applications\", \"Understand JavaScript concepts\"]"
offlineCourse: "{\"location\": {\"address\": \"123 Main St\", \"city\": \"Mumbai\"}, \"maxStudents\": 30}"
thumbnail: <file>
banner: <file>
coursePdf: <file>
```

**Response:**
```json
{
  "success": true,
  "message": "Course created successfully",
  "data": {
    "_id": "course_id",
    "title": "JavaScript Fundamentals",
    "description": "Learn JavaScript from scratch",
    "courseType": "online",
    "category": "programming",
    "duration": 40,
    "level": "beginner",
    "price": 2999,
    "originalPrice": 3999,
    "discountPercentage": 25,
    "thumbnail": "/uploads/courses/thumbnail.jpg",
    "banner": "/uploads/courses/banner.jpg",
    "onlineCourse": {
      "pdfContent": "/uploads/courses/course.pdf",
      "razorpayProductId": "prod_123",
      "razorpayPriceId": "price_123"
    },
    "totalEnrollments": 0,
    "averageRating": 0,
    "totalRatings": 0,
    "createdBy": "admin_id",
    "createdAt": "2024-01-10T10:30:00.000Z"
  }
}
```

### 8. Get All Courses
**GET** `/courses`

Get list of all courses with optional filters.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): "active" or "inactive"
- `courseType` (optional): "online" or "offline"
- `category` (optional): Course category
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Example:**
```
GET /courses?status=active&courseType=online&category=programming&page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "_id": "course_id",
        "title": "JavaScript Fundamentals",
        "description": "Learn JavaScript from scratch",
        "courseType": "online",
        "category": "programming",
        "duration": 40,
        "level": "beginner",
        "price": 2999,
        "originalPrice": 3999,
        "discountPercentage": 25,
        "thumbnail": "/uploads/courses/thumbnail.jpg",
        "totalEnrollments": 150,
        "averageRating": 4.5,
        "totalRatings": 45,
        "createdBy": {
          "_id": "admin_id",
          "firstName": "Admin",
          "lastName": "User"
        },
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalCourses": 25,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 9. Update Course
**PUT** `/courses/:courseId`

Update course information.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Advanced JavaScript",
  "description": "Advanced JavaScript concepts",
  "price": 3999,
  "isActive": true,
  "isPublished": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Course updated successfully",
  "data": {
    "_id": "course_id",
    "title": "Advanced JavaScript",
    "description": "Advanced JavaScript concepts",
    "price": 3999,
    "isActive": true,
    "isPublished": true,
    "updatedAt": "2024-01-10T10:30:00.000Z"
  }
}
```

### 10. Create Batch
**POST** `/batches`

Create a new batch for a course.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Morning Batch",
  "description": "Morning session batch",
  "courseId": "course_id_here",
  "startDate": "2024-01-15",
  "endDate": "2024-03-15",
  "schedule": "[{\"day\": \"monday\", \"startTime\": \"09:00\", \"endTime\": \"11:00\", \"room\": \"Room 101\"}]",
  "maxStudents": 20,
  "batchPrice": 3999,
  "originalPrice": 4999
}
```

**Response:**
```json
{
  "success": true,
  "message": "Batch created successfully",
  "data": {
    "_id": "batch_id",
    "name": "Morning Batch",
    "description": "Morning session batch",
    "course": "course_id",
    "startDate": "2024-01-15T00:00:00.000Z",
    "endDate": "2024-03-15T00:00:00.000Z",
    "schedule": [
      {
        "day": "monday",
        "startTime": "09:00",
        "endTime": "11:00",
        "room": "Room 101"
      }
    ],
    "maxStudents": 20,
    "currentStudents": 0,
    "batchPrice": 3999,
    "originalPrice": 4999,
    "discountPercentage": 20,
    "status": "upcoming",
    "isActive": true,
    "createdBy": "admin_id",
    "createdAt": "2024-01-10T10:30:00.000Z"
  }
}
```

### 11. Get All Batches
**GET** `/batches`

Get list of all batches with optional filters.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): "upcoming", "active", "completed", "cancelled"
- `courseId` (optional): Filter by course ID
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Example:**
```
GET /batches?status=upcoming&courseId=course_id_here&page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "batches": [
      {
        "_id": "batch_id",
        "name": "Morning Batch",
        "description": "Morning session batch",
        "course": {
          "_id": "course_id",
          "title": "JavaScript Fundamentals",
          "courseType": "offline"
        },
        "startDate": "2024-01-15T00:00:00.000Z",
        "endDate": "2024-03-15T00:00:00.000Z",
        "maxStudents": 20,
        "currentStudents": 15,
        "batchPrice": 3999,
        "status": "upcoming",
        "isActive": true,
        "createdBy": {
          "_id": "admin_id",
          "firstName": "Admin",
          "lastName": "User"
        },
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalBatches": 15,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 12. Enroll Student in Offline Course
**POST** `/enroll-student`

Enroll a student in an offline course or batch.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "studentId": "student_id_here",
  "courseId": "course_id_here",
  "batchId": "batch_id_here",
  "paymentAmount": 3999,
  "paymentMethod": "cash"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Student enrolled successfully",
  "data": {
    "studentId": "STU20240001",
    "courseTitle": "JavaScript Fundamentals",
    "enrollmentDate": "2024-01-10T10:30:00.000Z"
  }
}
```

### 13. Create Marksheet
**POST** `/marksheets`

Create a marksheet for a student.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "studentId": "student_id_here",
  "courseId": "course_id_here",
  "marks": 85,
  "grade": "A"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Marksheet created successfully",
  "data": {
    "studentId": "STU20240001",
    "courseTitle": "JavaScript Fundamentals",
    "marks": 85,
    "grade": "A"
  }
}
```

### 14. Create Certificate
**POST** `/certificates`

Create a certificate for a student.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body:**
```
studentId: "student_id_here"
courseId: "course_id_here"
certificate: <file>
```

**Response:**
```json
{
  "success": true,
  "message": "Certificate created successfully",
  "data": {
    "studentId": "STU20240001",
    "courseTitle": "JavaScript Fundamentals",
    "certificateNumber": "CERT20240001"
  }
}
```

### 15. Get Dashboard Statistics
**GET** `/dashboard`

Get system dashboard statistics.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalStudents": 150,
    "activeStudents": 120,
    "kycStats": {
      "pending": 15,
      "submitted": 10,
      "approved": 100,
      "rejected": 5
    },
    "totalCourses": 25,
    "totalBatches": 15,
    "totalEnrollments": 200
  }
}
```

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
  "message": "Insufficient permissions."
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Student not found"
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

### Course Content
- **Course PDF**: PDF only (max 10MB)
- **Course Videos**: MP4, AVI, MOV, WMV (max 10MB)
- **Thumbnail**: JPG, JPEG, PNG, WEBP (max 10MB)
- **Banner**: JPG, JPEG, PNG, WEBP (max 10MB)

### Certificates
- **Certificate**: PDF, JPG, JPEG, PNG (max 10MB)

## Status Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **500**: Internal Server Error

## Admin Roles and Permissions

### Super Admin
- All permissions
- Can manage other admins
- Full system access

### Admin
- Most permissions except admin management
- Can manage students, courses, batches
- Can approve KYC and create academic records

### Moderator
- Limited permissions
- Can view reports and basic operations
- Cannot approve KYC or create academic records

## Password Access

**Important**: Admin routes that retrieve student data now include the hashed password field. This allows admins to:
- View student passwords for administrative purposes
- Reset student passwords if needed
- Access student account information for support

The password field is included in:
- `GET /students` - List all students with passwords
- `GET /students/:studentId` - Get specific student details with password 