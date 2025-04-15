"use client"

import { useState, useEffect } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Plus, Eye, PencilLine, FileText } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { useRouter } from "next/navigation"

// Define the type for our data
type Survey = {
  id: string
  title: string
  description: string | null
  // type: "Text" | "Rating"
  status: "Draft" | "Scheduled" | "Active" | "Closed" | "Deleted"
  start_date: string
  end_date: string
  created_at: string
  updated_at: string
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
    // {
    //   accessorKey: "type",
    //   header: "Type",
    //   cell: ({ row }) => {
    //     const type = row.getValue("type") as string
    //     return (
    //       <div className="capitalize font-medium">
    //         {type}
    //       </div>
    //     )
    //   },
    // },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <div className={`capitalize font-medium ${
            status === "Active" ? "text-green-600" :
            status === "Closed" ? "text-red-600" :
            status === "Draft" ? "text-gray-600" :
            status === "Scheduled" ? "text-yellow-600" :
            "text-gray-600"
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
      header: "Action",
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
        { label: "Closed", value: "Closed" },
        { label: "Deleted", value: "Deleted" },
      ],
    },
    // {
    //   id: "type",
    //   title: "Type",
    //   options: [
    //     { label: "Text", value: "Text" },
    //     { label: "Rating", value: "Rating" },
    //   ],
    // },
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
        .eq('is_template', false) // Exclude templates
        .eq('type', 'Text')
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
        <h1 className="text-3xl font-bold">Surveys</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => router.push('/surveys/templates')}
          >
            <FileText className="mr-2 h-4 w-4" />
            Templates
          </Button>
          <Button onClick={() => router.push('/surveys/create')}>
            <Plus className="mr-2 h-4 w-4" />
            Create Survey
          </Button>
        </div>
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