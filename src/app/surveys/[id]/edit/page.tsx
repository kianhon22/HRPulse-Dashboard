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
import { SingleDatePicker } from "@/components/ui/date-picker"

type SurveyQuestion = {
  id?: string
  survey_id: string
  question: string
  category: string
  created_at?: string
}

type Survey = {
  id: string
  title: string
  description: string | null
  type: "text" | "rating"
  status: "Draft" | "Scheduled" | "Active" | "Closed" | "Deleted"
  start_date: string | null
  end_date: string | null
}

export default function EditSurveyPage() {
  const router = useRouter()
  const surveyId = useParams()?.id as string
  
  const [survey, setSurvey] = useState<Survey>({
    id: surveyId,
    title: "",
    description: "",
    type: "text",
    status: "Draft",
    start_date: null,
    end_date: null
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
          .order('created_at', { ascending: true })
        
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
  
  const handleTypeChange = (value: "text" | "rating") => {
    setSurvey(prev => ({
      ...prev,
      type: value
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
  
  const addQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        survey_id: surveyId,
        question: "",
        category: "Workload & Balance"
      }
    ])
  }
  
  const removeQuestion = (index: number) => {
    setQuestions(prev => {
      const updated = [...prev]
      updated.splice(index, 1)
      return updated
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
      
      if (!q.question.trim()) {
        showToast.error(`Question ${i + 1} text is required`)
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
          type: survey.type,
          status: survey.status,
          start_date: startDate?.toISOString() || null,
          end_date: endDate?.toISOString() || null,
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
              question: question.question,
              category: question.category
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
              question: question.question,
              category: question.category
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
                <Label htmlFor="type">Survey Type</Label>
                <Select
                  value={survey.type}
                  onValueChange={handleTypeChange}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select survey type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="rating">Rating (1-5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
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
                    <SelectItem value="Closed">Closed</SelectItem>
                    <SelectItem value="Deleted">Deleted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Start Date</Label>
                <SingleDatePicker
                  date={startDate}
                  onDateChange={setStartDate}
                />
              </div>
              
              <div className="space-y-2">
                <Label>End Date</Label>
                <SingleDatePicker
                  date={endDate}
                  onDateChange={setEndDate}
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
                      value={question.question}
                      onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                      placeholder="Enter question text"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`category-${index}`}>Category</Label>
                    <Select
                      value={question.category}
                      onValueChange={(value) => handleQuestionChange(index, 'category', value)}
                    >
                      <SelectTrigger id={`category-${index}`}>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Workload & Balance">Workload & Balance</SelectItem>
                        <SelectItem value="Communication & Engagement">Communication & Engagement</SelectItem>
                        <SelectItem value="Job Satisfaction">Job Satisfaction</SelectItem>
                        <SelectItem value="Career & Development">Career & Development</SelectItem>
                        <SelectItem value="Recognition & Rewards">Recognition & Rewards</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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