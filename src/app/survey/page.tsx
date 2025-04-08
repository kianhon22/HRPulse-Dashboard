"use client"

import { useState, useEffect } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Plus, ChevronsUpDown } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"

interface Survey {
  id: string
  title: string
  description: string
  start_date: string
  end_date: string
  status: "Active" | "Draft" | "Closed"
  response_count: number
  created_at: string
}

// Define the columns
const columns: ColumnDef<Survey>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Title
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "description",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Description
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const description = row.getValue("description") as string
      return description.length > 50 ? `${description.substring(0, 50)}...` : description
    },
  },
  {
    accessorKey: "start_date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Start Date
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = row.getValue("start_date") as string
      return format(new Date(date), "MMM dd, yyyy")
    },
  },
  {
    accessorKey: "end_date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          End Date
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = row.getValue("end_date") as string
      return format(new Date(date), "MMM dd, yyyy")
    },
  },
  {
    accessorKey: "response_count",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Responses
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge className={
          status === "Active" ? "bg-green-100 text-green-800 hover:bg-green-100" : 
          status === "Draft" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" : 
          "bg-gray-100 text-gray-800 hover:bg-gray-100"
        }>
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created At
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = row.getValue("created_at") as string
      return format(new Date(date), "MMM dd, yyyy")
    },
  },
]

// Define filterable columns
const filterableColumns = [
  {
    id: "status",
    title: "Status",
    options: [
      { label: "Active", value: "Active" },
      { label: "Draft", value: "Draft" },
      { label: "Closed", value: "Closed" },
    ],
  },
]

export default function SurveysPage() {
  const [data, setData] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())

  const fetchSurveys = async (year: string) => {
    setLoading(true)
    try {
      const startDate = `${year}-01-01`
      const endDate = `${year}-12-31`
      
      const { data, error } = await supabase
        .from('surveys')
        .select(`
          id,
          title,
          description,
          start_date,
          end_date,
          status,
          response_count,
          created_at
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false })

      if (error) throw error

      setData(data || [])
    } catch (error) {
      console.error('Error fetching surveys:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSurveys(selectedYear)
  }, [selectedYear])

  const handleYearChange = (year: string) => {
    setSelectedYear(year)
  }

  return (
    <div className="py-8 pr-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Surveys & Feedback</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Survey
        </Button>
      </div>
      <DataTable 
        columns={columns} 
        data={data} 
        filterableColumns={filterableColumns}
        defaultSort={{ id: "created_at", desc: true }}
        onYearChange={handleYearChange}
      />
    </div>
  )
} 