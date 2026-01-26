# M-PESA Daraja API Integration Guide

## Overview

Your Flask application is now integrated with Safaricom's Daraja API for M-PESA payments. This guide will help you set up and use the integration.

## Features Implemented

✅ STK Push (Lipa Na M-PESA Online) - Initiate payments
✅ Payment Callback Handler - Receive payment confirmations
✅ Transaction Status Query - Check payment status
✅ B2C Payment Support - For refunds (optional)
✅ Database tracking of M-PESA transactions

## Setup Instructions

### 1. Register on Safaricom Developer Portal

1. Go to [https://developer.safaricom.co.ke](https://developer.safaricom.co.ke)
2. Create an account and log in
3. Create a new app (Go-Live or Sandbox)
4. You'll receive:
   - **Consumer Key**
   - **Consumer Secret**
   - **Passkey** (for STK Push)
   - **Business Short Code**

### 2. Configure Environment Variables

Create a `.env` file in your backend directory:

```bash
# M-PESA Configuration
MPESA_ENVIRONMENT=sandbox  # Change to 'production' for live
MPESA_CONSUMER_KEY=your_consumer_key_here
MPESA_CONSUMER_SECRET=your_consumer_secret_here
MPESA_BUSINESS_SHORT_CODE=174379  # Use 174379 for sandbox, your short code for production
MPESA_PASSKEY=your_passkey_here

# Callback URL - Must be publicly accessible (use ngrok for local testing)
MPESA_CALLBACK_URL=https://your-domain.com/api/payments/mpesa/callback

# B2C Configuration (Optional - for refunds)
MPESA_INITIATOR_NAME=testapi
MPESA_SECURITY_CREDENTIAL=your_security_credential
MPESA_B2C_TIMEOUT_URL=https://your-domain.com/api/payments/mpesa/b2c/timeout
MPESA_B2C_RESULT_URL=https://your-domain.com/api/payments/mpesa/b2c/result
```

### 3. Install Python Packages

```bash
cd backend
pip install -r requirements.txt
```

### 4. Apply Database Migrations

```bash
flask db upgrade
```

### 5. For Local Testing - Set Up Ngrok

M-PESA needs a publicly accessible callback URL. Use ngrok:

```bash
# Install ngrok from https://ngrok.com
ngrok http 5000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Update MPESA_CALLBACK_URL in your .env file:
MPESA_CALLBACK_URL=https://abc123.ngrok.io/api/payments/mpesa/callback
```

## API Endpoints

### 1. Initiate M-PESA Payment (STK Push)

**Endpoint:** `POST /api/payments/mpesa/initiate`

**Headers:**

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "booking_id": 1,
  "phone_number": "0712345678",
  "amount": 5000
}
```

**Phone Number Formats Supported:**

- `0712345678` (Kenyan format)
- `254712345678` (International format)
- `+254712345678` (With plus)

**Response (Success):**

```json
{
  "success": true,
  "message": "Success. Request accepted for processing",
  "payment_id": 123,
  "checkout_request_id": "ws_CO_DMZ_123456789_12345678"
}
```

**Response (Error):**

```json
{
  "success": false,
  "error": "Error message here"
}
```

### 2. M-PESA Callback (Automatic)

**Endpoint:** `POST /api/payments/mpesa/callback`

This endpoint is called automatically by M-PESA when a payment is completed or failed.
You don't need to call this manually - M-PESA will send payment status updates here.

### 3. Query Payment Status

**Endpoint:** `GET /api/payments/mpesa/query/<checkout_request_id>`

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response:**

```json
{
  "success": true,
  "status": "completed",
  "result_code": "0",
  "result_desc": "The service request is processed successfully."
}
```

### 4. Get Booking Payments

**Endpoint:** `GET /api/payments/booking/<booking_id>`

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response:**

```json
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

## Payment Flow

1. **User Initiates Payment:**
   - Frontend calls `/api/payments/mpesa/initiate`
   - Server creates a pending payment record
   - Server calls M-PESA STK Push API

2. **User Receives STK Push:**
   - User gets prompt on their phone
   - User enters M-PESA PIN
   - User confirms payment

3. **M-PESA Processes Payment:**
   - M-PESA processes the transaction
   - M-PESA calls your callback URL with results

4. **Server Updates Payment:**
   - Callback handler receives payment status
   - Updates payment status to 'completed' or 'failed'
   - Updates booking confirmation status

## Testing with Sandbox

### Sandbox Credentials

- **Business Short Code:** 174379
- **Test Phone Number:** 254708374149
- **Test PIN:** Any 4-digit number

### Sandbox Test Flow

1. Use the sandbox credentials in your `.env` file
2. Make a payment request with the test phone number
3. Check the M-PESA sandbox portal to see test transactions
4. Manually trigger callback for testing

### Sandbox Limitations

- No actual money is transferred
- Need to manually trigger callbacks or wait for automatic ones
- Some features may not work exactly like production

## Frontend Integration Example

```javascript
// api.js
export const initiateMpesaPayment = async (bookingId, phoneNumber, amount) => {
  const response = await fetch(`${API_URL}/payments/mpesa/initiate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({
      booking_id: bookingId,
      phone_number: phoneNumber,
      amount: amount,
    }),
  });

  return await response.json();
};

export const checkPaymentStatus = async (checkoutRequestId) => {
  const response = await fetch(
    `${API_URL}/payments/mpesa/query/${checkoutRequestId}`,
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    },
  );

  return await response.json();
};

// Usage in component
const handlePayment = async () => {
  try {
    setLoading(true);

    const result = await initiateMpesaPayment(bookingId, phoneNumber, amount);

    if (result.success) {
      // Show success message
      alert("Please check your phone for the M-PESA prompt");

      // Poll for payment status
      const checkoutRequestId = result.checkout_request_id;
      const intervalId = setInterval(async () => {
        const status = await checkPaymentStatus(checkoutRequestId);

        if (status.status === "completed") {
          clearInterval(intervalId);
          // Payment successful
          navigate("/booking-confirmation");
        } else if (status.status === "failed") {
          clearInterval(intervalId);
          // Payment failed
          alert("Payment failed. Please try again.");
        }
      }, 3000); // Check every 3 seconds

      // Stop checking after 2 minutes
      setTimeout(() => clearInterval(intervalId), 120000);
    } else {
      alert(`Payment failed: ${result.error}`);
    }
  } catch (error) {
    alert("Error initiating payment");
  } finally {
    setLoading(false);
  }
};
```

## Troubleshooting

### Common Issues

1. **"Invalid Access Token"**
   - Check your Consumer Key and Consumer Secret
   - Ensure you're using the correct environment (sandbox vs production)

2. **"Request rejected by the user"**
   - User canceled the payment on their phone
   - User entered wrong PIN

3. **"Callback URL not accessible"**
   - Ensure callback URL is publicly accessible
   - Use ngrok for local testing
   - Check firewall settings

4. **"Insufficient Funds"**
   - User doesn't have enough money in M-PESA account

5. **"Phone number format error"**
   - Use format: 254XXXXXXXXX (without +)
   - Or: 07XXXXXXXX (will be auto-converted)

### Enable Debug Logging

Check Flask logs for detailed error messages:

```bash
# In app.py, enable debug mode
app.run(debug=True)

# Or set logging level
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Production Checklist

Before going live:

- [ ] Register for production on Safaricom Developer Portal
- [ ] Get production credentials (Consumer Key, Secret, Passkey)
- [ ] Get your actual Business Short Code
- [ ] Update environment variables to production values
- [ ] Set MPESA_ENVIRONMENT=production
- [ ] Use a proper domain for callback URL (not ngrok)
- [ ] Enable HTTPS on your domain
- [ ] Test with small amounts first
- [ ] Set up proper error monitoring
- [ ] Implement webhook retries for failed callbacks
- [ ] Add transaction logging for auditing

## Security Best Practices

1. **Never commit credentials to Git**
   - Use environment variables
   - Add `.env` to `.gitignore`

2. **Secure Callback Endpoint**
   - Validate callback source
   - Use HTTPS only
   - Verify transaction amounts

3. **Handle Errors Gracefully**
   - Don't expose sensitive error details to users
   - Log errors securely for debugging

4. **Implement Rate Limiting**
   - Prevent abuse of payment endpoints
   - Use Flask-Limiter or similar

## Support

- **Safaricom Developer Portal:** https://developer.safaricom.co.ke
- **API Documentation:** https://developer.safaricom.co.ke/apis-explorer
- **Support Email:** apisupport@safaricom.co.ke

## Database Schema Changes

New fields added to Payment model:

- `mpesa_receipt_number` - M-PESA receipt (e.g., QBR31H5YZX)
- `merchant_request_id` - Merchant request ID
- `checkout_request_id` - Checkout request ID for tracking
- `mpesa_response_code` - Response code from M-PESA
- `mpesa_response_description` - Response description

## Files Created/Modified

1. **Created:**
   - `backend/mpesa_service.py` - M-PESA service class
   - `backend/MPESA_SETUP.md` - This documentation

2. **Modified:**
   - `backend/models.py` - Added M-PESA fields to Payment model
   - `backend/views/payment.py` - Added M-PESA endpoints
   - `backend/app.py` - Added M-PESA configuration
   - `backend/requirements.txt` - Added requests library

3. **Migration:**
   - `backend/migrations/versions/[timestamp]_add_m_pesa_fields_to_payment_model.py`
