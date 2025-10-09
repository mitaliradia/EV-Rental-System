import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const RegisterPage = () => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { setAuthUser } = useAuth();

    // Updates the form state as the user types
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Handles the form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        // Basic frontend validation
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        setLoading(true);
        try {
            // Send the registration data to the backend API
            const { data } = await api.post('/auth/register', formData);
            
            // On success, update the global auth state
            setAuthUser(data);
            
            // Redirect the user to their new profile page
            navigate('/profile');
        } catch (err) {
            // Display any error messages from the backend
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            // Ensure the loading state is turned off, whether it succeeded or failed
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg space-y-8">
                <div>
                    <h2 className="text-3xl font-bold text-center text-gray-800">Create Your Account</h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        And start your electric journey with us!
                    </p>
                </div>
                
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name</label>
                        <input 
                            id="name" 
                            name="name" 
                            type="text" 
                            autoComplete="name"
                            value={formData.name}
                            onChange={handleChange} 
                            required 
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="text-sm font-medium text-gray-700">Email address</label>
                        <input 
                            id="email" 
                            name="email" 
                            type="email" 
                            autoComplete="email"
                            value={formData.email}
                            onChange={handleChange} 
                            required 
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
                        <input 
                            id="password" 
                            name="password" 
                            type="password" 
                            autoComplete="new-password"
                            minLength="6"
                            value={formData.password}
                            onChange={handleChange} 
                            required 
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={loading} 
                        className="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    >
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>
                
                <p className="text-center text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                        Login here
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;