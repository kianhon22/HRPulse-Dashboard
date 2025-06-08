"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Plus, Copy, FileText, PencilLine } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { showToast } from "@/lib/utils/toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"

type SurveyTemplate = {
  id: string
  title: string
  description: string | null
  // type: "Text" | "Rating"
  created_at: string
  updated_at: string
}

type Question = {
  id: string
  survey_id: string
  question: string
  category: string
  created_at: string
}

export default function TemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<SurveyTemplate[]>([])
  const [activeTemplate, setActiveTemplate] = useState<SurveyTemplate | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingQuestions, setLoadingQuestions] = useState(false)

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('surveys')
          .select('*')
          .eq('is_template', true)
          .order('created_at', { ascending: false })

        if (error) {
          showToast.error("Error loading templates")
          console.error('Error fetching templates:', error)
          return
        }

        setTemplates(data || [])
      } catch (error) {
        showToast.error("An unexpected error occurred")
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTemplates()
  }, [])

  const fetchTemplateQuestions = async (templateId: string) => {
    setLoadingQuestions(true)
    try {
      const { data, error } = await supabase
        .from('survey_questions')
        .select('*')
        .eq('survey_id', templateId)
        .order('created_at', { ascending: true })

      if (error) {
        showToast.error("Error loading template questions")
        console.error('Error fetching questions:', error)
        return
      }

      setQuestions(data || [])
    } catch (error) {
      showToast.error("An unexpected error occurred")
      console.error('Error:', error)
    } finally {
      setLoadingQuestions(false)
    }
  }

  const handleViewTemplate = (template: SurveyTemplate) => {
    setActiveTemplate(template)
    fetchTemplateQuestions(template.id)
  }

  const handleDuplicateTemplate = (templateId: string) => {
    // Store the template ID in localStorage for the create page to use
    localStorage.setItem('duplicateTemplateId', templateId)
    // Redirect to create survey page
    router.push('/surveys/create?fromTemplate=true')
  }

  const createNewTemplate = () => {
    router.push('/surveys/templates/create')
  }

  // Get all unique categories
  const categories = [...new Set(questions.map(q => q.category))].sort()

  if (loading) {
    return (
      <div className="py-8 pr-8">
        <div className="flex items-center mb-4">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Loading Templates...</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8 pr-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Survey Templates</h1>
        </div>
        <Button onClick={createNewTemplate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Available Templates</CardTitle>
              <CardDescription>
                Select a template to view its details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {templates.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-gray-400" />
                  <p className="mt-2 text-gray-500">No templates available</p>
                  <Button onClick={createNewTemplate} variant="link" className="mt-2">
                    Create your first template
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {templates.map(template => (
                    <div
                      key={template.id}
                      className={`p-3 rounded-md cursor-pointer hover:bg-muted transition ${
                        activeTemplate?.id === template.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => handleViewTemplate(template)}
                    >
                      <div className="font-medium">{template.title}</div>
                      <div className="flex justify-between text-sm text-gray-500">
                        {/* <span className="capitalize">{template.type}</span> */}
                        <span>
                          {format(new Date(template.created_at), "MMM dd, yyyy")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          {activeTemplate ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{activeTemplate.title}</CardTitle>
                      {activeTemplate.description && (
                        <CardDescription className="mt-1">
                          {activeTemplate.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        onClick={() => router.push(`/surveys/templates/${activeTemplate.id}/edit`)}
                      >
                        <PencilLine className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button onClick={() => handleDuplicateTemplate(activeTemplate.id)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Apply Template
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {/* <div>
                      <h3 className="text-sm font-medium text-gray-500">Template Type</h3>
                      <p className="capitalize">{activeTemplate.type}</p>
                    </div> */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Created At</h3>
                      <p>{format(new Date(activeTemplate.created_at), "MMMM d, yyyy")}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                      <p>{format(new Date(activeTemplate.updated_at), "MMMM d, yyyy")}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Total Questions</h3>
                      <p>{questions.length} questions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {categories.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Template Questions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingQuestions ? (
                      <div className="text-center py-6">Loading questions...</div>
                    ) : (
                      <Tabs defaultValue={categories[0]}>
                        <TabsList className="mb-4 flex flex-wrap">
                          {categories.map(category => (
                            <TabsTrigger key={category} value={category}>
                              {category}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                        
                        {categories.map(category => (
                          <TabsContent key={category} value={category} className="space-y-4">
                            {questions
                              .filter(q => q.category === category)
                              .map((question, index) => (
                                <Card key={question.id} className="overflow-hidden">
                                  <CardHeader className="bg-muted/50 py-3">
                                    <CardTitle className="text-base">
                                      {index + 1}. {question.question}
                                    </CardTitle>
                                  </CardHeader>
                                </Card>
                              ))}
                          </TabsContent>
                        ))}
                      </Tabs>
                    )}
                  </CardContent>

                </Card>
              )}
            </div>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-12">
                <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <CardTitle className="mb-2">Select a Template</CardTitle>
                <CardDescription>
                  Choose a template from the left to view its details
                </CardDescription>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
} 