/* eslint semi: ["warn", "never"] */
import './App.css'
import React, { Suspense
              , useState
              , useEffect
              , memo
              } from 'react'
import { Route
       , Link
       , useParams
       , createBrowserRouter
       , createRoutesFromElements
       , RouterProvider
       } from 'react-router-dom'
import { Markup } from 'interweave'
import Login from './Login'

function BlogPost({ posts }) {
  const slug = useParams()["*"]
  const post = posts.find(x => x.slug === slug)
  if (typeof post === 'undefined')
    console.log(`Slug '${slug}' did not match any post`)
  else return (
    <div>
      <Link to='/'>Back to All notes</Link>
      <Markup content={post.content} />
    </div>
  )
}

function fontFromLength(charCount) {
  let frac = Math.log(charCount) / Math.log(500000)
  let size = 2 + frac * 20
  if (size < 7) size = 7
  return size
}

const RootPage = memo(function RootPage({posts}) {
  return (
    <div>
      <h1>All notes</h1>
      <table>
        <tbody>
          {posts.map(post => {
            // TODO: use post.wordcount when i compile new version of blob
            const fontSize = fontFromLength(post.content.length)
            const linkText = (post.title === '') ? post.slug : post.title
            return (
              <tr key={post.slug}>
                <td>
                  <Link to={'/posts/' + post.slug} style={{fontSize: fontSize + 'pt'}}>
                    {linkText}
                  </Link>
                </td>
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
  const storedPosts = window.localStorage.getItem('posts')
  const [posts, setPosts] = useState(
    (!storedPosts || storedPosts === 'undefined') ? [] : JSON.parse(storedPosts)
  )
  const [blob, setBlob] = useState([])

  // (Since setBlob affects state, it must be called inside an effect hook to
  // prevent an infinite render loop)
  useEffect(() => {
    if (posts.length === 0) {
      fetch('http://localhost:4040/allposts', {
        headers: { Accept: 'application/octet-stream' }
      }).then(x => x.arrayBuffer())
        .then(x => setBlob(x))
    }}, [posts.length])

  if (posts.length === 0)
    return <Login blob={blob} setPosts={setPosts} />
  
  const myRouter = createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route path="/" element={<RootPage posts={posts} />} />
        <Route path="/posts/*" element={<BlogPost posts={posts} />} />
      </>
    )
  )

  if (posts.length > 0)
    return (
      <div className="main-container">
        <Suspense fallback={<p>Attempting to load BrowserRouter. If it takes long, it prolly broke.</p>} >
          <RouterProvider router={myRouter} />
        </Suspense>
      </div>
    )
}

export default App
