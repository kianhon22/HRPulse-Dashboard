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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

type Question = {
  id: string
  survey_id: string
  question: string
  category: string
  created_at: string
}

type Response = {
  id: string
  survey_id: string
  question_id: string
  user_id: string
  response: any
  sentiment?: {
    top_label: string
    confidence: number
    all_scores: {
      label: string
      score: number
    }[]
  }
  created_at: string
  user_name: string
}

type Survey = {
  id: string
  title: string
  description: string | null
  type: "text" | "rating"
  status: "Draft" | "Scheduled" | "Active" | "Closed" | "Deleted"
  start_date: string
  end_date: string
  created_at: string
  updated_at: string
  questions?: Question[]
}

export default function SurveyDetailPage() {
  const router = useRouter()
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [responses, setResponses] = useState<Response[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedResponses, setExpandedResponses] = useState<Record<string, boolean>>({})
  const [activeCategory, setActiveCategory] = useState<string>("")
  const surveyId = useParams()?.id as string

  // Get all unique categories
  const categories = [...new Set(questions.map(q => q.category))].sort()

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0])
    }
  }, [categories, activeCategory])

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
          .order('created_at', { ascending: true })
        
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
          .order('created_at', { ascending: false })
        
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
      case 'Closed': return 'bg-red-100 text-red-800'
      case 'Draft': return 'bg-gray-100 text-gray-800'
      case 'Scheduled': return 'bg-yellow-100 text-yellow-800'
      case 'Deleted': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 1: return 'Extremely Disagree'
      case 2: return 'Disagree'
      case 3: return 'Neutral'
      case 4: return 'Agree'
      case 5: return 'Extremely Agree'
      default: return 'Unknown'
    }
  }

  const getRatingColor = (rating: number) => {
    switch (rating) {
      case 1: return 'text-red-600'
      case 2: return 'text-orange-600'
      case 3: return 'text-yellow-600'
      case 4: return 'text-green-600'
      case 5: return 'text-green-700'
      default: return 'text-gray-600'
    }
  }

  // Get responses for a specific question
  const getResponsesForQuestion = (questionId: string) => {
    return responses.filter(r => r.question_id === questionId)
  }

  // Calculate rating counts for a question (for rating surveys)
  const getRatingCounts = (questionId: string) => {
    const questionResponses = getResponsesForQuestion(questionId)
    const counts = [0, 0, 0, 0, 0] // For ratings 1-5
    
    questionResponses.forEach(response => {
      const rating = Number(response.response)
      if (rating >= 1 && rating <= 5) {
        counts[rating - 1]++
      }
    })
    
    return counts
  }

  // Get percentage for a rating
  const getRatingPercentage = (count: number, total: number) => {
    if (total === 0) return 0
    return Math.round((count / total) * 100)
  }

  // Calculate sentiment analysis summary for text responses
  const getSentimentSummary = (questionId: string) => {
    const questionResponses = getResponsesForQuestion(questionId)
    const sentiments = {
      POSITIVE: 0,
      NEGATIVE: 0,
      NEUTRAL: 0,
      total: 0
    }
    
    questionResponses.forEach(response => {
      if (response.sentiment?.top_label) {
        sentiments[response.sentiment.top_label as keyof typeof sentiments]++
        sentiments.total++
      }
    })
    
    return sentiments
  }

  // Get sentiment color
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'POSITIVE': return 'text-green-600'
      case 'NEGATIVE': return 'text-red-600'
      case 'NEUTRAL': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  // Get sentiment background color
  const getSentimentBgColor = (sentiment: string) => {
    switch (sentiment) {
      case 'POSITIVE': return 'bg-green-100'
      case 'NEGATIVE': return 'bg-red-100'
      case 'NEUTRAL': return 'bg-yellow-100'
      default: return 'bg-gray-100'
    }
  }

  // Get sentiment icon
  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'POSITIVE': return '😀'
      case 'NEGATIVE': return '😞'
      case 'NEUTRAL': return '😐'
      default: return '❓'
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

  const canViewResponses = survey.status === 'Active' || survey.status === 'Closed'

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
            onClick={() => router.push(`/surveys/${survey.id}/edit`)}
          >
            <PencilLine className="mr-2 h-4 w-4" />
            Edit Survey
          </Button>
        </div>
      </div>

      <div className="space-y-6">
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
                <h3 className="text-sm font-medium text-gray-500">Survey Type</h3>
                <p className="capitalize">{survey.type}</p>
              </div>
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
              <div>
                <h3 className="text-sm font-medium text-gray-500">Responses</h3>
                <p>{responses.length} {responses.length === 1 ? 'response' : 'responses'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {categories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Questions & Responses</CardTitle>
              {!canViewResponses && responses.length > 0 && (
                <CardDescription>
                  Responses are only visible for Active or Closed surveys
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={categories[0]} value={activeCategory} onValueChange={setActiveCategory}>
                <TabsList className="mb-4 flex flex-wrap">
                  {categories.map(category => (
                    <TabsTrigger key={category} value={category}>
                      {category}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {categories.map(category => (
                  <TabsContent key={category} value={category} className="space-y-6">
                    {questions
                      .filter(q => q.category === category)
                      .map((question, index) => {
                        const questionResponses = getResponsesForQuestion(question.id)
                        return (
                          <Card key={question.id} className="overflow-hidden">
                            <CardHeader className="bg-muted/50">
                              <CardTitle className="text-base">{question.question}</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                              {!canViewResponses ? (
                                <p className="text-sm text-muted-foreground">
                                  Responses will be visible once the survey is Active or Closed.
                                </p>
                              ) : questionResponses.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No responses yet for this question.</p>
                              ) : survey.type === "rating" ? (
                                // Display rating summary
                                <div className="space-y-4">
                                  {getRatingCounts(question.id).map((count, idx) => {
                                    const rating = idx + 1
                                    const percentage = getRatingPercentage(count, questionResponses.length)
                                    return (
                                      <div key={idx} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                          <span className={getRatingColor(rating)}>
                                            {rating} - {getRatingLabel(rating)}
                                          </span>
                                          <span className="font-medium">
                                            {count} ({percentage}%)
                                          </span>
                                        </div>
                                        <Progress value={percentage} className="h-2" />
                                      </div>
                                    )
                                  })}
                                  <p className="text-sm text-muted-foreground mt-2">
                                    Total responses: {questionResponses.length}
                                  </p>
                                </div>
                              ) : (
                                // Display text responses with sentiment analysis
                                <div className="space-y-4">
                                  {/* Sentiment analysis summary */}
                                  <div className="mb-6 pb-4 border-b">
                                    <h4 className="text-sm font-medium mb-3">Sentiment Analysis</h4>
                                    <div className="grid grid-cols-3 gap-3">
                                      {['POSITIVE', 'NEUTRAL', 'NEGATIVE'].map(sentiment => {
                                        const sentiments = getSentimentSummary(question.id)
                                        const count = sentiments[sentiment as keyof typeof sentiments]
                                        const percentage = sentiments.total > 0 
                                          ? Math.round((count / sentiments.total) * 100) 
                                          : 0
                                        
                                        return (
                                          <div 
                                            key={sentiment} 
                                            className={`rounded-lg p-3 ${getSentimentBgColor(sentiment)}`}
                                          >
                                            <div className="flex justify-between items-center mb-1">
                                              <span className={`text-sm font-medium ${getSentimentColor(sentiment)}`}>
                                                {getSentimentIcon(sentiment)} {sentiment.charAt(0) + sentiment.slice(1).toLowerCase()}
                                              </span>
                                              <span className="text-sm font-bold">
                                                {percentage}%
                                              </span>
                                            </div>
                                            <Progress 
                                              value={percentage} 
                                              className="h-2" 
                                            />
                                            <p className="text-xs mt-1 text-gray-600">
                                              {count} {count === 1 ? 'response' : 'responses'}
                                            </p>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                  
                                  {/* Individual responses */}
                                  <h4 className="text-sm font-medium mb-2">Individual Responses</h4>
                                  <div className="space-y-2">
                                    {questionResponses.map(response => {
                                      const sentiment = response.sentiment?.top_label || 'UNKNOWN'
                                      const confidence = response.sentiment?.confidence
                                        ? Math.round(response.sentiment.confidence * 100)
                                        : null
                                        
                                      return (
                                        <div key={response.id} className="border rounded-md overflow-hidden">
                                          {/* Sentiment badge */}
                                          {sentiment !== 'UNKNOWN' && (
                                            <div className={`px-3 py-1 text-xs font-medium ${getSentimentBgColor(sentiment)}`}>
                                              {getSentimentIcon(sentiment)} {sentiment.charAt(0) + sentiment.slice(1).toLowerCase()}
                                              {confidence !== null && ` (${confidence}% confidence)`}
                                            </div>
                                          )}
                                          
                                          {/* Response text */}
                                          <div className="p-3 text-sm">
                                            {response.response || "No answer provided"}
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )
                      })}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 