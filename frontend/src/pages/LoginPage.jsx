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
      if (data?.token) {
        localStorage.setItem('token', data.token);
      }
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
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h2>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Log in to your EV-Go account.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 card p-6 shadow-md rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        {error && <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md text-sm border border-red-200 dark:border-red-800">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
          <input
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
          <input
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        <button className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 dark:disabled:bg-gray-600 transition-colors duration-200" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors duration-200">
            Create one
          </Link>
        </p>
      </form>
    </div>
  )
}
