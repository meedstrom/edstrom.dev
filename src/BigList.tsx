/* eslint semi: ["warn", "never"] */
import React from 'react'
import { HashLink as Link } from 'react-router-hash-link'
import { Post } from './index'
import { useAppContext } from './App'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
} from '@tanstack/react-table'

const columnHelper = createColumnHelper<Post>()
const columns =
  [
    columnHelper.accessor('title', {
      header: 'Note',
      cell: props => (
        <Link className={props.row.original.tags.includes('stub') ? 'stub-link' : 'working-link'}
              to={`${props.row.original.permalink}/${props.row.original.slug}`}>
          {props.getValue()}
        </Link>
      ),
    }),
    columnHelper.accessor('wordcount', {
      header: () => 'Words',
    }),
    columnHelper.accessor('links', {
      header: 'Links',
    }),
    columnHelper.accessor('created', {
      header: () => 'Created',
      // non-breaking hyphens
      cell: info => <time className='dt-published'>{(info.getValue() ?? '').replaceAll('-', '‑') }</time>,
    }),
    columnHelper.accessor('updated', {
      header: 'Updated',
      // non-breaking hyphens
      cell: info => <time className='dt-updated'>{(info.getValue() ?? '').replaceAll('-', '‑')}</time>,
    }),
  ]


export default function BigList() {
  const { posts, sorting, setSorting, } = useAppContext()
  const table = useReactTable({
    data: posts,
    columns: columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting, },
    onSortingChange: setSorting,
    enableSortingRemoval: false,
  })

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
