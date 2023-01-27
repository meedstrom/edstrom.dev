// import logo from './logo.svg'
import './App.css'
import React, { Suspense, useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import SomeMDFile from './App.md'

// async fetcher, use with <Suspense> https://blog.logrocket.com/react-suspense-data-fetching/
// const fetchData = (url) => {
//   const promise = fetch(url)
//         .then((res) => res.json())
//         .then((res) => res.data)
//   return wrapPromise(promise)
// }



class App extends React.Component {
  state = { someMD: '' , other: '', all: []}

  componentDidMount() {

    // Get the contents from the Markdown file and put them in the React state,
    // so we can reference it in render() below.
    fetch(SomeMDFile)
     .then(res => res.text())
     .then(text => this.setState({ someMD: text }))

    fetch('http://localhost:4040/post2')
      .then(res => res.text())
      .then(res => this.setState({ other: res }))

    fetch('http://localhost:4040/allposts')
      .then(res => res.json())
      .then(res => this.setState({ all: res }))

    ;(async function() {
      const res = await fetch('http://localhost:4040/allposts', {
        headers: { Accept: 'application/json' },
      })
      const json = await res.json()
      let contents = [];
      // see also Object.entries and Object.keys
      Object.values(json).forEach(x => {
        contents.push(x)
      })
      console.log(contents)
      // this.setState({ all: contents })
    })()

  }

  render() {
    // var [posts, setPosts] = useState([])

    var simplyPosts = (async () => {
      const res = await fetch('http://localhost:4040/allposts', {
        headers: { Accept: 'application/json' },
      })
      const json = await res.json()
      let contents = [];
      // see also Object.entries and Object.keys
      Object.values(json).forEach(x => {
        contents.push(x)
      })
      console.log(contents)
      return contents
    })()

    const { someMD } = this.state
    const { other } = this.state
    const { all } = this.state

    // for (const key in JSON.parse({ all })) {
    //   if(obj.hasOwnProperty(key)) {
    //     console.log(`${key} : ${all[key]}`)
    //   }
    // }

    return (
      <div className="main-container">
        <p>Test</p>
        <ReactMarkdown># hello, world</ReactMarkdown>
        <ReactMarkdown children={other} />
        <ReactMarkdown children={someMD} />
        <p> ALLPOSTS result below</p>
        {simplyPosts.map(item => <ReactMarkdown>{item}</ReactMarkdown>)}

      </div>
    )
  }
}

export default App
