import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
// You can create a simple SVG logo component or import an image
const Logo = () => (
    <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
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
                    <div className="hidden md:flex items-center space-x-6">
                        <Link to="/vehicles" className="text-gray-600 hover:text-indigo-600 transition-colors">Our Fleet</Link>
                        {/* More links can go here */}
                    </div>
                    <div className="flex items-center space-x-4">
                        {authUser ? (
                            <>
                                <span className="hidden sm:block text-gray-700">Welcome, {authUser.name}</span>
                                <Link to="/profile" className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Profile</Link>
                                {authUser.role === 'station-master' && (
                                    <Link to="/admin/dashboard" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Admin</Link>
                                )}
                                <button onClick={handleLogout} className="text-gray-500 hover:text-red-600">&times; Logout</button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-gray-600 hover:text-indigo-600">Login</Link>
                                <Link to="/register" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Register</Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>
        </header>
    );
};
export default Navbar;