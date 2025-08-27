# Admin API Documentation

## Overview
This document describes the API endpoints available for administrators to manage the system.

## Base URL
```
http://localhost:3500/api/admin
```

## Authentication
All endpoints require authentication using JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Permissions
Different endpoints require different permissions. The available permissions are:
- `manage_students` - Manage student accounts and KYC
- `manage_courses` - Create and manage courses
- `manage_batches` - Create and manage course batches
- `manage_payments` - Handle payment requests
- `manage_kyc` - Approve/reject KYC documents
- `manage_marksheets` - Create and manage student marksheets
- `manage_certificates` - Create and manage student certificates
- `manage_loans` - Manage loan applications
- `manage_society_members` - Manage society member accounts and documents
- `view_reports` - Access system reports and analytics
- `manage_admins` - Manage other admin accounts

## Endpoints

### 1. Admin Registration
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
  "permissions": ["manage_students", "manage_courses"]
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
      "adminId": "ADM2024000001",
      "firstName": "Admin",
      "lastName": "User",
      "email": "admin@example.com",
      "role": "admin",
      "permissions": ["manage_students", "manage_courses"]
    },
    "token": "jwt_token_here"
  }
}
```

### 2. Admin Login
**POST** `/login`
Authenticate an admin account.

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
      "adminId": "ADM2024000001",
      "firstName": "Admin",
      "lastName": "User",
      "email": "admin@example.com",
      "role": "admin",
      "permissions": ["manage_students", "manage_courses"]
    },
    "token": "jwt_token"
  }
}
```

### 3. Get Admin Profile
**GET** `/profile`
Get the admin's profile information.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "admin_id",
    "adminId": "ADM2024000001",
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@example.com",
    "phone": "9876543210",
    "role": "admin",
    "permissions": ["manage_students", "manage_courses"],
    "isActive": true,
    "lastLogin": "2024-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 4. Update Admin Profile
**PUT** `/profile`
Update the admin's profile information.

**Request Body:**
```json
{
  "firstName": "Admin",
  "lastName": "User",
  "phone": "9876543210"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "admin_id",
    "firstName": "Admin",
    "lastName": "User",
    "phone": "9876543210"
  }
}
```

### 5. Get All Students
**GET** `/students`
Get a list of all students with pagination and filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by account status
- `kycStatus` (optional): Filter by KYC status
- `search` (optional): Search by name or email

**Response:**
```json
{
  "success": true,
  "data": {
    "students": [
      {
        "id": "student_id",
        "studentId": "STU2024000001",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "phone": "9876543210",
        "kycStatus": "approved",
        "isKycApproved": true,
        "isAccountActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalStudents": 50,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 6. Get Student Details
**GET** `/students/:studentId`
Get detailed information about a specific student.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "student_id",
    "studentId": "STU2024000001",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "dateOfBirth": "1990-01-01T00:00:00.000Z",
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
    "enrollments": [],
    "certificates": [],
    "marksheets": [],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 7. Approve Student KYC
**POST** `/students/:studentId/kyc/approve`
Approve a student's KYC documents.

**Request Body:**
```json
{
  "notes": "KYC documents verified successfully"
}
```

**Response:**
```json
{
  "success": true,
  "message": "KYC approved successfully",
  "data": {
    "studentId": "STU2024000001",
    "kycStatus": "approved",
    "isKycApproved": true,
    "approvedBy": "admin_id",
    "approvedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 8. Reject Student KYC
**POST** `/students/:studentId/kyc/reject`
Reject a student's KYC documents.

**Request Body:**
```json
{
  "reason": "Documents are unclear",
  "notes": "Please upload clear copies"
}
```

**Response:**
```json
{
  "success": true,
  "message": "KYC rejected successfully",
  "data": {
    "studentId": "STU2024000001",
    "kycStatus": "rejected",
    "kycRejectionReason": "Documents are unclear",
    "rejectedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 9. Reset Student Password
**POST** `/students/:studentId/reset-password`
Reset a student's password.

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
  "message": "Password reset successfully",
  "data": {
    "studentId": "STU2024000001",
    "newPassword": "newpassword123"
  }
}
```

### 10. Create Course
**POST** `/courses`
Create a new course.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Authentication: Required
- Permission: `manage_courses`

**Form Data:**
- `title`: Course title
- `description`: Course description
- `shortDescription`: Short course description
- `courseType`: "online" or "offline"
- `category`: Course category
- `subcategory`: Course subcategory
- `duration`: Course duration in hours
- `level`: "beginner", "intermediate", or "advanced"
- `language`: Course language
- `price`: Course price
- `originalPrice`: Original course price
- `syllabus`: JSON string of course syllabus
- `prerequisites`: JSON array of prerequisites
- `learningOutcomes`: JSON array of learning outcomes
- `coursePdf`: Course PDF file (optional)
- `courseVideo`: Course video files (optional)
- `thumbnail`: Course thumbnail image (optional)
- `banner`: Course banner image (optional)

**Response:**
```json
{
  "success": true,
  "message": "Course created successfully",
  "data": {
    "courseId": "CRS2024000001",
    "title": "JavaScript Fundamentals",
    "price": 2999,
    "createdBy": "admin_id"
  }
}
```

### 11. Get All Courses
**GET** `/courses`
Get a list of all courses.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by course status
- `category` (optional): Filter by category
- `search` (optional): Search by title or description

**Response:**
```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "id": "course_id",
        "courseId": "CRS2024000001",
        "title": "JavaScript Fundamentals",
        "description": "Learn JavaScript from scratch",
        "courseType": "online",
        "category": "programming",
        "price": 2999,
        "originalPrice": 3999,
        "isActive": true,
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

### 12. Update Course
**PUT** `/courses/:courseId`
Update an existing course.

**Request Body:**
```json
{
  "title": "Updated JavaScript Fundamentals",
  "price": 3499,
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Course updated successfully",
  "data": {
    "courseId": "CRS2024000001",
    "title": "Updated JavaScript Fundamentals",
    "price": 3499
  }
}
```

### 13. Create Batch
**POST** `/batches`
Create a new course batch.

**Request Body:**
```json
{
  "name": "Morning Batch",
  "description": "Morning session for JavaScript course",
  "course": "course_id",
  "startDate": "2024-02-01",
  "endDate": "2024-04-01",
  "schedule": [
    {
      "day": "monday",
      "startTime": "09:00",
      "endTime": "11:00",
      "room": "Room 101"
    }
  ],
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
    "batchId": "BAT2024000001",
    "name": "Morning Batch",
    "course": "course_id",
    "createdBy": "admin_id"
  }
}
```

### 14. Get All Batches
**GET** `/batches`
Get a list of all batches.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `course` (optional): Filter by course ID
- `status` (optional): Filter by batch status

**Response:**
```json
{
  "success": true,
  "data": {
    "batches": [
      {
        "id": "batch_id",
        "batchId": "BAT2024000001",
        "name": "Morning Batch",
        "description": "Morning session for JavaScript course",
        "course": {
          "id": "course_id",
          "title": "JavaScript Fundamentals"
        },
        "startDate": "2024-02-01T00:00:00.000Z",
        "endDate": "2024-04-01T00:00:00.000Z",
        "maxStudents": 20,
        "batchPrice": 3999,
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

### 15. Enroll Student in Offline Course
**POST** `/students/:studentId/enroll-offline`
Enroll a student in an offline course batch.

**Request Body:**
```json
{
  "batch": "batch_id",
  "enrollmentDate": "2024-01-01",
  "paymentMethod": "cash",
  "amount": 3999
}
```

**Response:**
```json
{
  "success": true,
  "message": "Student enrolled successfully",
  "data": {
    "studentId": "STU2024000001",
    "batchId": "BAT2024000001",
    "enrollmentDate": "2024-01-01T00:00:00.000Z",
    "status": "enrolled"
  }
}
```

### 16. Create Marksheet
**POST** `/students/:studentId/marksheets`
Create a marksheet for a student.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Authentication: Required
- Permission: `manage_marksheets`

**Form Data:**
- `course`: Course ID
- `semester`: Semester number
- `totalMarks`: Total marks
- `obtainedMarks`: Obtained marks
- `grade`: Grade (A, B, C, D, F)
- `marksheet`: Marksheet file (PDF/Image)

**Response:**
```json
{
  "success": true,
  "message": "Marksheet created successfully",
  "data": {
    "studentId": "STU2024000001",
    "courseTitle": "JavaScript Fundamentals",
    "semester": 1,
    "grade": "A"
  }
}
```

### 17. Create Certificate
**POST** `/students/:studentId/certificates`
Create a certificate for a student.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Authentication: Required
- Permission: `manage_certificates`

**Form Data:**
- `course`: Course ID
- `certificate`: Certificate file (PDF/Image)

**Response:**
```json
{
  "success": true,
  "message": "Certificate created successfully",
  "data": {
    "studentId": "STU2024000001",
    "courseTitle": "JavaScript Fundamentals",
    "certificateNumber": "CERT123456789"
  }
}
```

### 18. Get Dashboard Statistics
**GET** `/dashboard`
Get system dashboard statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalStudents": 150,
    "activeStudents": 120,
    "kycStats": {
      "pending": 15,
      "submitted": 25,
      "approved": 100,
      "rejected": 10
    },
    "totalCourses": 25,
    "totalBatches": 30,
    "totalEnrollments": 200
  }
}
```

## Society Member Management

### 19. Get Society Member Bank Documents
**GET** `/society-members/:memberId/bank-documents`
Get bank documents for a specific society member.

**Permission Required:** `manage_society_members`

**Response:**
```json
{
  "success": true,
  "data": {
    "member": {
      "id": "member_id",
      "firstName": "John",
      "lastName": "Doe",
      "memberAccountNumber": "MEM2024000001",
      "email": "john@example.com"
    },
    "bankDocuments": {
      "accountStatement": "/uploads/bank-documents/statement-123.pdf",
      "passbook": "/uploads/bank-documents/passbook-123.jpg",
      "uploadedAt": "2024-01-01T00:00:00.000Z",
      "hasDocuments": true
    }
  }
}
```

### 20. Get All Society Members Bank Documents Status
**GET** `/society-members/bank-documents-status`
Get bank document status for all society members with pagination and filtering.

**Permission Required:** `manage_society_members`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `hasDocuments` (optional): Filter by document status ("true" or "false")

**Response:**
```json
{
  "success": true,
  "data": {
    "members": [
      {
        "id": "member_id",
        "firstName": "John",
        "lastName": "Doe",
        "memberAccountNumber": "MEM2024000001",
        "email": "john@example.com",
        "bankDocuments": {
          "hasAccountStatement": true,
          "hasPassbook": false,
          "uploadedAt": "2024-01-01T00:00:00.000Z",
          "hasAnyDocument": true
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalMembers": 50,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## Error Responses

### Validation Error
```json
{
  "success": false,
  "message": "Validation error message"
}
```

### Authentication Error
```json
{
  "success": false,
  "message": "Authentication required"
}
```

### Permission Error
```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

### Not Found Error
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

## File Upload Requirements

### Supported File Types
- **Images**: JPEG, JPG, PNG, WebP
- **Documents**: PDF
- **Videos**: MP4, AVI, MOV, WMV

### File Size Limits
- Maximum file size: 10MB per file
- Maximum files per request: 5

### File Naming
Files are automatically renamed with unique timestamps to prevent conflicts.

## Notes

1. **Permissions**: Different admin roles have different access levels based on their permissions.
2. **File Storage**: Uploaded files are stored in the `uploads/` directory with organized subdirectories.
3. **Security**: All endpoints require valid JWT authentication and appropriate permissions.
4. **Validation**: Input validation is performed on both client and server side.
5. **Error Handling**: Comprehensive error handling with meaningful error messages.
6. **Pagination**: List endpoints support pagination for better performance.
7. **File Management**: Admin can view and manage all uploaded files including bank documents. 