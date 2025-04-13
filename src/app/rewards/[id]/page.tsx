"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { Skeleton } from "@/components/ui/skeleton"
import { format, parseISO } from "date-fns"
import { supabase } from "@/lib/supabase"
import { showToast } from "@/lib/utils/toast"
import { ColumnDef } from "@tanstack/react-table"
import { 
  ArrowLeft, 
  Gift, 
  Calendar, 
  Tag, 
  User, 
  Users, 
  CheckCircle2, 
  Clock, 
  Package, 
  X, 
  AlertTriangle 
} from "lucide-react"

interface Reward {
  id: string
  title: string
  description: string
  points: number
  image_url: string | null
  created_at: string
  updated_at: string
  is_active: boolean
  redemptions_count: number
}

interface RewardRedemption {
  id: string
  user_id: string
  created_at: string
  status: string
  quantity: number
  total_points: number
  notes?: string
  user_name: string
  user_email: string
}

export default function RewardDetailPage() {
  const router = useRouter()
  const params = useParams()
  const rewardId = params.id as string
  
  const [reward, setReward] = useState<Reward | null>(null)
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("details")

  useEffect(() => {
    if (rewardId) {
      fetchRewardDetails()
    }
  }, [rewardId])

  async function fetchRewardDetails() {
    setLoading(true)
    try {
      // Fetch the reward details
      const { data: rewardData, error: rewardError } = await supabase
        .from('rewards')
        .select('*')
        .eq('id', rewardId)
        .single()

      if (rewardError) {
        showToast.error("Error loading reward details")
        console.error('Error fetching reward:', rewardError)
        return
      }

      // Get redemption count
      const { count: redemptionsCount, error: countError } = await supabase
        .from('reward_redemptions')
        .select('id', { count: 'exact', head: true })
        .eq('reward_id', rewardId)

      if (countError) {
        console.error('Error fetching redemption count:', countError)
      }

      // Fetch redemptions for this reward
      const { data: redemptionsData, error: redemptionsError } = await supabase
        .from('reward_redemptions')
        .select(`
          *,
          users:user_id (name, email)
        `)
        .eq('reward_id', rewardId)
        .order('created_at', { ascending: false })

      if (redemptionsError) {
        console.error('Error fetching redemptions:', redemptionsError)
      }

      // Format the redemption data
      const formattedRedemptions = (redemptionsData || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        created_at: item.created_at,
        status: item.status || 'pending',
        quantity: item.quantity || 1,
        total_points: (item.quantity || 1) * (rewardData?.points || 0),
        notes: item.notes,
        user_name: item.profiles?.name || 'Unknown',
        user_email: item.profiles?.email || '',
      }))

      // Set the reward data with redemption count
      setReward({
        ...rewardData,
        redemptions_count: redemptionsCount || 0
      })
      
      setRedemptions(formattedRedemptions)
    } catch (error) {
      showToast.error("An unexpected error occurred")
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusDetails = (status: string) => {
    switch (status) {
      case "pending":
        return {
          label: "Pending",
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: <Clock className="h-3 w-3 mr-1" />
        }
      case "approved":
        return {
          label: "Approved",
          color: "bg-blue-100 text-blue-800 border-blue-200",
          icon: <CheckCircle2 className="h-3 w-3 mr-1" />
        }
      case "fulfilled":
        return {
          label: "Fulfilled",
          color: "bg-green-100 text-green-800 border-green-200",
          icon: <Package className="h-3 w-3 mr-1" />
        }
      case "rejected":
        return {
          label: "Rejected",
          color: "bg-red-100 text-red-800 border-red-200",
          icon: <X className="h-3 w-3 mr-1" />
        }
      default:
        return {
          label: "Unknown",
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: <AlertTriangle className="h-3 w-3 mr-1" />
        }
    }
  }

  // Table columns for redemptions
  const redemptionColumns: ColumnDef<RewardRedemption>[] = [
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
      accessorKey: "quantity",
      header: "Quantity",
      cell: ({ row }) => row.original.quantity
    },
    {
      accessorKey: "total_points",
      header: "Points",
      cell: ({ row }) => {
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Gift className="mr-1 h-3 w-3" />
            {row.original.total_points} points
          </Badge>
        )
      }
    },
    {
      accessorKey: "created_at",
      header: "Requested",
      cell: ({ row }) => {
        const date = row.getValue("created_at") as string
        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            {format(parseISO(date), "MMM d, yyyy")}
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
    }
  ]

  if (loading) {
    return (
      <div className="py-8 pr-8">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => router.push('/rewards')} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  if (!reward) {
    return (
      <div className="py-8 pr-8">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => router.push('/rewards')} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Reward Not Found</h1>
            <p className="text-muted-foreground">
              The reward you're looking for doesn't exist or has been removed.
            </p>
          </div>
        </div>
        <Button onClick={() => router.push('/rewards')}>
          Return to Rewards
        </Button>
      </div>
    )
  }

  return (
    <div className="py-8 pr-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="outline" onClick={() => router.push('/rewards')} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Rewards
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{reward.title}</h1>
            <p className="text-muted-foreground">
              Reward details and redemption history
            </p>
          </div>
        </div>
        <div>
          <Button onClick={() => router.push(`/rewards/${rewardId}/edit`)} variant="outline" className="mr-2">
            Edit Reward
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="redemptions">
            Redemptions 
            <span className="ml-2 bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
              {redemptions.length}
            </span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Card>
                <CardContent className="pt-6">
                  <div className="w-full aspect-square rounded-md overflow-hidden flex items-center justify-center bg-gray-100">
                    {reward.image_url ? (
                      <img 
                        src={reward.image_url} 
                        alt={reward.title} 
                        className="object-cover w-full h-full" 
                      />
                    ) : (
                      <Gift className="h-16 w-16 text-gray-400" />
                    )}
                  </div>
                  <div className="mt-4 space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <Badge className={reward.is_active ? 
                        "bg-green-100 text-green-800 border-green-200" : 
                        "bg-red-100 text-red-800 border-red-200"
                      }>
                        {reward.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Created</p>
                      <p className="text-sm">{format(parseISO(reward.created_at), "MMMM d, yyyy")}</p>
                    </div>
                    {reward.updated_at && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Last Updated</p>
                        <p className="text-sm">{format(parseISO(reward.updated_at), "MMMM d, yyyy")}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Reward Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500 flex items-center">
                        <Gift className="h-4 w-4 mr-2 text-primary" />
                        Points Required
                      </p>
                      <p className="text-xl font-bold">{reward.points} points</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 flex items-center">
                        <Users className="h-4 w-4 mr-2 text-primary" />
                        Redemption Count
                      </p>
                      <p className="text-xl font-bold">{reward.redemptions_count}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">Description</p>
                    <div className="mt-2 p-4 bg-gray-50 rounded-md min-h-[100px]">
                      {reward.description ? (
                        <p className="whitespace-pre-line">{reward.description}</p>
                      ) : (
                        <p className="text-gray-400 italic">No description provided</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="redemptions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Redemption History</CardTitle>
            </CardHeader>
            <CardContent>
              {redemptions.length > 0 ? (
                <DataTable 
                  columns={redemptionColumns} 
                  data={redemptions} 
                />
              ) : (
                <div className="text-center py-8">
                  <Gift className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No Redemptions Yet</h3>
                  <p className="text-gray-500 mt-1">
                    This reward hasn't been redeemed by any employees yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 