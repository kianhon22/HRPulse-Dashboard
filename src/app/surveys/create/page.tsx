"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Plus, Trash2, GripVertical } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { showToast } from "@/lib/utils/toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { v4 as uuidv4 } from "uuid"

type QuestionType = "text" | "multiple_choice" | "rating"

interface Question {
  id: string
  question_text: string
  question_type: QuestionType
  required: boolean
  options: string[]
  order: number
}

export default function CreateSurveyPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [status, setStatus] = useState<string>("Draft")
  const [questions, setQuestions] = useState<Question[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const addQuestion = () => {
    const newQuestion: Question = {
      id: uuidv4(),
      question_text: "",
      question_type: "text",
      required: false,
      options: [""],
      order: questions.length
    }
    setQuestions([...questions, newQuestion])
  }

  const removeQuestion = (index: number) => {
    const newQuestions = [...questions]
    newQuestions.splice(index, 1)
    // Update order for remaining questions
    setQuestions(newQuestions.map((q, i) => ({ ...q, order: i })))
  }

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const newQuestions = [...questions]
    newQuestions[index] = { ...newQuestions[index], [field]: value }
    setQuestions(newQuestions)
  }

  const addOption = (questionIndex: number) => {
    const newQuestions = [...questions]
    newQuestions[questionIndex].options.push("")
    setQuestions(newQuestions)
  }

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const newQuestions = [...questions]
    newQuestions[questionIndex].options[optionIndex] = value
    setQuestions(newQuestions)
  }

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...questions]
    newQuestions[questionIndex].options.splice(optionIndex, 1)
    setQuestions(newQuestions)
  }

  const handleSubmit = async () => {
    // Validate form
    if (!title.trim()) {
      showToast.error("Please enter a survey title")
      return
    }

    if (questions.length === 0) {
      showToast.error("Please add at least one question")
      return
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.question_text.trim()) {
        showToast.error(`Question ${i + 1} text is required`)
        return
      }
      if (q.question_type === "multiple_choice" && (!q.options.length || q.options.some(opt => !opt.trim()))) {
        showToast.error(`Please provide valid options for question ${i + 1}`)
        return
      }
    }

    setIsSubmitting(true)

    try {
      // Create survey
      const { data: survey, error: surveyError } = await supabase
        .from('surveys')
        .insert({
          title,
          description: description || null,
          start_date: startDate ? startDate.toISOString() : null,
          end_date: endDate ? endDate.toISOString() : null,
          status,
          created_by: "current_user_id" // Replace with actual user ID from auth context
        })
        .select()
        .single()

      if (surveyError) {
        showToast.error("Failed to create survey: " + surveyError.message)
        setIsSubmitting(false)
        return
      }

      // Insert questions
      const questionsToInsert = questions.map(q => ({
        survey_id: survey.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.question_type === "multiple_choice" ? q.options : null,
        required: q.required,
        order: q.order
      }))

      const { error: questionsError } = await supabase
        .from('survey_questions')
        .insert(questionsToInsert)

      if (questionsError) {
        showToast.error("Failed to save questions: " + questionsError.message)
        setIsSubmitting(false)
        return
      }

      showToast.success("Survey created successfully")
      router.push(`/surveys/${survey.id}`)
    } catch (error) {
      console.error("Error creating survey:", error)
      showToast.error("An unexpected error occurred")
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
        <h1 className="text-3xl font-bold">Create New Survey</h1>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Survey Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Survey Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter survey title"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter survey description"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full mt-1 justify-start text-left font-normal"
                    >
                      {startDate ? format(startDate, "PPP") : "Select start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full mt-1 justify-start text-left font-normal"
                    >
                      {endDate ? format(endDate, "PPP") : "Select end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      disabled={(date) => 
                        startDate ? date < startDate : false
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Questions</CardTitle>
            <Button size="sm" onClick={addQuestion}>
              <Plus className="mr-2 h-4 w-4" />
              Add Question
            </Button>
          </CardHeader>
          <CardContent>
            {questions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-sm text-muted-foreground mb-4">No questions added yet</p>
                <Button onClick={addQuestion}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Question
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {questions.map((question, index) => (
                  <div key={question.id} className="border rounded-lg p-4 relative">
                    <div className="absolute top-2 right-2 flex">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeQuestion(index)}
                        className="h-8 w-8 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="mb-4 flex items-center">
                      <GripVertical className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="font-medium">Question {index + 1}</span>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor={`question-${index}`}>Question Text</Label>
                        <Input
                          id={`question-${index}`}
                          value={question.question_text}
                          onChange={(e) => updateQuestion(index, "question_text", e.target.value)}
                          placeholder="Enter question"
                          className="mt-1"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`type-${index}`}>Question Type</Label>
                          <Select 
                            value={question.question_type} 
                            onValueChange={(value: QuestionType) => updateQuestion(index, "question_type", value)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                              <SelectItem value="rating">Rating</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-end">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`required-${index}`}
                              checked={question.required}
                              onChange={(e) => updateQuestion(index, "required", e.target.checked)}
                              className="h-4 w-4 text-primary focus:ring-primary"
                            />
                            <Label htmlFor={`required-${index}`}>Required</Label>
                          </div>
                        </div>
                      </div>

                      {question.question_type === "multiple_choice" && (
                        <div>
                          <Label>Options</Label>
                          <div className="space-y-2 mt-1">
                            {question.options.map((option, optIndex) => (
                              <div key={optIndex} className="flex items-center space-x-2">
                                <Input
                                  value={option}
                                  onChange={(e) => updateOption(index, optIndex, e.target.value)}
                                  placeholder={`Option ${optIndex + 1}`}
                                  className="flex-1"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeOption(index, optIndex)}
                                  disabled={question.options.length <= 1}
                                  className="h-8 w-8 text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addOption(index)}
                              className="mt-2"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Add Option
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Survey"}
          </Button>
        </div>
      </div>
    </div>
  )
} 