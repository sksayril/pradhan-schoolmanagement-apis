# Society Management API Documentation

## Overview
This API provides comprehensive society management functionality including member registration, KYC verification, agent management, and administrative controls.

## Base URL
```
http://localhost:3500/api/society-member/signup
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## Society Member APIs

### 1. Society Member Signup
**POST** `/society-member/signup`

Register a new society member with optional agent code.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "9876543210",
  "dateOfBirth": "1990-01-01",
  "gender": "male",
  "address": {
    "street": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  },
  "password": "password123",
  "agentCode": "AGENT001", // Optional
  "emergencyContact": {
    "name": "Jane Doe",
    "relationship": "Spouse",
    "phone": "9876543211"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Society member registered successfully. Please complete KYC to access full features.",
  "data": {
    "member": {
      "id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "memberAccountNumber": "MEM2024000001",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "agentCode": "AGENT001",
      "referralCode": "REFMEM2024000001",
      "kycStatus": "pending",
      "isKycApproved": false,
      "isAccountActive": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Society Member Login
**POST** `/society-member/login`

Authenticate society member using either email or member account number and get access token.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "password123"
}
```

**OR**

```json
{
  "memberAccountNumber": "MEM2024000001",
  "password": "password123"
}
```

**Note:** You can use either `email` or `memberAccountNumber` for login. Both fields are optional, but at least one must be provided along with the password.

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "member": {
      "id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "memberAccountNumber": "MEM2024000001",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "agentCode": "AGENT001",
      "referralCode": "REFMEM2024000001",
      "kycStatus": "pending",
      "isKycApproved": false,
      "isAccountActive": true,
      "membershipStatus": "active"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Upload KYC Documents
**POST** `/society-member/kyc-upload`

Upload KYC documents (Aadhar, PAN, Profile Photo).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
```
aadharNumber: "123456789012"
panNumber: "ABCDE1234F"
aadharDocument: [file]
panDocument: [file]
profilePhoto: [file]
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
**GET** `/society-member/kyc-status`

Get current KYC status and details.

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

### 5. Get Member Profile
**GET** `/society-member/profile`

Get complete member profile information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "memberAccountNumber": "MEM2024000001",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "9876543210",
    "dateOfBirth": "1990-01-01T00:00:00.000Z",
    "gender": "male",
    "address": {
      "street": "123 Main Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001"
    },
    "agentCode": "AGENT001",
    "referralCode": "REFMEM2024000001",
    "referredBy": null,
    "kycStatus": "submitted",
    "isKycApproved": false,
    "membershipType": "basic",
    "membershipStartDate": "2024-01-01T00:00:00.000Z",
    "isMembershipActive": true,
    "monthlyContribution": 0,
    "totalContribution": 0,
    "emergencyContact": {
      "name": "Jane Doe",
      "relationship": "Spouse",
      "phone": "9876543211"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 6. Update Member Profile
**PUT** `/society-member/profile`

Update member profile information.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "firstName": "John Updated",
  "lastName": "Doe Updated",
  "phone": "9876543212",
  "address": {
    "street": "456 New Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400002"
  },
  "emergencyContact": {
    "name": "Jane Doe Updated",
    "relationship": "Spouse",
    "phone": "9876543213"
  }
}
```

### 7. Get Membership Details
**GET** `/society-member/membership`

Get membership information (requires KYC approval).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "membershipType": "basic",
    "membershipStartDate": "2024-01-01T00:00:00.000Z",
    "membershipEndDate": null,
    "isMembershipActive": true,
    "monthlyContribution": 500,
    "totalContribution": 1500,
    "lastContributionDate": "2024-03-01T00:00:00.000Z",
    "membershipStatus": "active",
    "isMembershipValid": true
  }
}
```

### 8. Get Referral Information
**GET** `/society-member/referrals`

Get referral details and referred members (requires KYC approval).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "referralCode": "REFMEM2024000001",
    "agentCode": "AGENT001",
    "referredBy": null,
    "referredMembers": [
      {
        "firstName": "Alice",
        "lastName": "Smith",
        "memberAccountNumber": "MEM2024000002",
        "createdAt": "2024-02-01T00:00:00.000Z",
        "isKycApproved": true
      }
    ]
  }
}
```

### 9. Validate Agent Code
**POST** `/society-member/validate-agent-code`

Validate an agent code before signup.

**Request Body:**
```json
{
  "agentCode": "AGENT001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Agent code is valid",
  "data": {
    "agentName": "John Agent",
    "agentCode": "AGENT001",
    "isVerified": true
  }
}
```

### 10. Get Available Agent Codes
**GET** `/society-member/agent-codes`

Get list of all active and verified agent codes.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "agentCode": "AGENT001",
      "agentName": "John Agent",
      "phone": "9876543210"
    },
    {
      "agentCode": "AGENT002",
      "agentName": "Jane Agent",
      "phone": "9876543211"
    }
  ]
}
```

### 11. Change Password
**PUT** `/society-member/change-password`

Change member password.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

### 12. Logout
**POST** `/society-member/logout`

Logout member (client-side token removal).

**Headers:**
```
Authorization: Bearer <token>
```

---
****************************************ADMIN SOCITY*************************************************
## Admin Society Management APIs

### 1. Admin Login
**POST** `/admin-society/login`

Authenticate admin and get access token.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "adminpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "admin": {
      "id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "adminId": "ADM2024000001",
      "firstName": "Admin",
      "lastName": "User",
      "email": "admin@example.com",
      "role": "admin",
      "permissions": ["manage_students", "manage_kyc", "view_reports"],
      "isActive": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Get All Society Members
**GET** `/admin-society/members`

Get paginated list of all society members with filters.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `status` (string): Filter by account status ("active" or "inactive")
- `kycStatus` (string): Filter by KYC status ("pending", "submitted", "approved", "rejected")
- `agentCode` (string): Filter by agent code
- `search` (string): Search by name, email, or member account number

**Response:**
```json
{
  "success": true,
  "data": {
    "members": [
      {
        "id": "60f7b3b3b3b3b3b3b3b3b3b3",
        "memberAccountNumber": "MEM2024000001",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "phone": "9876543210",
        "kycStatus": "approved",
        "isKycApproved": true,
        "membershipType": "basic",
        "isAccountActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "referredBy": null
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

### 3. Get Member Details
**GET** `/admin-society/members/:memberId`

Get detailed information about a specific member.

**Headers:**
```
Authorization: Bearer <admin_token>
```

### 4. Approve/Reject KYC
**PUT** `/admin-society/members/:memberId/kyc`

Approve or reject member KYC documents.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "action": "approve" // or "reject"
}
```

For rejection:
```json
{
  "action": "reject",
  "rejectionReason": "Documents are not clear. Please upload better quality images."
}
```

### 5. Update Society Member
**PUT** `/admin-society/members/:memberId`

Update member information by admin.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "firstName": "John Updated",
  "lastName": "Doe Updated",
  "phone": "9876543212",
  "membershipType": "premium",
  "monthlyContribution": 1000,
  "isAccountActive": true,
  "isMembershipActive": true
}
```

### 6. Get Pending KYC Requests
**GET** `/admin-society/kyc/pending`

Get all pending KYC approval requests.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)

### 7. Create Agent
**POST** `/admin-society/agents`

Create a new agent with documents.

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
```
agentCode: "AGENT001"
agentName: "John Agent"
phone: "9876543210"
email: "agent@example.com"
address[street]: "123 Agent Street"
address[city]: "Mumbai"
address[state]: "Maharashtra"
address[pincode]: "400001"
commissionRate: "5"
idProof: [file]
addressProof: [file]
agentProfilePhoto: [file]
```

### 8. Get All Agents
**GET** `/admin-society/agents`

Get paginated list of all agents.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `status` (string): Filter by status ("active" or "inactive")
- `search` (string): Search by name, code, or email

### 9. Get Agent Details
**GET** `/admin-society/agents/:agentId`

Get detailed information about a specific agent including referred members.

**Headers:**
```
Authorization: Bearer <admin_token>
```

### 10. Update Agent
**PUT** `/admin-society/agents/:agentId`

Update agent information.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "agentName": "John Agent Updated",
  "phone": "9876543212",
  "email": "agent.updated@example.com",
  "commissionRate": 7,
  "isActive": true,
  "isVerified": true
}
```

### 11. Get Dashboard Stats
**GET** `/admin-society/dashboard`

Get society management dashboard statistics.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalMembers": 150,
    "activeMembers": 145,
    "kycApprovedMembers": 140,
    "pendingKyc": 10,
    "totalAgents": 25,
    "activeAgents": 23,
    "monthlyRegistrations": [
      {
        "_id": {
          "year": 2024,
          "month": 1
        },
        "count": 15
      },
      {
        "_id": {
          "year": 2024,
          "month": 2
        },
        "count": 20
      }
    ]
  }
}
```

### 12. Get Agent Performance Report
**GET** `/admin-society/reports/agent-performance`

Get detailed agent performance report.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "agentCode": "AGENT001",
      "agentName": "John Agent",
      "totalReferrals": 15,
      "activeReferrals": 12,
      "totalCommission": 7500,
      "commissionRate": 5,
      "referredMembers": [
        {
          "firstName": "Alice",
          "lastName": "Smith",
          "memberAccountNumber": "MEM2024000001",
          "createdAt": "2024-01-01T00:00:00.000Z",
          "isKycApproved": true
        }
      ]
    }
  ]
}
```

### 13. Get KYC Status Report
**GET** `/admin-society/reports/kyc-status`

Get KYC status statistics and trends.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "kycStats": [
      {
        "_id": "approved",
        "count": 140
      },
      {
        "_id": "pending",
        "count": 5
      },
      {
        "_id": "submitted",
        "count": 10
      },
      {
        "_id": "rejected",
        "count": 5
      }
    ],
    "kycByMonth": [
      {
        "_id": {
          "year": 2024,
          "month": 1
        },
        "count": 25
      }
    ]
  }
}
```

---

## Error Responses

All endpoints return consistent error responses:

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
  "message": "Society member not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## File Upload Guidelines

### Supported File Types
- **Images**: JPEG, JPG, PNG, WebP
- **Documents**: PDF, JPEG, JPG, PNG
- **Videos**: MP4, AVI, MOV, WMV

### File Size Limits
- Maximum file size: 10MB per file
- Maximum files per request: 5

### Upload Directories
- KYC Documents: `/uploads/kyc/`
- Profile Photos: `/uploads/profiles/`
- Agent Documents: `/uploads/agents/`
- Course Materials: `/uploads/courses/`
- Certificates: `/uploads/certificates/`
- Marksheets: `/uploads/marksheets/`

---

## Security Features

1. **JWT Authentication**: All protected endpoints require valid JWT tokens
2. **Role-based Access**: Different permissions for different admin roles
3. **Input Validation**: Comprehensive validation for all inputs
4. **File Type Validation**: Strict file type checking for uploads
5. **Rate Limiting**: Protection against brute force attacks
6. **CORS Protection**: Cross-origin request protection
7. **Helmet Security**: Additional security headers

---

## Rate Limits

- Default: 100 requests per 15 minutes per IP
- Login endpoints: 5 requests per 15 minutes per IP
- File uploads: 10 requests per 15 minutes per IP

---

## Environment Variables

Required environment variables:

```env
JWT_SECRET=your_jwt_secret_key
MONGODB_URI=your_mongodb_connection_string
PORT=3000
NODE_ENV=development
```

---

## Testing

### Test Agent Code Validation
```bash
curl -X POST http://localhost:3000/api/society-member/validate-agent-code \
  -H "Content-Type: application/json" \
  -d '{"agentCode": "AGENT001"}'
```

### Test Member Signup
```bash
curl -X POST http://localhost:3000/api/society-member/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "phone": "9876543210",
    "dateOfBirth": "1990-01-01",
    "gender": "male",
    "address": {
      "street": "123 Test Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001"
    },
    "password": "password123",
    "emergencyContact": {
      "name": "Emergency Contact",
      "relationship": "Spouse",
      "phone": "9876543211"
    }
  }'
```

### Test Admin Login
```bash
curl -X POST http://localhost:3000/api/admin-society/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "adminpassword123"
  }'
```

## Bank Document Management

### 13. Upload Bank Document
**POST** `/upload-bank-document`
Upload bank account statement or passbook photo.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Authentication: Required

**Form Data:**
- `bankDocument`: Bank document file (PDF/Image)
- `documentType`: Either "accountStatement" or "passbook"

**Response:**
```json
{
  "success": true,
  "message": "Account Statement uploaded successfully",
  "data": {
    "documentType": "accountStatement",
    "documentPath": "/uploads/bank-documents/statement-123.pdf",
    "uploadedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 14. Get Bank Documents
**GET** `/bank-documents`
Get the member's uploaded bank documents.

**Response:**
```json
{
  "success": true,
  "data": {
    "accountStatement": "/uploads/bank-documents/statement-123.pdf",
    "passbook": "/uploads/bank-documents/passbook-123.jpg",
    "uploadedAt": "2024-01-01T00:00:00.000Z",
    "hasDocuments": true
  }
}
```

### 15. Delete Bank Document
**DELETE** `/bank-documents/:documentType`
Delete a specific bank document.

**Parameters:**
- `documentType`: Either "accountStatement" or "passbook"

**Response:**
```json
{
  "success": true,
  "message": "Account Statement removed successfully"
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

### File Size Limits
- Maximum file size: 10MB per file
- Maximum files per request: 5

### File Naming
Files are automatically renamed with unique timestamps to prevent conflicts.

## Notes

1. **KYC Completion**: Members must complete KYC to access certain features.
2. **File Storage**: Uploaded files are stored in the `uploads/` directory with organized subdirectories.
3. **Security**: All sensitive endpoints require valid JWT authentication.
4. **Validation**: Input validation is performed on both client and server side.
5. **Error Handling**: Comprehensive error handling with meaningful error messages.
