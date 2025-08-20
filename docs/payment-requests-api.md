# Payment Requests API Documentation

## Overview

The Payment Requests API provides comprehensive functionality for managing society member payments with RD (Recurring Deposit), FD (Fixed Deposit), OD (Overdraft), and CD (Current Deposit) options. The system supports multiple payment methods including UPI, Razorpay, and Cash payments.

## Base URL
```
/api/payment-requests
```

## Authentication
All endpoints require authentication using JWT tokens in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## Admin Routes

### 1. Create Payment Request
**POST** `/admin/create`

Creates a new payment request for a society member.

**Request Body:**
```json
{
  "societyMemberId": "507f1f77bcf86cd799439011",
  "paymentType": "RD",
  "amount": 5000,
  "interestRate": 8.5,
  "paymentMethod": "RAZORPAY",
  "dueDate": "2024-02-15T00:00:00.000Z",
  "description": "Monthly RD contribution",
  "duration": 12,
  "recurringDetails": {
    "frequency": "MONTHLY",
    "totalInstallments": 12
  }
}
```

**Payment Type Options:**
- `RD` - Recurring Deposit (requires duration and recurringDetails)
- `FD` - Fixed Deposit (requires duration)
- `OD` - Overdraft
- `CD` - Current Deposit

**Payment Method Options:**
- `UPI` - UPI payment
- `RAZORPAY` - Online payment via Razorpay
- `CASH` - Cash payment

**Response:**
```json
{
  "success": true,
  "message": "Payment request created successfully",
  "data": {
    "requestId": "PR202412001234",
    "paymentType": "RD",
    "amount": 5000,
    "interestRate": 8.5,
    "totalAmount": 5000,
    "dueDate": "2024-02-15T00:00:00.000Z",
    "status": "PENDING",
    "paymentMethod": "RAZORPAY",
    "description": "Monthly RD contribution",
    "maturityDate": "2025-01-15T00:00:00.000Z",
    "duration": 12,
    "recurringDetails": {
      "frequency": "MONTHLY",
      "nextDueDate": "2024-03-15T00:00:00.000Z",
      "installmentsPaid": 0,
      "totalInstallments": 12
    }
  }
}
```

### 2. Get All Payment Requests
**GET** `/admin/requests`

Retrieves all payment requests with pagination and filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (PENDING, PAID, FAILED, CANCELLED)
- `paymentType` (optional): Filter by payment type (RD, FD, OD, CD)
- `societyMemberId` (optional): Filter by society member ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "requestId": "PR202412001234",
      "paymentType": "RD",
      "amount": 5000,
      "interestRate": 8.5,
      "totalAmount": 5000,
      "dueDate": "2024-02-15T00:00:00.000Z",
      "status": "PENDING",
      "paymentMethod": "RAZORPAY",
      "description": "Monthly RD contribution",
      "societyMember": {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "phone": "9876543210",
        "memberAccountNumber": "MEM2024000001"
      },
      "createdBy": {
        "firstName": "Admin",
        "lastName": "User",
        "email": "admin@example.com"
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10
  }
}
```

### 3. Get Payment Request by ID
**GET** `/admin/requests/:requestId`

Retrieves a specific payment request by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "requestId": "PR202412001234",
    "paymentType": "RD",
    "amount": 5000,
    "interestRate": 8.5,
    "totalAmount": 5000,
    "dueDate": "2024-02-15T00:00:00.000Z",
    "status": "PENDING",
    "paymentMethod": "RAZORPAY",
    "description": "Monthly RD contribution",
    "paymentDetails": {
      "transactionId": null,
      "paymentDate": null,
      "razorpayOrderId": null,
      "razorpayPaymentId": null,
      "upiTransactionId": null,
      "cashReceiptNumber": null,
      "receivedBy": null
    },
    "societyMember": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "9876543210",
      "memberAccountNumber": "MEM2024000001"
    },
    "createdBy": {
      "firstName": "Admin",
      "lastName": "User",
      "email": "admin@example.com"
    }
  }
}
```

### 4. Update Payment Request
**PUT** `/admin/requests/:requestId`

Updates an existing payment request.

**Request Body:**
```json
{
  "amount": 6000,
  "interestRate": 9.0,
  "dueDate": "2024-02-20T00:00:00.000Z",
  "description": "Updated monthly RD contribution",
  "status": "PENDING"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment request updated successfully",
  "data": {
    "requestId": "PR202412001234",
    "paymentType": "RD",
    "amount": 6000,
    "interestRate": 9.0,
    "totalAmount": 6000,
    "dueDate": "2024-02-20T00:00:00.000Z",
    "status": "PENDING",
    "paymentMethod": "RAZORPAY",
    "description": "Updated monthly RD contribution"
  }
}
```

### 5. Mark Payment as Received
**POST** `/admin/requests/:requestId/mark-paid`

Marks a payment request as paid and records payment details.

**Request Body:**
```json
{
  "paymentMethod": "CASH",
  "transactionId": "TXN123456789",
  "cashReceiptNumber": "CR001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment marked as received successfully",
  "data": {
    "requestId": "PR202412001234",
    "status": "PAID",
    "paidAt": "2024-02-15T10:30:00.000Z",
    "paymentDetails": {
      "transactionId": "TXN123456789",
      "paymentDate": "2024-02-15T10:30:00.000Z",
      "receivedBy": "507f1f77bcf86cd799439012",
      "cashReceiptNumber": "CR001"
    }
  }
}
```

### 6. Get Payment Statistics
**GET** `/admin/statistics`

Retrieves payment statistics and analytics.

**Query Parameters:**
- `startDate` (optional): Start date for filtering (ISO format)
- `endDate` (optional): End date for filtering (ISO format)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRequests": 150,
    "pendingRequests": 45,
    "paidRequests": 100,
    "totalAmount": 750000,
    "paymentTypeStats": [
      {
        "_id": "RD",
        "count": 80,
        "totalAmount": 400000
      },
      {
        "_id": "FD",
        "count": 40,
        "totalAmount": 250000
      },
      {
        "_id": "OD",
        "count": 20,
        "totalAmount": 80000
      },
      {
        "_id": "CD",
        "count": 10,
        "totalAmount": 20000
      }
    ]
  }
}
```

---

## Society Member Routes

### 1. Get Member's Payment Requests
**GET** `/member/requests`

Retrieves payment requests for the authenticated society member.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (PENDING, PAID, FAILED, CANCELLED)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "requestId": "PR202412001234",
      "paymentType": "RD",
      "amount": 5000,
      "totalAmount": 5000,
      "dueDate": "2024-02-15T00:00:00.000Z",
      "status": "PENDING",
      "paymentMethod": "RAZORPAY",
      "description": "Monthly RD contribution",
      "isOverdue": false,
      "lateFee": 0,
      "maturityDate": "2025-01-15T00:00:00.000Z",
      "duration": 12,
      "recurringDetails": {
        "frequency": "MONTHLY",
        "nextDueDate": "2024-03-15T00:00:00.000Z",
        "installmentsPaid": 0,
        "totalInstallments": 12
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 25,
    "itemsPerPage": 10
  }
}
```

### 2. Get Member's Payment Request by ID
**GET** `/member/requests/:requestId`

Retrieves a specific payment request for the authenticated member.

**Response:**
```json
{
  "success": true,
  "data": {
    "requestId": "PR202412001234",
    "paymentType": "RD",
    "amount": 5000,
    "totalAmount": 5000,
    "dueDate": "2024-02-15T00:00:00.000Z",
    "status": "PENDING",
    "paymentMethod": "RAZORPAY",
    "description": "Monthly RD contribution",
    "isOverdue": false,
    "lateFee": 0,
    "maturityDate": "2025-01-15T00:00:00.000Z",
    "duration": 12,
    "recurringDetails": {
      "frequency": "MONTHLY",
      "nextDueDate": "2024-03-15T00:00:00.000Z",
      "installmentsPaid": 0,
      "totalInstallments": 12
    }
  }
}
```

### 3. Get Pending Payments
**GET** `/member/pending`

Retrieves all pending payment requests for the authenticated member.

**Response:**
```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "requestId": "PR202412001234",
        "paymentType": "RD",
        "amount": 5000,
        "totalAmount": 5000,
        "dueDate": "2024-02-15T00:00:00.000Z",
        "status": "PENDING",
        "paymentMethod": "RAZORPAY",
        "description": "Monthly RD contribution"
      }
    ],
    "totalPendingAmount": 15000,
    "totalPendingCount": 3
  }
}
```

---

## Payment Processing Routes

### 1. Create Razorpay Order
**POST** `/create-razorpay-order`

Creates a Razorpay order for online payment.

**Request Body:**
```json
{
  "requestId": "507f1f77bcf86cd799439011"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "order_1234567890",
    "amount": 5000,
    "currency": "INR",
    "requestId": "PR202412001234"
  }
}
```

### 2. Verify Razorpay Payment
**POST** `/verify-razorpay-payment`

Verifies and processes Razorpay payment.

**Request Body:**
```json
{
  "requestId": "507f1f77bcf86cd799439011",
  "paymentId": "pay_1234567890",
  "signature": "razorpay_signature_here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified and processed successfully",
  "data": {
    "requestId": "PR202412001234",
    "status": "PAID",
    "paidAt": "2024-02-15T10:30:00.000Z"
  }
}
```

### 3. Process UPI Payment
**POST** `/process-upi-payment`

Processes UPI payment.

**Request Body:**
```json
{
  "requestId": "507f1f77bcf86cd799439011",
  "upiTransactionId": "UPI123456789"
}
```

**Response:**
```json
{
  "success": true,
  "message": "UPI payment processed successfully",
  "data": {
    "requestId": "PR202412001234",
    "status": "PAID",
    "paidAt": "2024-02-15T10:30:00.000Z"
  }
}
```

---

## Error Responses

### Validation Error
```json
{
  "success": false,
  "errors": [
    {
      "field": "amount",
      "message": "Amount must be at least 1"
    }
  ]
}
```

### Not Found Error
```json
{
  "success": false,
  "message": "Payment request not found"
}
```

### Access Denied Error
```json
{
  "success": false,
  "message": "Access denied. Admin privileges required."
}
```

### Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Error details"
}
```

---

## Payment Types Explained

### RD (Recurring Deposit)
- Requires regular contributions at specified intervals
- Has maturity date and interest calculation
- Supports monthly, weekly, or daily frequency
- Tracks installments paid vs total installments

### FD (Fixed Deposit)
- One-time deposit with fixed duration
- Higher interest rates than RD
- Maturity date calculated based on duration
- No recurring payments

### OD (Overdraft)
- Flexible borrowing facility
- Interest charged on amount used
- No fixed duration or maturity date
- Suitable for short-term financial needs

### CD (Current Deposit)
- Regular savings account type
- Lower interest rates
- No fixed duration
- Flexible deposit and withdrawal

---

## Security Features

1. **Role-based Access Control**: Admin and society member routes are properly segregated
2. **JWT Authentication**: All endpoints require valid authentication
3. **Input Validation**: Comprehensive validation for all inputs
4. **Payment Verification**: Razorpay signature verification for online payments
5. **Audit Trail**: All payment activities are logged with timestamps
6. **Interest Rate Privacy**: Interest rates are hidden from society members

---

## Rate Limits

- Default rate limit: 100 requests per 15 minutes per IP
- Payment processing endpoints may have stricter limits
- Admin endpoints have higher rate limits than member endpoints

---

## Environment Variables Required

```env
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
JWT_SECRET=your_jwt_secret
MONGODB_URI=your_mongodb_connection_string
```
