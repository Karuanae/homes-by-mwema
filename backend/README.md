# Homes by Mwema - Backend API

A Flask-based REST API for the Homes by Mwema property rental platform.

## Features

- User authentication and authorization
- Property management
- Booking system
- Payment processing
- Admin dashboard
- JWT-based security

## Setup

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Set environment variables (optional):

```bash
export SECRET_KEY=your-secret-key
export JWT_SECRET_KEY=your-jwt-secret
export DATABASE_URL=sqlite:///homes.db
```

3. Run the application:

```bash
python app.py
```

4. Seed the database with sample data:

```bash
python seed.py
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Properties

- `GET /api/properties` - Get all properties
- `GET /api/properties/<id>` - Get property details
- `POST /api/properties` - Create property (admin)
- `PUT /api/properties/<id>` - Update property (admin)
- `DELETE /api/properties/<id>` - Delete property (admin)

### Bookings

- `POST /api/booking` - Create booking
- `GET /api/booking/my-bookings` - Get user's bookings
- `GET /api/booking/<id>` - Get booking details
- `POST /api/booking/<id>/cancel` - Cancel booking

### Payments

- `POST /api/payment/process/<booking_id>` - Process payment
- `GET /api/payment/booking/<booking_id>` - Get payment details

### User Management

- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `POST /api/user/change-password` - Change password

### Admin

- `GET /api/admin/users` - Get all users
- `GET /api/admin/properties` - Get all properties
- `GET /api/admin/bookings` - Get all bookings
- `GET /api/admin/payments` - Get all payments
- `PUT /api/admin/users/<id>/role` - Update user role

### General

- `GET /api/health` - Health check
- `POST /api/contact` - Send contact message
- `GET /api/featured-properties` - Get featured properties

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```
