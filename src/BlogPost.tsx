/* eslint semi: ["warn", "never"] */
import React from 'react'
import { Interweave, Node, } from 'interweave'
import { Post, useOutlet, } from './App'
import { useEffect, Suspense, } from 'react'
import { HashLink as Link } from 'react-router-hash-link'
import { useParams } from 'react-router-dom'

function daysSince(then: string): string {
    const unixNow = new Date().getTime()
    const unixThen = new Date(then).getTime()
    const days = Math.round((unixNow - unixThen) / (1000 * 60 * 60 * 24))
    return (days === 1) ? 'yesterday'
         : (days === 0) ? 'today'
         : (days > 550) ? `${Math.round(days/365)} years ago`
         : (days > 45) ? `${Math.round(days/30)} months ago`
         : (days > 25) ? 'a month ago'
         : `${days} days ago`
}

export default function BlogPost() {
    const { posts } = useOutlet()
    const slug = useParams()["*"]
    const thisPost = posts.find((x: Post) => x.slug === slug )

    useEffect(() => {
        if (typeof thisPost !== 'undefined' &&
            document.title !== thisPost.title) {
            document.title = thisPost.title
        }
    })

    if (typeof thisPost === 'undefined') {
        if (posts.length === 0) {
            return <div className="section">Just a second...</div>
        } else {
            return <div className="section">Page doesn't exist, or may be hidden from public view: {slug}</div>
        }
    }

    // I used to render the Org-exported HTML with just <Markup />,
    // which meant the links were <a> tags, unhandled by React Router.
    // For the user, clicking these links had an effect similar to as
    // if they'd entered the URLs manually: an ugly transition involving
    // a Flash Of Unstyled Content.
    // Solution: rewrite all the <a href=...> into <Link to=...>, so React
    // Router handles the links!
    // While we're at it, we can color the links specially.
    // NOTE: destroys any other props in the <a> tag.
    // NOTE: must be an arrow function to use the outer 'this' and thereby access
    //       the value of 'posts'.
    const rewriteLinkTags = (node: HTMLElement, children: Node[]): React.ReactNode => {
        if (node.tagName.toLowerCase() === 'a') {
            const href = node.getAttribute('href')
            if (href) {
                let linkClass = 'working-link'
                if (!href.startsWith('http') && !href.startsWith('#')) {
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
    }

    // Track what pages the visitor has seen
    const seen = new Set<string>(JSON.parse(window.localStorage.getItem('seen') ?? '[]'))
    if (seen.has(thisPost.slug)) {
        const all = posts.filter(post => !post.tags.includes('stub'))
                         .map(post => post.slug)
        // If visitor has now seen all non-stubs, restart the tracker so
        // the Random button continues working
        if (!all.find(slug => !seen.has(slug))) {
            seen.clear()
        }
    } else {
        seen.add(thisPost.slug)
    }
    window.localStorage.setItem('seen',  JSON.stringify([...seen]))

    function num(ymd: string) {
        return Number(ymd.replaceAll('-', ''))
    }
    let isDaily = false
    let nextDaily
    let prevDaily
    // If this is a daily page, insert links to next and previous dailies
    if (thisPost.slug.match(/^\d{4}-\d{2}-\d{2}$/)) {
        isDaily = true
        // posts is supposed to be alrdy sorted in creation order
        const dailies = posts.map(post => post.slug).filter(slug => slug.match(/^\d{4}-\d{2}-\d{2}$/))
        prevDaily = dailies.find(slug => num(slug) < num(thisPost.slug))
        nextDaily = dailies.reverse() // node and firefox yet to implement toReversed, 2023-04-24
                           .find(slug => num(slug) > num(thisPost.slug))
    }

    const informalUpdated = daysSince(thisPost.updated)
    const informalCreated = daysSince(thisPost.created)

    return (
        <Suspense fallback={<div className="section">Just a second...</div>}>
            <div className="section pt-3">
                <table className='table is-narrow is-bordered is-small'>
                    <tbody>
                        <tr>
                            <td>Planted</td>
                            <td><time className='dt-published' dateTime={thisPost.created}>{thisPost.created} ({informalCreated})</time></td>
                        </tr>
                        <tr>
                            <td>Last growth</td>
                            <td><time className='dt-updated' dateTime={thisPost.updated}>{thisPost.updated} ({informalUpdated})</time></td>
                        </tr>
                        {(thisPost.tags[0] !== '') ? (
                            <tr>
                                <td>Tags</td>
                                <td>{thisPost.tags.join(', ')}</td>
                            </tr>
                        ) : ''}
                    </tbody>
                </table>
                {isDaily ? (
                <div className="columns is-mobile">
                    <div className="column is-narrow">
                        {prevDaily ? <Link to={prevDaily}>← {prevDaily}</Link> : 'No previous entry'}
                    </div>
                    <div className="column is-narrow">
                        {nextDaily ? <Link to={nextDaily}>{nextDaily} →</Link> : 'No next entry'}
                    </div>
                </div>
                ) : ''}
                <article aria-labelledby='title' className='content'>
                    <Interweave content={thisPost.content} transform={rewriteLinkTags}/>
                </article>
            </div>
        </Suspense>
    )
}
/*
 * function Ensure(data: any) {
 *   return new Promise()
 * }
 *  */
