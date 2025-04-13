"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2, Upload, Gift } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { showToast } from "@/lib/utils/toast"
import { v4 as uuidv4 } from 'uuid'

export default function CreateRewardPage() {
  const router = useRouter()
  
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("-")
  const [points, setPoints] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

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
    if (!imageFile) return ""

    try {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${uuidv4()}.${fileExt}`
      const filePath = `reward/${fileName}`

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

      // Create the reward
      const { data, error } = await supabase
        .from('rewards')
        .insert({
          title,
          description,
          points: parseInt(points),
          image_url: finalImageUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()

      if (error) {
        throw error
      }

      showToast.success("Reward created successfully!")
      router.push('/rewards')
    } catch (error) {
      console.error('Error creating reward:', error)
      showToast.error("Failed to create reward. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="py-8 pr-8">
      <div className="flex items-center mb-8">
        <Button variant="ghost" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Create New Reward</h1>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reward Image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="image_url">Image URL</Label>
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
                  disabled={!!imageUrl}
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
            onClick={() => router.push('/rewards')} 
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
                Create Reward
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
} 