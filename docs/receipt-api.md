# Receipt Management API Documentation

## Overview
The Receipt Management API provides functionality for society members to upload receipt images and for admins to review and manage them. This system allows for simple image-based receipt tracking with optional metadata.

## Base URL
```
/api/receipts
```

## Authentication
All endpoints require authentication using JWT tokens in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## Society Member Routes

### 1. Upload Receipt Image
**POST** `/api/receipts/upload`

Upload a receipt image with optional metadata.

**Headers:**
```
Authorization: Bearer <society_member_token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
```
receiptImage: [file] (required) - Image file (JPEG, JPG, PNG, WebP)
title: "Monthly Contribution Receipt" (optional)
description: "Receipt for monthly society contribution" (optional)
receiptType: "contribution" (optional) - payment, contribution, loan, other
amount: "5000" (optional) - Numeric amount
receiptDate: "2024-01-15" (optional) - Date in YYYY-MM-DD format
```

**Response:**
```json
{
  "success": true,
  "message": "Receipt uploaded successfully",
  "data": {
    "receipt": {
      "receiptId": "RCPT202401001234",
      "title": "Monthly Contribution Receipt",
      "description": "Receipt for monthly society contribution",
      "receiptType": "contribution",
      "amount": 5000,
      "receiptDate": "2024-01-15T00:00:00.000Z",
      "status": "pending",
      "imageUrl": "/uploads/receipts/receipt-1234567890.jpg",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Receipt Types:**
- `payment` - General payment receipts
- `contribution` - Society contribution receipts
- `loan` - Loan-related receipts
- `other` - Other types of receipts

**Receipt Status:**
- `pending` - Receipt uploaded, awaiting admin review
- `approved` - Receipt approved by admin
- `rejected` - Receipt rejected by admin
- `paid` - Receipt marked as paid by admin

### 2. Get My Receipts
**GET** `/my-receipts`

Get all receipts uploaded by the authenticated society member.

**Headers:**
```
Authorization: Bearer <society_member_token>
```

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10)
- `status` (optional) - Filter by status (pending, approved, rejected)
- `receiptType` (optional) - Filter by receipt type

**Example:**
```
GET /api/receipts/my-receipts?page=1&limit=5&status=pending
```

**Response:**
```json
{
  "success": true,
  "data": {
    "receipts": [
      {
        "receiptId": "RCPT202401001234",
        "title": "Monthly Contribution Receipt",
        "description": "Receipt for monthly society contribution",
        "receiptType": "contribution",
        "amount": 5000,
        "receiptDate": "2024-01-15T00:00:00.000Z",
        "status": "pending",
        "imageUrl": "/uploads/receipts/receipt-1234567890.jpg",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalReceipts": 25,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### 3. Get Single Receipt
**GET** `/:receiptId`

Get details of a specific receipt by ID.

**Headers:**
```
Authorization: Bearer <society_member_token>
```

**Path Parameters:**
- `receiptId` - Receipt ID (e.g., RCPT202401001234)

**Response:**
```json
{
  "success": true,
  "data": {
    "receipt": {
      "receiptId": "RCPT202401001234",
      "title": "Monthly Contribution Receipt",
      "description": "Receipt for monthly society contribution",
      "receiptType": "contribution",
      "amount": 5000,
      "receiptDate": "2024-01-15T00:00:00.000Z",
      "status": "approved",
      "imageUrl": "/uploads/receipts/receipt-1234567890.jpg",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

---

## Admin Routes

### 1. Get All Receipts
**GET** `/api/admin/receipts/all`

Get all receipts in the system (admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10)
- `status` (optional) - Filter by status
- `receiptType` (optional) - Filter by receipt type
- `memberId` (optional) - Filter by specific member

**Example:**
```
GET /api/admin/receipts/all?page=1&limit=10&status=pending
```

**Response:**
```json
{
  "success": true,
  "data": {
    "receipts": [
      {
        "receiptId": "RCPT202401001234",
        "title": "Monthly Contribution Receipt",
        "description": "Receipt for monthly society contribution",
        "receiptType": "contribution",
        "amount": 5000,
        "receiptDate": "2024-01-15T00:00:00.000Z",
        "status": "pending",
        "imageUrl": "/uploads/receipts/receipt-1234567890.jpg",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "societyMember": {
          "id": "60f7b3b3b3b3b3b3b3b3b3b3",
          "firstName": "John",
          "lastName": "Doe",
          "memberAccountNumber": "MEM2024000001",
          "email": "john.doe@example.com"
        },
        "reviewedBy": null,
        "reviewedAt": null,
        "reviewNotes": null
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalReceipts": 50,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### 2. Get Receipts by Member
**GET** `/api/admin/receipts/member/:memberId`

Get all receipts for a specific society member.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Path Parameters:**
- `memberId` - Society member ID

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10)
- `status` (optional) - Filter by status

**Response:**
```json
{
  "success": true,
  "data": {
    "member": {
      "id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "firstName": "John",
      "lastName": "Doe",
      "memberAccountNumber": "MEM2024000001",
      "email": "john.doe@example.com"
    },
    "receipts": [
      {
        "receiptId": "RCPT202401001234",
        "title": "Monthly Contribution Receipt",
        "description": "Receipt for monthly society contribution",
        "receiptType": "contribution",
        "amount": 5000,
        "receiptDate": "2024-01-15T00:00:00.000Z",
        "status": "pending",
        "imageUrl": "/uploads/receipts/receipt-1234567890.jpg",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "reviewedBy": null,
        "reviewedAt": null,
        "reviewNotes": null
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalReceipts": 15,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### 3. Get Single Receipt (Admin)
**GET** `/api/admin/receipts/:receiptId`

Get detailed information about a specific receipt.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Path Parameters:**
- `receiptId` - Receipt ID

**Response:**
```json
{
  "success": true,
  "data": {
    "receipt": {
      "receiptId": "RCPT202401001234",
      "title": "Monthly Contribution Receipt",
      "description": "Receipt for monthly society contribution",
      "receiptType": "contribution",
      "amount": 5000,
      "receiptDate": "2024-01-15T00:00:00.000Z",
      "status": "pending",
      "imageUrl": "/uploads/receipts/receipt-1234567890.jpg",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "societyMember": {
        "id": "60f7b3b3b3b3b3b3b3b3b3b3",
        "firstName": "John",
        "lastName": "Doe",
        "memberAccountNumber": "MEM2024000001",
        "email": "john.doe@example.com"
      },
      "reviewedBy": null,
      "reviewedAt": null,
      "reviewNotes": null
    }
  }
}
```

### 4. Review Receipt
**PUT** `/api/admin/receipts/:receiptId/review`

Approve or reject a receipt with optional review notes.

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Path Parameters:**
- `receiptId` - Receipt ID

**Request Body:**
```json
{
  "status": "approved",
  "reviewNotes": "Receipt verified and approved. Amount matches records."
}
```

**Status Options:**
- `approved` - Receipt is approved
- `rejected` - Receipt is rejected

**Response:**
```json
{
  "success": true,
  "message": "Receipt approved successfully",
  "data": {
    "receipt": {
      "receiptId": "RCPT202401001234",
      "title": "Monthly Contribution Receipt",
      "description": "Receipt for monthly society contribution",
      "receiptType": "contribution",
      "amount": 5000,
      "receiptDate": "2024-01-15T00:00:00.000Z",
      "status": "approved",
      "imageUrl": "/uploads/receipts/receipt-1234567890.jpg",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "societyMember": {
        "id": "60f7b3b3b3b3b3b3b3b3b3b3",
        "firstName": "John",
        "lastName": "Doe",
        "memberAccountNumber": "MEM2024000001",
        "email": "john.doe@example.com"
      },
      "reviewedBy": {
        "id": "60f7b3b3b3b3b3b3b3b3b3b4",
        "firstName": "Admin",
        "lastName": "User"
      },
      "reviewedAt": "2024-01-15T14:30:00.000Z",
      "reviewNotes": "Receipt verified and approved. Amount matches records."
    }
  }
}
```

### 5. Mark Receipt as Paid
**POST** `/api/admin/receipts/:receiptId/mark-paid`

Mark an approved receipt as paid with a simple one-click action.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Path Parameters:**
- `receiptId` - Receipt ID

**Request Body:**
```
{} (No body required - simple one-click API)
```

**Response:**
```json
{
  "success": true,
  "message": "Receipt marked as paid successfully",
  "data": {
    "receipt": {
      "receiptId": "RCPT202401001234",
      "title": "Monthly Contribution Receipt",
      "description": "Receipt for monthly society contribution",
      "receiptType": "contribution",
      "amount": 5000,
      "receiptDate": "2024-01-15T00:00:00.000Z",
      "status": "paid",
      "imageUrl": "/uploads/receipts/receipt-1234567890.jpg",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "societyMember": {
        "id": "60f7b3b3b3b3b3b3b3b3b3b3",
        "firstName": "John",
        "lastName": "Doe",
        "memberAccountNumber": "MEM2024000001",
        "email": "john.doe@example.com"
      },
      "reviewedBy": {
        "id": "60f7b3b3b3b3b3b3b3b3b3b4",
        "firstName": "Admin",
        "firstName": "User"
      },
      "reviewedAt": "2024-01-15T14:30:00.000Z",
      "reviewNotes": "Receipt verified and approved. Amount matches records.",
      "paidBy": {
        "id": "60f7b3b3b3b3b3b3b3b3b3b4",
        "firstName": "Admin",
        "lastName": "User"
      },
      "paidAt": "2024-01-15T16:30:00.000Z"
    }
  }
}
```

**Requirements:**
- Receipt cannot already be marked as "paid"
- Admin authentication required
- **Note**: Receipts can be marked as paid from any status (pending, approved, or rejected)

### 6. Get Receipt Statistics
**GET** `/api/admin/receipts/stats/overview`

Get overview statistics of all receipts.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalReceipts": 150,
      "pendingReceipts": 25,
      "approvedReceipts": 120,
      "rejectedReceipts": 5,
      "paidReceipts": 100
    },
    "receiptsByType": [
      {
        "_id": "contribution",
        "count": 80
      },
      {
        "_id": "payment",
        "count": 45
      },
      {
        "_id": "loan",
        "count": 20
      },
      {
        "_id": "other",
        "count": 5
      }
    ],
    "recentReceipts": [
      {
        "receiptId": "RCPT202401001234",
        "title": "Monthly Contribution Receipt",
        "description": "Receipt for monthly society contribution",
        "receiptType": "contribution",
        "amount": 5000,
        "receiptDate": "2024-01-15T00:00:00.000Z",
        "status": "pending",
        "imageUrl": "/uploads/receipts/receipt-1234567890.jpg",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

---

## File Upload Specifications

### Supported Image Formats
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)

### File Size Limits
- Maximum file size: 10MB
- Recommended dimensions: 800x600 to 1920x1080 pixels

### Image Storage
- Images are stored in `/uploads/receipts/` directory
- Unique filenames are generated to prevent conflicts
- Images are accessible via `/uploads/receipts/filename.ext`

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Receipt image is required"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Receipt not found"
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

## Usage Examples

### Frontend Implementation (React)

#### Upload Receipt
```javascript
const uploadReceipt = async (formData) => {
  try {
    const response = await fetch('/api/receipts/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const data = await response.json();
    if (data.success) {
      console.log('Receipt uploaded:', data.data.receipt);
    }
  } catch (error) {
    console.error('Upload failed:', error);
  }
};

// Usage
const formData = new FormData();
formData.append('receiptImage', fileInput.files[0]);
formData.append('title', 'Monthly Contribution');
formData.append('description', 'January 2024 contribution');
formData.append('receiptType', 'contribution');
formData.append('amount', '5000');

uploadReceipt(formData);
```

#### Get My Receipts
```javascript
const getMyReceipts = async () => {
  try {
    const response = await fetch('/api/receipts/my-receipts?page=1&limit=10', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    if (data.success) {
      setReceipts(data.data.receipts);
      setPagination(data.data.pagination);
    }
  } catch (error) {
    console.error('Failed to fetch receipts:', error);
  }
};
```

### Admin Panel Implementation

#### Review Receipt
```javascript
const reviewReceipt = async (receiptId, status, notes) => {
  try {
    const response = await fetch(`/api/admin/receipts/${receiptId}/review`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status, reviewNotes: notes })
    });
    
    const data = await response.json();
    if (data.success) {
      console.log('Receipt reviewed:', data.message);
    }
  } catch (error) {
    console.error('Review failed:', error);
  }
};

// Usage
reviewReceipt('RCPT202401001234', 'approved', 'Receipt verified and approved');
```

#### Mark Receipt as Paid
```javascript
const markReceiptAsPaid = async (receiptId) => {
  try {
    const response = await fetch(`/api/admin/receipts/${receiptId}/mark-paid`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    const data = await response.json();
    if (data.success) {
      console.log('Receipt marked as paid:', data.message);
    }
  } catch (error) {
    console.error('Mark as paid failed:', error);
  }
};

// Usage
markReceiptAsPaid('RCPT202401001234');

---

## Best Practices

### For Society Members
1. **Image Quality**: Ensure receipts are clear and readable
2. **File Size**: Keep images under 5MB for faster uploads
3. **Metadata**: Provide accurate title, description, and amount
4. **Receipt Type**: Choose appropriate receipt type for better organization

### For Admins
1. **Regular Review**: Review pending receipts regularly
2. **Clear Notes**: Provide clear review notes for rejected receipts
3. **Consistent Standards**: Apply consistent approval criteria
4. **Communication**: Communicate with members about receipt status

---

## Security Features

1. **Authentication Required**: All endpoints require valid JWT tokens
2. **Role-Based Access**: Society members can only access their own receipts
3. **File Validation**: Only image files are accepted
4. **File Size Limits**: Prevents abuse and ensures performance
5. **Secure File Storage**: Files are stored outside web root

---

## Rate Limiting

- **Upload Limit**: 10 receipts per hour per member
- **View Limit**: 100 requests per hour per user
- **Admin Actions**: 50 actions per hour per admin

---

## Support

For technical support or questions about the Receipt Management API, please contact the development team or refer to the system documentation.
