/* eslint semi: ["warn", "never"] */
import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import { CookiesProvider } from 'react-cookie'
import { App } from './App'
import Tablev8 from './Tablev8'
import BlogPost from './BlogPost'
import Login from './Login'
import { Route
       , createBrowserRouter
       , createRoutesFromElements
       , redirect
       , RouterProvider } from 'react-router-dom'

export type Post = {
  title: string,
  slug: string,
  content: string,
  wordcount: number,
  tags: string[],
  links: number | null,
  backlinks: number | null,
  created: string,
  updated: string,
}

// Had to lift the posts-state up to the level of wrapping even the router.
// This enables the /random page, and lets the browser's back-button behave
// predictably after the /random page has redirected you, thanks to redirect().
// That would not happen if the /random page was a child that just returned a
// <Navigate> component.
function CustomRouterProvider () {
  const [posts, setPosts]  = useState<Post[]>([])

  const randomPost = () => {
    if (posts.length === 0) {
      console.log('no posts loaded yet')
      return redirect('/')
    }
    else {
      const seen = new Set<string>(JSON.parse(window.localStorage.getItem('seen') ?? '[]'))
      let nonStubs = new Set<string>(posts.filter(x => !x.tags.includes('stub'))
                                          .map(x => x.slug))
      // NOTE: set-difference is coming to JS https://github.com/tc39/proposal-set-methods
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
        <Route path="/" element={<App posts={posts} setPosts={setPosts} />} >
          <Route path="posts/*" element={<BlogPost />} />
          <Route path="posts" element={<Tablev8 />} />
          <Route path="login" element={<Login />} />
          <Route path="random" loader={randomPost} />
          <Route path="now" loader={() => { return redirect('/posts/portal-on-my-mind') }} />
          <Route path="about" loader={() => { return redirect('/posts/about') }} />
          {/* <Route path="news" element={<Changelog>} /> */}
        </Route>
      </>
    )
  )

  return <RouterProvider router={myRouter} />
}


const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
)
root.render(
  <React.StrictMode>
    <CookiesProvider>
      <CustomRouterProvider />
    </CookiesProvider>
  </React.StrictMode>
)
