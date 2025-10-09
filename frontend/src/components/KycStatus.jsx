"use client"

import { useEffect, useState } from "react"
import api from "../services/api.js"

// Renders 4 states: not_submitted, pending, approved, rejected
export default function KycStatus() {
  const [status, setStatus] = useState("loading")
  const [reason, setReason] = useState("")
  const [file, setFile] = useState(null)
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const fetchStatus = async () => {
    try {
      const { data } = await api.get("/api/kyc/status")
      setStatus(data.status || "not_submitted")
      setReason(data.reason || "")
    } catch {
      setStatus("not_submitted")
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const onUpload = async (e) => {
    e.preventDefault()
    setMessage("")
    if (!file) return
    const form = new FormData()
    form.append("document", file)
    try {
      setSubmitting(true)
      await api.post("/api/kyc/upload", form, { headers: { "Content-Type": "multipart/form-data" } })
      setMessage("KYC Uploaded Successfully!")
      setTimeout(fetchStatus, 1000)
    } catch (err) {
      setMessage(err?.response?.data?.message || "Upload failed.")
    } finally {
      setSubmitting(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="card p-4">
        <div className="flex items-center gap-2 text-gray-700">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <span>Loading KYC status...</span>
        </div>
      </div>
    )
  }

  if (status === "approved") {
    return (
      <div className="card p-4 border-green-300">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-lg font-semibold text-gray-900">KYC Approved</h4>
            <p className="text-sm text-gray-600">Your account is verified. You can now book vehicles.</p>
          </div>
          <span className="badge badge-success">Approved</span>
        </div>
      </div>
    )
  }

  if (status === "pending") {
    return (
      <div className="card p-4 border-yellow-300">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-lg font-semibold text-gray-900">KYC Under Review</h4>
            <p className="text-sm text-gray-600">Please wait while our team reviews your document.</p>
          </div>
          <span className="badge badge-warning">Pending</span>
        </div>
      </div>
    )
  }

  if (status === "rejected") {
    return (
      <div className="card p-4 border-red-300">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-lg font-semibold text-gray-900">KYC Rejected</h4>
            <p className="text-sm text-gray-600">Reason: {reason || "Not specified"}</p>
            <p className="text-sm text-gray-600">Please re-upload a valid document for review.</p>
          </div>
          <span className="badge badge-error">Rejected</span>
        </div>
        <form className="mt-4 space-y-3" onSubmit={onUpload}>
          <div>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="input"
            />
          </div>
          {message && (
            <div className={`badge ${message.includes("Successfully") ? "badge-success" : "badge-error"}`}>
              {message}
            </div>
          )}
          <div className="flex items-center justify-end">
            <button className="btn btn-primary" type="submit" disabled={!file || submitting}>
              {submitting ? "Uploading..." : "Re-upload"}
            </button>
          </div>
        </form>
      </div>
    )
  }

  // not_submitted
  return (
    <div className="card p-4">
      <h4 className="text-lg font-semibold text-gray-900">Submit KYC</h4>
      <p className="mt-1 text-sm text-gray-600">Upload a government-issued ID to enable bookings.</p>
      <form className="mt-4 space-y-3" onSubmit={onUpload}>
        <div>
          <label className="label">Document</label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="input"
          />
        </div>
        {message && (
          <div className={`badge ${message.includes("Successfully") ? "badge-success" : "badge-error"}`}>{message}</div>
        )}
        <div className="flex items-center justify-end">
          <button className="btn btn-primary" type="submit" disabled={!file || submitting}>
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Uploading...
              </span>
            ) : (
              "Upload"
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
