# EVForce - Electric Vehicle Rental Management System

A comprehensive full-stack web application for managing electric vehicle rentals with real-time notifications, role-based dashboards, and integrated payment processing.

## 🚗 Features

### Core Functionality
- **Multi-Role System**: Customer, Station Master, and Super Admin dashboards
- **Vehicle Management**: Complete CRUD operations for EV fleet management
- **Booking System**: Real-time booking with status tracking and history
- **Payment Integration**: Secure payments via Razorpay with transaction management
- **Real-time Notifications**: Socket.IO powered instant alerts across all user roles
- **Review System**: Customer feedback and rating system for vehicles

### Advanced Features
- **Dark Mode Support**: Comprehensive dark/light theme toggle
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **File Upload**: KYC document upload with Multer
- **Email Integration**: Automated email notifications via Nodemailer
- **Automated Tasks**: Cron jobs for overdue bookings and system maintenance
- **Data Cleanup**: MongoDB TTL indexing for automatic notification cleanup

## 🛠️ Tech Stack

**Frontend:**
- React.js with Vite
- Tailwind CSS
- Socket.IO Client
- Axios
- React Router DOM

**Backend:**
- Node.js & Express.js
- MongoDB with Mongoose ODM
- Socket.IO for real-time communication
- JWT Authentication
- Bcrypt.js for password hashing

**Additional Services:**
- Razorpay Payment Gateway
- Nodemailer for email services
- Multer for file uploads
- Node-Cron for scheduled tasks

## 📁 Project Structure

```
EV-Rental-System/
├── backend/
│   ├── controllers/     # Route controllers
│   ├── models/         # MongoDB schemas
│   ├── routes/         # API routes
│   ├── middleware/     # Authentication middleware
│   ├── jobs/          # Cron jobs
│   └── uploads/       # File upload directory
├── frontend/
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── pages/     # Page components
│   │   ├── context/   # React context
│   │   └── services/  # API services
│   └── public/        # Static assets
└── README.md
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB
- Razorpay account for payment integration

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/EV-Rental-System.git
   cd EV-Rental-System/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the backend directory:
   ```env
   JWT_SECRET=your_jwt_secret_key
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   ```

4. **Start the server**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the frontend directory:
   ```env
   VITE_API_URL=http://localhost:5000
   VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## 🔧 Database Seeding

To populate the database with initial data:

```bash
cd backend
npm run data:import
```

To clear the database:

```bash
npm run data:destroy
```

## 👥 User Roles & Access

### Customer
- Browse and search vehicles
- Make bookings and payments
- View booking history
- Submit reviews and ratings
- Manage favorites
- Real-time booking notifications

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
- Monitor all transactions
- System-wide notifications

## 🔔 Real-time Features

- **Socket.IO Integration**: Instant notifications for booking updates
- **Room-based Communication**: User-specific notification delivery
- **Auto-cleanup**: 30-day TTL for notification history
- **Cross-platform Sync**: Real-time updates across all devices

## 💳 Payment Integration

- **Razorpay Gateway**: Secure payment processing
- **Transaction Tracking**: Complete payment history
- **Refund Management**: Automated refund processing
- **Payment Verification**: Server-side payment validation

## 🎨 UI/UX Features

- **Dark Mode**: System-wide dark/light theme toggle
- **Responsive Design**: Mobile-first responsive layout
- **Accessibility**: WCAG compliant design
- **Loading States**: Smooth loading animations
- **Error Handling**: User-friendly error messages

## 📊 Performance Optimizations

- **Database Optimization**: Lean queries and indexing
- **Parallel Operations**: Promise.all for concurrent operations
- **Caching**: Efficient data caching strategies
- **Code Splitting**: Optimized bundle sizes
- **Image Optimization**: Compressed image assets

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt.js for password security
- **Route Protection**: Middleware-based route protection
- **Input Validation**: Server-side input sanitization
- **CORS Configuration**: Secure cross-origin requests

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Vehicles
- `GET /api/vehicles` - Get all vehicles
- `POST /api/vehicles` - Add new vehicle (Admin)
- `PUT /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Delete vehicle

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/user` - Get user bookings
- `PUT /api/bookings/:id` - Update booking status

### Payments
- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your LinkedIn](https://linkedin.com/in/yourprofile)

## 🙏 Acknowledgments

- React.js community for excellent documentation
- MongoDB for flexible database solutions
- Socket.IO for real-time communication
- Tailwind CSS for utility-first styling
- Razorpay for seamless payment integration

---

⭐ Star this repository if you found it helpful!