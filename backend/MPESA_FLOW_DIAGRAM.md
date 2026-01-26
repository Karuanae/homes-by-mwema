# M-PESA Payment Flow Diagram

## Complete Payment Flow

```
┌─────────────┐
│   Frontend  │
│   (React)   │
└──────┬──────┘
       │
       │ 1. User clicks "Pay with M-PESA"
       │    - Enters phone number
       │    - Enters amount
       │
       │ 2. POST /api/payments/mpesa/initiate
       ▼
┌──────────────────┐
│   Flask Backend  │
│                  │
│  ┌────────────┐  │
│  │ payment.py │  │
│  └─────┬──────┘  │
│        │         │
│        │ 3. Creates pending payment in DB
│        │
│        │ 4. Calls MPesaService.stk_push()
│        ▼
│  ┌──────────────┐│
│  │mpesa_service │││
│  │              │││
│  │ - get_token()│││
│  │ - generate_  │││
│  │   password() │││
│  │ - stk_push() │││
│  └──────┬───────┘│
│         │        │
└─────────┼────────┘
          │
          │ 5. POST to Daraja API
          │    (STK Push request)
          ▼
    ┌──────────────┐
    │   Safaricom  │
    │  Daraja API  │
    └──────┬───────┘
           │
           │ 6. Sends STK Push to user's phone
           ▼
    ┌──────────────┐
    │  User Phone  │
    │   (M-PESA)   │
    └──────┬───────┘
           │
           │ 7. User sees prompt
           │    - Enters PIN
           │    - Confirms payment
           │
           │ 8. M-PESA processes payment
           ▼
    ┌──────────────┐
    │   Safaricom  │
    │  Daraja API  │
    └──────┬───────┘
           │
           │ 9. POST /api/payments/mpesa/callback
           │    (Payment result)
           ▼
┌──────────────────┐
│   Flask Backend  │
│                  │
│  ┌────────────┐  │
│  │ payment.py │  │
│  │ callback() │  │
│  └─────┬──────┘  │
│        │         │
│        │ 10. Process callback
│        │     - Update payment status
│        │     - Update booking status
│        │     - Save M-PESA receipt
│        │
│        ▼
│  ┌──────────┐   │
│  │ Database │   │
│  └──────────┘   │
│                 │
└─────────────────┘
        │
        │ 11. Frontend polls for status
        │     GET /api/payments/mpesa/query/<id>
        │
        ▼
┌─────────────┐
│   Frontend  │
│             │
│ Payment     │
│ Confirmed!  │
│             │
└─────────────┘
```

## Data Flow Details

### Step 1-2: Payment Initiation

```json
Frontend → Backend
POST /api/payments/mpesa/initiate
{
  "booking_id": 123,
  "phone_number": "0712345678",
  "amount": 5000
}
```

### Step 3: Database Record

```sql
INSERT INTO payments (
  booking_id, user_id, amount,
  method, status, mpesa_number
) VALUES (
  123, 456, 5000,
  'mpesa', 'pending', '254712345678'
);
```

### Step 4-5: Daraja API Request

```json
Backend → Daraja API
POST https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest
{
  "BusinessShortCode": "174379",
  "Password": "MTc0Mzc5YmZiMjc...",
  "Timestamp": "20260124103000",
  "TransactionType": "CustomerPayBillOnline",
  "Amount": 5000,
  "PartyA": "254712345678",
  "PartyB": "174379",
  "PhoneNumber": "254712345678",
  "CallBackURL": "https://yourdomain.com/api/payments/mpesa/callback",
  "AccountReference": "BOOKING-123",
  "TransactionDesc": "Payment for booking #123"
}
```

### Step 5: Daraja Response

```json
Daraja API → Backend
{
  "MerchantRequestID": "29115-34620561-1",
  "CheckoutRequestID": "ws_CO_DMZ_123456789_12345678",
  "ResponseCode": "0",
  "ResponseDescription": "Success. Request accepted for processing",
  "CustomerMessage": "Success. Request accepted for processing"
}
```

### Step 9: M-PESA Callback

```json
Daraja API → Backend
POST /api/payments/mpesa/callback
{
  "Body": {
    "stkCallback": {
      "MerchantRequestID": "29115-34620561-1",
      "CheckoutRequestID": "ws_CO_DMZ_123456789_12345678",
      "ResultCode": 0,
      "ResultDesc": "The service request is processed successfully.",
      "CallbackMetadata": {
        "Item": [
          { "Name": "Amount", "Value": 5000 },
          { "Name": "MpesaReceiptNumber", "Value": "QBR31H5YZX" },
          { "Name": "TransactionDate", "Value": 20260124103015 },
          { "Name": "PhoneNumber", "Value": 254712345678 }
        ]
      }
    }
  }
}
```

### Step 10: Database Update

```sql
UPDATE payments
SET
  status = 'completed',
  mpesa_receipt_number = 'QBR31H5YZX',
  transaction_id = 'QBR31H5YZX',
  completed_at = NOW()
WHERE checkout_request_id = 'ws_CO_DMZ_123456789_12345678';

UPDATE bookings
SET
  payment_status = 'completed',
  confirmation = 'confirmed'
WHERE id = 123;
```

### Step 11: Status Query

```json
Frontend → Backend
GET /api/payments/mpesa/query/ws_CO_DMZ_123456789_12345678

Backend → Frontend
{
  "success": true,
  "status": "completed",
  "result_code": "0",
  "result_desc": "The service request is processed successfully."
}
```

## Error Scenarios

### User Cancels Payment

```
User sees STK Push → Cancels
↓
M-PESA sends callback with ResultCode: 1032
↓
Backend updates payment status to 'failed'
↓
Frontend shows error: "Payment cancelled"
```

### Insufficient Funds

```
User enters PIN → Insufficient balance
↓
M-PESA sends callback with ResultCode: 1
↓
Backend updates payment status to 'failed'
↓
Frontend shows error: "Insufficient funds"
```

### Timeout

```
User doesn't respond to STK Push (120 seconds)
↓
M-PESA sends callback with ResultCode: 1037
↓
Backend updates payment status to 'failed'
↓
Frontend shows error: "Payment timeout"
```

## Status Codes Reference

| Code | Description        | Action                  |
| ---- | ------------------ | ----------------------- |
| 0    | Success            | Mark as completed       |
| 1    | Insufficient Funds | Show error, allow retry |
| 1032 | Cancelled by user  | Show error, allow retry |
| 1037 | Timeout            | Show error, allow retry |
| 2001 | Wrong PIN          | Show error, allow retry |

## Polling Strategy

```javascript
// Frontend polls every 3 seconds for 2 minutes
const pollInterval = 3000; // 3 seconds
const maxPolls = 40; // 2 minutes total

let pollCount = 0;
const interval = setInterval(async () => {
  pollCount++;

  const status = await checkPaymentStatus(checkoutRequestId);

  if (status.status === "completed") {
    clearInterval(interval);
    showSuccess();
  } else if (status.status === "failed") {
    clearInterval(interval);
    showError();
  } else if (pollCount >= maxPolls) {
    clearInterval(interval);
    showTimeout();
  }
}, pollInterval);
```

## Security Flow

```
1. User authenticates
   ↓
2. JWT token stored
   ↓
3. Token sent with payment request
   ↓
4. Backend verifies token
   ↓
5. Checks user owns booking
   ↓
6. Validates payment amount
   ↓
7. Initiates M-PESA
   ↓
8. M-PESA callback received
   ↓
9. Validates callback source
   ↓
10. Updates only matching payment
```

## Database Schema

```sql
-- Payment Table with M-PESA fields
CREATE TABLE payments (
  id INTEGER PRIMARY KEY,
  booking_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  property_id INTEGER,
  amount DECIMAL(10,2) NOT NULL,
  method VARCHAR(20) NOT NULL,

  -- M-PESA specific fields
  mpesa_number VARCHAR(20),
  mpesa_receipt_number VARCHAR(100),
  merchant_request_id VARCHAR(100),
  checkout_request_id VARCHAR(100),
  mpesa_response_code VARCHAR(10),
  mpesa_response_description VARCHAR(255),

  -- Timestamps
  payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- Status
  status VARCHAR(20) DEFAULT 'pending',

  -- Foreign keys
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (property_id) REFERENCES properties(id)
);
```

---

**This diagram shows the complete end-to-end flow of M-PESA payments in your application.**
