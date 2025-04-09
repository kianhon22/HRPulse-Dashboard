"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronLeft, ChevronRight, Search, RefreshCw, ChevronsUpDown, ChevronUp, ChevronDown } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getCurrentYear, getYearOptions } from "@/hooks/getYear"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  filterableColumns?: {
    id: string
    title: string
    options: { label: string; value: string }[]
  }[]
  defaultSort?: {
    id: string
    desc: boolean
  }
  showYearFilter?: boolean
  yearOptions?: { label: string; value: string }[]
  onYearChange?: (year: string) => void
  onRowClick?: (data: TData) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  filterableColumns = [],
  // defaultSort = { id: "created_at", desc: true },
  showYearFilter = true,
  yearOptions = getYearOptions(),
  onYearChange,
  onRowClick,
}: DataTableProps<TData, TValue>) {
  // const [sorting, setSorting] = React.useState<SortingState>([defaultSort])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [pageSize, setPageSize] = React.useState(10)
  const [pageIndex, setPageIndex] = React.useState(0)
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [selectedYear, setSelectedYear] = React.useState(getCurrentYear().toString())

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: {
        pageIndex,
        pageSize,
      },
      globalFilter,
    },
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const newState = updater({
          pageIndex,
          pageSize,
        })
        setPageIndex(newState.pageIndex)
        setPageSize(newState.pageSize)
      }
    },
    globalFilterFn: (row, columnId, filterValue) => {
      const value = row.getValue(columnId)
      if (value == null) return false
      return String(value)
        .toLowerCase()
        .includes(String(filterValue).toLowerCase())
    },
    // initialState: {
    //   sorting: [defaultSort],
    // },
  })

  const resetTable = () => {
    // setSorting([defaultSort])
    setSorting([])
    setColumnFilters([])
    setGlobalFilter("")
    setPageIndex(0)
    setPageSize(10)
    setSelectedYear(getCurrentYear().toString())
    if (onYearChange) {
      onYearChange(getCurrentYear().toString())
    }
  }

  const handleYearChange = (year: string) => {
    setSelectedYear(year)
    if (onYearChange) {
      onYearChange(year)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="pl-8"
            />
          </div>
          {showYearFilter && (
            <Select
              value={selectedYear}
              onValueChange={handleYearChange}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year.value} value={year.value}>
                    {year.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {filterableColumns.map((column) => (
            <Select
              key={column.id}
              value={(table.getColumn(column.id)?.getFilterValue() as string) ?? "all"}
              onValueChange={(value) => {
                table.getColumn(column.id)?.setFilterValue(value === "all" ? "" : value)
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={`Filter by ${column.title}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {column.title}</SelectItem>
                {column.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
          <Select
            value={pageSize.toString()}
            onValueChange={(value: string) => setPageSize(Number(value))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select page size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 per page</SelectItem>
              <SelectItem value="20">20 per page</SelectItem>
              <SelectItem value="30">50 per page</SelectItem>
              <SelectItem value="40">100 per page</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={resetTable}
            className="h-10 w-22 hover:bg-[#6A1B9A] hover:text-white cursor-pointer"
          >
            Refresh <RefreshCw className="ml-1 h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto hover:bg-[#6A1B9A] hover:text-white cursor-pointer">
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead 
                        key={header.id}
                        className="text-white bg-[#6A1B9A]"
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={`flex items-center space-x-2 ${
                              header.column.getCanSort() ? "cursor-pointer select-none" : ""
                            }`}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {header.column.getCanSort() && (
                              <div className="flex flex-col">                            
                                {(header.column.getIsSorted() != "asc" && header.column.getIsSorted() != "desc") && (
                                  <ChevronsUpDown className="ml-2 h-3 w-3" />
                                )}
                                {header.column.getIsSorted() === "asc" && (
                                  <ChevronUp className="ml-2 h-3 w-3" />
                                )}
                                {header.column.getIsSorted() === "desc" && (
                                  <ChevronDown className="ml-2 h-3 w-3" />
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                    className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="flex items-center justify-between py-4">
        <div className="text-sm text-muted-foreground">
          Showing {table.getState().pagination.pageIndex * pageSize + 1} to{" "}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * pageSize,
            table.getFilteredRowModel().rows.length
          )}{" "}
          of {table.getFilteredRowModel().rows.length} records
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center justify-center text-sm">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
} 