"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { supabase } from "@/lib/supabase"
import { ArrowLeft, PencilLine, ChevronDown, ChevronUp } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { showToast } from "@/lib/utils/toast"

type Question = {
  id: string
  survey_id: string
  question_text: string
  question_type: "multiple_choice" | "text" | "rating"
  options?: string[]
  required: boolean
  order: number
}

type Response = {
  id: string
  survey_id: string
  user_id: string
  answers: Record<string, any>
  submitted_at: string
  user_name: string
}

type Survey = {
  id: string
  title: string
  description: string | null
  start_date: string
  end_date: string
  status: "Draft" | "Scheduled" | "Active" | "Ended"
  created_at: string
  updated_at: string
  created_by: string
  questions?: Question[]
}

export default function SurveyDetailPage() {
  const router = useRouter()
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [responses, setResponses] = useState<Response[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedResponses, setExpandedResponses] = useState<Record<string, boolean>>({})
  const surveyId = useParams()?.id as string

  useEffect(() => {
    const fetchSurveyDetails = async () => {
      setLoading(true)
      try {
        // Fetch survey details
        const { data: surveyData, error: surveyError } = await supabase
          .from('surveys')
          .select('*')
          .eq('id', surveyId)
          .single()
        
        if (surveyError) {
          showToast.error("Error loading survey details")
          console.error('Error fetching survey:', surveyError)
          return
        }

        setSurvey(surveyData)
        
        // Fetch questions
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
        
        // Fetch responses
        const { data: responsesData, error: responsesError } = await supabase
          .from('survey_responses')
          .select(`
            *,
            users:user_id (
              name
            )
          `)
          .eq('survey_id', surveyId)
          .order('submitted_at', { ascending: false })
        
        if (responsesError) {
          showToast.error("Error loading survey responses")
          console.error('Error fetching responses:', responsesError)
          return
        }

        // Transform responses to include user name
        const transformedResponses = responsesData.map((response: any) => ({
          ...response,
          user_name: response.users?.name || 'Anonymous'
        }))

        setResponses(transformedResponses || [])
      } catch (error) {
        showToast.error("An unexpected error occurred")
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSurveyDetails()
  }, [surveyId])

  const toggleResponseExpansion = (responseId: string) => {
    setExpandedResponses(prev => ({
      ...prev,
      [responseId]: !prev[responseId]
    }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800'
      case 'Ended': return 'bg-red-100 text-red-800'
      case 'Draft': return 'bg-gray-100 text-gray-800'
      case 'Scheduled': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
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

  if (!survey) {
    return (
      <div className="py-8 pr-8">
        <div className="flex items-center mb-4">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Survey Not Found</h1>
        </div>
        <p>The requested survey could not be found.</p>
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
          <h1 className="text-3xl font-bold">{survey.title}</h1>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => router.push(`/feedback/surveys/${survey.id}/edit`)}
          >
            <PencilLine className="mr-2 h-4 w-4" />
            Edit Survey
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Survey Information</CardTitle>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(survey.status)}`}>
                  {survey.status}
                </span>
              </div>
              {survey.description && (
                <CardDescription>{survey.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Start Date</h3>
                  <p>{survey.start_date ? format(new Date(survey.start_date), "MMMM d, yyyy") : "Not specified"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">End Date</h3>
                  <p>{survey.end_date ? format(new Date(survey.end_date), "MMMM d, yyyy") : "Not specified"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Created</h3>
                  <p>{format(new Date(survey.created_at), "MMMM d, yyyy")}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                  <p>{format(new Date(survey.updated_at), "MMMM d, yyyy")}</p>
                </div>
              </div>

              <h3 className="text-lg font-medium mb-4">Questions</h3>
              {questions.length === 0 ? (
                <p className="text-gray-500">No questions have been added to this survey.</p>
              ) : (
                <Accordion type="multiple" className="w-full">
                  {questions.map((question, index) => (
                    <AccordionItem key={question.id} value={question.id}>
                      <AccordionTrigger className="text-left">
                        <span className="font-medium">
                          {index + 1}. {question.question_text}
                          {question.required && <span className="text-red-500 ml-1">*</span>}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pl-6">
                          <p className="text-sm text-gray-500 mb-2">Type: {question.question_type.replace('_', ' ')}</p>
                          
                          {question.question_type === "multiple_choice" && question.options && (
                            <div className="mt-2">
                              <p className="text-sm font-medium mb-1">Options:</p>
                              <ul className="list-disc pl-5">
                                {(question.options as string[]).map((option, idx) => (
                                  <li key={idx} className="text-sm">{option}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Responses</CardTitle>
              <CardDescription>
                {responses.length} {responses.length === 1 ? 'response' : 'responses'} received
              </CardDescription>
            </CardHeader>
            <CardContent>
              {responses.length === 0 ? (
                <p className="text-gray-500">No responses have been submitted yet.</p>
              ) : (
                <div className="space-y-4">
                  {responses.map((response) => (
                    <div key={response.id} className="border rounded-lg p-4">
                      <div 
                        className="flex justify-between items-center cursor-pointer"
                        onClick={() => toggleResponseExpansion(response.id)}
                      >
                        <div>
                          <h4 className="font-medium">{response.user_name}</h4>
                          <p className="text-sm text-gray-500">
                            {format(new Date(response.submitted_at), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                        {expandedResponses[response.id] ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      
                      {expandedResponses[response.id] && (
                        <div className="mt-4 pt-4 border-t">
                          {questions.map((question) => {
                            const answer = response.answers[question.id];
                            return (
                              <div key={question.id} className="mb-3">
                                <p className="text-sm font-medium">{question.question_text}</p>
                                <p className="text-sm">
                                  {answer === null || answer === undefined ? 
                                    'Not answered' : 
                                    String(answer)}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => router.push(`/surveys/${survey.id}/responses`)}>
                View All Responses
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
} 