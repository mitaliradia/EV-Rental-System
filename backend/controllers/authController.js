import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// Helper function to create and set the cookie
const generateTokenAndSetCookie = (res, userId) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development', // Use secure cookies in production
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
};

export const registerUser = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists' });
        
        const user = await User.create({ name, email, password });
        generateTokenAndSetCookie(res, user._id);
        
        res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role, kyc: user.kyc });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (user && (await user.matchPassword(password))) {
            generateTokenAndSetCookie(res, user._id);
            res.status(200).json({ _id: user._id, name: user.name, email: user.email, role: user.role, kyc: user.kyc });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const logoutUser = (req, res) => {
    res.cookie('jwt', '', { httpOnly: true, expires: new Date(0) });
    res.status(200).json({ message: 'Logged out successfully' });
};

export const getMe = async (req, res) => {
    // req.user is attached by the protectRoute middleware
    res.status(200).json(req.user);
};