"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Plus, Trash2, GripVertical, Lightbulb, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { showToast } from "@/lib/utils/toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { v4 as uuidv4 } from "uuid"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

// type QuestionType = "Text" | "Rating"

interface Question {
  id: string
  question_text: string
  category: string
  order: number
  db_id?: string
  type: "rating" | "text"
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

export default function EditTemplatePage() {
  const router = useRouter()
  const templateId = useParams()?.id as string
  
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  // const [surveyType, setSurveyType] = useState<QuestionType>("Text")
  const [questions, setQuestions] = useState<Question[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("Workload & Balance")
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([])
  
  const categories = [
    "Workload & Balance",
    "Communication & Engagement",
    "Job Satisfaction",
    "Career & Development",
    "Recognition & Rewards"
  ]

  // Load template data
  useEffect(() => {
    const fetchTemplate = async () => {
      setLoading(true)
      try {
        // Fetch template details
        const { data: templateData, error: templateError } = await supabase
          .from('surveys')
          .select('*')
          .eq('id', templateId)
          .eq('is_template', true)
          .single()
        
        if (templateError) {
          showToast.error("Error loading template")
          console.error('Error fetching template:', templateError)
          router.push('/surveys/templates')
          return
        }

        if (templateData) {
          setTitle(templateData.title)
          setDescription(templateData.description || "")
          // setSurveyType(templateData.type as QuestionType)
        }
        
        // Fetch template questions
        const { data: questionsData, error: questionsError } = await supabase
          .from('survey_questions')
          .select('*')
          .eq('survey_id', templateId)
          .order('created_at', { ascending: true })
        
        if (questionsError) {
          showToast.error("Error loading template questions")
          console.error('Error fetching questions:', questionsError)
          return
        }

        if (questionsData && questionsData.length > 0) {
          // Transform questions to match local format
          const formattedQuestions = questionsData.map((q) => ({
            id: uuidv4(),
            question_text: q.question,
            category: q.category,
            order: q.order || 0,
            db_id: q.id, // Store the database ID
            type: q.type
          }))
          
          setQuestions(formattedQuestions)
          
          // Set active tab to first question category
          setActiveTab(formattedQuestions[0].category)
        }
      } catch (error) {
        showToast.error("An unexpected error occurred")
        console.error('Error loading template:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTemplate()
  }, [templateId, router])

  const addQuestion = (category: string) => {
    const newQuestion: Question = {
      id: uuidv4(),
      question_text: "",
      category: category,
      order: questions.filter(q => q.category === category).length,
      type: "rating" as "text" | "rating"
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
        order: questions.filter(q => q.category === activeTab).length + selectedSuggestions.indexOf(text),
        type: "rating" as "text" | "rating"
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

  const handleSubmit = async () => {
    // Validate form
    if (!title.trim()) {
      showToast.error("Please enter a template title")
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
    }

    setIsSubmitting(true)

    try {
      // Update template
      const { error: templateError } = await supabase
        .from('surveys')
        .update({
          title,
          description: description || null,
          type: 'Text',
          updated_at: new Date().toISOString()
        })
        .eq('id', templateId)

      if (templateError) {
        showToast.error("Failed to update template: " + templateError.message)
        setIsSubmitting(false)
        return
      }

      // Get existing questions to determine which to update/delete
      const { data: existingQuestions } = await supabase
        .from('survey_questions')
        .select('id')
        .eq('survey_id', templateId)
      
      const existingIds = new Set((existingQuestions || []).map(q => q.id))
      const currentDbIds = new Set(questions.filter(q => q.db_id).map(q => q.db_id))
      
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
        if (question.db_id) {
          // Update existing question
          const { error } = await supabase
            .from('survey_questions')
            .update({
              question: question.question_text,
              category: question.category,
              order: question.order,
              type: question.type
            })
            .eq('id', question.db_id)
          
          if (error) {
            showToast.error("Failed to update question: " + error.message)
            setIsSubmitting(false)
            return
          }
        } else {
          // Insert new question
          const { error } = await supabase
            .from('survey_questions')
            .insert({
              survey_id: templateId,
              question: question.question_text,
              category: question.category,
              order: question.order,
              type: question.type
            })
          
          if (error) {
            showToast.error("Failed to add question: " + error.message)
            setIsSubmitting(false)
            return
          }
        }
      }

      showToast.success("Template updated successfully")
      router.push('/surveys/templates')
    } catch (error) {
      console.error("Error updating template:", error)
      showToast.error("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
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
          <h1 className="text-3xl font-bold">Loading Template...</h1>
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
        <h1 className="text-3xl font-bold">Edit Template</h1>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Template Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Template Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter template title"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter template description"
                className="mt-1"
              />
            </div>
            {/* <div>
              <Label htmlFor="surveyType">Survey Type</Label>
              <Select value={surveyType} onValueChange={(value: QuestionType) => setSurveyType(value)}>
                <SelectTrigger id="surveyType" className="mt-1">
                  <SelectValue placeholder="Select survey type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Text">Text</SelectItem>
                  <SelectItem value="Rating">Likert Rating</SelectItem>
                </SelectContent>
              </Select>
            </div> */}
          </CardContent>
        </Card>

        <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Questions</CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button type="button" variant="outline">
                  <Lightbulb className="mr-2 h-4 w-4" />
                  Suggestions
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Suggested Questions for {activeTab}</DialogTitle>
                  <DialogDescription>
                    You may select multiple questions to add to your survey
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto py-4">
                  {suggestionsByCategory[activeTab as keyof typeof suggestionsByCategory].map((text, idx) => (
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
                  <DialogClose asChild>
                    <Button 
                      type="button"
                      onClick={addSuggestedQuestions} 
                      disabled={selectedSuggestions.length === 0}
                    >
                      Add Questions ({selectedSuggestions.length})
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                  {questions.filter(q => q.category === category).length === 0 ? (
                    <div className="text-center py-6 border rounded-lg">
                      <p className="text-muted-foreground">No questions added yet for this category</p>
                      <Button type="button" onClick={() => addQuestion(category)} className="mt-4">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Question
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
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            </div>
                            <div className="mb-4 flex items-center">
                              <GripVertical className="h-5 w-5 text-gray-400 mr-2" />
                              <span className="font-medium">Question {index + 1}</span>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor={`question-${question.id}`}>Question</Label>
                              <Input
                                id={`question-${question.id}`}
                                value={question.question_text}
                                onChange={(e) => updateQuestion(question.id, 'question_text', e.target.value)}
                                placeholder="Enter question..."
                              />
                            </div>
                            <div className="space-y-2 mt-2">
                              <Label htmlFor={`type-${question.id}`}>Type</Label>
                              <Select
                                value={question.type}
                                onValueChange={value => updateQuestion(question.id, 'type', value as "text" | "rating")}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="text">Text</SelectItem>
                                  <SelectItem value="rating">Rating</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        ))}

                      <Button type="button" onClick={() => addQuestion(category)} className="w-full mt-4">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Question
                      </Button>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  )
} 