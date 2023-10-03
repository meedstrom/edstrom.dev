/* eslint semi: ["warn", "never"] */
import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import BigList from './BigList'
import BlogPost from './BlogPost'
import Login from './Login'
import { CookiesProvider } from 'react-cookie'
import { App } from './App'
import { Route,
         RouterProvider,
         createBrowserRouter,
         createRoutesFromElements,
         redirect, } from 'react-router-dom'

export type Post = {
  title: string,
  slug: string,
  permalink: string,
  content: string,
  wordcount: number,
  tags: string[],
  links: number,
  created: string,
  updated: string,
}

// Had to lift the posts-state all the way up this level. This lets the
// browser's back-button behave predictably after the /random page has redirected
// you, thanks to redirect(). That would not happen if the /random page was a
// child that just returned a <Navigate> component.
function CustomRouterProvider () {
  const [posts, setPosts]  = useState<Post[]>([])

  const randomPost = () => {
    if (posts.length === 0) {
      console.log('no posts loaded yet')
      return redirect('/')
    }
    else {
      const seen = new Set<string>(JSON.parse(window.localStorage.getItem('seen') ?? '[]'))
      let nonStubLinks = new Set<string>(posts.filter(x => !x.tags.includes('stub'))
                                              .map(x => x.permalink))
      // NOTE: set-difference is coming to JS https://github.com/tc39/proposal-set-methods
      for (const link of seen) {
        nonStubLinks.delete(link)
      }
      const unseen = [...nonStubLinks]
      const randomPermalink = unseen[Math.floor(Math.random() * unseen.length)]
      const randomPost = posts.find(x => x.permalink === randomPermalink)
      const slug = randomPost ? randomPost.slug : ''
      return redirect(`/posts/${randomPermalink}/${slug}`)
    }
  }

  const myRouter = createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route path="/" element={<App posts={posts} setPosts={setPosts} />} >
          {/* <Route path="posts/*" element={<BlogPost />} /> */}
          <Route path="posts/*" element={<BlogPost />} />
          <Route path="posts" element={<BigList />} />
          <Route path="login" element={<Login />} />
          <Route path="random" loader={randomPost} />
          <Route path="now" loader={() => { return redirect('/posts/BJ9N3oY/portal-on-my-mind') }} />
          <Route path="blogroll" loader={() => { return redirect('/posts/QwnyMIf/blogroll') }} />
          <Route path="nexus" loader={() => { return redirect('/posts/tq5Q8GX/nexus') }} />
          <Route path="about" loader={() => { return redirect('/posts/TtEmFMV/about') }} />
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
