# CD Penalty System Documentation

## Overview
The CD (Certificate of Deposit) Penalty System automatically calculates penalties for overdue CD payments based on a specific rule: **₹10 per day after 15 days in a month**.

## Penalty Rules

### Grace Period
- **15-day grace period**: If a CD payment is due on or before the 15th day of a month, penalties start accumulating from the 16th day
- **Immediate penalty**: If a CD payment is due after the 15th day, penalties start accumulating from the day after the due date

### Penalty Calculation
- **Rate**: ₹10 per day
- **Formula**: 
  - For due dates ≤ 15th: Penalty = ₹10 × (Current Day - 15)
  - For due dates > 15th: Penalty = ₹10 × Days Late

### Examples

#### Example 1: Due on 10th, checking on 20th
- Due Date: January 10th
- Check Date: January 20th
- Penalty: ₹10 × (20 - 15) = ₹50

#### Example 2: Due on 20th, checking on 25th
- Due Date: January 20th
- Check Date: January 25th
- Penalty: ₹10 × (25 - 20) = ₹50

#### Example 3: Due on 5th, checking on 14th
- Due Date: January 5th
- Check Date: January 14th
- Penalty: ₹0 (within grace period)

## API Endpoints

### Payment Processing

#### 1. Create Razorpay Order
```
POST /api/payment-requests/create-razorpay-order
```
Creates a Razorpay order for payment processing.

**Request Body:**
```json
{
  "requestId": "string",
  "amount": "number (in paise)",
  "currency": "INR"
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "order_xyz123",
  "amount": 100000,
  "currency": "INR"
}
```

#### 2. Verify Payment
```
POST /api/payment-requests/verify-razorpay-payment
```
Verifies and processes Razorpay payment.

**Request Body:**
```json
{
  "requestId": "string",
  "paymentId": "pay_xyz123",
  "orderId": "order_xyz123",
  "signature": "razorpay_signature",
  "amount": 1000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified successfully"
}
```

### For Society Members

#### 1. Get CD Penalty Summary
```
GET /api/payment-requests/member/cd-penalties
```
Returns a summary of all CD payments with their penalties.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPayments": 3,
    "overduePayments": 2,
    "onTimePayments": 1,
    "totalPenalty": 150,
    "totalAmount": 45000,
    "totalAmountWithPenalty": 45150,
    "penaltyBreakdown": [...],
    "summary": {
      "message": "Total penalty: ₹150 for 2 overdue payment(s)",
      "hasOverdue": true
    }
  }
}
```

#### 2. Get CD Penalty Details for Specific Payment
```
GET /api/payment-requests/member/cd-penalties/:requestId
```
Returns detailed penalty information for a specific CD payment request.

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentRequest": {
      "requestId": "PR001",
      "paymentType": "CD",
      "amount": 10000,
      "cdPenalty": 50,
      "penaltyDetails": {
        "hasPenalty": true,
        "penaltyAmount": 50,
        "penaltyPerDay": 10,
        "message": "CD penalty: ₹50 (₹10 per day after grace period)"
      }
    },
    "penaltyDetails": {
      "hasPenalty": true,
      "penaltyAmount": 50,
      "daysLate": 5,
      "penaltyDays": 5,
      "penaltyPerDay": 10
    },
    "totalAmountWithPenalty": 10050
  }
}
```

### For Admins

#### 1. Get All CD Penalties
```
GET /api/payment-requests/admin/cd-penalties?page=1&limit=10
```
Returns all CD payments with penalties, paginated.

#### 2. Get CD Penalties for Specific Member
```
GET /api/payment-requests/admin/cd-penalties/member/:memberId
```
Returns penalty summary for a specific society member.

#### 3. Update CD Penalty for Payment Request
```
POST /api/payment-requests/admin/cd-penalties/:requestId/update
```
Manually recalculates and updates the CD penalty for a specific payment request.

#### 4. Get CD Penalty Statistics
```
GET /api/payment-requests/admin/cd-penalties/statistics?startDate=2024-01-01&endDate=2024-01-31
```
Returns statistics about CD penalties in a date range.

## Frontend Integration

### Displaying Penalties
The penalty information is automatically included in payment request responses:

```javascript
// Get payment request details
const response = await fetch('/api/payment-requests/member/requests/PR001');
const data = await response.json();

if (data.data.paymentType === 'CD') {
  console.log('CD Penalty:', data.data.cdPenalty);
  console.log('Penalty Details:', data.data.penaltyDetails);
  console.log('Total Amount with Penalty:', data.data.totalAmount);
}
```

### Real-time Penalty Updates
Penalties are automatically calculated when:
- Fetching payment request details
- Updating payment requests
- Creating new payment requests

### Penalty Display Components
```javascript
// Example React component for displaying CD penalty
const CDPenaltyDisplay = ({ paymentRequest }) => {
  if (paymentRequest.paymentType !== 'CD') return null;
  
  return (
    <div className="cd-penalty">
      <h4>CD Penalty Information</h4>
      {paymentRequest.cdPenalty > 0 ? (
        <div className="penalty-warning">
          <p>⚠️ Penalty: ₹{paymentRequest.cdPenalty}</p>
          <p>Rate: ₹10 per day after grace period</p>
          <p>{paymentRequest.penaltyDetails.message}</p>
        </div>
      ) : (
        <div className="penalty-ok">
          <p>✅ No penalty applicable</p>
        </div>
      )}
    </div>
  );
};
```

## Database Schema

The payment request model now includes:

```javascript
// CD Penalty field
cdPenalty: {
  type: Number,
  default: 0,
  min: [0, 'CD penalty cannot be negative']
}

// Total amount calculation updated to include CD penalty
totalAmount = amount + lateFee + cdPenalty
```

## Testing

Run the test file to see how penalties are calculated:

```bash
node test/cd-penalty-test.js
```

## Important Notes

1. **CD Only**: Penalties only apply to payment requests with `paymentType: 'CD'`
2. **Pending Status**: Penalties only apply to payments with `status: 'PENDING'`
3. **Automatic Calculation**: Penalties are automatically calculated when fetching payment details
4. **Real-time Updates**: Penalties increase daily based on current date
5. **Grace Period**: 15-day grace period applies only to payments due on or before the 15th

## Error Handling

The system includes comprehensive error handling:
- Invalid dates are handled gracefully
- Missing payment requests return appropriate 404 errors
- Database errors are logged and return 500 errors
- Validation errors return 400 errors with detailed messages
