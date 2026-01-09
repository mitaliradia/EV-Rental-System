import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Logo = () => (
    <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
);

const Navbar = () => {
    const { authUser, setAuthUser } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await api.post('/auth/logout');
        setAuthUser(null);
        navigate('/login');
    };

    return (
        <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <Link to="/" className="flex items-center space-x-2">
                        <Logo />
                        <span className="text-xl font-bold text-gray-800">EV-Go</span>
                    </Link>
                    
                    {/* --- ADDED THIS SECTION FOR CENTRAL NAVIGATION --- */}
                    <div className="hidden md:flex items-center space-x-6">
                        <Link to="/vehicles" className="text-gray-600 hover:text-indigo-600 transition-colors font-medium">
                            Our Fleet
                        </Link>
                        {/* You could add more links here like "About Us" or "Contact" */}
                    </div>
                    {/* ------------------------------------------- */}

                    <div className="flex items-center space-x-4">
                    {authUser ? (<>
                        <span className="hidden sm:block text-gray-700 font-medium">
                            Welcome, {authUser.name}
                        </span>
                        {authUser.role === 'user' && (
                                    <Link to="/profile" className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                                        My Profile
                                    </Link>
                        )}
                        {authUser.role === 'station-master' && <Link to="/dashboard">My Dashboard</Link>}
                        {authUser.role === 'super-admin' && <Link to="/super-admin">Super Admin Panel</Link>}
                        <button onClick={handleLogout} title="Logout" className="p-2 rounded-full text-gray-500 hover:bg-red-100 hover:text-red-600">
                                    Logout
                                </button>
                    </>) : (<>
                        <Link to="/login" className="text-gray-600 hover:text-indigo-600">Login</Link>
                        <Link to="/register" className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700">Register</Link>
                    </>)}
                </div>
                </div>
            </nav>
        </header>
    );
};

export default Navbar;