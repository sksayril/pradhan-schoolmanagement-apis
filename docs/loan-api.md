# Loan Management System API Documentation

## Overview

The Loan Management System provides comprehensive loan management capabilities for society members, supporting four loan types: **GOLD**, **EDUCATION**, **PERSONAL**, and **EMERGENCY**. The system includes automatic EMI calculations, payment scheduling, and comprehensive admin management features.

## Loan Types

### 1. Gold Loan (GOLD)
- **Description**: Secured loan against gold ornaments, coins, or bars
- **Interest Rate**: 10% per annum (default)
- **Amount Range**: ₹1,000 - ₹10,00,000
- **Duration**: 1-120 months
- **Requirements**: Gold collateral details (type, weight, purity, estimated value)

### 2. Education Loan (EDUCATION)
- **Description**: Loan for educational purposes including courses and training
- **Interest Rate**: 8% per annum (default)
- **Amount Range**: ₹5,000 - ₹5,00,000
- **Duration**: 6-84 months
- **Requirements**: Institution details, course information, duration

### 3. Personal Loan (PERSONAL)
- **Description**: Unsecured loan for personal needs
- **Interest Rate**: 14% per annum (default)
- **Amount Range**: ₹10,000 - ₹5,00,000
- **Duration**: 12-60 months
- **Requirements**: Employment proof, income details, existing obligations

### 4. Emergency Loan (EMERGENCY)
- **Description**: Quick loan for emergency situations
- **Interest Rate**: 15% per annum (default)
- **Amount Range**: ₹1,000 - ₹1,00,000
- **Duration**: 3-24 months
- **Requirements**: Emergency type, urgency level, supporting documents

## Authentication

All loan endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Society Member Loan APIs

### 1. Apply for a Loan

**Endpoint**: `POST /api/loans/apply`

**Description**: Submit a new loan application

**Request Body**:
```json
{
  "loanType": "GOLD",
  "amount": 50000,
  "duration": 24,
  "purpose": "Business expansion",
  
  // Gold loan specific fields (required for GOLD loans)
  "collateralType": "GOLD_ORNAMENTS",
  "collateralWeight": 25.5,
  "collateralPurity": 91.6,
  "collateralEstimatedValue": 75000,
  
  // Education loan specific fields (required for EDUCATION loans)
  "institution": "ABC University",
  "course": "MBA in Finance",
  "courseDuration": "2 years",
  
  // Emergency loan specific fields (required for EMERGENCY loans)
  "emergencyType": "MEDICAL",
  "urgency": "HIGH",
  
  // Personal loan specific fields (required for PERSONAL loans)
  "employmentType": "SALARIED",
  "monthlyIncome": 45000,
  "existingObligations": 5000
}
```

**Response**:
```json
{
  "success": true,
  "message": "Loan application submitted successfully. It will be reviewed by admin.",
  "data": {
    "loanId": "LOAN202412001234",
    "loanType": "GOLD",
    "amount": 50000,
    "duration": 24,
    "purpose": "Business expansion",
    "status": "PENDING",
    "emiAmount": 2307.50,
    "totalAmount": 55380.00,
    "appliedAt": "2024-12-01T10:30:00.000Z"
  }
}
```

### 2. Get My Loans

**Endpoint**: `GET /api/loans/my-loans`

**Description**: Get all loans for the authenticated member

**Query Parameters**:
- `status` (optional): Filter by loan status
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response**:
```json
{
  "success": true,
  "data": {
    "loans": [
      {
        "loanId": "LOAN202412001234",
        "loanType": "GOLD",
        "amount": 50000,
        "duration": 24,
        "emiAmount": 2307.50,
        "totalAmount": 55380.00,
        "purpose": "Business expansion",
        "status": "ACTIVE",
        "startDate": "2024-12-01T00:00:00.000Z",
        "expectedEndDate": "2026-12-01T00:00:00.000Z",
        "currentBalance": 41512.50,
        "overdueAmount": 0,
        "totalLateFee": 0,
        "isOverdue": false,
        "nextPayment": {
          "installmentNumber": 19,
          "dueDate": "2025-07-01T00:00:00.000Z",
          "amount": 2307.50
        },
        "totalInstallments": 24,
        "paidInstallments": 18,
        "pendingInstallments": 6
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalLoans": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

### 3. Get Loan Details

**Endpoint**: `GET /api/loans/:loanId`

**Description**: Get detailed information about a specific loan

**Response**:
```json
{
  "success": true,
  "data": {
    "loanId": "LOAN202412001234",
    "loanType": "GOLD",
    "amount": 50000,
    "duration": 24,
    "emiAmount": 2307.50,
    "totalAmount": 55380.00,
    "purpose": "Business expansion",
    "status": "ACTIVE",
    "startDate": "2024-12-01T00:00:00.000Z",
    "expectedEndDate": "2026-12-01T00:00:00.000Z",
    "currentBalance": 41512.50,
    "overdueAmount": 0,
    "totalLateFee": 0,
    "isOverdue": false,
    "nextPayment": {
      "installmentNumber": 19,
      "dueDate": "2025-07-01T00:00:00.000Z",
      "amount": 2307.50
    },
    "totalInstallments": 24,
    "paidInstallments": 18,
    "pendingInstallments": 6
  }
}
```

## Admin Loan Management APIs

### 1. Get All Loans

**Endpoint**: `GET /api/admin/loans`

**Description**: Get all loans with filtering and pagination (admin only)

**Query Parameters**:
- `status`: Filter by loan status
- `loanType`: Filter by loan type
- `memberId`: Filter by member ID
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `sortBy`: Sort field (default: createdAt)
- `sortOrder`: Sort order (default: desc)

**Response**:
```json
{
  "success": true,
  "data": {
    "loans": [
      {
        "loanId": "LOAN202412001234",
        "loanType": "GOLD",
        "amount": 50000,
        "duration": 24,
        "emiAmount": 2307.50,
        "totalAmount": 55380.00,
        "purpose": "Business expansion",
        "status": "PENDING",
        "interestRate": 10,
        "totalInterest": 5380.00,
        "member": {
          "id": "member_id",
          "firstName": "John",
          "lastName": "Doe",
          "memberAccountNumber": "MEM2024000001",
          "email": "john@example.com",
          "phone": "9876543210"
        },
        "createdAt": "2024-12-01T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalLoans": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

### 2. Get Loan Details (Admin View)

**Endpoint**: `GET /api/admin/loans/:loanId`

**Description**: Get detailed loan information including sensitive data (admin only)

**Response**:
```json
{
  "success": true,
  "data": {
    "loanId": "LOAN202412001234",
    "loanType": "GOLD",
    "amount": 50000,
    "duration": 24,
    "emiAmount": 2307.50,
    "totalAmount": 55380.00,
    "purpose": "Business expansion",
    "status": "PENDING",
    "interestRate": 10,
    "totalInterest": 5380.00,
    "member": {
      "id": "member_id",
      "firstName": "John",
      "lastName": "Doe",
      "memberAccountNumber": "MEM2024000001",
      "email": "john@example.com",
      "phone": "9876543210",
      "address": {
        "street": "123 Main St",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400001"
      }
    },
    "collateral": {
      "type": "GOLD_ORNAMENTS",
      "weight": 25.5,
      "purity": 91.6,
      "estimatedValue": 75000
    },
    "documents": [],
    "notes": [],
    "createdAt": "2024-12-01T10:30:00.000Z"
  }
}
```

### 3. Approve Loan

**Endpoint**: `POST /api/admin/loans/:loanId/approve`

**Description**: Approve a pending loan application (admin only)

**Request Body**:
```json
{
  "startDate": "2024-12-01",
  "notes": "Loan approved after document verification"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Loan approved successfully",
  "data": {
    "loanId": "LOAN202412001234",
    "status": "APPROVED",
    "startDate": "2024-12-01T00:00:00.000Z",
    "expectedEndDate": "2026-12-01T00:00:00.000Z",
    "emiAmount": 2307.50,
    "totalAmount": 55380.00,
    "approvedBy": "admin_id",
    "approvedAt": "2024-12-01T12:00:00.000Z"
  }
}
```

### 4. Reject Loan

**Endpoint**: `POST /api/admin/loans/:loanId/reject`

**Description**: Reject a pending loan application (admin only)

**Request Body**:
```json
{
  "reason": "Insufficient income proof",
  "notes": "Member needs to provide additional income documents"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Loan rejected successfully",
  "data": {
    "loanId": "LOAN202412001234",
    "status": "REJECTED",
    "rejectionReason": "Insufficient income proof",
    "rejectedAt": "2024-12-01T12:00:00.000Z"
  }
}
```

### 5. Activate Loan

**Endpoint**: `POST /api/admin/loans/:loanId/activate`

**Description**: Activate an approved loan (admin only)

**Response**:
```json
{
  "success": true,
  "message": "Loan activated successfully",
  "data": {
    "loanId": "LOAN202412001234",
    "status": "ACTIVE",
    "startDate": "2024-12-01T00:00:00.000Z",
    "expectedEndDate": "2026-12-01T00:00:00.000Z",
    "activatedAt": "2024-12-01T12:00:00.000Z"
  }
}
```

### 6. Update Interest Rate

**Endpoint**: `PUT /api/admin/loans/:loanId/interest-rate`

**Description**: Update the interest rate for a loan (admin only)

**Request Body**:
```json
{
  "interestRate": 12,
  "notes": "Rate updated based on member's credit score"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Interest rate updated successfully",
  "data": {
    "loanId": "LOAN202412001234",
    "interestRate": 12,
    "emiAmount": 2352.50,
    "totalAmount": 56460.00,
    "updatedAt": "2024-12-01T12:00:00.000Z"
  }
}





## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

For validation errors:
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    "Amount must be between ₹1,000 and ₹10,00,000",
    "Duration must be between 1 and 120 months"
  ]
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Loan Status Flow

1. **PENDING** - Loan application submitted, awaiting admin review
2. **APPROVED** - Loan approved by admin, start date set
3. **ACTIVE** - Loan activated, payments can be recorded
4. **COMPLETED** - All installments paid
5. **REJECTED** - Loan application rejected
6. **DEFAULTED** - Loan marked as defaulted due to non-payment
7. **CANCELLED** - Loan application cancelled by member

## EMI Calculation

The system automatically calculates EMI using the formula:

```
EMI = P × r × (1 + r)^n / ((1 + r)^n - 1)
```

Where:
- P = Principal amount
- r = Monthly interest rate (annual rate ÷ 12 ÷ 100)
- n = Total number of months

## Payment Methods

- **CASH** - Cash payment
- **UPI** - UPI transfer
- **RAZORPAY** - Online payment gateway
- **BANK_TRANSFER** - Bank transfer

## Security Features

- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- Comprehensive error handling
- Audit trail for all actions

## Rate Limits

- Member endpoints: 100 requests per 15 minutes
- Admin endpoints: 200 requests per 15 minutes

## Support

For technical support or questions about the loan API, please contact the development team.
