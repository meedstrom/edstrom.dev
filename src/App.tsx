/* eslint semi: ["warn", "never"] */
import './App.css'
import React, { Suspense
              , useState
              , useEffect
              , memo
              } from 'react'
import { Route
       , Link
       , Navigate
       , useParams
       , createBrowserRouter
       , createRoutesFromElements
       , RouterProvider
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

function BlogPost({ posts }: { posts: Post[] }) {
  const slug = useParams()["*"]
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

const BigList = memo(function BigList({ posts }: { posts: Post[] }) {
  return (
    <div>
      <h1>All notes</h1>
      <table>
        <tbody>
          {posts.map(post => {
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

function App() {
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
      if (cryptoKey !== null && cryptoKey !== 'undefined' && bytes.byteLength > 0) {
        myDecrypt(bytes, cryptoKey)
          .then((x: any) => Object.values(x))
          .then((x: Object) => {
            setPosts(x)
            window.sessionStorage.setItem('posts', JSON.stringify(x))
          })
      }
  }}, [posts, bytes, cryptoKey])

  // TODO: Find out how to allow the back button to not trigger the warning
  // ""You are trying to use a blocker on a POP navigation to a location that was
  // not created by @remix-run/router.""

  // Maybe if I move the router to absolute root level in index.tsx and DON'T
  // pass any props?  Because I can't lift state that far.
  // I would go about it like .. either putting the necessary props in Context or ..
  // the useEffect stuff could sit in the index.tsx as outside-of-React stuff.
  const myRouter = createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route path="/" element={<Navigate replace to={posts.length === 0 ? '/login' : '/all'} />} />
        <Route path="/posts/*" element={<BlogPost posts={posts} />} />
        <Route path="/login" element={<Login bytes={bytes} setPosts={setPosts} cryptoKey={cryptoKey} setCryptoKey={setCryptoKey} />} />
        <Route path="/all" element={<BigList posts={posts} />} />
      </>
    )
  )
  return <RouterProvider router={myRouter} />
}

export default App
