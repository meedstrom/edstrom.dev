/* eslint semi: ["warn", "never"] */
import './App.css'
import React, { Suspense
              , useState
              , useEffect
              , memo
              } from 'react'
import {
         Link
       , Outlet
       , Navigate
       , useNavigate
       , useParams
       , useLocation
       , useOutletContext
       } from 'react-router-dom'
import { Markup } from 'interweave'
import useCookie from 'react-use-cookie'
import Login, { myDecrypt } from './Login'

const enc = new TextEncoder()
const dec = new TextDecoder()

interface Post {
   title: string
  ,slug: string
  ,content: string
  ,date: string
  ,wordcount: number
  ,tags: string[]
}

function BlogPost() {
  const slug = useParams()["*"]
  const [posts, setPosts,
         bytes, setBytes,
         cryptoKey, setCryptoKey]: any[] = useOutletContext()
  const post = posts.find((x: Post) => x.slug === slug)
  if (typeof post === 'undefined') {
    console.log(`Slug '${slug}' did not match any post`)
    return null
  }
  // TODO: use a nice spinner?
  else return (
    <Suspense fallback={<p>Loading</p>}>
      <div>
        <Link to='/'>Back to All notes</Link>
        <Markup content={post.content} />
      </div>
    </Suspense>
  )
}

function fontFromLength(charCount: number) {
  let frac = Math.log(charCount) / Math.log(50000)
  let size = 2 + frac * 20
  if (size < 7) size = 7
  return size
}

const BigList = memo(function BigList() {
  const [posts, setPosts,
         bytes, setBytes,
         cryptoKey, setCryptoKey]: any[] = useOutletContext()
  return (
    <div>
      <h1>All notes</h1>
      <table>
        <tbody>
          {posts.map((post: Post) => {
            const fontSize = fontFromLength(post.wordcount)
            const linkText = (post.title === '') ? post.slug : post.title
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
  const navigate = useNavigate()
  const storedPosts = window.sessionStorage.getItem('posts')
  const storedBytes = window.localStorage.getItem('bytes')
  const [cryptoKey, setCryptoKey] = useCookie('token')
  const [bytes, setBytes] = useState(
    (!storedBytes || storedBytes === 'undefined') ? new ArrayBuffer(0) : enc.encode(storedBytes)
  )
  const [posts, setPosts] = useState(
    (!storedPosts || storedPosts === 'undefined') ? [] : JSON.parse(storedPosts)
  )

  // (Since setBytes affects state, it must be called inside an effect hook to
  // prevent an infinite render loop)
  useEffect(() => {
    if (posts.length === 0) {
      if (bytes.byteLength === 0) {
        fetch('http://localhost:4040/allposts', {
          headers: { Accept: 'application/octet-stream' }
        }).then((x: Response) => x.arrayBuffer())
          .then((x: any) => {
            setBytes(x)
            window.localStorage.setItem('bytes', dec.decode(x))
          })
      }
      // if key cookie already exists, use that to decrypt instead of
      // directing user to the login page
      else if (cryptoKey !== '') {
        console.log('key: ' + cryptoKey)
        myDecrypt(bytes, cryptoKey)
               .then((x: Object) => {
                 console.log('I am here')
                 setPosts(x)
                 window.sessionStorage.setItem('posts', JSON.stringify(x))
               })
               .then(() => {
                 navigate('/all')
               })
      }
  }}, [bytes, cryptoKey])

  console.log(location.pathname)
  if (location.pathname === '/') {
    return <Navigate to={(posts.length === 0) ? '/login' : '/all'} />
  } else {
    return <Outlet context={[posts, setPosts,
                             bytes, setBytes,
                             cryptoKey, setCryptoKey]} />
  }
}

export { BlogPost, BigList, App }
