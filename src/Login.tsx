/* eslint semi: ["warn", "never"] */
import './App.css'
import React, { useState } from 'react'
import { useNavigate,
          useOutletContext} from 'react-router-dom'
import { Buffer } from 'buffer'
const { subtle } = globalThis.crypto

async function myKeyImport(someBase64String: string) {
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
  const decryptedBuffer = await subtle.decrypt(
    { name: 'AES-GCM', iv, additionalData }
    , key
    , ciphertext
  )
  // It seems these are equivalent!
  const plaintext = new TextDecoder().decode(decryptedBuffer)
  // const plaintext = Buffer.from(decryptedBuffer).toString()
  const json = JSON.parse(plaintext)
  return json
}

function Login() {
  const [ setPosts,
          bytes,
          cryptoKey, setCryptoKey]: any[] = useOutletContext()
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
    if (bytes.byteLength !== 0) {
      myDecrypt(bytes, cryptoKey)
        .then((x: Object) => {
          setPosts(x)
          window.sessionStorage.setItem('posts', JSON.stringify(x))
          navigate('/all')
        })
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
