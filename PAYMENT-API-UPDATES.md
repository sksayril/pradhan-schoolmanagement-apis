# Payment API Updates - Razorpay Integration

## 🎯 Overview
The payment API endpoints have been updated to match the proper Razorpay payment documentation structure. This ensures compatibility and prevents payment processing issues.

## 📍 Updated Endpoints

### 1. Create Razorpay Order
- **URL**: `/api/payment-requests/create-razorpay-order`
- **Method**: `POST`
- **Authentication**: Required (Society Member)

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

**Validation:**
- ✅ `requestId` and `amount` are required
- ✅ Only `INR` currency is supported
- ✅ Amount must match payment request total amount
- ✅ Payment request must exist and be in `PENDING` status

### 2. Verify Payment
- **URL**: `/api/payment-requests/verify-razorpay-payment`
- **Method**: `POST`
- **Authentication**: Required (Society Member)

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

**Validation:**
- ✅ All fields are required
- ✅ Order ID must match stored order ID
- ✅ Amount must match payment request total amount
- ✅ Payment signature is verified (except for mock orders)

## 🔧 Key Changes Made

### Before (Old Structure):
```javascript
// Old endpoint structure
router.post('/create-razorpay-order', ...)
router.post('/verify-razorpay-payment', ...)

// Old request validation
const { requestId } = req.body;

// Old response format
res.json({
  success: true,
  data: { ... }
});
```

### After (New Structure):
```javascript
// New endpoint structure (same URLs, updated logic)
router.post('/create-razorpay-order', ...)
router.post('/verify-razorpay-payment', ...)

// New request validation
const { requestId, amount, currency = 'INR' } = req.body;
if (!requestId || !amount) { /* validation */ }
if (currency !== 'INR') { /* validation */ }

// New response format
res.json({
  success: true,
  orderId: orderResult.order.id,
  amount: amount,
  currency: currency
});
```

## 🧪 Testing

### Test File Created:
- `test/test-payment-endpoints.js` - Tests the payment endpoints with mock data

### Test Scenarios:
1. ✅ Create order with valid data
2. ✅ Create order with missing fields (should reject)
3. ✅ Create order with invalid currency (should reject)
4. ✅ Verify payment with valid data
5. ✅ Verify payment with missing fields (should reject)

### Run Tests:
```bash
node test/test-payment-endpoints.js
```

## 📚 Documentation Updates

### Files Updated:
1. **`routes/paymentRequests.js`** - Updated endpoint logic
2. **`docs/cd-penalty-system.md`** - Added payment processing endpoints
3. **`README-CD-PENALTY.md`** - Added payment processing section
4. **`PAYMENT-API-UPDATES.md`** - This summary document

## 🚀 Frontend Integration

### Create Order:
```javascript
const response = await fetch('/api/payment-requests/create-razorpay-order', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    requestId: 'PR001',
    amount: 1000,
    currency: 'INR'
  })
});

const data = await response.json();
console.log('Order ID:', data.orderId);
```

### Verify Payment:
```javascript
const response = await fetch('/api/payment-requests/verify-razorpay-payment', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    requestId: 'PR001',
    paymentId: 'pay_xyz123',
    orderId: 'order_xyz123',
    signature: 'razorpay_signature',
    amount: 1000
  })
});

const data = await response.json();
console.log('Status:', data.message);
```

## ⚠️ Important Notes

1. **Amount Validation**: The amount sent must exactly match the payment request's total amount (including penalties)
2. **Currency**: Only INR is supported
3. **Authentication**: Both endpoints require valid society member authentication
4. **Mock Orders**: Development/testing orders with `_mock` in the order ID skip signature verification
5. **Error Handling**: Comprehensive error messages for validation failures

## 🔍 Troubleshooting

### Common Issues:
- **404 Not Found**: Check if the endpoint URL is correct
- **400 Bad Request**: Verify all required fields are present
- **Amount Mismatch**: Ensure amount matches payment request total amount
- **Authentication Error**: Check if the token is valid and not expired

### Debug Mode:
```javascript
// Enable detailed logging
console.log('Request Body:', req.body);
console.log('Payment Request:', paymentRequest);
console.log('Order Result:', orderResult);
```

---

**✅ Payment API endpoints are now properly structured and ready for production use!**
