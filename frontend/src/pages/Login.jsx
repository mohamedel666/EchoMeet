import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

const API = import.meta.env.VITE_API_URL || '/api'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`${API}/meetings/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      })

      if (!res.ok) {
        const err = await res.json()
        if (res.status === 404) {
          setError(
            <span>
              This email isn't registered on Echo Meet. Would you like to{' '}
              <Link to="/signup" className="underline font-bold text-[#2563EB] dark:text-blue-400 hover:text-blue-500">
                Sign up
              </Link>
              ?
            </span>
          )
        } else {
          setError(err.detail || 'Incorrect credentials or error logging in')
        }
        return
      }

      const data = await res.json()
      // On success, save variables to localStorage and redirect
      localStorage.setItem('pname', `${data.first_name} ${data.last_name}`)
      localStorage.setItem('pemail', data.email)
      localStorage.setItem('isLoggedIn', 'true')
      navigate('/')
    } catch (err) {
      setError(`Failed to connect to the server (${err.message}). Please verify the backend is running.`)
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0F111A] font-sans transition-colors duration-300">
      <Navbar onStartMeeting={() => navigate('/')} />

      <div className="pt-32 pb-20 px-6 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md bg-white dark:bg-[#0b0f19] rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 p-8 sm:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-4 text-[#2563EB] dark:text-blue-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#1E1A3C] dark:text-white mb-2">Welcome Back</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Login to access your Echo Meet dashboard.
            </p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-xl p-3 text-red-600 dark:text-red-400 text-xs font-semibold text-start">
              {error}
            </div>
          )}

          {/* Form */}
          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 text-start">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:border-transparent bg-white dark:bg-[#1e293b] text-[#1E1A3C] dark:text-white transition-colors duration-200"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Password
                </label>
                <a href="#" className="text-xs font-semibold text-[#2563EB] dark:text-blue-400 hover:underline">
                  Forgot?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:border-transparent bg-white dark:bg-[#1e293b] text-[#1E1A3C] dark:text-white transition-colors duration-200"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-cta flex items-center justify-center gap-2 py-3 mt-6 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Logging in...
                </>
              ) : (
                <>
                  Login
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            New to Echo Meet?{' '}
            <Link to="/signup" className="font-semibold text-[#2563EB] dark:text-blue-400 hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
