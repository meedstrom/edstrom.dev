import './App.css'
import React, { Suspense, useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function BlogPost () {
  let { slug } = useParams()
}

function App() {
  const [posts, setPosts] = useState([])
  const [page, setPage] = useState('/')
  const runOnceHack // this never changes

  // useEffect is stuff to run before every render (be aware that async stuff
  // won't finish before the first render)
  useEffect(() => {
    fetch('http://localhost:4040/allposts', {
        headers: { Accept: 'application/json' },
    }).then(x => x.json())
      .then(x => Object.values(x))
      .then(x => setPosts(x))
  }, [runOnceHack])

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
            {posts.map(post => {
              return <Route key={post.id}
                            path={'/' + post.slug}
                            content={post.content}
                            children={(props) =>
                              <ReactMarkdown>{props.content}</ReactMarkdown>
                            } /> }
                      )}
          </Routes>

        </Suspense>

      </div>
    </BrowserRouter>
  )
}

export default App
