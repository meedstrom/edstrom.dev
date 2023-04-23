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
    const setCookie = useCookies(['storedPostKey', 'who'])[1]
    const [password, setPassword] = useState('')
    const navigate = useNavigate()

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const maybeKey = password.trim().slice(1)
        const postKey = await subtle.importKey(
            'raw'
            ,new Uint8Array(Buffer.from(maybeKey, 'base64'))
            ,'AES-GCM'
            ,true
            ,['encrypt', 'decrypt']
        )
        setPostKey(postKey)
        const wrappedPostKey = await subtle.wrapKey(
            'raw'
            ,postKey
            ,await hardcodedWrappingKey()
            ,'AES-KW'
        )
        // console.log('wrapped key: ')
        // console.log(wrappedPostKey)

        const stringified = Buffer.from(wrappedPostKey).toString('base64')

        await setCookie('storedPostKey'
            ,stringified
            ,{ maxAge: 7*86400, sameSite: 'strict', secure: true }
        )

        // Yes it's a bit... crude... but I trust my friends not to elevate
        // their access level ;-)
        const firstChar = password.slice(0, 1)
        await setCookie('who'
           ,(firstChar === 'f') ? 'friend'
            : (firstChar === 'p') ? 'partner'
            : (firstChar === 't') ? 'therapist'
            : 'nobody'
           ,{ maxAge: 7*86400, sameSite: 'strict', secure: true }
        )

        /* console.log(new Uint8Array(Buffer.from(stringified, 'base64')))
         * console.log('unwrapped key (to verify): ')
         * console.log(await
         *     subtle.unwrapKey(
         *         'raw'
         *         ,new Uint8Array(Buffer.from(stringified, 'base64'))
         *         ,hardcodedWrappingKey
         *         ,'AES-KW'
         *         ,'AES-GCM'
         *         ,false
         *         ,['encrypt', 'decrypt']
         * ))
         */
        navigate('/posts')
    }
  return (
    <div className="section pt-3">
      <form className="box" onSubmit={handleSubmit}>
        <div className="field">
          <label className="label">Username</label>
          <div className="control">
            <input className="input" type="text" autoFocus />
          </div>
        </div>
        <div className="field">
          <label className="label">Passphrase</label>
          <div className="control">
            <input className="input" type="password" onChange={x => setPassword(x.target.value)} />
          </div>
        </div>
        <div className="field">
          <div className="control">
            {/* <button className="button is-primary" type="submit" onClick={() => this.setState({className: className + " is-loading"}) }> */}
            <button className="button is-primary" type="submit">
              Log me in
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
