import { useState, useEffect, useRef } from 'react'
import api from '../services/api'
import { useSocket } from '../context/SocketContext'
import { useAuth } from '../context/AuthContext'

const ChatModal = ({ booking, onClose }) => {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)
  const socket = useSocket()
  const { authUser } = useAuth()

  useEffect(() => {
    fetchMessages()
    
    if (socket) {
      socket.on('new_message', handleNewMessage)
      return () => socket.off('new_message', handleNewMessage)
    }
  }, [socket, booking._id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    try {
      const { data } = await api.get(`/messages/booking/${booking._id}`)
      setMessages(data)
    } catch (error) {
      console.error('Failed to fetch messages')
    } finally {
      setLoading(false)
    }
  }

  const handleNewMessage = (message) => {
    if (message.booking === booking._id) {
      setMessages(prev => [...prev, message])
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    try {
      await api.post('/messages', {
        bookingId: booking._id,
        message: newMessage,
        type: 'text'
      })
      setNewMessage('')
    } catch (error) {
      alert('Failed to send message')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md h-96 flex flex-col">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold">Chat with Station Master</h3>
              <p className="text-sm text-gray-600">{booking.vehicle.modelName}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="text-center text-gray-500">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500">No messages yet</div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.sender._id.toString() === authUser._id.toString() ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    msg.sender._id.toString() === authUser._id.toString()
                      ? 'bg-indigo-600 text-white'
                      : msg.type === 'emergency'
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p>{msg.message}</p>
                  <p className="text-xs opacity-75 mt-1">
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="p-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 border rounded-lg text-sm"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ChatModal