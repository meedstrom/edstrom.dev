/* eslint semi: ["warn", "never"] */
import './bulmaOverride.scss'
import pako from 'pako'
import { useCookies } from 'react-cookie'
import { Buffer } from 'buffer'
import { HashLink as Link } from 'react-router-hash-link'
import {
  Suspense,
  useState,
  useEffect,
} from 'react'
import {
  Outlet,
  Navigate,
  ScrollRestoration,
  useLocation,
  useOutletContext,
} from 'react-router-dom'

const { subtle } = globalThis.crypto

export type Post = {
  title: string
  slug: string
  content: string
  wordcount: number
  tags: string[]
  backlinks: number | null
  created: string
  updated: string
}

export const hardcodedWrappingKey = await subtle.importKey(
  'raw'
  ,new Uint8Array([30,225,107,217,205,158,108,110,187,158,194,55,203,81,30,84,109,198,83,29,23,130,131,28,110,122,228,24,11,97,140,7])
  ,'AES-KW'
  ,true
  ,['wrapKey', 'unwrapKey']
)

async function myDecrypt( ciphertext: Uint8Array
                        , iv: Uint8Array
                        , postKey: CryptoKey | null) {
  // TODO: catch more detailed exceptions? with try/catch?
  console.log(iv)
  console.log(postKey)
  console.log(ciphertext)
  if (postKey) {
    const decryptedBuffer = await subtle.decrypt(
      { name: 'AES-GCM', iv }
      , postKey
      , ciphertext
    )
    // const decompressedBytes = await new Response(decryptedBuffer).body.pipeThrough(new DecompressionStream('gzip'))
    // return await new Response(decompressedBytes).text()
    const decompressed = pako.ungzip(decryptedBuffer)
    const text = Buffer.from(decompressed).toString()
    return text
  }
  else {
    console.log('postKey was undefined')
    return 'Decryption failed'
  }
}


export function RandomPost() {
  const { posts } = usePosts()
  if (posts.length === 0)
    return <p>Loading...</p>
  else {
    const storedSeen = window.localStorage.getItem('seen')
    const seen = storedSeen ? new Set(JSON.parse(storedSeen)) : new Set()
    let allNonStubs = new Set(posts.filter(x => !x.tags.includes('stub')).map(x => x.slug))
    // NOTE: set-difference is coming to JS, check if it's happened yet  https://github.com/tc39/proposal-set-methods
    for (const item of seen) {
      allNonStubs.delete(item)
    }
    const unseen = Array.from(allNonStubs)
    const randomSlug = unseen[Math.floor(Math.random() * unseen.length)]
    return <Navigate to={`/posts/${randomSlug}`} />
  }
}

type ContextType = {
  postKey: CryptoKey | null
  setPostKey: Function
  posts: Post[]
  setPosts: Function
}

export function usePostKey() {
  return useOutletContext<ContextType>()
}

export function usePosts() {
  return useOutletContext<ContextType>()
}

export function App() {
  const location = useLocation()
  const [cookies] = useCookies(['storedPostKey'])
  const [postKey, setPostKey] = useState<CryptoKey | null>(null)
  const [posts, setPosts] = useState<Post[]>([])

  useEffect(() => {
    // Get the big JSON of all posts
    if (posts.length === 0 && postKey) {
      fetch(process.env.PUBLIC_URL + '/posts.bin',
            {
              headers: {
                "Accept": 'application/octet-stream',
                "Cache-Control": 'max-age=86400, private',
              },
              cache: "default",
            }
      )
        .then((x: Response) => x.arrayBuffer())
        .then((x: any) => {
          const iv = new Uint8Array(x.slice(0, 16))
          const ciphertext = new Uint8Array(x.slice(16))
          return myDecrypt(ciphertext, iv, postKey)
        })
        .then((x: any) => {
          const parsed: Post[] = JSON.parse(x)
          setPosts(parsed)
        })
    }
    // Get postKey out of cookie, if there is one
    if (!postKey && cookies.storedPostKey) {
      subtle.unwrapKey(
        'raw'
        ,new Uint8Array(Buffer.from(cookies.storedPostKey, 'base64'))
        ,hardcodedWrappingKey
        ,'AES-KW'
        ,'AES-GCM'
        ,true
        ,['encrypt', 'decrypt']
      ).then((x) => setPostKey(x))
       .catch((error: Error) => console.log(error))
    }
  })

  const storedSeen = window.localStorage.getItem('seen')
  const seen = storedSeen ? JSON.parse(storedSeen) : []
  
  if (location.pathname === '/') {
    const needLogin = (posts.length === 0 && !cookies.storedPostKey)
    return (<Navigate to={needLogin ? '/login' : '/posts'} />)
  }
  else return (
    <>
      <nav className="navbar" role="navigation" aria-label="main navigation">
        <div className="navbar-brand">
          <Link className="navbar-item is-link" to="/posts">All notes</Link>
          <Link className="navbar-item is-link" to="/posts/about">About</Link>
          <Link className="navbar-item is-link" to="/now">Now</Link>
          <Link className="navbar-item is-link" to="/random">Random</Link>
          <Link className="navbar-item is-link" to="/posts/blogroll">Blogroll</Link>
          <Link className="navbar-item is-link" to="/login">Login</Link>
          <div className="navbar-item">{seen ? `Visited ${seen.length} of ${posts.length}` : '' }</div>
        </div>
      </nav>

    <div className="section pt-3">
      <Suspense fallback={<p>Loading</p>}>
        <Outlet context={{ posts, setPosts,
                           postKey, setPostKey, }} />
        <ScrollRestoration />
      </Suspense>
    </div>
    <footer className="footer has-text-centered">
      Martin Edström
      <br /><a href="https://github.com/meedstrom">GitHub</a>
      <br />LinkedIn
    </footer>

    </>
  )
}
