/* eslint semi: ["warn", "never"] */
import './App.css'
/* import encryptedBlob from 'file!./encryptedBlob.bin' */
// import { file as encryptedBlob } from './encryptedBlob.bin'
import React from 'react'
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

import useCookie from 'react-use-cookie'
import { HashLink as Link } from 'react-router-hash-link'
import { Interweave, Node } from 'interweave'
import { Buffer } from 'buffer'

const { subtle } = globalThis.crypto
const enc = new TextEncoder()
const dc  = new TextDecoder()
interface Post {
   title: string
  ,slug: string
  ,content: string
  ,date: string
  ,wordcount: number
  ,tags: string[]
  // ,nonce: Uint8Array
  // ,created: string
  // ,updated: string
}

async function myDecrypt( bytes : ArrayBuffer, password: string ) {
  const key = await subtle.importKey(
    'raw'
    , new Uint8Array(Buffer.from(password, 'base64'))
    , { name: 'AES-GCM', length: 256 }
    , false
    , ['encrypt', 'decrypt']
  )
  const additionalData = new Uint8Array(bytes.slice(0, 10))
  const iv = new Uint8Array(bytes.slice(10, 26))
  const ciphertext = new Uint8Array(bytes.slice(26))
  const decryptedBuffer = await subtle.decrypt(
    { name: 'AES-GCM', iv, additionalData }
    , key
    , ciphertext
  )
  // It seems these are equivalent!
  const plaintext = dc.decode(decryptedBuffer)
  // const plaintext = Buffer.from(decryptedBuffer).toString()
  const json = JSON.parse(plaintext)
  return json
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
    if (!href)
      return null // don't replace the element
    else
      return <Link to={href}>{children}</Link>
  }
}

// TODO: is it still possible to memoize when its "inputs" vary only via the link params?
// TODO: if yes to the above, figure out how to 'prefetch' every relative link in the Interweave body, and to cache more than 1 memo...
// https://omarelhawary.me/blog/file-based-routing-with-react-router-pre-loading
// https://stackoverflow.com/questions/48842892/cache-react-router-route/70875994#70875994
// const BlogPost = memo(function BlogPost() {
function BlogPost() {
  const [posts, setPosts, bytes, setBytes, cryptoKey, setCryptoKey]: any[] = useOutletContext()
  const slug = useParams()["*"]
  //useEffect(() => { document.title = slug })
  const post = posts.find((x: Post) => x.slug === slug)
  if (typeof post === 'undefined') {
    return <p>Post hidden or deleted: {slug}</p>
  }
 
  const tags = (post.tags[0] === '') ? '' : 'Tags: ' + post.tags.join(', ')
  //useEffect(() => { document.title = post.title })

  // NOTE: For some reason backing up by linking to -1 pushes three entries
  // on history!  Bug?  So I go with a "not-actually-a-back-button".
  return <div>
    <div><Link to='/posts'>Back to All notes</Link> {tags}</div>
    <Interweave content={post.content} transform={rewriteLinkTags}/>
  </div>
}

function fontFromLength(wordCount: number) {
  const ratioOfMax = Math.log(wordCount) / Math.log(50000)
  const size = 2 + ratioOfMax * 20
  return size < 7 ? 7 : size
}

const BigList = memo(function BigList() {
  useEffect(() => { document.title = 'All posts' })
  const [posts, setPosts, bytes, setBytes, cryptoKey, setCryptoKey]: any[] = useOutletContext()
  return (
    <div>
      <h1>All notes</h1>
      <Suspense fallback={<p>Decrypting...  This shouldn't take more than a second.</p>}>
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
                  <td>{post.date}</td>
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
// function SplitPane(props: Object) {
//  return (
//    <div className="SplitPane">
//      <div className="SplitPane-left">
//        {props.left}      </div>
//      <div className="SplitPane-right">
//        {props.right}      </div>
//    </div>
//  )
//}

function App() {
  const location = useLocation()
  const storedPosts = window.sessionStorage.getItem('posts')
  const storedBytes = window.localStorage.getItem('bytes')
  const [cryptoKey, setCryptoKey] = useCookie('token')
  const [bytes, setBytes] = useState(
    (!storedBytes || storedBytes === 'undefined') ? new ArrayBuffer(0) : enc.encode(storedBytes)
  )
  const [posts, setPosts] = useState(
    (!storedPosts || storedPosts === 'undefined') ? [] : JSON.parse(storedPosts)
  )

  // (Since setBytes and setPosts affect state, they must be called inside this
  // effect hook to prevent an infinite render loop)
  useEffect(() => {
    // Expire old cache
    // const storageDate = Number(window.localStorage.getItem('storageDate'))
    // if (isNaN(storageDate) || Date.now() > (storageDate + 86400000)) {
    //   window.localStorage.setItem('storageDate', Date.now().toString())
    //   setBytes(new ArrayBuffer(0))
    // }
    if (posts.length === 0) {
      if (bytes.byteLength === 0)
        fetch(process.env.PUBLIC_URL + '/encryptedBlob.bin'
             ,{ headers: { Accept: 'application/octet-stream' }})
        .then((x: Response) => x.arrayBuffer())
        .then((x: any) => {
          setBytes(x)
          window.localStorage.setItem('bytes', dc.decode(x))
          window.localStorage.setItem('storageDate', Date.now().toString())
        })
        .catch((error: any) => console.log(error))
      else if (cryptoKey !== '')
        myDecrypt(bytes, cryptoKey)
        .then((x: Object) => {
          setPosts(x)
          window.sessionStorage.setItem('posts', JSON.stringify(x))
        })
    }
  })

  // TODO: Apply the weird typescript adaptation in https://reactrouter.com/en/main/hooks/use-outlet-context
  //       or stop warning about @typescript-eslint/no-unused-vars
  //       or find a way to retrieve only specific vars from a context (seems impossible?)
  if (location.pathname === '/')
    return <Navigate to={(posts.length === 0) ? '/login' : '/posts'} />
  else
    return <Suspense fallback={<p>Loading</p>}>
             <Outlet context={[posts,     setPosts,
                               bytes,     setBytes,
                               cryptoKey, setCryptoKey]} />
             <ScrollRestoration />
           </Suspense>
}

export { BlogPost, BigList, App }
