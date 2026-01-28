'use client';

import { useState, useMemo } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    getFilteredRowModel,
    flexRender,
    ColumnDef,
    SortingState,
    ColumnFiltersState,
} from '@tanstack/react-table';

interface DataTableProps<T> {
    data: T[];
    columns: ColumnDef<T, unknown>[];
    pageSize?: number;
    showPagination?: boolean;
    showSearch?: boolean;
    onRowClick?: (row: T) => void;
}

export default function DataTable<T>({
    data,
    columns,
    pageSize = 20,
    showPagination = true,
    showSearch = false,
    onRowClick,
}: DataTableProps<T>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState('');

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            columnFilters,
            globalFilter,
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        initialState: {
            pagination: {
                pageSize,
            },
        },
    });

    return (
        <div className="w-full">
            {/* Global Search */}
            {showSearch && (
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Search all columns..."
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="w-full max-w-sm px-3 py-2 border border-[var(--border-gray)] rounded-md text-sm focus:border-[var(--accent-coral)] focus:outline-none"
                    />
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto border border-[var(--border-gray)] rounded-lg">
                <table className="w-full text-sm">
                    <thead className="bg-[var(--dark)] text-white">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <th
                                        key={header.id}
                                        className="px-3 py-2 text-left font-medium cursor-pointer select-none hover:bg-gray-800 transition-colors"
                                        onClick={header.column.getToggleSortingHandler()}
                                    >
                                        <div className="flex items-center gap-1">
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                            {/* Sort indicator */}
                                            {{
                                                asc: ' ▲',
                                                desc: ' ▼',
                                            }[header.column.getIsSorted() as string] ?? ''}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="px-3 py-8 text-center text-[var(--text-secondary)]"
                                >
                                    No data available
                                </td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map((row, index) => (
                                <tr
                                    key={row.id}
                                    onClick={() => onRowClick?.(row.original)}
                                    className={`
                    ${index % 2 === 0 ? 'bg-white' : 'bg-[var(--bg-secondary)]'}
                    ${onRowClick ? 'cursor-pointer hover:bg-blue-50' : ''}
                    transition-colors
                  `}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <td key={cell.id} className="px-3 py-2 whitespace-nowrap">
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {showPagination && data.length > pageSize && (
                <div className="flex items-center justify-between mt-4 text-sm">
                    <div className="text-[var(--text-secondary)]">
                        Showing {table.getState().pagination.pageIndex * pageSize + 1} to{' '}
                        {Math.min(
                            (table.getState().pagination.pageIndex + 1) * pageSize,
                            data.length
                        )}{' '}
                        of {data.length} results
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => table.setPageIndex(0)}
                            disabled={!table.getCanPreviousPage()}
                            className="px-2 py-1 border border-[var(--border-gray)] rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--bg-secondary)]"
                        >
                            {'<<'}
                        </button>
                        <button
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="px-3 py-1 border border-[var(--border-gray)] rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--bg-secondary)]"
                        >
                            Previous
                        </button>

                        <span className="px-3 py-1">
                            Page {table.getState().pagination.pageIndex + 1} of{' '}
                            {table.getPageCount()}
                        </span>

                        <button
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className="px-3 py-1 border border-[var(--border-gray)] rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--bg-secondary)]"
                        >
                            Next
                        </button>
                        <button
                            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                            disabled={!table.getCanNextPage()}
                            className="px-2 py-1 border border-[var(--border-gray)] rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--bg-secondary)]"
                        >
                            {'>>'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
