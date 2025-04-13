"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ColumnDef } from "@tanstack/react-table"
import { supabase } from "@/lib/supabase"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { showToast } from "@/lib/utils/toast"
import { Input } from "@/components/ui/input"
import { 
  Eye, 
  Package, 
  Check, 
  Clock, 
  Gift, 
  User, 
  Calendar, 
  AlertTriangle
} from "lucide-react"

interface RewardRedemption {
  id: string
  user_id: string
  reward_id: string
  created_at: string
  status: string
  quantity: number
  points_spent: number
  user_name: string
  user_email: string
  reward_title: string
  reward_points: number
  image_url?: string
}

export default function RedemptionsPage() {
  const router = useRouter()
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [totalPointsSpent, setTotalPointsSpent] = useState(0)
  const [selectedRedemption, setSelectedRedemption] = useState<RewardRedemption | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  // const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  // const [rejectionReason, setRejectionReason] = useState("")
  const [processingAction, setProcessingAction] = useState(false)

  useEffect(() => {
    fetchRedemptions()
  }, [])

  async function fetchRedemptions() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('reward_redemptions')
        .select(`
          *,
          users:user_id (name, email),
          rewards:reward_id (title, points, image_url)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        showToast.error("Error loading redemptions")
        console.error('Error fetching redemptions:', error)
        return
      }

      // Format the data to match our interface
      const formattedData = (data || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        reward_id: item.reward_id,
        created_at: item.created_at,
        status: item.status,
        quantity: item.quantity || 1,
        // points_spent: (item.quantity || 1) * (item.rewards?.points || 0),
        points_spent: item.points_spent ?? 0,
        user_name: item.users?.name || 'Unknown',
        user_email: item.users?.email || '',
        reward_title: item.rewards?.title || 'Unknown Reward',
        reward_points: item.rewards?.points || 0,
        image_url: item.rewards?.image_url
      }))

      setRedemptions(formattedData)
      
      // Calculate pending count
      const pending = formattedData.filter(r => r.status === 'Pending').length
      setPendingCount(pending)
      
      // Calculate total points spent
      const pointsSpent = formattedData.reduce((sum, r) => {
        if (r.status === 'Redeemed') {
          return sum + r.points_spent
        }
        return sum
      }, 0)
      setTotalPointsSpent(pointsSpent)
    } catch (error) {
      showToast.error("An unexpected error occurred")
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const viewRedemption = (redemption: RewardRedemption) => {
    setSelectedRedemption(redemption)
    setViewDialogOpen(true)
  }

  const handleConfirmAction = (redemption: RewardRedemption) => {
    setSelectedRedemption(redemption)
    setConfirmDialogOpen(true)
  }

  // const handleRejectAction = (redemption: RewardRedemption) => {
  //   setSelectedRedemption(redemption)
  //   setRejectionReason("")
  //   setRejectDialogOpen(true)
  // }

  const completeRedemption = async () => {
    if (!selectedRedemption) return
    
    setProcessingAction(true)
    try {
      const { error } = await supabase
        .from('reward_redemptions')
        .update({ status: 'Redeemed' })
        .eq('id', selectedRedemption.id)
      
      if (error) {
        showToast.error("Error completing redemption")
        console.error('Error completing redemption:', error)
        return
      }

      showToast.success("Redemption completed successfully")
      setConfirmDialogOpen(false)
      setViewDialogOpen(false)
      fetchRedemptions()
    } catch (error) {
      showToast.error("An unexpected error occurred")
      console.error('Error:', error)
    } finally {
      setProcessingAction(false)
    }
  }

  const getStatusDetails = (status: string) => {
    switch (status) {
      case "Pending":
        return {
          label: "Pending",
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: <Clock className="h-3 w-3 mr-1" />
        }
      case "Completed":
        return {
          label: "Completed",
          color: "bg-green-100 text-green-800 border-green-200",
          icon: <Check className="h-3 w-3 mr-1" />
        }
      default:
        return {
          label: "Unknown",
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: <AlertTriangle className="h-3 w-3 mr-1" />
        }
    }
  }

  // Define table columns
  const columns: ColumnDef<RewardRedemption>[] = [
    {
      accessorKey: "reward_title",
      header: "Reward",
      cell: ({ row }) => {
        const redemption = row.original
        const imageUrl = redemption.image_url
        
        return (
          <div className="flex items-center gap-3">
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt={redemption.reward_title} 
                className="h-10 w-10 rounded-md object-cover" 
              />
            ) : (
              <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                <Gift className="h-5 w-5 text-primary" />
              </div>
            )}
            <div className="font-medium">{redemption.reward_title}</div>
          </div>
        )
      }
    },
    {
      accessorKey: "user_name",
      header: "Employee",
      cell: ({ row }) => {
        const redemption = row.original
        return (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <div>{redemption.user_name}</div>
              <div className="text-xs text-muted-foreground">{redemption.user_email}</div>
            </div>
          </div>
        )
      }
    },
    {
      accessorKey: "points_spent",
      header: "Points Spent",
      cell: ({ row }) => {
        const redemption = row.original
        return (
          <div className="flex items-center">
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              <Gift className="mr-1 h-3 w-3" />
              {redemption.points_spent} points
            </Badge>
            {redemption.quantity > 1 && (
              <span className="ml-2 text-xs text-muted-foreground">
                ({redemption.quantity} × {redemption.reward_points})
              </span>
            )}
          </div>
        )
      }
    },
    {
      accessorKey: "created_at",
      header: "Requested At",
      cell: ({ row }) => {
        const date = row.getValue("created_at") as string
        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            {format(new Date(date), "MMM d, yyyy")}
          </div>
        )
      }
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        const { label, color, icon } = getStatusDetails(status)
        
        return (
          <Badge variant="outline" className={color}>
            {icon}
            {label}
          </Badge>
        )
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const redemption = row.original
        return (
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                viewRedemption(redemption)
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        )
      }
    }
  ]

  const filterableColumns = [
    {
      id: "status",
      title: "Status",
      width: "w-[90px]",
      options: [
        { label: "Pending", value: "Pending" },
        { label: "Completed", value: "Completed" },
      ],
    },
  ]

  const handleYearChange = (year: string) => {
    setSelectedYear(year)
  }

  return (
    <div className="py-8 pr-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Reward Redemptions</h1>
          <p className="text-muted-foreground">
            Manage and track employee reward redemption requests
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/rewards')}>
          Back to Rewards
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">All Redemptions</p>
                <p className="text-2xl font-bold">{redemptions.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Pending Requests</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Total Points Spent</p>
                <p className="text-2xl font-bold">{totalPointsSpent}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <Gift className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <DataTable 
        columns={columns} 
        data={redemptions} 
        filterableColumns={filterableColumns}
        onYearChange={handleYearChange}
        onRowClick={(row: RewardRedemption) => viewRedemption(row)}
      />

      {loading && (
        <div className="flex justify-center my-8">
          <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
        </div>
      )}

      {/* View Redemption Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Redemption Details</DialogTitle>
          </DialogHeader>
          
          {selectedRedemption && (
            <div className="space-y-4">
              <div className="flex flex-col gap-4">
                <div className="w-full h-40 rounded-md overflow-hidden flex items-center justify-center bg-gray-100">
                  {selectedRedemption.image_url ? (
                    <img 
                      src={selectedRedemption.image_url} 
                      alt={selectedRedemption.reward_title} 
                      className="object-cover w-full h-full" 
                    />
                  ) : (
                    <Gift className="h-16 w-16 text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedRedemption.reward_title}</h3>
                  <div className="flex items-center mt-1">
                    <Gift className="mr-2 h-4 w-4 text-yellow-600" />
                    <span className="font-medium">{selectedRedemption.reward_points} points</span>
                    {selectedRedemption.quantity > 1 && (
                      <Badge variant="outline" className="ml-2">
                        Qty: {selectedRedemption.quantity}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-b py-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <div className="mt-1">
                    {(() => {
                      const { label, color, icon } = getStatusDetails(selectedRedemption.status)
                      return (
                        <Badge variant="outline" className={color}>
                          {icon}
                          {label}
                        </Badge>
                      )
                    })()}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Total Points</h3>
                  <p className="font-medium mt-1">{selectedRedemption.points_spent} points</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Requested by</h3>
                  <p className="font-medium mt-1">{selectedRedemption.user_name}</p>
                  <p className="text-sm text-gray-500">{selectedRedemption.user_email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Request Date</h3>
                  <p className="text-sm mt-1">
                    {format(new Date(selectedRedemption.created_at), "PPP")}
                  </p>
                </div>
              </div>
              
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            {selectedRedemption && selectedRedemption.status === 'Pending' && (
              <>
                <Button
                  onClick={() => {
                    setViewDialogOpen(false)
                    handleConfirmAction(selectedRedemption)
                  }}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Complete
                </Button>
              </>
            )}
            <Button
              variant="outline"
              className="sm:order-first"
              onClick={() => setViewDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedRedemption?.status === 'Pending' ? 'Complete Redemption' : ''}
            </DialogTitle>
            <DialogDescription>
              {selectedRedemption?.status === 'Pending' 
                ? 'Are you sure you want to complete this redemption request?'
                : ''}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {selectedRedemption && (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                  <Gift className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{selectedRedemption.reward_title}</p>
                  <p className="text-sm text-muted-foreground">Requested by {selectedRedemption.user_name}</p>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
              disabled={processingAction}
            >
              Cancel
            </Button>
            <Button
              onClick={completeRedemption}
              disabled={processingAction}
            >
              {processingAction ? (
                <span className="flex items-center">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-opacity-50 border-t-transparent rounded-full mr-2"></span>
                  Processing...
                </span>
              ) : 
                <><Check className="mr-2 h-4 w-4" />Complete Redemption</>
              }              
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Redemption</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this redemption request.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {selectedRedemption && (
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                  <Gift className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{selectedRedemption.reward_title}</p>
                  <p className="text-sm text-muted-foreground">Requested by {selectedRedemption.user_name}</p>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Rejection Reason (optional)</h3>
              <Input
                placeholder="Reason for rejection"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={processingAction}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={rejectRedemption}
              disabled={processingAction}
            >
              {processingAction ? (
                <span className="flex items-center">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-opacity-50 border-t-transparent rounded-full mr-2"></span>
                  Processing...
                </span>
              ) : (
                <><X className="mr-2 h-4 w-4" />Reject Redemption</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog> */}
    </div>
  )
} 