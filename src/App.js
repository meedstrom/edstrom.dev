/* eslint semi: ["warn", "never"] */
import './App.css'
import React, { Suspense
              , useState
              , useEffect
              , memo
              } from 'react'
import { BrowserRouter
       , Routes
       , Route
       , Link
       , useParams
       } from 'react-router-dom'
import { Markup } from 'interweave'
import { readMessage, decrypt } from 'openpgp/lightweight'

async function decryptPosts ( buffer, password ) {
  const byteBlob = new Uint8Array(buffer)
  const pgpBlob = await readMessage({
    binaryMessage: byteBlob
  })
  const { data: decryptedData } = await decrypt({
    message: pgpBlob
  , passwords: [password]
  , format: 'binary'
  })
  const string = new TextDecoder().decode(decryptedData)
  return JSON.parse(string)
}

function BlogPost({ posts }) {
  const slug = useParams()["*"]
  const post = posts.find(x => x.slug === slug)
  if (typeof post === 'undefined')
    console.log(`Slug '${slug}' did not match any post`)
  else return <Markup content={post.content} />
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
            // TODO: use post.wordcount
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
            )})}
        </tbody>
      </table>
    </div>
  )
})

function Login ({ blob, setPosts }) {
  const [password, setPassword] = useState('')
  const handleSubmit = (x) => {
    x.preventDefault()
    if (!blob) console.log('Not yet fetched posts from server')
    else decryptPosts(blob, password)
      .then(x => Object.values(x))
      .then(x => {
        setPosts(x)
        window.localStorage.setItem("posts", JSON.stringify(x))
      })
  }
  return (
    <div className="login-wrapper">
      <h1> Please log in </h1>
      <form onSubmit={handleSubmit}>
      <label>
        <p>Username</p>
        <input type="text" value="guest" readOnly />
      </label>
      <label>
        <p>Passphrase</p>
        <input type="password" onChange={x => setPassword(x.target.value)} />
      </label>
      <div>
        <button type="submit">Log in</button>
      </div>
    </form>
    </div>
  )
}

function App() {
  const storedPosts = window.localStorage.getItem('posts')
  const [posts, setPosts] = useState(
    (!storedPosts || storedPosts === 'undefined') ? [] : JSON.parse(storedPosts)
  )
  const [blob, setBlob] = useState([])

  // State must be set inside an effect hook to prevent infinite render loop
  useEffect(() => {
    if (posts.length === 0) {
      fetch('http://localhost:4040/allposts', {
        headers: { Accept: 'application/octet-stream' }
      }).then(x => x.arrayBuffer())
        .then(x => setBlob(x))
    }}, [posts.length])

  if (posts.length === 0)
    return <Login blob={blob} setPosts={setPosts} />

  if (posts.length > 0)
    return (
      <div className="main-container">
        <Suspense fallback={<p>Attempting to load BrowserRouter. If it takes long, it prolly broke.</p>} >
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<RootPage posts={posts} />} />
              <Route path="/posts/*" element={<BlogPost posts={posts} />} />
            </Routes>
          </BrowserRouter>
        </Suspense>
      </div>
    )
}

export default App
