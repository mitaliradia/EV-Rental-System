import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

import http from 'http';
import {Server} from 'socket.io';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import superAdminRoutes from './routes/superAdminRoutes.js';
import stationMasterRoutes from './routes/stationMasterRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import otpRoutes from './routes/otpRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import favoriteRoutes from './routes/favoriteRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import refundRoutes from './routes/refundRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import loyaltyRoutes from './routes/loyaltyRoutes.js';
import { startCronJobs } from './jobs/cronJobs.js';
import { startPaymentTimeoutJob } from './jobs/paymentTimeout.js';
import { socketAuthMiddleware, validateRoomAccess } from './middleware/socketAuth.js';

dotenv.config();

// MongoDB connection with retry logic and better timeout settings
const connectDB = async () => {
    const options = {
        serverSelectionTimeoutMS: 10000, // 10 seconds
        socketTimeoutMS: 45000, // 45 seconds
        maxPoolSize: 10,
        minPoolSize: 2,
        maxIdleTimeMS: 30000,
        retryWrites: true,
        retryReads: true,
    };
    
    try {
        await mongoose.connect(process.env.MONGO_URI, options);
        console.log('✅ MongoDB Connected successfully');
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err.message);
        console.log('🔄 Retrying connection in 5 seconds...');
        setTimeout(connectDB, 5000);
    }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB error:', err.message);
});

mongoose.connection.on('reconnected', () => {
    console.log('✅ MongoDB reconnected');
});

connectDB();

const app = express();

//Create an HTTP server from the Express app
const server = http.createServer(app);

// Read the frontend URL from environment variables.
// Default to localhost for development if the variable isn't set.
const clientURL = process.env.FRONTEND_URL || 'http://localhost:5173';

// In local development, we still want to allow multiple ports for testing.
// In production, we'll only have one client URL.
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [clientURL]
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175','https://ev-rental-system.onrender.com'];

const corsOptions = {
    origin: function (origin, callback) {
        // The `origin` variable is the URL of the frontend making the request.
        // `!origin` allows requests from tools like Postman (which have no origin).
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true); // Allow the request
        } else {
            console.warn(`⚠️ CORS blocked request from: ${origin}`);
            console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
            callback(new Error(`Not allowed by CORS. Origin: ${origin}`)); // Block the request
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static images
app.use('/images', express.static(path.join(__dirname, 'images')));


// --- UPDATE THE SOCKET.IO CORS CONFIGURATION AS WELL ---
const io = new Server(server, {
    cors: {
        origin: allowedOrigins, // We can directly use the array here
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Issue #28: Socket.IO authentication middleware
io.use(socketAuthMiddleware);

// Handle socket connections with room access control
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);
    
    // Automatically join user's personal room
    socket.join(socket.userId);
    
    // Handle room join requests with validation
    socket.on('join_room', (roomName) => {
        if (validateRoomAccess(socket, roomName)) {
            socket.join(roomName);
            console.log(`User ${socket.userId} joined room: ${roomName}`);
        } else {
            socket.emit('error', { message: 'Unauthorized room access' });
            console.log(`User ${socket.userId} denied access to room: ${roomName}`);
        }
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.userId}`);
    });
});

// Middleware to make 'io' accessible in controllers
app.use((req,res,next) => {
    req.io=io;
    next();
})

// Make io globally available for cron jobs
global.io = io;

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/public',publicRoutes);
app.use('/api/station-master', stationMasterRoutes);
app.use('/api/bookings',bookingRoutes);
app.use('/api/super-admin',superAdminRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/payments', paymentRoutes);app.use('/api/refund', refundRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/loyalty', loyaltyRoutes);
//Socket.IO connection logic
io.on('connection',(socket)=>{
    console.log('A user connected:',socket.id);

    // Create a "room" for a specific user
    socket.on('joinUserRoom',(userId) => {
        socket.join(userId);
        console.log(`Socket ${socket.id} joined room for user ID: ${userId}`);
        console.log('Current rooms for socket:', socket.rooms);
    });

    socket.on('joinAdminRooms',(user)=>{
        if(user.role==='super-admin'){
            socket.join('super_admin_room');
            console.log(`Socket ${socket.id} joined SUPER ADMIN room`);
        }
        if (user.role === 'station-master' && user.station) {
            socket.join(`station_${user.station}`);
            console.log(`Socket ${socket.id} joined room for station: ${user.station}`);
        }
    })

    socket.on('disconnect',()=> {
        console.log('User disconnected:',socket.id);
    });
})

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    //2. Start the scheduled jobs after the server is successfully running
    startCronJobs();
    startPaymentTimeoutJob();
});

