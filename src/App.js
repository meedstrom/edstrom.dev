import './App.css'
import React, { Suspense
                , useState
                , useEffect
                , useRef } from 'react'
import { BrowserRouter
         , Routes
         , Route
         , useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function BlogPost({ posts }) {
  let { slug } = useParams()

  console.log(slug)
  console.log(posts)
  function firstPostBySlug(posts, slug) {
    for (let i = 0; i < posts.length; i++) {
      if (posts[i].slug === slug) {
        return posts[i]
      }
    }
  }

  let post = firstPostBySlug(posts, slug)
  let content = post.content

  console.log(content)
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {content}
    </ReactMarkdown>
  )
}

function useFirstRender() {
  const ref = useRef(true);
  const firstRender = ref.current;
  ref.current = false;
  return firstRender;
}

function App() {
  const [posts, setPosts] = useState([])
  const runOnceHack = true // this never changes
  const firstRender = useFirstRender()

  // useEffect is stuff to run before every render (be aware that async stuff
  // won't finish before the first render)
  useEffect(() => {
    fetch('http://localhost:4040/allposts', {
        headers: { Accept: 'application/json' } //,
    }).then(x => x.json())
      .then(x => Object.values(x))
      .then(x => setPosts(x))
  }, [runOnceHack])

  if (!firstRender)
  return (
    <BrowserRouter>
      <div className="main-container">
        <h1>Martin's notes</h1>
        <Suspense fallback={<p>Attempting to load. If it takes long, it prolly broke.</p>} >
          {posts.map(post =>
            <ReactMarkdown key={post.id} remarkPlugins={[remarkGfm]} >
              {post.content}
            </ReactMarkdown>
          )}

        <Routes>
          <Route path="/" element={<p>You're on the root page.</p>} />
          <Route path="/posts/:slug" element={<BlogPost posts={posts} />} />
        </Routes>

        </Suspense>


      </div>
    </BrowserRouter>
  )
}

export default App
