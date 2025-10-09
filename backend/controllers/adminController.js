import User from '../models/User.js';

export const getKycRequests = async (req, res) => {
    try {
        const users = await User.find({ 'kyc.status': 'pending' }).select('-password');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const updateKycStatus = async (req, res) => {
    const { userId } = req.params;
    const { status, reason } = req.body;
    try {
        const user = await User.findById(userId);
        if (user) {
            user.kyc.status = status;
            user.kyc.rejectionReason = status === 'rejected' ? reason : '';
            await user.save();
            res.status(200).json({ message: `User KYC has been ${status}` });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};