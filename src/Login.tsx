/* eslint semi: ["warn", "never"] */
import './App.css'
import React, { useState } from 'react'
import { readMessage, decrypt } from 'openpgp/lightweight'
import { Buffer } from 'buffer'
const { subtle } = globalThis.crypto

async function myKeyImport(someBase64String: string) {
  return await subtle.importKey(
    'raw',
    new Uint8Array(Buffer.from(someBase64String, 'base64')),
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'])
}

async function myDecrypt( bytes : ArrayBuffer, password: string ) {
  const key = await myKeyImport(password)
  const additionalData = new Uint8Array(bytes.slice(0, 10))
  const iv = new Uint8Array(bytes.slice(10, 26))
  const ciphertext = new Uint8Array(bytes.slice(26))
  const decryptedBuffer = await subtle.decrypt(
    { name: 'AES-GCM', iv, additionalData }
    , key
    , ciphertext
  )
  // new TextDecoder().decode(decryptedBuffer)
  const plaintext = Buffer.from(decryptedBuffer).toString()
  return JSON.parse(plaintext)
}

function Login({ blob, setPosts }:
               { blob: ArrayBuffer, setPosts: Function }) {
  const [password, setPassword] = useState('')
  const handleSubmit = (form: any) => {
    form.preventDefault()
    if (!blob) console.log('Not yet fetched posts from server')
    else myDecrypt(blob, password)
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
