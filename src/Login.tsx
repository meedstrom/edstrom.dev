/* eslint semi: ["warn", "never"] */
import './App.css'
import React, { useState, useEffect } from 'react'
import { useOutletContext, Navigate } from 'react-router-dom'

export default function Login() {
  useEffect(() => { document.title = 'Login' })
  const [posts, setPosts, bytes, setBytes, cryptoKey, setCryptoKey]: any[] = useOutletContext()
  const [password, setPassword] = useState('')
  const handleSubmit = (form: any) => {
    form.preventDefault()
    setCryptoKey(
      password,
      { days: 0, sameSite: 'Strict', secure: true }
    )
  }
  if (posts.length !== 0) return <Navigate to='/posts' replace />
  else return (
    <div className="login-wrapper">
      <h1>Please log in</h1>
      <form onSubmit={handleSubmit}>
        <label>
          <p>Username</p>
          <input type="text" value="guest" readOnly />
        </label>
        <label>
          <p>Passphrase</p>
          <input type="password" autoFocus onChange={x => setPassword(x.target.value)} />
        </label>
        <div>
          <br />
          <button type="submit">I accept a cookie, log me in</button>
        </div>
      </form>
    </div>
  )
}
