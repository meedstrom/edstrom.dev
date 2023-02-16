import './App.css'
import React, { Suspense
              , useState
              , useEffect
              } from 'react'
import { BrowserRouter
         , Routes
         , Route
         , Link
         , useParams } from 'react-router-dom'
import useCookie from 'react-use-cookie'
import { Markup } from 'interweave'
import { readMessage, decrypt } from 'openpgp/lightweight'
// import useTable from 'react-table'

async function decryptPosts ( buffer, password ) {
  const byteBlob = new Uint8Array(buffer)
  const pgpBlob = await readMessage({
    binaryMessage: byteBlob
  })
  console.log('password: ' + password) // check that it's still there
  const { data: decryptedData } = await decrypt({
    message: pgpBlob
    // TODO: get the passphrase from user
    // and then enter it here like
    // , passwords: [password]
    , passwords: ['xoa2ziegh3ooYuichiepuoh4ohveey']
    , format: 'binary'
  })

  var string = new TextDecoder().decode(decryptedData)
  return JSON.parse(string)
}

function BlogPost({ posts }) {
  const slug = useParams()["*"]
  const post = posts.find(x => x.slug === slug)
  if (typeof post === 'undefined') {
    console.log(`Slug '${slug}' did not match any post`)
  }
  else {
    return <Markup content={post.content} />
  }
}

function fontFromLength(charCount) {
  let frac = Math.log(charCount) / Math.log(500000)
  let size = 2 + frac * 20
  if (size < 7) {
    size = 7
  }
  return size
}

function RootPage({posts}) {
  return (
    <div>
      <h1>All notes</h1>
      <table>
        <tbody>
        {posts.map(post => {
          const fontSize = fontFromLength(post.content.length)
          let urlText = post.title
          if (post.title === '') urlText = post.slug
          return (
            <tr key={post.slug}>
              <td>
                <Link to={'/posts/' + post.slug} style={{fontSize: fontSize + 'pt'}}>
                  {urlText}
                </Link>
              </td>
              <td>{post.date}</td>
            </tr>
          )})}
        </tbody>
      </table>
    </div>
  )
}

async function loginUser(creds) {
  return fetch('http://localhost:4040/login', {
    method: 'POST'
    , headers: { 'Content-Type': 'application/json' }
    , body: JSON.stringify(creds)
  }).then(data => data.json())
}

function Login ({ setAuthToken, password, setPassword }) {
  // const username = 'guest'
  const handleSubmit = async (x) => {
    x.preventDefault()
    const token = await loginUser({ username: 'guest', password })
    setAuthToken(token, {
        days: 7
      , sameSite: 'Strict'
      , secure: true
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
        <button type="submit">I accept a cookie, log me in</button>
      </div>
    </form>
    </div>
  )
}

function App() {
  const [posts, setPosts] = useState([])
  const [password, setPassword] = useState()
  const [authToken, setAuthToken] = useCookie('token')
  const runOnceHack = true // this never changes

  // TODO: persist the value of 'posts' in sessionStorage
  // so like, don't fetch if it already exists here
  const sessionPosts = window.sessionStorage.getItem("posts")
  useEffect(() => {
    if (posts.length === 0) {
      if (sessionPosts) {
        setPosts(sessionPosts)
      }
      else {
        fetch('http://localhost:4040/allposts', {
          headers: { Accept: 'application/octet-stream' }
        }).then(x => x.arrayBuffer())
          .then(x => decryptPosts(x, password))
          .then(x => Object.values(x))
          .then(x => setPosts(x))
      }
    }}, [runOnceHack])
  // React.useMemo(() => [x]))  // for react-table

  if (!authToken) {
    return <Login setAuthToken={setAuthToken} setPassword={setPassword} password={password} />
  }
  if (posts.length > 0) {
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
}

export default App
