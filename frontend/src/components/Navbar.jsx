import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function Navbar({ onStartMeeting }) {
  const [scrolled, setScrolled] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    
    // Default is always light (standard mode = white)
    // Only switch to dark if user explicitly chose dark
    if (localStorage.theme === 'dark') {
      document.documentElement.classList.add('dark')
      setIsDark(true)
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.theme = 'light'
      setIsDark(false)
    }

    // Check login status
    const checkLogin = () => {
      const logged = localStorage.getItem('isLoggedIn') === 'true'
      setIsLoggedIn(logged)
      if (logged) {
        setUserName(localStorage.getItem('pname') || 'User')
      }
    }
    checkLogin()

    window.addEventListener('storage', checkLogin)
    
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('storage', checkLogin)
    }
  }, [])

  function toggleTheme() {
    if (isDark) {
      document.documentElement.classList.remove('dark')
      localStorage.theme = 'light'
      setIsDark(false)
    } else {
      document.documentElement.classList.add('dark')
      localStorage.theme = 'dark'
      setIsDark(true)
    }
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between
                  px-6 md:px-16 py-4 transition-all duration-300
                  ${scrolled
                    ? 'bg-white/95 dark:bg-[#0F111A]/90 backdrop-blur-xl shadow-sm dark:shadow-none border-b border-gray-100 dark:border-white/10'
                    : 'bg-white dark:bg-[#0F111A] border-b border-gray-100 dark:border-white/10'}`}
    >
      {/* Logo + Brand */}
      <Link to="/" className="flex items-center gap-3 group">
        <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl overflow-hidden bg-transparent transition-transform duration-300 group-hover:scale-110">
          <img
            src="/logo.png"
            alt="Echo Meet"
            className="w-14 h-14 scale-[1.35] object-contain"
          />
        </div>
        <span className="text-xl font-bold tracking-tight text-[#1E1A3C] dark:text-white">
          Echo <span className="text-[#2563EB] dark:text-blue-400">Meet</span>
        </span>
      </Link>

      {/* Nav Links */}
      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500 dark:text-gray-400">
        <a href="/#features"    className="hover:text-[#1E1A3C] dark:hover:text-white transition-colors duration-200">Features</a>
        <a href="/#how-it-works" className="hover:text-[#1E1A3C] dark:hover:text-white transition-colors duration-200">How It Works</a>
        <a href="/#overview"    className="hover:text-[#1E1A3C] dark:hover:text-white transition-colors duration-200">Overview</a>
        <a href="/#audience"    className="hover:text-[#1E1A3C] dark:hover:text-white transition-colors duration-200">Our Audience</a>
      </div>

      {/* CTA & Theme Toggle */}
      <div className="flex items-center gap-3">
        {isLoggedIn ? (
          <div className="hidden sm:flex items-center gap-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl px-3 py-1.5">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
              {userName}
            </span>
            <button
              onClick={() => {
                localStorage.removeItem('isLoggedIn')
                localStorage.removeItem('pname')
                localStorage.removeItem('pemail')
                setIsLoggedIn(false)
                window.location.reload()
              }}
              className="text-xs font-bold text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
            >
              Logout
            </button>
          </div>
        ) : (
          <Link
            id="navbar-login"
            to="/login"
            className="hidden sm:block text-sm font-semibold text-gray-600 dark:text-gray-300
                       hover:text-[#1E1A3C] dark:hover:text-white transition-colors duration-200 px-2"
          >
            Login
          </Link>
        )}
        <button
          id="navbar-start-meeting"
          onClick={onStartMeeting}
          className="btn-cta text-sm px-5 py-2.5"
        >
          Get Started
        </button>
        
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ml-1"
          aria-label="Toggle Dark Mode"
        >
          {isDark ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>
    </nav>
  )
}
