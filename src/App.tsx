/* eslint semi: ["warn", "never"] */
import './bulmaConfig.scss'
import icon from './information-mark-circle-outline-icon.svg'
import pako from 'pako'
import { Post } from './index'
import { useCookies } from 'react-cookie'
import { Buffer } from 'buffer'
import { HashLink as Link } from 'react-router-hash-link'
import { OnChangeFn,
         SortingState, } from '@tanstack/react-table'
import { Suspense,
         useEffect,
         useState, } from 'react'
import { Navigate,
         Outlet,
         ScrollRestoration,
         useLocation,
         useOutletContext, } from 'react-router-dom'

const { subtle } = globalThis.crypto

// NOTE: Yes it's plaintext.  Doesn't need to be secret from who reads the
// code; the wrapping key is not the encryption key.
export async function getHardcodedWrappingKey() {
   return await subtle.importKey(
    'raw'
    ,new Uint8Array([30,225,107,217,205,158,108,110,187,158,194,55,203,81,30,84,109,198,83,29,23,130,131,28,110,122,228,24,11,97,140,7])
    ,'AES-KW'
    ,false
    ,['wrapKey', 'unwrapKey']
  )
}

async function myDecrypt( ciphertext: Uint8Array
                        , iv: Uint8Array
                        , postKey: CryptoKey | null) {
  // TODO: get subtle.decrypt to print more detailed exceptions?
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

type AppContextType = {
  postKey: CryptoKey | null,
  setPostKey(a: CryptoKey | null): void,
  posts: Post[],
  setPosts(a: Post[]): void,
  sorting: SortingState,
  setSorting: OnChangeFn<SortingState>,
}

export function useAppContext() {
  return useOutletContext<AppContextType>()
}

export function App({posts, setPosts}: any) {
  const location = useLocation()
  const [cookies] = useCookies(['storedPostKey', 'who'])
  const [postKey, setPostKey] = useState<CryptoKey | null>(null)
  const [publicPosts, setPublicPosts] = useState<Post[]>([])
  const [privatePosts, setPrivatePosts] = useState<Post[]>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const seen = JSON.parse(window.localStorage.getItem('seen') ?? '[]')

  // Get postKey out of cookie, if it exists
  // Should only run once per session
  useEffect(() => {
    if (!postKey && cookies.storedPostKey) {
      getHardcodedWrappingKey()
        .then(wrappingKey => {
          return subtle.unwrapKey(
            'raw'
            ,new Uint8Array(Buffer.from(cookies.storedPostKey, 'base64'))
            ,wrappingKey
            ,'AES-KW'
            ,'AES-GCM'
            ,false
            ,['encrypt', 'decrypt']
          )
        }).then((x) => setPostKey(x))
        .catch((error: Error) => console.log(error))
    }
  }, [cookies.storedPostKey])

  // Get the big JSON of public posts
  // Should only run once per session
  useEffect(() => {
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
        })
    }
  }, [publicPosts])

  // Get the big JSON of private posts once we have the key
  useEffect(() => {
    if (privatePosts.length === 0 && postKey) {
      fetch(process.env.PUBLIC_URL + '/extraPosts.bin', {
        headers: {
          "Accept": 'application/octet-stream',
          "Cache-Control": 'max-age=8640, private',
        },
        cache: "default",
      })
        .then((x: Response) => x.arrayBuffer())
        .then((x: any) => {
          const iv = new Uint8Array(x.slice(0, 16))
          const ciphertext = new Uint8Array(x.slice(16))
          return myDecrypt(ciphertext, iv, postKey)
        })
        .then((x: string | null) => {
          if (x) {
            const parsed: Post[] = JSON.parse(x)
            setPrivatePosts(parsed)
          }
        })
    }
  }, [privatePosts, postKey])

  // Reveal (some subset of) private posts if applicable
  useEffect(() => {
    if (cookies.who && cookies.who !== 'nobody' && privatePosts.length !== 0) {
      // Yes it's a bit... crude... but I trust my friends not to elevate
      // their access level ;-)  And non-friends lack the other cookie.
      const allowedTags = new Set<string>(
        (cookies.who === 'therapist') ? ['eyes-friend', 'eyes-partner', 'eyes-therapist']
        : (cookies.who === 'partner') ? ['eyes-friend', 'eyes-partner']
        : (cookies.who === 'friend') ? ['eyes-friend']
        : []
      )
      const subset = privatePosts.filter((post: Post) => post.tags.find(tag => allowedTags.has(tag)))
      const newCollection = [...subset, ...publicPosts].sort(
        // order most recently created on top
        (a, b) => b.created.localeCompare(a.created)
      )
      if (posts.length !== newCollection.length) {
        setPosts(newCollection)
      }
    }
  }, [cookies, publicPosts, privatePosts])

  const toggleMenu = () => {
    // e.preventDefault()
    const button = document.getElementById('mainNavBtn')
    // Get the target from the "data-target" HTML attribute
    const buttonTarget = button ? button.dataset.target : null
    const menu = (typeof buttonTarget === 'string') ? document.getElementById(buttonTarget) : null
    if (button) button.classList.toggle('is-active')
    if (menu) menu.classList.toggle('is-active')
  }
  
  if (location.pathname === '/') {
    return <Navigate to='/posts/about' />
  }
  else return (
    <>
      <nav className="navbar" role="navigation" aria-label="main navigation">
        <div className="navbar-brand">
          <Link className="navbar-item is-link" to="/posts/about"><img src={icon} alt="Go to the About-page" width="24px" /></Link>
          {/* <Link className="navbar-item is-link" to="/posts/about">️🛟</Link> */}
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
            <Link className="navbar-item is-link" onClick={toggleMenu} to="/posts/home">Nexus</Link>
            <Link className="navbar-item is-link" onClick={toggleMenu} to="/posts">Grand List</Link>
            <Link className="navbar-item is-link" onClick={toggleMenu} to="/random">Random</Link>
            {/* <Link className="navbar-item is-link" onClick={toggleMenu} to="/now">Now</Link> */}
            <Link className="navbar-item is-link" onClick={toggleMenu} to="/posts/about">About</Link>
            <Link className="navbar-item is-link" onClick={toggleMenu} to="/posts/blogroll">Blogroll</Link>
            <Link className="navbar-item is-link" onClick={toggleMenu} to="/login">Login</Link>
          </div>
        </div>
      </nav>

      <Suspense fallback={<p>Loading...</p>}>
        <Outlet context={{
          posts, setPosts,
          postKey, setPostKey,
          sorting, setSorting,
        }} />
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
