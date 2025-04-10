"use client"

import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Plus, Trophy } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"

interface Recognition {
  id: string
  recipientName: string
  nominatorName: string
  category: string
  date: string
  points: number
  description: string
}

const columns: ColumnDef<Recognition>[] = [
  {
    accessorKey: "recipientName",
    header: "Recipient",
  },
  {
    accessorKey: "nominatorName",
    header: "Nominated By",
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "date",
    header: "Date",
  },
  {
    accessorKey: "points",
    header: "Points",
    cell: ({ row }) => {
      const points = row.getValue("points") as number
      return (
        <div className="flex items-center">
          <Trophy className="mr-2 h-4 w-4 text-yellow-500" />
          <span>{points}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "description",
    header: "Description",
  },
]

// Temporary data - replace with Supabase fetch
const data: Recognition[] = [
  {
    id: "1",
    recipientName: "John Doe",
    nominatorName: "Jane Smith",
    category: "Innovation",
    date: "2024-03-10",
    points: 100,
    description: "Implemented a new feature that improved team productivity",
  },
  {
    id: "2",
    recipientName: "Jane Smith",
    nominatorName: "Mike Johnson",
    category: "Leadership",
    date: "2024-03-08",
    points: 150,
    description: "Successfully led the team through a challenging project",
  },
  // Add more sample data as needed
]

export default function RecognitionPage() {
  return (
    <div className="py-8 pr-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold">Recognition & Rewards</h1>
          {/* <p className="text-muted-foreground">
            Recognize and reward outstanding employee contributions
          </p> */}
        </div>
        <div className="flex space-x-4">
          <Button>
            <Trophy className="mr-2 h-4 w-4" />
            Leaderboard
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nominate
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <h3 className="text-lg font-semibold">Total Points Available</h3>
          </div>
          <p className="mt-2 text-3xl font-bold">1,000</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <h3 className="text-lg font-semibold">Points Awarded</h3>
          </div>
          <p className="mt-2 text-3xl font-bold">450</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <h3 className="text-lg font-semibold">Top Performer</h3>
          </div>
          <p className="mt-2 text-xl font-semibold">Jane Smith</p>
          <p className="text-sm text-muted-foreground">250 points</p>
        </div>
      </div>

      <DataTable columns={columns} data={data} />
    </div>
  )
} 