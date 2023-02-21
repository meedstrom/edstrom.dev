import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { BlogPost, BigList, App } from './App'
import Login from './Login'
import reportWebVitals from './reportWebVitals'
import { Route
       , createBrowserRouter
       , createRoutesFromElements
       , RouterProvider } from 'react-router-dom'

const myRouter = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<App />} >
        <Route path="posts/*" element={<BlogPost />} />
        <Route path="login" element={<Login />} />
        <Route path="all" element={<BigList />} />
      </Route>
    </>
  )
)

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
)
root.render(
  <React.StrictMode>
    <RouterProvider router={myRouter} />
  </React.StrictMode>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
