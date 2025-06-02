"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { supabase } from "@/lib/supabase"
import { showToast } from "@/lib/utils/toast"
import { ShieldCheck, ShieldX } from "lucide-react"

// Define the Leave type
type Leave = {
  id: string
  user_id: string
  employee_name: string
  leave_type: string
  start_date: string
  end_date: string
  status: "Pending" | "Approved" | "Rejected" | "Cancelled"
  reason: string
  hr_remarks: string | null
  attachment_url: string | null
  created_at: string
  users?: {
    name: string
  } | null
}

interface LeaveDetailDialogProps {
  leave: Leave | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onLeaveUpdated: () => void
}

export function LeaveDetailDialog({ leave, open, onOpenChange, onLeaveUpdated }: LeaveDetailDialogProps) {
  const [remarks, setRemarks] = useState(leave?.hr_remarks || "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calculate the duration of the leave in days
  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 because it's inclusive
  }

  const handleStatusUpdate = async (status: "Approved" | "Rejected") => {
    if (!leave) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('leaves')
        .update({ 
          status,
          hr_remarks: remarks
        })
        .eq('id', leave.id)

      if (error) {
        showToast.error("Failed to update leave status: " + error.message)
        return
      }

      showToast.success(`Leave ${status.toLowerCase()} successfully`)
      onLeaveUpdated()
      onOpenChange(false)
    } catch (error) {
      showToast.error("An unexpected error occurred")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!leave) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Leave Request Details</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="font-bold">Employee</Label>
              <p>{leave.employee_name}</p>
            </div>
            <div>
              <Label className="font-bold">Status</Label>
              <p className={`capitalize font-medium ${
                leave.status === "Approved" ? "text-green-600" :
                leave.status === "Rejected" ? "text-red-600" :
                leave.status === "Cancelled" ? "text-gray-600" :
                "text-yellow-600"
              }`}>
                {leave.status}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="font-bold">Leave Type</Label>
              <p>{leave.leave_type}</p>
            </div>
            <div>
              <Label className="font-bold">Duration</Label>
              <p>{calculateDuration(leave.start_date, leave.end_date)} days</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="font-bold">Start Date</Label>
              <p>{format(new Date(leave.start_date), "MMM dd, yyyy")}</p>
            </div>
            <div>
              <Label className="font-bold">End Date</Label>
              <p>{format(new Date(leave.end_date), "MMM dd, yyyy")}</p>
            </div>
          </div>

          <div>
            <Label className="font-bold">Reason</Label>
            <p className="whitespace-pre-wrap">{leave.reason}</p>
          </div>

          {leave.attachment_url && (
            <div>
              <Label className="font-bold">Attachment</Label>
              <p>
                <a 
                  href={leave.attachment_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View Attachment
                </a>
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="remarks" className="font-bold">HR Remarks</Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add any remarks or notes here"
              className="mt-1"
              disabled={leave.status !== "Pending"}
            />
          </div>
        </div>

        {leave.status === "Pending" && (
          <DialogFooter className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => handleStatusUpdate("Rejected")}
              disabled={isSubmitting}
              className="bg-red-100 text-red-600 hover:bg-red-200"
            >
              <ShieldX className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={() => handleStatusUpdate("Approved")}
              disabled={isSubmitting}
              className="bg-green-100 text-green-600 hover:bg-green-200"
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
} 