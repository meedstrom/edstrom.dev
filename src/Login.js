/* eslint semi: ["warn", "never"] */
import './App.css'
import React, { useState } from 'react'
import { readMessage, decrypt } from 'openpgp/lightweight'

async function decryptPosts ( buffer, password ) {
  const byteBlob = new Uint8Array(buffer)
  const pgpBlob = await readMessage({
    binaryMessage: byteBlob
  })
  const { data: decryptedData } = await decrypt({
    message: pgpBlob
  , passwords: [password]
  , format: 'binary'
  })
  const string = new TextDecoder().decode(decryptedData)
  return JSON.parse(string)
}

function Login({ blob, setPosts }) {
  const [password, setPassword] = useState('')
  const handleSubmit = form => {
    form.preventDefault()
    if (!blob) console.log('Not yet fetched posts from server')
    else decryptPosts(blob, password)
      .then(x => Object.values(x))
      .then(x => {
        setPosts(x)
        window.localStorage.setItem("posts", JSON.stringify(x))
      })
  }
  return (
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
        <button type="submit">Log in</button>
      </div>
    </form>
    </div>
  )
}

export default Login
