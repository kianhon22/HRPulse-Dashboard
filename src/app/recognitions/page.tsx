"use client"

import { useState, useEffect } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Trophy, Download, ThumbsUp, ShieldCheck, ShieldX, Medal } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"
import { supabase } from "@/lib/supabase"
import { showToast } from "@/lib/utils/toast"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { exportToCSV } from "@/lib/utils/csv-export"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Recognition {
  id: string
  nominator: string
  receiver: string
  descriptions: string
  points: number
  status: "Pending" | "Approved" | "Rejected"
  hr_remarks: string
  created_at: string
  updated_at: string
  nominator_user?: {
    name: string
    email: string
    image_url: string | null
  }
  receiver_user?: {
    name: string
    email: string
    image_url: string | null
    points: number
  }
}

interface UserPoints {
  id: string
  name: string
  points: number
  image_url: string | null
}

export default function RecognitionsPage() {
  const [recognitions, setRecognitions] = useState<Recognition[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "Pending" | "Approved" | "Rejected">("all")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [selectedRecognition, setSelectedRecognition] = useState<Recognition | null>(null)
  const [recognitionDialog, setRecognitionDialog] = useState(false)
  const [approvalLoading, setApprovalLoading] = useState(false)
  const [remarks, setRemarks] = useState(selectedRecognition?.hr_remarks || "")
  const [topPerformer, setTopPerformer] = useState<UserPoints | null>(null)
  const [totalPoints, setTotalPoints] = useState(0)
  const [leaderboardDialog, setLeaderboardDialog] = useState(false)
  const [leaderboard, setLeaderboard] = useState<UserPoints[]>([])

  useEffect(() => {
    fetchRecognitions(selectedYear)
    fetchTopPerformer(selectedYear)
  }, [selectedYear])

  const fetchTopPerformer = async (year: string) => {
    try {
      const startDate = `${year}-01-01`
      const endDate = `${year}-12-31`

      // Get approved recognitions for the year period
      const { data: recognitionsData, error: recognitionsError } = await supabase
        .from('recognitions')
        .select(`
          id,
          receiver,
          points,
          receiver_user:users!receiver(
            id,
            name,
            image_url
          )
        `)
        .eq('status', 'Approved')
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      if (recognitionsError) {
        console.error('Error fetching recognitions for leaderboard:', recognitionsError)
        return
      }

      // Calculate points per user
      const userPoints: Record<string, UserPoints> = {}
      
      recognitionsData?.forEach(recognition => {
        if (!recognition.receiver_user) return
        
        const userId = recognition.receiver
        const receiverUser = recognition.receiver_user as unknown as { 
          id: string;
          name: string;
          image_url: string | null;
        };
        const userName = receiverUser.name
        const userImage = receiverUser.image_url
        
        if (!userPoints[userId]) {
          userPoints[userId] = {
            id: userId,
            name: userName,
            points: 0,
            image_url: userImage
          }
        }
        
        userPoints[userId].points += recognition.points || 0
      })
      
      // Convert to array and sort
      const sortedUsers = Object.values(userPoints).sort((a, b) => b.points - a.points)
      
      // Set leaderboard
      setLeaderboard(sortedUsers)
      
      // Get top performer
      if (sortedUsers.length > 0) {
        setTopPerformer(sortedUsers[0])
      }
      else {
        setTopPerformer(null)
      }
      
      // Calculate total points awarded in this period
      const totalPointsAwarded = sortedUsers.reduce((sum, user) => sum + user.points, 0)
      setTotalPoints(totalPointsAwarded)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchRecognitions = async (year: string) => {
    setLoading(true)
    try {
      const startDate = `${year}-01-01`
      const endDate = `${year}-12-31`

      const { data, error } = await supabase
        .from('recognitions')
        .select(`
          *,
          nominator_user:users!nominator(
            name,
            email,
            image_url
          ),
          receiver_user:users!receiver(
            name,
            email,
            image_url,
            points
          )
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false })
      
      if (error) {
        showToast.error("Error loading recognitions")
        console.error('Error fetching recognitions:', error)
        return
      }

      // Format the data
      const formattedData = data.map((recognition: any) => ({
        ...recognition,
        status: recognition.status || "Pending"
      }))

      setRecognitions(formattedData || [])
    } catch (error) {
      showToast.error("An unexpected error occurred")
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const openRecognitionDetails = (recognition: Recognition) => {
    setSelectedRecognition(recognition)
    setRemarks(recognition.hr_remarks || "")
    setRecognitionDialog(true)
  }

  const handleApproval = async (approved: boolean) => {
    if (!selectedRecognition) return

    setApprovalLoading(true)
    try {
      const status = approved ? "Approved" : "Rejected"
      const { error } = await supabase
        .from('recognitions')
        .update({ 
          status, 
          hr_remarks: remarks,
          updated_at: new Date().toISOString() 
        })
        .eq('id', selectedRecognition.id)
      
      if (error) {
        throw error
      }

      // If approved, add points to the receiver
      if (approved && selectedRecognition.receiver && selectedRecognition.points) {
        const receiver = selectedRecognition.receiver
        const points = selectedRecognition.points

        // Get current points for receiver
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('points')
          .eq('id', receiver)
          .single()
        
        if (userError) {
          throw userError
        }

        const currentPoints = userData?.points || 0
        const newPoints = currentPoints + points

        // Update points
        const { error: updateError } = await supabase
          .from('users')
          .update({ points: newPoints })
          .eq('id', receiver)
        
        if (updateError) {
          throw updateError
        }
      }

      // Update local state
      setRecognitions(prev => prev.map(r => 
        r.id === selectedRecognition.id ? { ...r, status, hr_remarks: remarks } : r
      ))

      // Refresh top performers
      fetchTopPerformer(selectedYear)

      showToast.success(`Recognition ${approved ? 'approved' : 'rejected'} successfully`)
      setRecognitionDialog(false)
    } catch (error) {
      console.error('Error updating recognition:', error)
      showToast.error(`Failed to ${approved ? 'approve' : 'reject'} recognition`)
    } finally {
      setApprovalLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-800 border-green-200'
      case 'Rejected': return 'bg-red-100 text-red-800 border-red-200'
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved': return <ShieldCheck className="mr-1 h-3 w-3" />
      case 'Rejected': return <ShieldX className="mr-1 h-3 w-3" />
      case 'Pending': return <ThumbsUp className="mr-1 h-3 w-3" />
      default: return null
    }
  }

  const columns: ColumnDef<Recognition>[] = [
    {
      accessorKey: "receiver_user.name",
      header: "Receiver",
      cell: ({ row }) => {
        const recognition = row.original
        const user = recognition.receiver_user
        
        return (
          <div className="flex items-center gap-3">
            {user?.image_url ? (
              <img 
                src={user.image_url} 
                alt={user.name} 
                className="h-8 w-8 rounded-full object-cover" 
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {user?.name?.charAt(0) || "?"}
                </span>
              </div>
            )}
            <div>
              <div className="font-medium">{user?.name || "Unknown User"}</div>
              {/* <div className="text-xs text-gray-500">{user?.email}</div> */}
            </div>
          </div>
        )
      }
    },
    {
      accessorKey: "nominator_user.name",
      header: "Nominated By",
      cell: ({ row }) => {
        const recognition = row.original
        const user = recognition.nominator_user
        
        return (
          <div className="flex items-center gap-3">
            {user?.image_url ? (
              <img 
                src={user.image_url} 
                alt={user.name} 
                className="h-8 w-8 rounded-full object-cover" 
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {user?.name?.charAt(0) || "?"}
                </span>
              </div>
            )}
            <div className="font-medium">{user?.name || "Unknown User"}</div>
          </div>
        )
      }
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
      }
    },
    {
      accessorKey: "descriptions",
      header: "Description",
      cell: ({ row }) => {
        const description = row.getValue("descriptions") as string
        return <div className="max-w-xs truncate">{description}</div>
      }
    },
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ row }) => {
        const date = row.getValue("created_at") as string
        return format(new Date(date), "MMM d, yyyy")
      }
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge className={getStatusColor(status)}>
            {getStatusIcon(status)}
            {status}
          </Badge>
        )
      }
    },
  ]

  const filterableColumns = [
    {
      id: "status",
      title: "Status",
      options: [
        { label: "Pending", value: "Pending" },
        { label: "Approved", value: "Approved" },
        { label: "Rejected", value: "Rejected" },
      ],
    },
  ]

  const filteredRecognitions = recognitions.filter(recognition => {
    let match = true
    
    // Search by receiver or nominator name
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const receiverName = recognition.receiver_user?.name?.toLowerCase() || ""
      const nominatorName = recognition.nominator_user?.name?.toLowerCase() || ""
      const description = recognition.descriptions?.toLowerCase() || ""
      
      if (!receiverName.includes(query) && !nominatorName.includes(query) && !description.includes(query)) {
        match = false
      }
    }
    
    // Filter by status
    if (statusFilter !== "all" && recognition.status !== statusFilter) {
      match = false
    }
    
    return match
  })

  const pendingCount = recognitions.filter(r => r.status === "Pending").length

  return (
    <div className="py-8 pr-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Recognitions</h1>
        <div className="flex space-x-2">
          <Button onClick={() => exportToCSV(columns, recognitions, `Recognitions_${selectedYear}`)}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setLeaderboardDialog(true)}>
            <Medal className="mr-2 h-4 w-4" />
            Leaderboard
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Total Recognitions</p>
                <p className="text-2xl font-bold">{recognitions.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <ThumbsUp className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Total Points</p>
                <p className="text-2xl font-bold">{totalPoints}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Top Performer</p>
                <p className="text-xl font-semibold">{topPerformer?.name || "N/A"}</p>
                <p className="text-sm text-muted-foreground">{topPerformer ? `${topPerformer.points} points` : ""}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Medal className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* <div className="flex flex-col space-y-4 my-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Search by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs"
            />
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="flex gap-4 p-4 border rounded-md">
            <div className="w-60">
              <Label htmlFor="status-filter">Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(value: "all" | "Pending" | "Approved" | "Rejected") => setStatusFilter(value)}
              >
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div> */}

      <DataTable 
        columns={columns} 
        data={filteredRecognitions} 
        filterableColumns={filterableColumns}
        onYearChange={(year: string) => {setSelectedYear(year)}}
        onRowClick={(row: Recognition) => openRecognitionDetails(row)}
      />

      {loading && (
        <div className="flex justify-center my-8">
          <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
        </div>
      )}

      {/* Recognition Details Dialog */}
      <Dialog open={recognitionDialog} onOpenChange={setRecognitionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Recognition Details</DialogTitle>
          </DialogHeader>
          
          {selectedRecognition && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(selectedRecognition.status)}>
                      {getStatusIcon(selectedRecognition.status)}
                      {selectedRecognition.status}
                    </Badge>
                    <div className="flex items-center">
                      <Trophy className="h-4 w-4 text-yellow-500 mr-1 ml-5" />
                      <span>{selectedRecognition.points} points</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium mt-2">
                    {format(new Date(selectedRecognition.created_at), "MMMM d, yyyy")}
                  </p>
                </div>
              </div>

              <div className="border-t border-b py-3 space-y-3">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">From</h3>
                  <p className="font-medium">{selectedRecognition.nominator_user?.name}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">To</h3>
                  <p className="font-medium">{selectedRecognition.receiver_user?.name}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Description</h3>
                  <p className="text-sm">{selectedRecognition.descriptions}</p>
                </div>

                <div>
                  <Label htmlFor="remarks" className="font-medium">HR Remarks</Label>
                  <Textarea
                    id="remarks"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Add any remarks"
                    className="mt-1"
                    disabled={selectedRecognition.status !== "Pending"}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between gap-2">
            {selectedRecognition?.status === "Pending" ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => handleApproval(false)}
                  disabled={approvalLoading}
                  className="bg-red-100 text-red-600 hover:bg-red-200"
                >
                  <ShieldX className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button 
                  onClick={() => handleApproval(true)}
                  disabled={approvalLoading}
                  className="bg-green-100 text-green-600 hover:bg-green-200"
                >
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </>
            ) : (
              <Button onClick={() => setRecognitionDialog(false)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leaderboard Dialog */}
      <Dialog open={leaderboardDialog} onOpenChange={setLeaderboardDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Recognition Leaderboard</DialogTitle>
            <DialogDescription className="text-xs italic">
              Employees are ranked by recognition points
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {leaderboard.map((user, index) => (
              <div key={user.id} className="flex items-center gap-3 p-3 border rounded-md">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {index + 1}
                </div>
                <div className="flex-shrink-0">
                  {user.image_url ? (
                    <img 
                      src={user.image_url} 
                      alt={user.name} 
                      className="h-10 w-10 rounded-full object-cover" 
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-medium text-primary">
                        {user?.name?.charAt(0) || "?"}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-grow">
                  <p className="font-medium">{user.name}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <span className="font-bold">{user.points || 0}</span>
                </div>
              </div>
            ))}

            {leaderboard.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Medal className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No points data available yet</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setLeaderboardDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 