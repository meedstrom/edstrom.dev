/* eslint semi: ["warn", "never"] */
import './App.css'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Buffer } from 'buffer'
const { subtle } = globalThis.crypto

async function myKeyImport(someBase64String: string) {
 console.log(someBase64String)
  return await subtle.importKey(
    'raw'
    , new Uint8Array(Buffer.from(someBase64String, 'base64'))
    , { name: 'AES-GCM', length: 256 }
    , false
    , ['encrypt', 'decrypt'])
}

async function myDecrypt( bytes : ArrayBuffer, password: string ) {
  const key = await myKeyImport(password)
  const additionalData = new Uint8Array(bytes.slice(0, 10))
  const iv = new Uint8Array(bytes.slice(10, 26))
  const ciphertext = new Uint8Array(bytes.slice(26))
  console.log('additionalData: ')
  console.log(additionalData)
  console.log('iv:')
  console.log(iv)
  console.log('ciphertext: ')
  console.log(ciphertext)
  const decryptedBuffer = await subtle.decrypt(
    { name: 'AES-GCM', iv, additionalData }
    , key
    , ciphertext
  )
  console.log('decryptedBuffer:')
  console.log(decryptedBuffer)
  // It seems these are equivalent!
  const plaintext = new TextDecoder().decode(decryptedBuffer)
  // const plaintext = Buffer.from(decryptedBuffer).toString()
  console.log('plaintext:')
  console.log(plaintext)
  const json = JSON.parse(plaintext)
  console.log('json:')
  console.log(json)
  return json
}

function Login({ bytes, setPosts, cryptoKey, setCryptoKey }:
               { bytes: ArrayBuffer,
                 setPosts: Function,
                 cryptoKey: string
                 setCryptoKey: Function }) {
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const handleSubmit = (form: any) => {
    form.preventDefault()
    setCryptoKey(password,
                 { days: 14
                 , sameSite: 'Strict'
                 , secure: true }
    )
    console.log(cryptoKey)
    if (!bytes || bytes.byteLength === 0) {
      console.log('Not yet fetched posts from server')
    } else {
      myDecrypt(bytes, cryptoKey)
        .then((x: Object) => {
          setPosts(x)
          window.sessionStorage.setItem('posts', JSON.stringify(x))
        })
        .then(() => navigate('/all'))
    }
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
          <br />
          <button type="submit">I accept a cookie, log me in</button>
        </div>
      </form>
    </div>
  )
}

export { myDecrypt }
export default Login
