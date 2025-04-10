"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { showToast } from "@/lib/utils/toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { SingleDatePicker } from "@/components/ui/date-picker"

type SurveyQuestion = {
  id?: string
  survey_id: string
  question_text: string
  question_type: "multiple_choice" | "text" | "rating"
  options?: string[]
  required: boolean
  order: number
}

type Survey = {
  id: string
  title: string
  description: string | null
  start_date: string | null
  end_date: string | null
  status: "Draft" | "Scheduled" | "Active" | "Ended"
}

export default function EditSurveyPage() {
  const router = useRouter()
  const surveyId = useParams()?.id as string
  
  const [survey, setSurvey] = useState<Survey>({
    id: surveyId,
    title: "",
    description: "",
    start_date: null,
    end_date: null,
    status: "Draft"
  })
  
  const [questions, setQuestions] = useState<SurveyQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  
  // Fetch survey data
  useEffect(() => {
    const fetchSurvey = async () => {
      setLoading(true)
      try {
        const { data: surveyData, error: surveyError } = await supabase
          .from('surveys')
          .select('*')
          .eq('id', surveyId)
          .single()
        
        if (surveyError) {
          showToast.error("Error loading survey data")
          console.error('Error fetching survey:', surveyError)
          return
        }
        
        setSurvey(surveyData)
        
        if (surveyData.start_date) {
          setStartDate(new Date(surveyData.start_date))
        }
        
        if (surveyData.end_date) {
          setEndDate(new Date(surveyData.end_date))
        }
        
        // Fetch the questions
        const { data: questionsData, error: questionsError } = await supabase
          .from('survey_questions')
          .select('*')
          .eq('survey_id', surveyId)
          .order('order', { ascending: true })
        
        if (questionsError) {
          showToast.error("Error loading survey questions")
          console.error('Error fetching questions:', questionsError)
          return
        }
        
        setQuestions(questionsData || [])
      } catch (error) {
        showToast.error("An unexpected error occurred")
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchSurvey()
  }, [surveyId])
  
  const handleSurveyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setSurvey(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleStatusChange = (value: string) => {
    setSurvey(prev => ({
      ...prev,
      status: value as Survey['status']
    }))
  }
  
  const handleQuestionChange = (index: number, field: string, value: any) => {
    setQuestions(prev => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        [field]: value
      }
      return updated
    })
  }
  
  const handleOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
    setQuestions(prev => {
      const updated = [...prev]
      const options = [...(updated[questionIndex].options || [])]
      options[optionIndex] = value
      updated[questionIndex].options = options
      return updated
    })
  }
  
  const addOption = (questionIndex: number) => {
    setQuestions(prev => {
      const updated = [...prev]
      const question = updated[questionIndex]
      updated[questionIndex] = {
        ...question,
        options: [...(question.options || []), ""]
      }
      return updated
    })
  }
  
  const removeOption = (questionIndex: number, optionIndex: number) => {
    setQuestions(prev => {
      const updated = [...prev]
      const options = [...(updated[questionIndex].options || [])]
      options.splice(optionIndex, 1)
      updated[questionIndex].options = options
      return updated
    })
  }
  
  const addQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        survey_id: surveyId,
        question_text: "",
        question_type: "text",
        options: [],
        required: false,
        order: prev.length
      }
    ])
  }
  
  const removeQuestion = (index: number) => {
    setQuestions(prev => {
      const updated = [...prev]
      updated.splice(index, 1)
      
      // Update order for remaining questions
      return updated.map((q, i) => ({
        ...q,
        order: i
      }))
    })
  }
  
  const validateForm = () => {
    if (!survey.title.trim()) {
      showToast.error("Survey title is required")
      return false
    }
    
    if (!questions.length) {
      showToast.error("Please add at least one question")
      return false
    }
    
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      
      if (!q.question_text.trim()) {
        showToast.error(`Question ${i + 1} text is required`)
        return false
      }
      
      if (q.question_type === "multiple_choice" && (!q.options || q.options.length < 2)) {
        showToast.error(`Please provide valid options for question ${i + 1}`)
        return false
      }
    }
    
    return true
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setSaving(true)
    
    try {
      // Update survey
      const { error: surveyError } = await supabase
        .from('surveys')
        .update({
          title: survey.title,
          description: survey.description,
          start_date: startDate?.toISOString() || null,
          end_date: endDate?.toISOString() || null,
          status: survey.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', surveyId)
      
      if (surveyError) {
        showToast.error("Failed to update survey: " + surveyError.message)
        setSaving(false)
        return
      }
      
      // Get existing questions to determine which to update/delete
      const { data: existingQuestions } = await supabase
        .from('survey_questions')
        .select('id')
        .eq('survey_id', surveyId)
      
      const existingIds = new Set((existingQuestions || []).map(q => q.id))
      const currentIds = new Set(questions.filter(q => q.id).map(q => q.id))
      
      // Find questions to delete (in existingIds but not in currentIds)
      const idsToDelete = Array.from(existingIds).filter(id => !currentIds.has(id as string))
      
      if (idsToDelete.length) {
        await supabase
          .from('survey_questions')
          .delete()
          .in('id', idsToDelete)
      }
      
      // Update existing questions and insert new ones
      for (const question of questions) {
        if (question.id) {
          // Update existing question
          const { error } = await supabase
            .from('survey_questions')
            .update({
              question_text: question.question_text,
              question_type: question.question_type,
              options: question.options,
              required: question.required,
              order: question.order
            })
            .eq('id', question.id)
          
          if (error) {
            showToast.error("Failed to update question: " + error.message)
            setSaving(false)
            return
          }
        } else {
          // Insert new question
          const { error } = await supabase
            .from('survey_questions')
            .insert({
              survey_id: surveyId,
              question_text: question.question_text,
              question_type: question.question_type,
              options: question.options,
              required: question.required,
              order: question.order
            })
          
          if (error) {
            showToast.error("Failed to add question: " + error.message)
            setSaving(false)
            return
          }
        }
      }
      
      showToast.success("Survey updated successfully")
      router.push(`/surveys/${surveyId}`)
    } catch (error: any) {
      showToast.error("An unexpected error occurred: " + (error.message || error))
    } finally {
      setSaving(false)
    }
  }
  
  if (loading) {
    return (
      <div className="py-8 pr-8">
        <div className="flex items-center mb-4">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Loading Survey...</h1>
        </div>
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
        <h1 className="text-3xl font-bold">Edit Survey</h1>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Survey Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Survey Title *</Label>
              <Input
                id="title"
                name="title"
                value={survey.title}
                onChange={handleSurveyChange}
                placeholder="Enter survey title"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={survey.description || ""}
                onChange={handleSurveyChange}
                placeholder="Enter survey description"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={survey.status}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Ended">Ended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Start Date</Label>
                <SingleDatePicker
                //   date={startDate}
                //   onDateChange={setStartDate}
                //   placeholder="Select start date"
                />
              </div>
              
              <div className="space-y-2">
                <Label>End Date</Label>
                <SingleDatePicker
                //   date={endDate}
                //   onDateChange={setEndDate}
                //   placeholder="Select end date"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Questions</CardTitle>
            <Button type="button" onClick={addQuestion} variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Question
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {questions.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No questions yet. Click "Add Question" to start building your survey.
              </div>
            ) : (
              questions.map((question, index) => (
                <div key={question.id || index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">Question {index + 1}</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeQuestion(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`question-${index}`}>Question Text *</Label>
                    <Input
                      id={`question-${index}`}
                      value={question.question_text}
                      onChange={(e) => handleQuestionChange(index, 'question_text', e.target.value)}
                      placeholder="Enter question text"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`question-type-${index}`}>Question Type</Label>
                      <Select
                        value={question.question_type}
                        onValueChange={(value) => handleQuestionChange(index, 'question_type', value)}
                      >
                        <SelectTrigger id={`question-type-${index}`}>
                          <SelectValue placeholder="Select question type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                          <SelectItem value="rating">Rating</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center space-x-2 h-10 mt-6">
                      <Checkbox
                        id={`required-${index}`}
                        checked={question.required}
                        onCheckedChange={(checked: boolean) => 
                          handleQuestionChange(index, 'required', Boolean(checked))
                        }
                      />
                      <label
                        htmlFor={`required-${index}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Required question
                      </label>
                    </div>
                  </div>
                  
                  {question.question_type === 'multiple_choice' && (
                    <div className="space-y-2">
                      <Label>Options</Label>
                      {(question.options || []).map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center space-x-2">
                          <Input
                            value={option}
                            onChange={(e) => handleOptionChange(index, optionIndex, e.target.value)}
                            placeholder={`Option ${optionIndex + 1}`}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOption(index, optionIndex)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addOption(index)}
                        className="mt-2"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Option
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/surveys/${surveyId}`)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
} 