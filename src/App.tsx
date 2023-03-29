/* eslint semi: ["warn", "never"] */
import './App.css'
import pako from 'pako'
import { useCookies } from 'react-cookie'
import React from 'react'
import { Interweave, Node } from 'interweave'
import { Buffer } from 'buffer'
import { HashLink as Link } from 'react-router-hash-link'
// import postsBin from './posts.bin'

import {
  Suspense,
  useState,
  useEffect,
} from 'react'

import {
  Outlet,
  Navigate,
  ScrollRestoration,
  useParams,
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
                        // , additionalData: Uint8Array
                        , postKey: CryptoKey | null) {
  // TODO: catch more detailed exceptions? with try/catch?
  console.log(iv)
  console.log(postKey)
  console.log(ciphertext)
  if (postKey) {
    const decryptedBuffer = await subtle.decrypt(
      { name: 'AES-GCM', iv }
      // { name: 'AES-GCM', iv, additionalData }
      , postKey
      , ciphertext
    )
    // const decompressedBytes = await new Response(decryptedBuffer).body.pipeThrough(new DecompressionStream('gzip'))
    // return await new Response(decompressedBytes).text()
    const decompressed = pako.ungzip(decryptedBuffer)
    const text = Buffer.from(decompressed).toString()
    return text
    /* return await new Response(decryptedBuffer).text() */
  }
  else {
    console.log('postKey was undefined')
    return 'Decryption failed'
  }
}

// I used to render the Org-exported HTML with just <Markup />,
// which meant the links were <a> tags, unhandled by React Router.
// For the user, clicking these links had an effect similar to as
// if they'd entered the URLs manually: an ugly transition involving
// a Flash Of Unstyled Content.
// Solution: rewrite all the <a href=...> into <Link to=...>, so React
// Router handles the links!
// NOTE: destroys any other props in the <a> tag
function rewriteLinkTags (node: HTMLElement, children: Node[]): React.ReactNode {
  if (node.tagName.toLowerCase() === "a") {
    const href = node.getAttribute('href')
    if (href) {
      return <Link className={className} to={href}>{children}</Link>
    }
  }
}

// Maybe can make perf even faster by pre-decrypting every linked-to post in the
// current post.  I suspect that would radically change what goes in the BlogPost
// component in the first place, maybe remove all its current hooks, work done
// jus after Interweave instead.
export function BlogPost() {
  const { posts } = usePosts()
  const slug = useParams()["*"]
  const post = posts.find((x: Post) => x.slug === slug )

  useEffect(() => {
    if (typeof post !== 'undefined') {
      document.title = post.title
    }
  })

  if (typeof post === 'undefined') {
    return (
      <div><p>Getting post: {slug}...</p><p>It may be hidden or it may not exist.</p></div>
    )
  }

  function daysSince(then: string) {
    const unixNow = new Date().getTime()
    const unixThen = new Date(then).getTime()
    return Math.round((unixNow - unixThen) / (1000 * 60 * 60 * 24))
  }

  const daysSinceUpdate = daysSince(post.updated)
  const informalUpdatedDate = (daysSinceUpdate === 1) ? 'yesterday'
                            : (daysSinceUpdate === 0) ? 'today'
                            : (daysSinceUpdate > 730) ? `${Math.round(daysSinceUpdate/730)} years ago`
                            : (daysSinceUpdate > 60) ? `${Math.round(daysSinceUpdate/30)} months ago`
                            : (daysSinceUpdate > 30) ? 'a month ago'
                            : `${daysSinceUpdate} days ago`


  // NOTE: For some reason backing up by linking to -1 pushes three entries
  // on history!  Bug?  So I go with a "not-actually-a-back-button".
  return (
    <>
      <Suspense fallback={<p>Decrypting... This should take just a second.</p>}>
        <table>
          <tr>
            <td>Planted</td>
            <td><time className='dt-published' dateTime={post.created}>{post.created}</time></td>
          </tr>
          <tr>
            <td>Last growth</td>
            <td><time className='dt-updated' dateTime={post.updated}>{informalUpdatedDate}</time></td>
          </tr>
          {(post.tags[0] !== '') ? (
            <tr>
              <td>Tags</td>
              <td>{post.tags.join(', ')}</td>
            </tr>
          ) : ''}
        </table>
        <article aria-labelledby='title'>
          <Interweave content={post.content} transform={rewriteLinkTags}/>
        </article>
      </Suspense>
    </>
  )
}

// use like <SplitPane left={<Contacts /> } right={<Chat /> } />
 function SplitPane(props: any) {
  return (
    <div className="SplitPane">
      <div className="SplitPane-left">
        {props.left}      </div>
      <div className="SplitPane-right">
        {props.right}      </div>
    </div>
  )
}

type ContextType = {
   postKey: CryptoKey | null
  ,setPostKey: Function
  ,posts: Post[]
  ,setPosts: Function
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
              cache: "default"
            }
      )
        .then((x: Response) => x.arrayBuffer())
        .then((x: any) => {
          const iv = new Uint8Array(x.slice(0, 16))
          const ciphertext = new Uint8Array(x.slice(16))
          return myDecrypt(ciphertext, iv, postKey)
        })
        .then((x: any) => {
          const parsed = JSON.parse(x)
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

  if (location.pathname === '/') {
    const needLogin = (posts.length === 0 && !cookies.storedPostKey)
    return (<Navigate to={needLogin ? '/login' : '/posts'} />)
  }

  else return (
    <>
      <nav className='top-bar'>
        <Link to='/posts'>All notes</Link>
        <Link to='/about'>About</Link>
        <Link to='/now'>Now</Link>
        <Link to='/login'>Login</Link>
      </nav>
      <main>
        <Suspense fallback={<p>Loading</p>}>
          <Outlet context={{ posts, setPosts
                           , postKey, setPostKey }} />
          <ScrollRestoration />
        </Suspense>

        <footer>
          Martin Edström
          <br /><a href='https://github.com/meedstrom'>GitHub</a>
          <br />LinkedIn
        </footer>
      </main>
    </>
  )
}
