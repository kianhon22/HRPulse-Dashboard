"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2, Upload, Gift, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { showToast } from "@/lib/utils/toast"
import { Switch } from "@/components/ui/switch"
import { v4 as uuidv4 } from 'uuid'

interface Reward {
  id: string
  title: string
  description: string
  points: number
  image_url: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function EditRewardPage() {
  const router = useRouter()
  const params = useParams()
  const rewardId = params?.id as string
  
  const [reward, setReward] = useState<Reward | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [points, setPoints] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    fetchRewardDetails()
  }, [rewardId])

  const fetchRewardDetails = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('id', rewardId)
        .single()
      
      if (error) {
        showToast.error("Error loading reward details")
        console.error('Error fetching reward:', error)
        return
      }

      setReward(data)
      setTitle(data.title)
      setDescription(data.description || "")
      setPoints(data.points.toString())
      setImageUrl(data.image_url || "")
      setIsActive(data.is_active)
    } catch (error) {
      showToast.error("An unexpected error occurred")
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImageFile(file)
    
    // Create a preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const uploadImage = async (): Promise<string> => {
    if (!imageFile) return imageUrl

    try {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${uuidv4()}.${fileExt}`
      const filePath = `reward-images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('rewards')
        .upload(filePath, imageFile)

      if (uploadError) {
        throw uploadError
      }

      const { data } = supabase.storage
        .from('rewards')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      throw error
    }
  }

  const handleExternalUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value)
    setImageFile(null)
    setImagePreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate fields
    if (!title.trim()) {
      showToast.error("Title is required")
      return
    }

    if (!points || parseInt(points) <= 0) {
      showToast.error("Points must be a positive number")
      return
    }

    setIsSubmitting(true)

    try {
      // If there's an image file, upload it first
      let finalImageUrl = imageUrl
      if (imageFile) {
        finalImageUrl = await uploadImage()
      }

      // Update the reward
      const { error } = await supabase
        .from('rewards')
        .update({
          title,
          description,
          points: parseInt(points),
          image_url: finalImageUrl,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', rewardId)

      if (error) {
        throw error
      }

      showToast.success("Reward updated successfully!")
      router.push(`/rewards/${rewardId}`)
    } catch (error) {
      console.error('Error updating reward:', error)
      showToast.error("Failed to update reward. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClearImage = () => {
    setImageUrl("")
    setImageFile(null)
    setImagePreview(null)
  }

  if (loading) {
    return (
      <div className="py-8 pr-8">
        <div className="flex items-center mb-4">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Loading Reward...</h1>
        </div>
      </div>
    )
  }

  if (!reward) {
    return (
      <div className="py-8 pr-8">
        <div className="flex items-center mb-4">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Reward Not Found</h1>
        </div>
        <p>The requested reward could not be found.</p>
      </div>
    )
  }

  return (
    <div className="py-8 pr-8">
      <div className="flex items-center mb-8">
        <Button variant="ghost" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Edit Reward</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Reward Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter reward title"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter reward description"
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="points">Points Required *</Label>
              <Input
                id="points"
                type="number"
                min="1"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                placeholder="Enter points required"
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch 
                id="is_active" 
                checked={isActive} 
                onCheckedChange={setIsActive} 
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reward Image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="image_url">Image URL</Label>
                {(imageUrl || imagePreview) && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={handleClearImage}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
              <Input
                id="image_url"
                type="url"
                value={imageUrl}
                onChange={handleExternalUrlChange}
                placeholder="Enter external image URL"
                disabled={!!imageFile}
              />
              <p className="text-sm text-muted-foreground">Enter a URL for an existing image, or upload a new one below.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_upload">Upload Image</Label>
              <div className="border-2 border-dashed rounded-md p-4 text-center">
                <Input
                  id="image_upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={!!imageUrl && !imageFile}
                />
                <Label htmlFor="image_upload" className="cursor-pointer flex flex-col items-center justify-center">
                  <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium">
                    Click to upload, or drag and drop
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    PNG, JPG, GIF up to 10MB
                  </span>
                </Label>
              </div>
            </div>

            {(imagePreview || imageUrl) && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Image Preview</h3>
                <div className="border rounded-md p-4 flex justify-center">
                  <img 
                    src={imagePreview || imageUrl} 
                    alt="Preview" 
                    className="max-h-40 object-contain" 
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push(`/rewards/${rewardId}`)} 
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Gift className="mr-2 h-4 w-4" />
                Update Reward
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
} 