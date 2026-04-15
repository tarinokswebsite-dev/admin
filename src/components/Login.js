import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/Login.css'

const USERNAME = 'tarinoks'
const PASSWORD = 'tarinoks123@'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = () => {
    if (username === USERNAME && password === PASSWORD) {
      localStorage.setItem('isLoggedIn', 'true')
      navigate('/admin')
    } else {
      setError('Invalid username or password')
    }
  }

  return (
    <div className='login-container'>
      <h2>Admin Login</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      {error && <p className="error">{error}</p>}
      <button onClick={handleLogin}>Login</button>
    </div>
  )
}

export default Login