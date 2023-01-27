// import logo from './logo.svg'
import './App.css'
import React from 'react'
import { Suspense } from 'react'
import ReactMarkdown from 'react-markdown'
import SomeMDFile from './App.md'

const someStr = '## hello, dood'

// const baseUrl = 'http://localhost:4040'

// const getPostsFromBackend = () => {
//   fetch('$(baseUrl)/post2')
//     .then(res => res.text())
//     .then((res) => console.log(res))
// }

// async fetcher, use with <Suspense> https://blog.logrocket.com/react-suspense-data-fetching/
// const fetchData = (url) => {
//   const promise = fetch(url)
//         .then((res) => res.json())
//         .then((res) => res.data)
//   return wrapPromise(promise)
// }

class App extends React.Component {
  state = { someMD: '' , other: '', all: ['']}

  // const APost = React.lazy(() => {
  //     fetch('http://localhost:4040/post2')
  //     .then(res => res.text())
  //     .then(res => this.setState({ other: res }))
  // })

  constructor() {
    super()
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

  }

  render() {
    const { someMD } = this.state
    const { other } = this.state

    return (
      <div className="main-container">
        <p>Test</p>
        <ReactMarkdown># hello, world</ReactMarkdown>
        <ReactMarkdown children={someStr} />
        <Suspense fallback={<p>loading...</p>}>
          <ReactMarkdown children={other} />
        </Suspense>

        <ReactMarkdown children={someMD} />
      </div>
    )
  }
}

// import Posts from "./posts/Posts"

// const App = () => {
//   return (
//     <div className="main-container">
//       <h1 className="main-heading">
//         Blog App using React Js
//       </h1>
//       <Posts />
//     </div>
//   );
// };

// import post from './App.html';

// class App extends React.Component {

//   constructor() {
//     super();
//     this.state = { markdown: '' };
//   }

//   componentWillMount() {
//     // Get the contents from the Markdown file and put them in the React state, so we can reference it in render() below.
//     fetch(AppMarkdown).then(res => res.text()).then(text => this.setState({ markdown: text }));
//   }

//   render() {
//     const { markdown } = this.state;
//     return (
//     <App>
//       <p>Test</p>

//       <ReactMarkdown source={markdown} />
//     </App>
//     );
//   }
// }

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

export default App
