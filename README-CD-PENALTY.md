# CD Penalty System - Quick Start Guide

## 🎯 What is the CD Penalty System?

The CD Penalty System automatically calculates penalties for overdue CD (Certificate of Deposit) payments based on a simple rule: **₹10 per day after 15 days in a month**.

## 🚀 Quick Start

### 1. System Requirements
- Node.js backend with Express
- MongoDB database
- Existing payment request system

### 2. Files Added
```
utilities/cdPenaltyCalculator.js     - Core penalty calculation logic
models/paymentRequest.model.js       - Updated with CD penalty fields
routes/paymentRequests.js            - New CD penalty API endpoints
test/cd-penalty-test.js             - Test scenarios
examples/cd-penalty-examples.js     - Frontend integration examples
docs/cd-penalty-system.md           - Detailed documentation
```

### 3. Test the System
```bash
node test/cd-penalty-test.js
```

## 📱 Frontend Integration

### Get CD Penalty Summary
```javascript
// For society members
const response = await fetch('/api/payment-requests/member/cd-penalties', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const data = await response.json();
console.log('Total Penalty:', data.data.totalPenalty);
```

### Get Penalty Details for Specific Payment
```javascript
// For a specific CD payment
const response = await fetch(`/api/payment-requests/member/cd-penalties/${requestId}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

const data = await response.json();
console.log('Penalty Amount:', data.data.penaltyDetails.penaltyAmount);
```

## 💳 Payment Processing

### Create Razorpay Order
```
POST /api/payment-requests/create-razorpay-order
```
**Request Body:**
```json
{
  "requestId": "string",
  "amount": "number (in paise)",
  "currency": "INR"
}
```

### Verify Payment
```
POST /api/payment-requests/verify-razorpay-payment
```
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

## 🔧 Admin Functions

### View All CD Penalties
```
GET /api/payment-requests/admin/cd-penalties?page=1&limit=10
```

### Get Penalty Statistics
```
GET /api/payment-requests/admin/cd-penalties/statistics?startDate=2024-01-01&endDate=2024-01-31
```

### Update Penalty for Payment
```
POST /api/payment-requests/admin/cd-penalties/:requestId/update
```

## 📊 How Penalties Work

### Grace Period Rule
- **Due on/before 15th**: Penalty starts from 16th day of month
- **Due after 15th**: Penalty starts from day after due date

### Examples
| Due Date | Check Date | Penalty | Reason |
|----------|------------|---------|---------|
| Jan 10   | Jan 20     | ₹50     | 5 days after 15th (16th-20th) |
| Jan 20   | Jan 25     | ₹50     | 5 days after due date |
| Jan 5    | Jan 14     | ₹0      | Within grace period |

## 🎨 Frontend Components

### Simple Penalty Display
```javascript
const CDPenaltyDisplay = ({ paymentRequest }) => {
  if (paymentRequest.paymentType !== 'CD') return null;
  
  return (
    <div className="cd-penalty">
      {paymentRequest.cdPenalty > 0 ? (
        <div className="penalty-warning">
          ⚠️ Penalty: ₹{paymentRequest.cdPenalty}
        </div>
      ) : (
        <div className="penalty-ok">
          ✅ No penalty
        </div>
      )}
    </div>
  );
};
```

### Dashboard Widget
```javascript
const CDPenaltyDashboard = ({ token }) => {
  // See examples/cd-penalty-examples.js for full implementation
};
```

## 🔍 API Response Examples

### Penalty Summary Response
```json
{
  "success": true,
  "data": {
    "totalPayments": 3,
    "overduePayments": 2,
    "totalPenalty": 150,
    "totalAmount": 45000,
    "totalAmountWithPenalty": 45150,
    "summary": {
      "message": "Total penalty: ₹150 for 2 overdue payment(s)"
    }
  }
}
```

### Payment Request with Penalty
```json
{
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
}
```

## ⚠️ Important Notes

1. **CD Only**: Penalties only apply to `paymentType: 'CD'`
2. **Pending Status**: Only applies to `status: 'PENDING'` payments
3. **Automatic**: Penalties are calculated automatically when fetching data
4. **Real-time**: Penalties increase daily based on current date
5. **Grace Period**: 15-day grace period for payments due on/before 15th

## 🐛 Troubleshooting

### Common Issues
- **No penalties showing**: Check if payment type is 'CD' and status is 'PENDING'
- **Wrong penalty amount**: Verify due date and current date
- **API errors**: Check authentication token and request format

### Debug Mode
```javascript
// Enable detailed logging
const penalty = calculateCDPenalty(dueDate, currentDate);
console.log('Penalty calculation:', penalty);
```

## 📚 More Information

- **Full Documentation**: See `docs/cd-penalty-system.md`
- **Examples**: See `examples/cd-penalty-examples.js`
- **Tests**: See `test/cd-penalty-test.js`

## 🤝 Support

The CD penalty system is designed to be simple and reliable. If you encounter issues:

1. Check the test file output
2. Verify API responses
3. Review the documentation
4. Check console logs for errors

---

**Happy Coding! 🎉**
