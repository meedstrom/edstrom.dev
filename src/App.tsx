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
  ,false
  ,['wrapKey', 'unwrapKey']
)

async function myDecrypt( ciphertext: Uint8Array
                        , iv: Uint8Array
                        , postKey: CryptoKey | null) {
  // TODO: get subtle.decrypt to print more detailed exceptions?
  console.log('Decrypting...')
  console.log(iv)
  console.log(postKey)
  console.log(ciphertext)
  if (postKey) {
    let decryptedBuffer: ArrayBuffer | null = null
    try {
     decryptedBuffer = await subtle.decrypt(
      { name: 'AES-GCM', iv }
      , postKey
      , ciphertext
    )
    } catch (e) {
      console.log(e)
    }

    if (decryptedBuffer) {
      const decompressed = pako.ungzip(decryptedBuffer)
      const text = Buffer.from(decompressed).toString()
      return text
    } else {
      console.log('Decryption failed')
      return null
    }
  }
  else {
    console.log('postKey was undefined')
    return null
  }
}


export function RandomPost() {
  const { posts } = usePosts()
  if (posts.length === 0)
    return <p>Loading...</p>
  else {
    const cachedSeen = window.localStorage.getItem('seen')
    const seen = new Set<string>(cachedSeen ? JSON.parse(cachedSeen) : null)
    let allNonStubs = new Set<string>(posts.filter(x => !x.tags.includes('stub'))
                                           .map(x => x.slug))
    // NOTE: set-difference is coming to JS, check if it's happened yet  https://github.com/tc39/proposal-set-methods
    for (const item of seen) {
      allNonStubs.delete(item)
    }
    const unseen = [...allNonStubs]
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
    if (posts.length === 0 && postKey) {
      // Get the big JSON of all posts if we have the key
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
        .then((x: string | null) => {
          if (x) {
            const parsed: Post[] = JSON.parse(x)
            setPosts(parsed)
            console.log(posts)
          }
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
        ,false
        ,['encrypt', 'decrypt']
      ).then((x) => setPostKey(x))
       .catch((error: Error) => console.log(error))
    }
  })

  const cachedSeen = window.localStorage.getItem('seen')
  const seen = cachedSeen ? JSON.parse(cachedSeen) : []
  
  if (location.pathname === '/') {
    const needLogin = (posts.length === 0 && !cookies.storedPostKey)
    return (<Navigate to={needLogin ? '/login' : '/posts'} />)
  }
  else return (
    <>
      <nav className="navbar is-size-7-mobile" role="navigation" aria-label="main navigation">
        <div className="navbar-brand">
          <Link className="navbar-item is-link is-narrow" to="/posts/about">About</Link>
          <Link className="navbar-item is-link is-narrow" to="/posts">All</Link>
          <Link className="navbar-item is-link is-narrow" to="/random">Random</Link>
          <div className="navbar-item is-info">{seen ? `Seen ${seen.length} of ${posts.length}` : '' }</div>
          <a role="button" className="navbar-burger" aria-label="menu" aria-expanded="false" data-target="navbarBasicExample">
            {/* Looks hacky, but Bulma recommends this method.  This makes three burger patties. */}
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
          </a>
        </div>
        <div id="navbarBasicExample" className="navbar-menu">
          <div className="navbar-end">
            <Link className="navbar-item is-link" to="/posts/blogroll">Blogroll</Link>
            <Link className="navbar-item is-link" to="/now">Now</Link>
            <Link className="navbar-item is-link" to="/login">Login</Link>
          </div>
        </div>
      </nav>

      <Suspense fallback={<p>Loading</p>}>
        <Outlet context={{ posts, setPosts,
                           postKey, setPostKey, }} />
        <ScrollRestoration />
      </Suspense>

      <footer className="footer has-text-centered">
        Martin Edström
        <br /><a href="https://github.com/meedstrom">GitHub</a>
        <br />LinkedIn
      </footer>

    </>
  )
}
