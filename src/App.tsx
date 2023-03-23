/* eslint semi: ["warn", "never"] */
import './App.css'
import pako from 'pako'
import React from 'react'
import { useCookies } from 'react-cookie'
import { Interweave, Node } from 'interweave'
import { Buffer } from 'buffer'
import { HashLink as Link } from 'react-router-hash-link'
import postsJson from './posts.json'

import {
  Suspense
  ,useState
  ,useEffect
  ,memo
} from 'react'

import {
   Outlet
  ,Navigate
  ,ScrollRestoration
  ,useParams
  ,useLocation
  ,useOutletContext
} from 'react-router-dom'

const { subtle } = globalThis.crypto

interface Post {
   title: string
  ,slug: string
  ,content: string
  ,wordcount: number
  ,tags: string[]
  ,nonce: Uint8Array
  ,created: string
  ,updated: string
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
  console.log('post key: ')
  console.log(postKey)
  // TODO: catch more detailed exceptions?
  if (postKey) {
    const decryptedBuffer = await subtle.decrypt(
      { name: 'AES-GCM', iv }
      // { name: 'AES-GCM', iv, additionalData }
      , postKey
      , ciphertext
    )
    console.log('decrypted buffer: ' + decryptedBuffer)
    // const decompressedBytes = await new Response(decryptedBuffer).body.pipeThrough(new DecompressionStream('gzip'))
    // return await new Response(decompressedBytes).text()
    const decompressed = pako.ungzip(decryptedBuffer)
    const text = Buffer.from(decompressed).toString()
    console.log(text)
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
function rewriteLinkTags (node: HTMLElement, children: Node[]): React.ReactNode {
  if (node.tagName.toLowerCase() === "a") {
    const href = node.getAttribute('href')
    if (href) return <Link to={href}>{children}</Link>
  }
}

// Maybe can make perf even faster by pre-decrypting every linked-to post in the
// current post.  I suspect that would radically change what goes in the BlogPost
// component in the first place, maybe remove all its current hooks, work done
// jus after Interweave instead.
export function BlogPost() {
  const { posts } = usePosts()
  const { postKey } = usePostKey()
  const [postContent, setPostContent] = useState('')
  const slug = useParams()["*"]
  const post = posts.find((x: Post) => x.slug === slug )

  useEffect(() => {
    if (typeof post !== 'undefined') {
      document.title = post.title
      let ciphertext = new Uint8Array(Buffer.from(post.content, 'base64'))
      let iv = post.nonce
      console.log('post: ')
      console.log(post)
      console.log('nonce encoded as iv: ')
      console.log(iv)
      // let additionalData = new Uint8Array(Buffer.from(post.title))
      myDecrypt(
        ciphertext
        ,iv
        // ,additionalData
        ,postKey
      ).then(x => setPostContent(x))
       .catch((err) => {
        console.log('failed to decrypt because:' + err)
      })
    }
  })

  if (typeof post === 'undefined') {
    return <p>Post hidden or not yet fetched: {slug}  <Link to='/login'>Back to Login</Link></p>
  }

  const tags = (post.tags[0] === '') ? '' : 'Tags: ' + post.tags.join(', ')

  console.log('value of postContent: ')
  console.log(postContent)
  
  // NOTE: For some reason backing up by linking to -1 pushes three entries
  // on history!  Bug?  So I go with a "not-actually-a-back-button".
  return (
    <>
      <SplitPane left={<Link to='/posts'>Back to All notes</Link>} right={tags} />
      <Suspense fallback={post.content}>
        <Interweave content={postContent} transform={rewriteLinkTags}/>
      </Suspense>
    </>
  )
}

function fontFromLength(wordCount: number) {
  const ratioOfMax = Math.log(wordCount) / Math.log(50000)
  const size = 2 + ratioOfMax * 20
  return size < 7 ? 7 : size
}

export const BigList = memo(function BigList() {
  useEffect(() => { document.title = 'All posts' })
  const { posts } = usePosts()
  // if (posts && posts.length > 0) {
    return (
      <div>
        <h1>All notes</h1>
        <Suspense fallback={<p>Loading...  This shouldn't take more than a second.</p>}>
          <table>
            <tbody>
              {posts.map((post: Post) => {
                const fontSize = fontFromLength(post.wordcount)
                const linkText = post.title === '' ? post.slug : post.title
                const tags = post.tags.join(",")
                return (
                  <tr key={post.slug}>
                    <td>
                      <Link to={'/posts/' + post.slug} style={{fontSize: fontSize + 'pt'}}>
                        {linkText}
                      </Link>
                    </td>
                    <td>{tags}</td>
                    <td>{post.created}</td>
                    <td>{post.updated}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Suspense>
      </div>
    )

})

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
  /* const [storedPostKey, setStoredPostKey] = useCookie('storedPostKey') */
  const [postKey, setPostKey] = useState<CryptoKey | null>(null)
  const [posts, setPosts] = useState<Post[]>([])

  // console.log('stored key: ' + cookies.storedPostKey)
  
  useEffect(() => {
    // Get the big JSON of all posts
    if (posts.length === 0) {
      const x: Post[] = postsJson.map((post: any) => {
        post.nonce = new Uint8Array(Object.values(post.nonce))
        return post
      })
      setPosts(x)
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

  if (location.pathname === '/')
    return (<Navigate to={!cookies.storedPostKey ? '/login' : '/posts'} />)

  else return (
    <Suspense fallback={<p>Loading</p>}>
      <Outlet context={{ posts, setPosts
                       , postKey, setPostKey }} />
      <ScrollRestoration />
    </Suspense>
  )
}
