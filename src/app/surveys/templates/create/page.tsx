"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Plus, Trash2, GripVertical, Lightbulb } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { showToast } from "@/lib/utils/toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { v4 as uuidv4 } from "uuid"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

type QuestionType = "Text" | "Rating"

interface Question {
  id: string
  question_text: string
  category: string
  order: number
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

export default function CreateTemplatePage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [surveyType, setSurveyType] = useState<QuestionType>("Text")
  const [questions, setQuestions] = useState<Question[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("Workload & Balance")
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([])
  
  const categories = [
    "Workload & Balance",
    "Communication & Engagement",
    "Job Satisfaction",
    "Career & Development",
    "Recognition & Rewards"
  ]

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
      // Create template
      const { data: template, error: templateError } = await supabase
        .from('surveys')
        .insert({
          title,
          description: description || null,
          type: surveyType,
          status: "Draft", // Templates are always in draft
          is_template: true // This is a template
        })
        .select()
        .single()

      if (templateError) {
        showToast.error("Failed to create template: " + templateError.message)
        setIsSubmitting(false)
        return
      }

      // Insert questions
      const questionsToInsert = questions.map(q => ({
        survey_id: template.id,
        question: q.question_text,
        category: q.category,
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

      showToast.success("Template created successfully")
      router.push('/surveys/templates')
    } catch (error) {
      console.error("Error creating template:", error)
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
        <h1 className="text-3xl font-bold">Create New Template</h1>
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
            <div>
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
                    <Button onClick={() => addQuestion(category)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Question
                    </Button>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <Lightbulb className="mr-2 h-4 w-4" />
                          Suggestions
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Suggested Questions for {category}</DialogTitle>
                          <DialogDescription>
                            Select questions to add to your template. You can select multiple questions.
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
                            <Button variant="outline">Cancel</Button>
                          </DialogClose>
                          <Button 
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
                      <Button onClick={() => addQuestion(category)} variant="link" className="mt-2">
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
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor={`question-${question.id}`}>Question Text</Label>
                                <Input
                                  id={`question-${question.id}`}
                                  value={question.question_text}
                                  onChange={(e) => updateQuestion(question.id, "question_text", e.target.value)}
                                  placeholder="Enter question"
                                  className="mt-1"
                                />
                              </div>
                            </div>
                          </div>
                        ))}

                      <Button onClick={() => addQuestion(category)} variant="outline" className="w-full mt-4">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Another Question
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
            {isSubmitting ? "Creating..." : "Create Template"}
          </Button>
        </div>
      </div>
    </div>
  )
} 