import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = () => {
    const { authUser } = useAuth();
    return authUser && authUser.role === 'station-master' ? <Outlet /> : <Navigate to="/" replace />;
};
export default AdminRoute;