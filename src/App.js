import './App.css'
import React, { Suspense
                , useState
                , useEffect
                , useRef } from 'react'
import { BrowserRouter
         , Routes
         , Route
         , Link
         , useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function BlogPost({ posts }) {
  let { slug } = useParams()
  let post = posts.find(x => x.slug === slug)
  if (post.type === "md") {
    return (
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {post.content}
      </ReactMarkdown>
    )
  }
  else if (post.type === "html") {
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

// a custom hook
function useFirstRender() {
  const ref = useRef(true)
  const firstRender = ref.current
  ref.current = false
  return firstRender
}

function App() {
  const [posts, setPosts] = useState([])
  const runOnceHack = true // this never changes
  const firstRender = useFirstRender()

  // NOTE: Because setPosts() affects state, doing it here causes an infinite
  // render loop, thus runOnceHack.
  useEffect(() => {
    fetch('http://localhost:4040/allposts', {
        headers: { Accept: 'application/json' } //,
    }).then(x => x.json())
      .then(x => Object.values(x))
      .then(x => setPosts(x))
  }, [runOnceHack])

  // Because the below JSX can't render on an empty state, just return no JSX on
  // the first render.
  if (!firstRender)  
  return (
      <div className="main-container">
        <Suspense fallback={<p>Attempting to load. If it takes long, it prolly broke.</p>} >
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootPage posts={posts} />} />
          <Route path="/posts/:slug" element={<BlogPost posts={posts} />} />
          <Route path="/login" />
        </Routes>
        </BrowserRouter>
        </Suspense>
      </div>
  )
}

export default App
