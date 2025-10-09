import User from '../models/User.js';

export const uploadKyc = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
        
        const user = await User.findById(req.user._id);
        if (user) {
            user.kyc.documentPath = `uploads/${req.file.filename}`; // Save the relative path
            user.kyc.status = 'pending';
            const updatedUser = await user.save();
            
            // Send back the full user object so the frontend can update its state
            res.status(200).json(updatedUser);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};