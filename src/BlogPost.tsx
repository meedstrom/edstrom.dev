import { Interweave, Node, } from 'interweave'
import { usePosts, Post, } from './App'
import { useEffect, Suspense, } from 'react'
import { HashLink as Link, } from 'react-router-hash-link'
import {
    useParams,
} from 'react-router-dom'

export function BlogPost() {
  const { posts } = usePosts()
  const slug = useParams()["*"]
  const post = posts.find((x: Post) => x.slug === slug )

  useEffect(() => {
    if (typeof post !== 'undefined') {
      document.title = post.title
    }
  })

  if (typeof post === 'undefined') {
    if (posts.length === 0) {
      return <p>Decrypting... This should take just a second.</p>
    }
    else return (
      <p>Page hidden or doesn't exist: {slug}</p>
    )
  }

  function daysSince(then: string) {
    const unixNow = new Date().getTime()
    const unixThen = new Date(then).getTime()
    return Math.round((unixNow - unixThen) / (1000 * 60 * 60 * 24))
  }

  const daysSinceUpdate = daysSince(post.updated)
  const informalUpdatedDate = (daysSinceUpdate === 1) ? 'yesterday'
                            : (daysSinceUpdate === 0) ? 'today'
                            : (daysSinceUpdate > 730) ? `${Math.round(daysSinceUpdate/730)} years ago`
                            : (daysSinceUpdate > 60) ? `${Math.round(daysSinceUpdate/30)} months ago`
                            : (daysSinceUpdate > 30) ? 'a month ago'
                            : `${daysSinceUpdate} days ago`

  // I used to render the Org-exported HTML with just <Markup />,
  // which meant the links were <a> tags, unhandled by React Router.
  // For the user, clicking these links had an effect similar to as
  // if they'd entered the URLs manually: an ugly transition involving
  // a Flash Of Unstyled Content.
  // Solution: rewrite all the <a href=...> into <Link to=...>, so React
  // Router handles the links!
  // NOTE: destroys any other props in the <a> tag.
  // NOTE: must be an arrow function to use the outer 'this' and thereby access
  //       the value of 'posts'.
  const rewriteLinkTags = (node: HTMLElement, children: Node[]): React.ReactNode => {
    if (node.tagName.toLowerCase() === 'a') {
      const href = node.getAttribute('href')
      if (href) {
        let linkClass = 'working-link'
        if (!href.startsWith('http')) {
          const found = posts.find(x => x.slug === href.split('#')[0])
          if (!found) {
            linkClass = 'broken-link'
          }
          else if (found.tags.includes('stub')) {
            linkClass = 'stub-link'
          }
        }

        return <Link className={linkClass} to={href}>{children}</Link>
      }
    }

    /* else if (node.tagName.toLowerCase() === 'img') {
     *   return (
     *     <figure class="image">
     *       <img {props}>{children}</img>
     *     </figure>
     *   )
     * }
     */
  }

  // Track what pages the visitor has seen
  let seen: string[] | null = JSON.parse(window.localStorage.getItem('seen'))
  if (!seen) {
    seen = [post.slug]
  } else if (!seen.includes(post.slug)) {
    seen.push(post.slug)
  } else {
    // Maybe reset
    const all = posts.filter(x => !x.tags.includes('stub')).map(x => x.slug)
    if (all === seen) seen = []
  }
  window.localStorage.setItem('seen',  JSON.stringify(seen))

  return (
      <>
          <Suspense fallback={<p>Decrypting... This should take just a second.</p>}>
              <article aria-labelledby='title'>
                  <div className='content'>
                      <Interweave content={post.content} transform={rewriteLinkTags}/>
                  </div>
                  <table className='table is-narrow is-bordered'>
                      <tbody>
                          <tr>
                              <td>Planted</td>
                              <td><time className='dt-published' dateTime={post.created}>{post.created}</time></td>
                          </tr>
                          <tr>
                              <td>Last growth</td>
                              <td><time className='dt-updated' dateTime={post.updated}>{informalUpdatedDate}</time></td>
                          </tr>
                          {(post.tags[0] !== '') ? (
                              <tr>
                                  <td>Tags</td>
                                  <td>{post.tags.join(', ')}</td>
                              </tr>
                          ) : ''}
                      </tbody>
                  </table>
              </article>
          </Suspense>
      </>
  )
}
/*
 * function Ensure(data: any) {
 *   return new Promise()
 * }
 *  */
