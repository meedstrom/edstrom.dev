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
import PropTypes from 'prop-types'
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

function Login ({ setToken }) {
  const [username, setUserName] = useState()
  const [password, setPassword] = useState()

  const handleSubmit = async x => {
    x.preventDefault()
    const token = await loginUser({ username, password })
    setToken(token)
  }

  return (
    <div className="login-wrapper">
      <h1> Please log in </h1>
      <form onSubmit={handleSubmit}>
      <label>
        <p>Username</p>
        <input type="text" onChange={x => setUserName(x.target.value)} />
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

// // necessary?

Login.propTypes = {
  setToken: PropTypes.func.isRequired
};



// custom hook
function useToken() {
  const getToken = () => {
    const tokenString = sessionStorage.getItem('token')
    const userToken = JSON.parse(tokenString)
    return userToken?.token
  }

  let [token, setToken] = useState()
  token = getToken()

  const saveToken = userToken => {
    // set state, not just sessionStorage, in order to trigger re-render
    sessionStorage.setItem('token', JSON.stringify(userToken))
    setToken(userToken.token)
  }

  return [token, setToken]
}

function App() {
  const [posts, setPosts] = useState([])
  const [token, setToken] = useToken()
  const [userToken, setUserToken] = useCookie('token', '0')

  if (posts.length === 0) {
    fetch('http://localhost:4040/allposts', {
      headers: { Accept: 'application/json' } //,
    }).then(x => x.json())
      .then(x => Object.values(x))
      .then(x => setPosts(x))
  }

  if (!token) {
    return <Login setToken={setToken} />
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
