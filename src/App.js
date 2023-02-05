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

// was encrypted with:
// for file in **; do gpg -ac --pinentry-mode loopback --no-symkey-cache --passphrase-file ../../passphrase $file ; done

async function decryptPosts ( posts ) {
  const rxForTitle = /<h1>(.*?)<\/h1>/
  const rxForDate = /<p>Planted [(.*?)]/
  posts.map(async (post) => {
    const blob = await readMessage({
      binaryMessage: post.crypted
    })
    const { data: decryptedContent } = await decrypt({
      message: blob
      // TODO: get the passphrase from user
    , passwords: ['xoa2ziegh3ooYuichiepuoh4ohveey']
    , format: 'binary'
    })
    post.content = decryptedContent
    post.title = decryptedContent.match(rxForTitle)[0]
    post.date = decryptedContent.match(rxForDate)[0]
  })
  return posts
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

function RootPage({ posts }) {

  // const data = React.useMemo[posts]
  // const columns = React.useMemo(
  //   () => [
  //     {
  //       Header: 'Title',
  //       accessor: 'title'
  //     },
  //     {
  //       Header: 'Date',
  //       accessor: 'date'
  //     },
  //   ]
  // )

  // const tableInstance = useTable({columns, posts})
  //  const {
   // getTableProps,
   // getTableBodyProps,
   // headerGroups,
   // rows,
   // prepareRow,
  // } = tableInstance
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
            <tr key={post.id}>
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

function Login ({ setAuthToken }) {
  const [username, setUsername] = useState()
  const [password, setPassword] = useState()

  const handleSubmit = async x => {
    x.preventDefault()
    const token = await loginUser({ username, password })
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
        <input type="text" onChange={x => setUsername(x.target.value)} />
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
  const [authToken, setAuthToken] = useCookie('token')
  const runOnceHack = true // this never changes

  useEffect(() => {
    if (posts.length === 0) {
      fetch('http://localhost:4040/allposts', {
        headers: { Accept: 'application/json' }
      }).then(x => x.json())
        .then(x => Object.values(x))
        .then(x => decryptPosts(x))
        .then(x => setPosts(x))
    }}, [runOnceHack])
  // React.useMemo(() => [x]))  // for react-table

  if (!authToken) {
    return <Login setAuthToken={setAuthToken} />
  }
  return (
      <div className="main-container">
        <Suspense fallback={<p>Attempting to load. If it takes long, it prolly broke.</p>} >
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootPage posts={posts} />} />
          <Route path="/posts/*" element={<BlogPost posts={posts} />} />
          <Route path="/login" />
        </Routes>
        </BrowserRouter>
        </Suspense>
      </div>
  )
}

export default App
