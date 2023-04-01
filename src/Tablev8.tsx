/* eslint semi: ["warn", "never"] */
import React from 'react'
import { HashLink as Link, } from 'react-router-hash-link'
import { usePosts, Post, } from './App'
import { useState, useReducer, } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
} from '@tanstack/react-table'

const columnHelper = createColumnHelper<Post>()

const columns = [
  columnHelper.accessor('created', {
    header: () => 'Created',
    cell: info => <time className='dt-published'>{info.getValue()}</time>,
  }),
  columnHelper.accessor('title', {
    header: 'Note',
    /* cell: props => (
     *   <Link to={props.row.original.slug} style={{fontSize: `${fontFromLength(props.row.original.wordcount)}pt`}} >
     *     {props.getValue()}
     *   </Link>
     * ), */
    cell: props => <Link to={props.row.original.slug}>{props.getValue()}</Link>,
  }),
  columnHelper.accessor('wordcount', {
    header: () => 'Words#',
  }),
  columnHelper.accessor('backlinks', {
    header: 'Backlinks',
  }),
  columnHelper.accessor('tags', {
    header: () => 'Tags',
    cell: info => <i>{info.getValue().join(',')}</i>,
  }),
  columnHelper.accessor('updated', {
    header: 'Updated',
  }),
]

function fontFromLength(wordCount: number) {
  const ratioOfMax = Math.log(wordCount) / Math.log(50000)
  const size = 2 + ratioOfMax * 20
  return size < 8 ? 8 : size
}

export function Tablev8() {
  const { posts } = usePosts()
  const rerender = useReducer(() => ({}), {})[1]
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data: posts,
    columns: columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting, },
    onSortingChange: setSorting,
    enableSortingRemoval: true,
  })

  return (
    <div className='table-container'>
      {/* <Table size="sm" striped responsive> */}
      <table className='table is-striped is-narrow'>
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => {
                return (
                  <th key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder ? null : (
                      <div
                        {...{
                          className: header.column.getCanSort()
                                   ? 'cursor-pointer select-none'
                                   : '',
                          onClick: header.column.getToggleSortingHandler(),
                        }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: ' 🔼',
                          desc: ' 🔽',
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    )}
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr key={row.id}>
              {row.getVisibleCells().map(cell => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>

      </table>
      <div className="h-4" />
      <button onClick={() => rerender()} className="border p-2">
        Rerender
      </button>

    </div>
  )
}
