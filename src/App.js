import './App.css'
import React, { Suspense
                , useState
                 } from 'react'
import { BrowserRouter
         , Routes
         , Route
         , Link
         , useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import useCookie from 'react-use-cookie'

function BlogPost({ posts }) {
  let { slug } = useParams()
  let post = posts.find(x => x.slug === slug)
  if (typeof post === 'undefined') {
    console.log(`Slug '${slug}' did not match any post`)
  }
  else if (post.type === 'md') {
    return (
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {post.content}
      </ReactMarkdown>
    )
  }
  else if (post.type === 'html') {
    let chunk = {__html: post.content}
    return (
      <div dangerouslySetInnerHTML={chunk} />
    )
  }
}

function RootPage({ posts }) {
  return (
    <div>
      <h1>Martin's notes</h1>
      <ul>
        {posts.map(post => { return (
                   <li key={post.id}>
                     <Link to={'/posts/' + post.slug}>
                       {'/posts/' + post.slug}
                     </Link>
                   </li>
        )})}
      </ul>
    </div>
  )
}

function Dashboard () {
  return <h2>Dashboard</h2>
}

async function loginUser(creds) {
  return fetch('http://localhost:4040/login', {
    method: 'POST'
    , headers: { 'Content-Type': 'application/json' }
    , body: JSON.stringify(creds)
  }).then(data => data.json())
}

function Login ({ setUserToken }) {
  const [username, setUsername] = useState()
  const [password, setPassword] = useState()

  const handleSubmit = async x => {
    x.preventDefault()
    const token = await loginUser({ username, password })
    setUserToken(token, {
        days: 7
      , sameSite: 'Strict'
      , secure: true
      // , httpOnly: true
    })
  }

  return (
    <div className="login-wrapper">
      <h1> Please log in </h1>
      <form onSubmit={handleSubmit}>
      <label>
        <p>Username</p>
        <input type="text" onChange={x => setUsername(x.target.value)} />
      </label>
      <label>
        <p>Passphrase</p>
        <input type="password" onChange={x => setPassword(x.target.value)} />
      </label>
      <div>
        <button type="submit">Submit</button>
      </div>
    </form>
    </div>
  )
}

function App() {
  const [posts, setPosts] = useState([])
  const [userToken, setUserToken] = useCookie('token')

  if (posts.length === 0) {
    fetch('http://localhost:4040/allposts', {
      headers: { Accept: 'application/json' } //,
    }).then(x => x.json())
      .then(x => Object.values(x))
      .then(x => setPosts(x))
  }

  if (!userToken) {
    return <Login setUserToken={setUserToken} />
  }
  return (
      <div className="main-container">

        <Suspense fallback={<p>Attempting to load. If it takes long, it prolly broke.</p>} >
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootPage posts={posts} />} />
          {/* TODO: allow slashes to be part of slug.  Maybe here the path can
            * be just /posts/* and then BlogPost figures it out. */}
          <Route path="/posts/:slug" element={<BlogPost posts={posts} />} />
          <Route path="/login" />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
        </BrowserRouter>
        </Suspense>
      </div>
  )
}

export default App
