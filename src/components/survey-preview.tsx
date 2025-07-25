import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

type QuestionType = "text" | "rating"

interface Question {
  id: string
  question_text: string
  type: QuestionType
  required?: boolean
  order: number
}

interface SurveyPreviewProps {
  title: string
  description: string
  questions: Question[]
  onExitPreview: () => void
}

export function SurveyPreview({ title, description, questions, onExitPreview }: SurveyPreviewProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{title || "Untitled Survey"}</CardTitle>
          {description && <p className="text-gray-600 mt-2">{description}</p>}
        </CardHeader>
        <CardContent className="space-y-6">
          {questions.map((question, index) => (
            <div key={question.id} className="border-b pb-4 last:border-0">
              <div className="flex items-start space-x-2">
                <p className="font-medium mb-2">{question.question_text || `Question ${index + 1}`}</p>
                {question.required && (
                  <span className="text-red-500 text-sm">*</span>
                )}
              </div>
              {question.type === "text" ? (
                <Textarea placeholder="Enter your answer" disabled className="bg-gray-50" />
              ) : (
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <Button key={num} variant="outline" size="sm" disabled className="px-3 py-1">
                      {num}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button onClick={onExitPreview}>
          Return to Editor
        </Button>
      </div>
    </div>
  )
} 