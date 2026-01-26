# M-PESA API Quick Reference

## Base URL

```
http://localhost:5000/api/payments
```

## Endpoints

### 1. Initiate M-PESA Payment

```
POST /mpesa/initiate
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "booking_id": 1,
  "phone_number": "0712345678",
  "amount": 5000
}

Response:
{
  "success": true,
  "message": "Success. Request accepted for processing",
  "payment_id": 123,
  "checkout_request_id": "ws_CO_DMZ_123456789_12345678"
}
```

### 2. M-PESA Callback (Automatic)

```
POST /mpesa/callback
(Called by M-PESA, not by client)
```

### 3. Query Payment Status

```
GET /mpesa/query/<checkout_request_id>
Authorization: Bearer <jwt_token>

Response:
{
  "success": true,
  "status": "completed",
  "result_code": "0",
  "result_desc": "The service request is processed successfully."
}
```

### 4. Get Booking Payments

```
GET /booking/<booking_id>
Authorization: Bearer <jwt_token>

Response:
[
  {
    "id": 123,
    "amount": 5000.0,
    "method": "mpesa",
    "status": "completed",
    "transaction_id": "QBR31H5YZX",
    "mpesa_receipt": "QBR31H5YZX",
    "payment_date": "2026-01-24T10:30:00"
  }
]
```

## Payment Status Flow

```
pending -> completed (Success)
pending -> failed (User cancelled or error)
```

## Phone Number Formats

All these formats are supported:

- 0712345678
- 254712345678
- +254712345678

## Testing with Sandbox

**Test Credentials:**

- Business Short Code: 174379
- Test Phone: 254708374149
- Test PIN: Any 4 digits

## Common Result Codes

| Code | Description                   |
| ---- | ----------------------------- |
| 0    | Success                       |
| 1    | Insufficient Funds            |
| 1032 | Request cancelled by user     |
| 1037 | Timeout (user didn't respond) |
| 2001 | Wrong PIN entered             |

## Local Testing Setup

```bash
# 1. Install ngrok
brew install ngrok  # or download from ngrok.com

# 2. Start ngrok
ngrok http 5000

# 3. Copy HTTPS URL
# Example: https://abc123.ngrok.io

# 4. Update .env
MPESA_CALLBACK_URL=https://abc123.ngrok.io/api/payments/mpesa/callback

# 5. Restart Flask server
python app.py
```

## cURL Examples

### Initiate Payment

```bash
curl -X POST http://localhost:5000/api/payments/mpesa/initiate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "booking_id": 1,
    "phone_number": "0712345678",
    "amount": 1
  }'
```

### Query Status

```bash
curl -X GET http://localhost:5000/api/payments/mpesa/query/ws_CO_DMZ_123456 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Frontend Integration Snippet

```javascript
// Initiate payment
const initiatePayment = async () => {
  const response = await fetch("/api/payments/mpesa/initiate", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      booking_id: bookingId,
      phone_number: phoneNumber,
      amount: amount,
    }),
  });

  const data = await response.json();

  if (data.success) {
    // Start polling for status
    pollPaymentStatus(data.checkout_request_id);
  }
};

// Poll payment status
const pollPaymentStatus = (checkoutRequestId) => {
  const interval = setInterval(async () => {
    const response = await fetch(
      `/api/payments/mpesa/query/${checkoutRequestId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const data = await response.json();

    if (data.status === "completed") {
      clearInterval(interval);
      // Show success message
    } else if (data.status === "failed") {
      clearInterval(interval);
      // Show error message
    }
  }, 3000);

  // Stop after 2 minutes
  setTimeout(() => clearInterval(interval), 120000);
};
```
