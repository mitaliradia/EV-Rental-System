"use client"

import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext.jsx"

export function UserRoute({ children }) {
  const { authUser, loading } = useAuth()
  const location = useLocation()

  if (loading) return null
  if (!authUser) return <Navigate to="/login" replace state={{ from: location }} />
  return children
}

export function AdminRoute({ children }) {
  const { authUser, loading } = useAuth()
  const location = useLocation()

  if (loading) return null
  if (!authUser) return <Navigate to="/login" replace state={{ from: location }} />
  if (authUser.role !== "admin") return <Navigate to="/" replace />
  return children
}
