"use client"

import { Button } from "@/components/ui/button"
import { showToast } from "@/lib/utils/toast"

export function ToastUtilDemo() {
  return (
    <div className="flex flex-wrap gap-4">
      <Button
        variant="default"
        onClick={() => showToast.success("Operation completed successfully!")}
      >
        Success Toast
      </Button>
      
      <Button
        variant="destructive"
        onClick={() => showToast.error("Something went wrong. Please try again.")}
      >
        Error Toast
      </Button>
      
      <Button
        variant="outline"
        onClick={() => showToast.info("This is an informational message.")}
      >
        Info Toast
      </Button>
      
      <Button
        variant="secondary"
        onClick={() => showToast.warning("Please be careful with this action.")}
      >
        Warning Toast
      </Button>
      
      <Button
        variant="outline"
        onClick={() => 
          showToast.custom({
            title: "Custom Toast",
            description: "This is a custom toast message with an action button.",
            action: (
              <Button
                variant="outline"
                className="h-8 px-4 text-xs"
                onClick={() => console.log("Custom action clicked")}
              >
                Action
              </Button>
            ),
          })
        }
      >
        Custom Toast
      </Button>
    </div>
  )
} 