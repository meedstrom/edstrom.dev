/* eslint semi: ["warn", "never"] */
import './bulmaConfig.scss'
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

// NOTE: Yes it's plaintext.  It doesn't need to be secret from who reads the
// code.  The wrapping key is not the encryption key.
export async function hardcodedWrappingKey() {
   return await subtle.importKey(
    'raw'
    ,new Uint8Array([30,225,107,217,205,158,108,110,187,158,194,55,203,81,30,84,109,198,83,29,23,130,131,28,110,122,228,24,11,97,140,7])
    ,'AES-KW'
    ,false
    ,['wrapKey', 'unwrapKey']
  )
}

// Doesn't follow React paradigm, but it's for consumption by randomPost() in
// index.tsx which cannot be a component and thus cannot use a hook. IDK the way.
export var postsBackdoor: Post[] = []

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
  const [cookies] = useCookies(['storedPostKey', 'who'])
  const [postKey, setPostKey] = useState<CryptoKey | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [publicPosts, setPublicPosts] = useState<Post[]>([])
  const [privatePosts, setPrivatePosts] = useState<Post[]>([])
  /* const [wrappingKey, setWrappingKey] = useState<CryptoKey | null>() */

  useEffect(() => {
    /* if (!wrappingKey) {
     *   hardcodedWrappingKey().then(x => setWrappingKey(x))
     * }
     */

    // Get postKey out of cookie, if it exists
    if (!postKey && cookies.storedPostKey) {
      hardcodedWrappingKey()
        .then(wrappingKey => {
          return subtle.unwrapKey(
            'raw'
            ,new Uint8Array(Buffer.from(cookies.storedPostKey, 'base64'))
            ,wrappingKey
            ,'AES-KW'
            ,'AES-GCM'
            ,false
            ,['encrypt', 'decrypt']

        )}).then((x) => setPostKey(x))
        .catch((error: Error) => console.log(error))
    }
    // Get the big JSON of public posts
    if (posts.length === 0) {
      fetch(process.env.PUBLIC_URL + '/posts.json.gz',
            {
              headers: {
                "Accept": 'application/octet-stream',
                "Cache-Control": 'max-age=8640, private',
              },
              cache: "default",
            }
      )
        .then((x: Response) => x.arrayBuffer())
        .then((x: any) => {
          const parsed: Post[] = JSON.parse(Buffer.from(pako.ungzip(x)).toString())
          setPosts(parsed)
          setPublicPosts(parsed)
          postsBackdoor = parsed
        })
    }
    // Get the big JSON of private posts if we have the key
    if (privatePosts.length === 0 && postKey) {
      fetch(process.env.PUBLIC_URL + '/extraPosts.bin',
            {
              headers: {
                "Accept": 'application/octet-stream',
                "Cache-Control": 'max-age=8640, private',
              },
              cache: "default",
            }
      )
        .then((x: Response) => x.arrayBuffer())
        .then((x: any) => {
          console.log('should be a massive arraybuffer:')
          console.log(x)
          const iv = new Uint8Array(x.slice(0, 16))
          const ciphertext = new Uint8Array(x.slice(16))
          return myDecrypt(ciphertext, iv, postKey)
        })
        .then((x: string | null) => {
          if (x) {
            console.log(x)
            const parsed: Post[] = JSON.parse(x)
            console.log("got the private posts!")
            console.log(parsed)
            setPrivatePosts(parsed)
          }
        })
    }
    if (cookies.who && cookies.who !== 'nobody' && privatePosts.length !== 0) {
      const allowedTags = new Set<string>(
        (cookies.who === 'therapist') ? ['eyes-friend', 'eyes-partner', 'eyes-therapist']
        : (cookies.who === 'partner') ? ['eyes-friend', 'eyes-partner']
        : (cookies.who === 'friend') ? ['eyes-friend']
        : []
      )
      const subset = privatePosts.filter((post: Post) => post.tags.find(tag => allowedTags.has(tag)))
      console.log('adding the following subset:')
      console.log(subset)
      const newCollection = [...subset, ...publicPosts]
      // prevent infinite render loop
      if (posts.length !== newCollection.length) {
        setPosts(newCollection)
        postsBackdoor = newCollection
      }
    }
  }, [postKey, cookies, posts, privatePosts, publicPosts])

  const toggleMenu = () => {
    // e.preventDefault()
    // Get the target from the "data-target" attribute
    const button = document.getElementById('mainNavBtn')
    const buttonTarget = button ? button.dataset.target : null
    const menu = (typeof buttonTarget === 'string') ? document.getElementById(buttonTarget) : null
    // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
    if (button) button.classList.toggle('is-active')
    if (menu) menu.classList.toggle('is-active')
  }


  const seen = JSON.parse(window.localStorage.getItem('seen') ?? '[]')
  
  if (location.pathname === '/') {
    return <Navigate to='/posts' />
  }
  else return (
    <>

      <nav className="navbar" role="navigation" aria-label="main navigation">
        <div className="navbar-brand">
          <Link className="navbar-item is-link" to="/posts">{`Seen ${seen.length} of ${posts.length}`}</Link>
          <Link className="navbar-item is-link" to="/random">Random</Link>
          <a id="mainNavBtn" onClick={toggleMenu} role="button" className="navbar-burger" aria-label="menu" aria-expanded="false" data-target="mainNav">
            {/* Looks hacky, but Bulma mandates this method.  This makes three burger patties. */}
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
          </a>
        </div>
        <div id="mainNav" className="navbar-menu">
          <div className="navbar-start">
          </div>
          <div className="navbar-end">
            <Link className="navbar-item is-link" onClick={toggleMenu} to="/posts/about">About</Link>
            <Link className="navbar-item is-link" onClick={toggleMenu} to="/posts">All</Link>
            <Link className="navbar-item is-link" onClick={toggleMenu} to="/now">Now</Link>
            <Link className="navbar-item is-link" onClick={toggleMenu} to="/posts/blogroll">Blogroll</Link>
            <Link className="navbar-item is-link" onClick={toggleMenu} to="/login">Login</Link>
          </div>
        </div>
      </nav>

      <Suspense fallback={<p>Loading...</p>}>
        <Outlet context={{ posts, setPosts,
                           postKey, setPostKey, }} />
        <ScrollRestoration />
      </Suspense>

      <footer className="footer has-text-centered">
        Martin Edström
        <br /><a href="https://github.com/meedstrom">GitHub</a>
        {/* <br />LinkedIn */}
      </footer>

    </>
  )
}
