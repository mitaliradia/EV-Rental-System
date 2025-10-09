import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const KycStatus = () => {
    const { authUser, setAuthUser } = useAuth();
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState('');

    const handleFileChange = (e) => setFile(e.target.files[0]);

    const handleKycUpload = async (e) => {
        e.preventDefault();
        if (!file) return setMessage('Please select a file.');
        const formData = new FormData();
        formData.append('kycDocument', file);
        try {
            const { data } = await api.post('/users/kyc', formData);
            setAuthUser(data);
            setMessage('KYC document uploaded successfully!');
        } catch (error) {
            setMessage(error.response?.data?.message || 'Upload failed.');
        }
    };

    if (!authUser) return null;

    const statusStyles = {
        'not-submitted': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800' },
        'pending': { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800' },
        'approved': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800' },
        'rejected': { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800' },
    };

    const currentStatus = authUser.kyc.status;
    const styles = statusStyles[currentStatus];

    return (
        <div className={`p-6 rounded-lg border ${styles.bg} ${styles.border}`}>
            <h3 className={`text-xl font-semibold ${styles.text}`}>KYC Verification Status</h3>
            <p className={`mt-2 font-bold capitalize ${styles.text}`}>{currentStatus.replace('-', ' ')}</p>

            {currentStatus === 'not-submitted' && (
                <form onSubmit={handleKycUpload} className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Upload your driver's license to get verified.</p>
                    <input type="file" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                    <button type="submit" className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Upload</button>
                </form>
            )}
            {currentStatus === 'rejected' && (
                <p className="mt-2 text-sm text-red-700">Reason: {authUser.kyc.rejectionReason}</p>
            )}
            {message && <p className="mt-4 text-sm text-gray-800">{message}</p>}
        </div>
    );
};

const ProfilePage = () => {
    return (
        <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-8">My Profile</h1>
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <KycStatus />
            </div>
        </div>
    );
};

export default ProfilePage;