"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Loader2, Plus, Trash2, GripVertical, Lightbulb } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { showToast } from "@/lib/utils/toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { v4 as uuidv4 } from "uuid"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface Question {
  id: string
  question_text: string
  category: string
  order: number
  dbId?: string // For existing questions from DB
}

type Survey = {
  id: string
  title: string
  description: string | null
  type: "Text" | "Rating"
  status: "Draft" | "Scheduled" | "Active" | "Closed" | "Deleted"
  start_date: string | null
  end_date: string | null
  is_template: boolean
}

// Suggested questions by category
const suggestionsByCategory = {
  "Workload & Balance": [
    "I have enough time to complete my assigned tasks.",
    "My workload is manageable and reasonable.",
    "I can maintain a healthy work-life balance in my current role.",
    "The distribution of work across my team is fair and equitable.",
    "I rarely feel overwhelmed by the amount of work assigned to me.",
    "I have sufficient resources to complete my work effectively.",
    "My supervisor is considerate of my workload when assigning new tasks.",
    "I rarely need to work overtime to complete my regular tasks.",
    "The pace of work in my department is reasonable.",
    "I have adequate opportunities to recharge during the workday."
  ],
  "Communication & Engagement": [
    "Information is communicated clearly and effectively within my team.",
    "Leadership keeps employees well-informed about important changes.",
    "I feel comfortable speaking up and sharing my ideas in meetings.",
    "There are effective channels for providing feedback within the organization.",
    "My manager is responsive to my questions and concerns.",
    "I receive timely communication about issues that affect my work.",
    "Cross-departmental communication is effective at our organization.",
    "Team meetings are productive and valuable.",
    "I feel engaged and connected to my colleagues and the organization.",
    "I understand how my role contributes to the company's goals and vision."
  ],
  "Job Satisfaction": [
    "I find my work meaningful and fulfilling.",
    "I am satisfied with my current role and responsibilities.",
    "My skills and abilities are well-utilized in my current position.",
    "I enjoy the daily tasks and activities of my job.",
    "I have opportunities to do what I do best every day.",
    "I feel a sense of accomplishment from my work.",
    "I would recommend this organization as a great place to work.",
    "I am proud to tell others that I work for this organization.",
    "My work environment is positive and supportive.",
    "I rarely think about looking for a job at another organization."
  ],
  "Career & Development": [
    "I have opportunities for growth and advancement within the organization.",
    "My manager supports my professional development goals.",
    "I receive useful and constructive feedback on my performance.",
    "There are clear paths for career progression in the organization.",
    "I have access to the training I need to do my job effectively.",
    "I have had opportunities to learn and grow in the past year.",
    "My manager takes an active interest in my career aspirations.",
    "The organization provides resources for skill development.",
    "I can see a future for myself at this organization.",
    "I am encouraged to take on challenging assignments that develop my skills."
  ],
  "Recognition & Rewards": [
    "I feel valued and appreciated for my contributions.",
    "My efforts and achievements are recognized appropriately.",
    "The organization has fair and transparent compensation practices.",
    "I receive recognition when I do good work.",
    "The benefits package meets my needs.",
    "Our organization celebrates team and individual successes.",
    "I believe I am fairly compensated for the work I do.",
    "The recognition programs in our organization are meaningful.",
    "My manager acknowledges my contributions to the team.",
    "I feel that my hard work is rewarded appropriately."
  ]
}

export default function EditSurveyPage() {
  const router = useRouter()
  const surveyId = useParams()?.id as string
  
  const [survey, setSurvey] = useState<Survey>({
    id: surveyId,
    title: "",
    description: "",
    type: "Text",
    status: "Draft",
    start_date: null,
    end_date: null,
    is_template: false
  })
  
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [activeTab, setActiveTab] = useState("Workload & Balance")
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([])
  
  const categories = [
    "Workload & Balance",
    "Communication & Engagement",
    "Job Satisfaction",
    "Career & Development",
    "Recognition & Rewards"
  ]

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
        
        // Transform questions to our format
        const formattedQuestions = (questionsData || []).map(q => ({
          id: uuidv4(),
          question_text: q.question,
          category: q.category,
          order: q.order || 0,
          dbId: q.id
        }))
        
        setQuestions(formattedQuestions)
        
        // Set active tab to first category if questions exist
        if (formattedQuestions.length > 0) {
          setActiveTab(formattedQuestions[0].category)
        }
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
  
  const handleTypeChange = (value: "Text" | "Rating") => {
    setSurvey(prev => ({
      ...prev,
      type: value
    }))
  }
  
  const addQuestion = (category: string) => {
    const newQuestion: Question = {
      id: uuidv4(),
      question_text: "",
      category: category,
      order: questions.filter(q => q.category === category).length
    }
    setQuestions([...questions, newQuestion])
  }
  
  const removeQuestion = (id: string) => {
    const newQuestions = questions.filter(q => q.id !== id)
    setQuestions(newQuestions)
  }
  
  const updateQuestion = (id: string, field: keyof Question, value: any) => {
    const newQuestions = questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    )
    setQuestions(newQuestions)
  }

  const addSuggestedQuestions = () => {
    const newQuestions = [
      ...questions,
      ...selectedSuggestions.map(text => ({
        id: uuidv4(),
        question_text: text,
        category: activeTab,
        order: questions.filter(q => q.category === activeTab).length + selectedSuggestions.indexOf(text)
      }))
    ]
    setQuestions(newQuestions)
    setSelectedSuggestions([])
  }

  const toggleSuggestion = (text: string) => {
    if (selectedSuggestions.includes(text)) {
      setSelectedSuggestions(selectedSuggestions.filter(s => s !== text))
    } else {
      setSelectedSuggestions([...selectedSuggestions, text])
    }
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
          start_date: startDate ? format(startDate, "yyyy-MM-dd") : null,
          end_date: endDate ? format(endDate, "yyyy-MM-dd") : null,
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
      const currentDbIds = new Set(questions.filter(q => q.dbId).map(q => q.dbId))
      
      // Find questions to delete (in existingIds but not in currentDbIds)
      const idsToDelete = Array.from(existingIds).filter(id => !currentDbIds.has(id as string))
      
      if (idsToDelete.length) {
        await supabase
          .from('survey_questions')
          .delete()
          .in('id', idsToDelete)
      }
      
      // Update existing questions and insert new ones
      for (const question of questions) {
        if (question.dbId) {
          // Update existing question
          const { error } = await supabase
            .from('survey_questions')
            .update({
              question: question.question_text,
              category: question.category,
              order: question.order
            })
            .eq('id', question.dbId)
          
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
              question: question.question_text,
              category: question.category,
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <SelectItem value="Text">Text</SelectItem>
                    <SelectItem value="Rating">Rating (1-5)</SelectItem>
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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
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
              
              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
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
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-5 mb-4">
                {categories.map(category => (
                  <TabsTrigger key={category} value={category}>
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {categories.map(category => (
                <TabsContent key={category} value={category} className="space-y-4">
                  <div className="flex justify-between">
                    <Button type="button" onClick={() => addQuestion(category)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Question
                    </Button>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline">
                          <Lightbulb className="mr-2 h-4 w-4" />
                          Suggestions
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Suggested Questions for {category}</DialogTitle>
                          <DialogDescription>
                            Select questions to add to your survey. You can select multiple questions.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2 max-h-[60vh] overflow-y-auto py-4">
                          {suggestionsByCategory[category as keyof typeof suggestionsByCategory].map((text, idx) => (
                            <div key={idx} className="flex items-start gap-2 p-2 border rounded-md">
                              <input 
                                type="checkbox" 
                                id={`suggestion-${idx}`} 
                                checked={selectedSuggestions.includes(text)}
                                onChange={() => toggleSuggestion(text)}
                                className="mt-1"
                              />
                              <label htmlFor={`suggestion-${idx}`} className="text-sm">
                                {text}
                              </label>
                            </div>
                          ))}
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button type="button" variant="outline">Cancel</Button>
                          </DialogClose>
                          <Button 
                            type="button"
                            onClick={addSuggestedQuestions} 
                            disabled={selectedSuggestions.length === 0}
                          >
                            Add Selected ({selectedSuggestions.length})
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  {questions.filter(q => q.category === category).length === 0 ? (
                    <div className="text-center py-6 border rounded-lg">
                      <p className="text-muted-foreground">No questions added yet for this category</p>
                      <Button type="button" onClick={() => addQuestion(category)} variant="link" className="mt-2">
                        <Plus className="mr-2 h-4 w-4" />
                        Add your first question
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {questions
                        .filter(q => q.category === category)
                        .map((question, index) => (
                          <div key={question.id} className="border rounded-lg p-4 relative">
                            <div className="absolute top-2 right-2 flex">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeQuestion(question.id)}
                                className="h-8 w-8 text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="mb-4 flex items-center">
                              <GripVertical className="h-5 w-5 text-gray-400 mr-2" />
                              <span className="font-medium">Question {index + 1}</span>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor={`question-${question.id}`}>Question Text *</Label>
                              <Input
                                id={`question-${question.id}`}
                                value={question.question_text}
                                onChange={(e) => updateQuestion(question.id, 'question_text', e.target.value)}
                                placeholder="Enter question text"
                              />
                            </div>
                          </div>
                        ))}

                      <Button type="button" onClick={() => addQuestion(category)} variant="outline" className="w-full mt-4">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Another Question
                      </Button>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
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