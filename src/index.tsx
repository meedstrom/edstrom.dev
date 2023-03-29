/* eslint semi: ["warn", "never"] */
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { BlogPost, App } from './App'
import { Tablev8 } from './Tablev8'
import { CookiesProvider } from 'react-cookie'
import Login  from './Login'
/* import reportWebVitals from './reportWebVitals' */
import { Route
       , createBrowserRouter
       , createRoutesFromElements
       , redirect
       , RouterProvider } from 'react-router-dom'

const myRouter = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<App />} >
        <Route path="posts/*" element={<BlogPost />} />
        <Route path="posts" element={<Tablev8 />} />
        <Route path="login" element={<Login />} />
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
