import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Meeting from './pages/Meeting'
import Summary from './pages/Summary'
import SummaryResults from './pages/SummaryResults'
import Login from './pages/Login'
import Signup from './pages/Signup'

export default function App() {
  useEffect(() => {
    if (localStorage.theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.theme = 'light'
    }
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/meeting/:roomName" element={<Meeting />} />
        <Route path="/summary/:roomName" element={<Summary />} />
        <Route path="/summary/:roomName/results" element={<SummaryResults />} />
      </Routes>
    </BrowserRouter>
  )
}
