# EVGo - Electric Vehicle Rental Management System

> A comprehensive full-stack web application for managing electric vehicle rentals with real-time notifications, role-based dashboards, and integrated payment processing.

## Features

### Core Functionality
- Multi-Role System: Customer, Station Master, and Super Admin dashboards
- Vehicle Management: Complete CRUD operations for EV fleet management
- Booking System: Real-time booking with status tracking and history
- Payment Integration: Secure payments via Razorpay with transaction management
- Real-time Notifications: Socket.IO powered instant alerts across all user roles
- Review System: Customer feedback and rating system for vehicles

### Advanced Features
- Dark Mode Support: Comprehensive dark/light theme toggle
- Responsive Design: Mobile-first approach with Tailwind CSS
- File Upload: KYC document upload with Multer
- Email Integration: Automated email notifications via Nodemailer
- Automated Tasks: Cron jobs for overdue bookings and system maintenance
- Data Cleanup: MongoDB TTL indexing for automatic notification cleanup

## Technology Stack

### Frontend
- React.js with Vite
- Tailwind CSS
- Socket.IO Client
- Axios
- React Router DOM

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose ODM
- Socket.IO
- JWT Authentication
- bcrypt.js

### Additional Services
- Razorpay Payment Gateway
- Nodemailer
- Multer
- Node-Cron

```

## User Roles and Access
### Customer
- Browse and search vehicles
- Make bookings and payments
- View booking history
- Submit reviews and ratings
- Manage favorites
- Receive real-time notifications

### Station Master
- Manage assigned station vehicles
- Update vehicle availability
- View station bookings
- Handle customer queries
- Receive booking notifications

### Super Admin
- Complete system oversight
- Manage all vehicles and stations
- Assign station masters
- View system analytics
- Monitor transactions
- System-wide notifications

### Real-Time Features
- Socket.IO-based instant notifications
- Room-based user communication
- 30-day TTL auto-cleanup for notifications
- Cross-device real-time synchronization

### Payment Integration
- Razorpay secure payment gateway
- Transaction history tracking
- Refund management
- Server-side payment verification

### UI and UX Features
- Dark and light mode toggle
- Fully responsive layout
- Accessibility-compliant design
- Loading states and animations
- User-friendly error handling

### Performance Optimizations
- Database indexing and lean queries
- Parallel processing with Promise.all
- Efficient caching strategies
- Code splitting
- Image optimization

### Security Features
- JWT-based authentication
- Password hashing using bcrypt.js
- Middleware-based route protection
- Input validation and sanitization
- Secure CORS configuration

## API Endpoints
### Authentication
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout

### Vehicles
- GET /api/vehicles
- POST /api/vehicles
- PUT /api/vehicles/:id
- DELETE /api/vehicles/:id

### Bookings
- POST /api/bookings
- GET /api/bookings/user
- PUT /api/bookings/:id

### Payments
- POST /api/payments/create-order
- POST /api/payments/verify



Integrated ioredis for heavy database queries
Implemented TTL
Cache Eviction/Invalidation
