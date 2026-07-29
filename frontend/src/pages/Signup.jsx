import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

const API = import.meta.env.VITE_API_URL || '/api'

export default function Signup() {
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [terms, setTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSignup = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }
    if (!terms) {
      setError('You must agree to the Terms & Privacy')
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`${API}/meetings/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          password,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        setError(err.detail || 'Failed to sign up. Please try again.')
        return
      }

      // Automatically log in the user
      localStorage.setItem('pname', `${firstName.trim()} ${lastName.trim()}`)
      localStorage.setItem('pemail', email.trim().toLowerCase())
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#1E1A3C] dark:text-white mb-2">Create Account</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Join Echo Meet for a distraction-free experience.
            </p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-xl p-3 text-red-600 dark:text-red-400 text-xs font-semibold text-start">
              {error}
            </div>
          )}

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSignup}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 text-start">
                  First Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:border-transparent bg-white dark:bg-[#1e293b] text-[#1E1A3C] dark:text-white transition-colors duration-200"
                    placeholder="John"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 text-start">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="block w-full px-3 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:border-transparent bg-white dark:bg-[#1e293b] text-[#1E1A3C] dark:text-white transition-colors duration-200"
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

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
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 text-start">
                Password
              </label>
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

            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                id="terms"
                className="w-4 h-4 text-[#2563EB] border-gray-300 rounded focus:ring-[#2563EB] dark:border-white/10 dark:bg-[#1e293b]"
              />
              <label htmlFor="terms" className="text-sm text-gray-500 dark:text-gray-400 text-start">
                I agree to the <a href="#" className="font-semibold text-[#2563EB] dark:text-blue-400 hover:underline">Terms & Privacy</a>.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-cta flex items-center justify-center gap-2 py-3 mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Registering...
                </>
              ) : (
                <>
                  Get Started
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Already a member?{' '}
            <Link to="/login" className="font-semibold text-[#2563EB] dark:text-blue-400 hover:underline">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
