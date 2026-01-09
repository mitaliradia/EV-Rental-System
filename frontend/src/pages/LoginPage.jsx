"use client"

import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext.jsx"
import api from "../services/api.js"

export default function LoginPage() {
  const { setAuthUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading,setLoading] = useState(false)

  const from = location.state?.from?.pathname || "/"

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    if (!email || !password) {
      setError("Please enter email and password.")
      return
    }
    setLoading(true);
    try {
      const {data} = await api.post('/auth/login',{email,password});
      setAuthUser(data);
      switch (data.role) {
        case 'super-admin':
          navigate('/super-admin'); // Correct: Sends Super Admin to their panel
          break;
        case 'station-master':
          navigate('/dashboard'); // Correct: Sends Station Master to their panel
          break;
        case 'user':
          default:
          navigate('/profile'); // Correct: Sends regular users to their profile
          break;
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
      <p className="mt-1 text-sm text-gray-600">Log in to your EV-Go account.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 card p-6 shadow-md rounded-lg">
        {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        <button className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p className="text-center text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-indigo-600 hover:underline">
            Create one
          </Link>
        </p>
      </form>
    </div>
  )
}
