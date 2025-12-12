import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SuperAdminRoute = () => {
    const { authUser } = useAuth();
    return authUser && authUser.role === 'super-admin' ? <Outlet /> : <Navigate to="/" replace />;
};
export default SuperAdminRoute;