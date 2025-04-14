"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { showToast } from "@/lib/utils/toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Eye, Gift, Package, Plus, PencilIcon, Award, Search } from "lucide-react"

// Define the reward interface according to your database structure
interface Reward {
  id: string
  title: string
  description: string
  points: number
  image_url: string | null
  is_active: boolean
  redemptions_count: number
}

export default function RewardsPage() {
  const router = useRouter()
  const [rewards, setRewards] = useState<Reward[]>([])
  const [totalRedemptions, setTotalRedemptions] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)

  useEffect(() => {
    fetchRewards()
  }, [])

  async function fetchRewards() {
    setLoading(true)
    try {
      // Fetch rewards data from Supabase
      const { data: rewardsData, error } = await supabase
        .from('rewards')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        showToast.error("Error loading rewards")
        console.error('Error fetching rewards:', error)
        return
      }

      // Fetch redemptions count for each reward
      const { data: redemptionsData, error: redemptionsError } = await supabase
        .from('reward_redemptions')
        .select('reward_id, quantity')
        
      if (redemptionsError) {
        console.error('Error fetching redemptions:', redemptionsError)
      }

      // Calculate redemptions count for each reward
      const redemptionCountByReward = (redemptionsData || []).reduce((acc, redemption) => {
        const rewardId = redemption.reward_id
        const quantity = redemption.quantity || 1
        acc[rewardId] = (acc[rewardId] || 0) + quantity
        return acc
      }, {} as Record<string, number>)

      // Calculate total redemptions
      const totalCount = Object.values(redemptionCountByReward).reduce((sum, count) => sum + count, 0)
      setTotalRedemptions(totalCount)

      // Enhance rewards data with redemptions count
      const enhancedRewards = (rewardsData || []).map(reward => ({
        ...reward,
        redemptions_count: redemptionCountByReward[reward.id] || 0
      }))

      setRewards(enhancedRewards)
    } catch (error) {
      showToast.error("An unexpected error occurred")
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const viewReward = (reward: Reward) => {
    setSelectedReward(reward)
    setViewDialogOpen(true)
  }

  // Define table columns
  const columns: ColumnDef<Reward>[] = [
    {
      accessorKey: "title",
      header: "Reward",
      cell: ({ row }) => {
        const reward = row.original
        const imageUrl = reward.image_url
        
        return (
          <div className="flex items-center gap-3">
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt={reward.title} 
                className="h-10 w-10 rounded-md object-cover" 
              />
            ) : (
              <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                <Gift className="h-5 w-5 text-primary" />
              </div>
            )}
            <div>
              <div className="font-medium">{reward.title}</div>
              <div className="text-sm text-muted-foreground line-clamp-1">
                {reward.description}
              </div>
            </div>
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
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Gift className="mr-1 h-3 w-3" />
            {points} points
          </Badge>
        )
      }
    },
    {
      accessorKey: "redemptions_count",
      header: "Redeemed",
      cell: ({ row }) => row.getValue("redemptions_count") || 0
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("is_active") as boolean
        return isActive ? (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Active
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
            Inactive
          </Badge>
        )
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const reward = row.original
        return (
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/rewards/${reward.id}`)
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/rewards/${reward.id}/edit`)
              }}
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
          </div>
        )
      }
    }
  ]

  return (
    <div className="py-8 pr-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Rewards</h1>        
        <div className="flex space-x-2">
          <Button onClick={() => router.push('/rewards/redemptions')}>
            <Package className="mr-2 h-4 w-4" />
            View Redemptions
          </Button>
          <Button onClick={() => router.push('/rewards/create')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Reward
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Total Rewards</p>
                <p className="text-2xl font-bold">{rewards.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Gift className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Active Rewards</p>
                <p className="text-2xl font-bold">
                  {rewards.filter(r => r.is_active).length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Award className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Total Redemptions</p>
                <p className="text-2xl font-bold">{totalRedemptions}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>       
      </div>

      <DataTable 
        columns={columns} 
        data={rewards} 
        onRowClick={(row: Reward) => viewReward(row)}
      />

      {loading && (
        <div className="flex justify-center my-8">
          <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
        </div>
      )}

      {/* View Reward Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reward Details</DialogTitle>
          </DialogHeader>
          
          {selectedReward && (
            <div className="space-y-4">
              <div className="flex flex-col gap-4">
                <div className="w-full h-40 rounded-md overflow-hidden flex items-center justify-center bg-gray-100">
                  {selectedReward.image_url ? (
                    <img 
                      src={selectedReward.image_url} 
                      alt={selectedReward.title} 
                      className="object-cover w-full h-full" 
                    />
                  ) : (
                    <Gift className="h-16 w-16 text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedReward.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedReward.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-b py-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Points Required</h3>
                  <div className="flex items-center mt-1">
                    <Gift className="mr-2 h-4 w-4 text-yellow-600" />
                    <span className="font-medium">{selectedReward.points} points</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Redemption Count</h3>
                  <p className="font-medium mt-1">{selectedReward.redemptions_count}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <div className="mt-1">
                    {selectedReward.is_active ? (
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-100 text-gray-800">Inactive</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setViewDialogOpen(false)}
            >
              Close
            </Button>
            {selectedReward && (
              <Button
                onClick={() => {
                  setViewDialogOpen(false)
                  router.push(`/rewards/${selectedReward.id}/edit`)
                }}
              >
                <PencilIcon className="mr-2 h-4 w-4" />
                Edit Reward
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 