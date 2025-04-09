"use client"

import { useState, useEffect } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Plus, Eye, PencilLine } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { useRouter } from "next/navigation"

// Define the type for our data
type Survey = {
  id: string
  title: string
  description: string | null
  start_date: string
  end_date: string
  status: "Draft" | "Scheduled" | "Active" | "Ended"
  created_at: string
  updated_at: string
  created_by: string
}

export default function FeedbackPage() {
  const router = useRouter()
  const [data, setData] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())

  const columns: ColumnDef<Survey>[] = [
    {
      accessorKey: "title",
      header: "Title",
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const description = row.getValue("description") as string | null
        return description ? (
          description.length > 50 ? `${description.substring(0, 50)}...` : description
        ) : "-"
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <div className={`capitalize font-medium ${
            status === "Active" ? "text-green-600" :
            status === "Ended" ? "text-red-600" :
            status === "Draft" ? "text-gray-600" :
            "text-yellow-600"
          }`}>
            {status}
          </div>
        )
      },
    },
    {
      accessorKey: "start_date",
      header: "Start Date",
      cell: ({ row }) => {
        const date = row.getValue("start_date") as string
        return date ? format(new Date(date), "MMM dd, yyyy") : "-"
      },
    },
    {
      accessorKey: "end_date",
      header: "End Date",
      cell: ({ row }) => {
        const date = row.getValue("end_date") as string
        return date ? format(new Date(date), "MMM dd, yyyy") : "-"
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const survey = row.original
        
        return (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/surveys/${survey.id}`)
              }}
              className="h-8 w-8"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/surveys/${survey.id}/edit`)
              }}
              className="h-8 w-8"
            >
              <PencilLine className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  // Define filterable columns
  const filterableColumns = [
    {
      id: "status",
      title: "Status",
      options: [
        { label: "Draft", value: "Draft" },
        { label: "Scheduled", value: "Scheduled" },
        { label: "Active", value: "Active" },
        { label: "Ended", value: "Ended" },
      ],
    },
  ]

  const fetchSurveys = async (year: string) => {
    setLoading(true)
    
    try {
      // Get the start and end of the selected year
      const startDate = `${year}-01-01`
      const endDate = `${year}-12-31`
      
      // Fetch surveys for the selected year
      const { data: surveysData, error } = await supabase
        .from('surveys')
        .select()
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching surveys:', error)
        return
      }
      
      setData(surveysData || [])
    } catch (error) {
      console.error('Error:', error)
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

  const handleRowClick = (survey: Survey) => {
    router.push(`/surveys/${survey.id}`)
  }

  return (
    <div className="py-8 pr-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Surveys & Feedback</h1>
        <Button onClick={() => router.push('/surveys/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Survey
        </Button>
      </div>
      <DataTable 
        columns={columns} 
        data={data} 
        filterableColumns={filterableColumns}
        onYearChange={handleYearChange}
        onRowClick={handleRowClick}
      />
    </div>
  )
} 