/* eslint semi: ["warn", "never"] */
import React from 'react'
import { HashLink as Link, } from 'react-router-hash-link'
import { usePosts, Post, } from './App'
import { useState, } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
} from '@tanstack/react-table'


const columnHelper = createColumnHelper<Post>()
const columns =
     [
       columnHelper.accessor('title', {
         header: 'Note',
         cell: props => (
           <Link className={props.row.original.tags.includes('stub') ? 'stub-link' : 'working-link'}
                 to={props.row.original.slug}>
             {props.getValue()}
           </Link>
         ),
       }),
       columnHelper.accessor('wordcount', {
        header: () => 'Words',
      }),
       columnHelper.accessor('backlinks', {
         header: 'Links',
       }),
       /* columnHelper.accessor('tags', {
        *   header: () => 'Tags',
        *   cell: info => <i>{info.getValue().join(',')}</i>,
        * }), */
      columnHelper.accessor('created', {
        header: () => 'Created',
        // non-breaking hyphens
        cell: info => <time className='dt-published'>{(info.getValue() ?? '').replaceAll('-', '‑') }</time>,
      }),
       columnHelper.accessor('updated', {
         header: 'Updated',
         cell: info => <time className='dt-published'>{(info.getValue() ?? '').replaceAll('-', '‑')}</time>,
       }),
     ]


export function Tablev8() {
  const { posts } = usePosts()
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

  // TODO: sort by updated from the beginning
  // table.columns[3].getToggleSortingHandler()

  return (
    <div className="table-container" id="big-list">
      <table className="table is-striped is-narrow is-fullwidth">
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
    </div>
  )
}
