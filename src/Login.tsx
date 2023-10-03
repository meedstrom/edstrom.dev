/* eslint semi: ["warn", "never"] */
import React, { useState, useEffect } from 'react'
import { useCookies } from 'react-cookie'
import { useNavigate } from 'react-router-dom'
import { Buffer } from 'buffer'
import { useAppContext, getHardcodedWrappingKey } from './App'
import { toast } from 'react-toastify'
const { subtle } = globalThis.crypto

// Run this bit locally on your computer.  Then paste the result in getHardcodedWrappingKey definition.
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
  const { setPostKey } = useAppContext()
  const setCookie = useCookies(['storedPostKey', 'who'])[1]
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    // TODO: alert when the key couldn't be imported, and stay on login page
    const maybeKey = password.trim().slice(1)

    const postKey = await subtle.importKey(
      'raw'
      ,new Uint8Array(Buffer.from(maybeKey, 'base64'))
      ,'AES-GCM'
      ,true
      ,['encrypt', 'decrypt']
    ).catch(_ => null)

    if (['therapist', 'partner', 'friend'].includes(username)) {
      await setCookie('who', username, {
        maxAge: 7*86400, sameSite: 'strict', secure: true,
      })
      if (postKey) {
        toast('Login success!', { type: 'success' })
      } else {
        toast('Passphrase wrong (or something broke)', { type: 'error' })
        return
      }
    } else {
      toast('Unknown user', { type: 'error' })
      await setCookie('who', 'nobody', {
        maxAge: 7*86400, sameSite: 'strict', secure: true,
      })
      return
    }

    setPostKey(postKey)
    const wrappedPostKey = await subtle.wrapKey(
      'raw'
      ,postKey
      ,await getHardcodedWrappingKey()
      ,'AES-KW'
    )

    const stringified = Buffer.from(wrappedPostKey).toString('base64')

    await setCookie('storedPostKey', stringified, {
      maxAge: 7*86400, sameSite: 'strict', secure: true
    })

    if (username === 'therapist') {
      navigate('/posts/TSmDwf3/for-therapist')
    } else {
      navigate('/nexus')
    }

  }
  return (
    <div className="section pt-3">
      <form className="box" onSubmit={handleSubmit}>
        <div className="field">
          <label className="label">User</label>
          <div className="control">
            <input className="input" type="text" autoFocus onChange={x => setUsername(x.target.value)} />
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
