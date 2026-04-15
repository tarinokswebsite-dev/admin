import React from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import Admin from './components/Admin'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
      </Routes>
    </HashRouter>
  )
}

function ProtectedRoute({ children }) {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
  return isLoggedIn ? children : <Navigate to="/" />
}

export default App