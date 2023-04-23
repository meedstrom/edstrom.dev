/* eslint semi: ["warn", "never"] */
import React from 'react'
import ReactDOM from 'react-dom/client'
import { CookiesProvider } from 'react-cookie'
import { App, postsBackdoor } from './App'
import { Tablev8 } from './Tablev8'
import BlogPost from './BlogPost'
import Login from './Login'
/* import reportWebVitals from './reportWebVitals' */
import { Route
       , createBrowserRouter
       , createRoutesFromElements
       , redirect
       , RouterProvider } from 'react-router-dom'

// Non-component to avoid creating extra history entries.
// TODO: maybe it'd be possible to rely on usePosts from within BlogPost if the
//       URL is /posts/random...
function randomPost() {
  //const { posts } = usePosts()  // hooks can only be used in components
  const posts = postsBackdoor
  if (posts.length === 0) {
    console.log('no posts loaded yet')
    return redirect('/')
  }
  else {
    const seen = new Set<string>(JSON.parse(window.localStorage.getItem('seen') ?? '[]'))
    let nonStubs = new Set<string>(posts.filter(x => !x.tags.includes('stub'))
                                        .map(x => x.slug))
    // NOTE: set-difference is coming to JS, check if it's happened yet  https://github.com/tc39/proposal-set-methods
    for (const item of seen) {
      nonStubs.delete(item)
    }
    const unseen = [...nonStubs]
    const randomSlug = unseen[Math.floor(Math.random() * unseen.length)]
    return redirect(`/posts/${randomSlug}`)
  }
}

const myRouter = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<App />} >
        <Route path="posts/*" element={<BlogPost />} />
        <Route path="posts" element={<Tablev8 />} />
        <Route path="login" element={<Login />} />
        <Route path="random" loader={randomPost} />
        <Route path="now" loader={() => { return redirect('/posts/portal-what-excites-me-recently') }} />
        <Route path="about" loader={() => { return redirect('/posts/about') }} />
        {/* <Route path="news" element={<Changelog>} /> */}
      </Route>
    </>
  )
)

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
)
root.render(
  <React.StrictMode>
    <CookiesProvider>
      <RouterProvider router={myRouter} />
    </CookiesProvider>
  </React.StrictMode>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
/* reportWebVitals(console.log) */
