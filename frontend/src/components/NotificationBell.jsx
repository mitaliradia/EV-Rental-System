import { useState, useEffect } from 'react'
import { useSocket } from '../context/SocketContext'
import api from '../services/api'

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const socket = useSocket()

  useEffect(() => {
    // Fetch notifications on mount
    fetchNotifications()
  }, [])

  useEffect(() => {
    if (!socket) return

    console.log('NotificationBell: Setting up socket listeners')
    
    const handleNotification = (notification) => {
      console.log('Received notification:', notification)
      setNotifications(prev => [notification, ...prev])
      setUnreadCount(prev => prev + 1)
    }

    socket.on('notification', handleNotification)
    socket.on('booking_update', (data) => {
      handleNotification({
        _id: Date.now(),
        title: 'Booking Update',
        message: data.message,
        type: 'booking',
        priority: 'medium',
        createdAt: new Date(),
        isRead: false
      })
    })

    return () => {
      console.log('NotificationBell: Cleaning up socket listeners')
      socket.off('notification', handleNotification)
      socket.off('booking_update')
    }
  }, [socket])

  const fetchNotifications = async () => {
    try {
      console.log('Fetching notifications...')
      const response = await api.get('/notifications?limit=100')
      
      console.log('Fetched notifications:', response.data)
      
      const allNotifications = response.data.notifications || []
      setNotifications(allNotifications)
      
      // Count unread notifications
      const unreadNotifications = allNotifications.filter(n => !n.isRead)
      console.log('Unread notifications:', unreadNotifications.length)
      setUnreadCount(unreadNotifications.length)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`)
      
      // Update the notification in the list instead of removing it
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const formatTime = (date) => {
    const now = new Date()
    const notifDate = new Date(date)
    const diffMs = now - notifDate
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return `${Math.floor(diffMins / 1440)}d ago`
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-semibold">Notifications</h3>
            <button 
              onClick={fetchNotifications}
              className="text-sm text-blue-600 hover:underline"
            >
              Refresh
            </button>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications yet
              </div>
            ) : (
              (showAll ? notifications : notifications.slice(0, 10)).map((notification) => (
                <div
                  key={notification._id || notification.id}
                  className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => !notification.isRead && markAsRead(notification._id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          
          {notifications.length > 10 && (
            <div className="p-3 border-t text-center">
              <button 
                onClick={() => setShowAll(!showAll)}
                className="text-blue-600 text-sm hover:underline"
              >
                {showAll ? 'Show recent only' : 'View older notifications'}
              </button>
            </div>
          )}
        </div>
      )}
      
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </div>
  )
}

export default NotificationBell