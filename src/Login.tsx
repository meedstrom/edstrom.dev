/* eslint semi: ["warn", "never"] */
// import './App.css'
import React, { useState, useEffect } from 'react'
import { useCookies } from 'react-cookie'
import { useNavigate } from 'react-router-dom'
import { Buffer } from 'buffer'
import { usePostKey, hardcodedWrappingKey } from './App'

const { subtle } = globalThis.crypto

// Run this bit locally on your computer.  Then paste the result in hardcodedWrappingKey definition.
/*
   window.crypto.subtle.generateKey(
   { name: 'AES-KW', length: 256 }
   ,true
   ,['wrapKey', 'unwrapKey']
   ).then(newKey => window.crypto.subtle.exportKey('raw', newKey)
   ).then(x => console.log(Array.apply([], new Uint8Array(x)).join(',')))
 */

// Test with
/* window.crypto.subtle.importKey(
 *   'raw'
 *   ,new Uint8Array([30,225,107,217,205,158,108,110,187,158,194,55,203,81,30,84,109,198,83,29,23,130,131,28,110,122,228,24,11,97,140,7])
 *   ,'AES-KW'
 *   ,true
 *   ,['wrapKey', 'unwrapKey']
 * ).then(newKey => window.crypto.subtle.exportKey('raw', newKey)
 * ).then(x => console.log(Array.apply([], new Uint8Array(x)).join(','))) */

export default function Login() {
    useEffect(() => { document.title = 'Login' })
    const { setPostKey } = usePostKey()
    const setCookie = useCookies(['storedPostKey'])[1]
    /* const [storedPostKey, setStoredPostKey]: [string, Function] = useCookie('storedPostKey') */
    const [password, setPassword] = useState('')
    const navigate = useNavigate()
    const handleSubmit = async (form: React.FormEvent<HTMLFormElement>) => {
        form.preventDefault()
        const postKey = await subtle.importKey(
            'raw'
            ,new Uint8Array(Buffer.from(password, 'base64'))
            ,'AES-GCM'
            ,true
            ,['encrypt', 'decrypt']
        )
        setPostKey(postKey)
        const wrappedPostKey = await subtle.wrapKey(
            'raw'
            ,postKey
            ,hardcodedWrappingKey
            ,'AES-KW'
        )
        console.log('wrapped key: ')
        console.log(wrappedPostKey)

        const stringified = Buffer.from(wrappedPostKey).toString('base64')

        await setCookie('storedPostKey'
            ,stringified
            ,{ maxAge: 7*86400, sameSite: 'strict', secure: true }
        )

        console.log(new Uint8Array(Buffer.from(stringified, 'base64')))
        console.log('unwrapped key (to verify): ')
        console.log(await
            subtle.unwrapKey(
                'raw'
                ,new Uint8Array(Buffer.from(stringified, 'base64'))
                ,hardcodedWrappingKey
                ,'AES-KW'
                ,'AES-GCM'
                ,true
                ,['encrypt', 'decrypt']
        ))

        navigate('/posts')
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
