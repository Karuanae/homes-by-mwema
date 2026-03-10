/**
 * M-PESA Payment Component Example
 * 
 * This is a reference implementation for integrating M-PESA payments
 * in your frontend. Adapt this to your existing PaymentPage.jsx
 */

import React, { useState, useEffect } from 'react';
import { initiateMpesaPayment, checkPaymentStatus } from '../services/api';

const MpesaPaymentExample = ({ bookingId, amount, onSuccess, onError }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [checkoutRequestId, setCheckoutRequestId] = useState(null);
  const [pollInterval, setPollInterval] = useState(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pollInterval]);

  // Format phone number as user types
  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    
    // Limit to 10 digits if starting with 0, or 12 if starting with 254
    if (value.startsWith('0')) {
      value = value.slice(0, 10);
    } else if (value.startsWith('254')) {
      value = value.slice(0, 12);
    }
    
    setPhoneNumber(value);
  };

  // Validate phone number
  const validatePhoneNumber = (phone) => {
    // Accept formats: 0712345678, 254712345678, 712345678
    const pattern = /^(0|254)?[71]\d{8}$/;
    return pattern.test(phone);
  };

  // Poll for payment status
  const startPolling = (checkoutId) => {
    let pollCount = 0;
    const maxPolls = 40; // Poll for 2 minutes (40 * 3 seconds)

    const interval = setInterval(async () => {
      pollCount++;
      
      try {
        const result = await checkPaymentStatus(checkoutId);
        
        if (result.status === 'completed') {
          clearInterval(interval);
          setPollInterval(null);
          setLoading(false);
          setMessage('Payment successful! Redirecting...');
          
          // Call success callback
          setTimeout(() => {
            if (onSuccess) onSuccess(result);
          }, 2000);
        } else if (result.status === 'failed') {
          clearInterval(interval);
          setPollInterval(null);
          setLoading(false);
          setError('Payment failed. Please try again.');
          
          if (onError) onError(result);
        } else if (pollCount >= maxPolls) {
          // Timeout
          clearInterval(interval);
          setPollInterval(null);
          setLoading(false);
          setError('Payment timeout. Please check your M-PESA messages.');
        }
      } catch (err) {
        console.error('Error polling status:', err);
      }
    }, 3000); // Poll every 3 seconds

    setPollInterval(interval);
  };

  // Handle payment submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset states
    setError('');
    setMessage('');
    
    // Validate phone number
    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid phone number (e.g., 0712345678)');
      return;
    }

    setLoading(true);
    setMessage('Initiating payment...');

    try {
      const result = await initiateMpesaPayment(bookingId, phoneNumber, amount);
      
      if (result.success) {
        setMessage('Payment request sent! Please check your phone for the M-PESA prompt.');
        setCheckoutRequestId(result.checkout_request_id);
        
        // Start polling for payment status
        startPolling(result.checkout_request_id);
      } else {
        setLoading(false);
        setError(result.error || 'Failed to initiate payment');
        
        if (onError) onError(result);
      }
    } catch (err) {
      setLoading(false);
      setError('Network error. Please check your connection and try again.');
      console.error('Payment error:', err);
      
      if (onError) onError(err);
    }
  };

  // Format amount with KES currency
  const formatAmount = (amt) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amt);
  };

  return (
    <div className="mpesa-payment-container">
      <div className="payment-header">
        <h3>Pay with M-PESA</h3>
        <p className="amount-display">Amount: {formatAmount(amount)}</p>
      </div>

      <form onSubmit={handleSubmit} className="payment-form">
        <div className="form-group">
          <label htmlFor="phone">
            M-PESA Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            value={phoneNumber}
            onChange={handlePhoneChange}
            placeholder="0712345678"
            disabled={loading}
            required
            className="phone-input"
          />
          <small className="helper-text">
            Enter the phone number registered with M-PESA
          </small>
        </div>

        {error && (
          <div className="alert alert-error">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {message && (
          <div className="alert alert-info">
            <span className="info-icon">ℹ️</span>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !phoneNumber}
          className="submit-button"
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Processing...
            </>
          ) : (
            `Pay ${formatAmount(amount)}`
          )}
        </button>
      </form>

      <div className="payment-info">
        <h4>How to pay:</h4>
        <ol>
          <li>Enter your M-PESA phone number</li>
          <li>Click "Pay" button</li>
          <li>Check your phone for M-PESA prompt</li>
          <li>Enter your M-PESA PIN</li>
          <li>Confirm the payment</li>
        </ol>
      </div>

      <style>{`
        .mpesa-payment-container {
          max-width: 500px;
          margin: 0 auto;
          padding: 20px;
        }

        .payment-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .payment-header h3 {
          color: #2c3e50;
          margin-bottom: 10px;
        }

        .amount-display {
          font-size: 24px;
          font-weight: bold;
          color: #27ae60;
        }

        .payment-form {
          background: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #2c3e50;
        }

        .phone-input {
          width: 100%;
          padding: 12px;
          border: 2px solid #ddd;
          border-radius: 5px;
          font-size: 16px;
          transition: border-color 0.3s;
        }

        .phone-input:focus {
          outline: none;
          border-color: #27ae60;
        }

        .phone-input:disabled {
          background: #f5f5f5;
          cursor: not-allowed;
        }

        .helper-text {
          display: block;
          margin-top: 5px;
          font-size: 12px;
          color: #7f8c8d;
        }

        .alert {
          padding: 12px 15px;
          border-radius: 5px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .alert-error {
          background: #fee;
          color: #c33;
          border: 1px solid #fcc;
        }

        .alert-info {
          background: #e3f2fd;
          color: #1976d2;
          border: 1px solid #bbdefb;
        }

        .submit-button {
          width: 100%;
          padding: 15px;
          background: #27ae60;
          color: white;
          border: none;
          border-radius: 5px;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .submit-button:hover:not(:disabled) {
          background: #229954;
        }

        .submit-button:disabled {
          background: #95a5a6;
          cursor: not-allowed;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .payment-info {
          margin-top: 30px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 10px;
        }

        .payment-info h4 {
          color: #2c3e50;
          margin-bottom: 15px;
        }

        .payment-info ol {
          margin-left: 20px;
          color: #555;
        }

        .payment-info li {
          margin-bottom: 8px;
        }
      `}</style>
    </div>
  );
};

export default MpesaPaymentExample;

/**
 * Usage example in your PaymentPage.jsx:
 * 
 * import MpesaPaymentExample from '../components/MpesaPaymentExample';
 * 
 * function PaymentPage() {
 *   const handleSuccess = (result) => {
 *     // Navigate to confirmation page
 *     navigate('/booking-confirmation');
 *   };
 * 
 *   const handleError = (error) => {
 *     // Show error notification
 *     console.error('Payment failed:', error);
 *   };
 * 
 *   return (
 *     <MpesaPaymentExample
 *       bookingId={bookingId}
 *       amount={totalAmount}
 *       onSuccess={handleSuccess}
 *       onError={handleError}
 *     />
 *   );
 * }
 */
