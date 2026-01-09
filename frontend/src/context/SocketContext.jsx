import { useState } from "react";
import { useEffect } from "react";
import { createContext } from "react";
import { useContext } from "react";
import { useAuth } from "./AuthContext";
import io from 'socket.io-client';
import { useNavigate } from "react-router-dom";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);
export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { authUser,setAuthUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Only connect if there is a logged-in user
        if (authUser) {
            // Establish connection to the backend server
            const newSocket = io('http://localhost:5000');
            setSocket(newSocket);
            
            // Join the user-specific room
            newSocket.emit('joinUserRoom', authUser._id);
            newSocket.emit('joinAdminRooms', authUser); // Send the whole user object

            newSocket.on('role_changed',(data)=>{
                alert(data.message);

                //Force a full logout to clear all state and cookies
                //This is the safest way to handle a permission change.
                const logout=async()=>{
                    await api.post('/auth/logout');
                    setAuthUser(null);
                    navigate('/login');
                }
                logout();
            })

            // Clean up the connection when the component unmounts or user logs out
            return () => newSocket.close();
            
        } else {
            // If there's no user, disconnect any existing socket
            if (socket) {
                socket.close();
                setSocket(null);
            }
        }
    }, [authUser,setAuthUser,navigate]); // This effect re-runs whenever the user logs in or out

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};

