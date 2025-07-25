"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { supabase } from "@/lib/supabase"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { showToast } from "@/lib/utils/toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { exportToCSV } from "@/lib/utils/csv-export"
import { ArrowLeft, PencilLine, ChevronDown, ChevronUp, Smile, Meh, Frown, ThumbsUp, ThumbsDown, Download, Trash2, Calendar } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type Question = {
  id: string
  survey_id: string
  question: string
  category: string
  created_at: string
  type: "rating" | "text"
}

type Response = {
  id: string
  survey_id: string
  question_id: string
  user_id: string
  response: any
  sentiment?: any
  created_at: string
  user_name: string
}

type Survey = {
  id: string
  title: string
  description: string | null
  type: "Text" | "Rating"
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
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [showUnscheduleDialog, setShowUnscheduleDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const surveyId = useParams()?.id as string

  // Get all unique categories in the correct order
  const categoryOrder = [
    "Workload & Balance",
    "Communication & Engagement", 
    "Job Satisfaction",
    "Career & Development",
    "Recognition & Rewards"
  ]
  const categories = categoryOrder.filter(cat => 
    questions.some(q => q.category === cat)
  )

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
    
    // Set up real-time subscriptions
    const surveySubscription = supabase
      .channel('survey-detail')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'surveys',
          filter: `id=eq.${surveyId}`
        }, 
        () => {fetchSurveyDetails()}
      )
      .subscribe()

    const questionsSubscription = supabase
      .channel('survey-questions')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'survey_questions',
          filter: `survey_id=eq.${surveyId}`
        }, 
        () => {
          fetchSurveyDetails()
        }
      )
      .subscribe()

    const responsesSubscription = supabase
      .channel('survey-responses')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'survey_responses',
          filter: `survey_id=eq.${surveyId}`
        }, 
        () => {
          fetchSurveyDetails()
        }
      )
      .subscribe()

    return () => {
      surveySubscription.unsubscribe()
      questionsSubscription.unsubscribe()
      responsesSubscription.unsubscribe()
    }
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
      case 'Draft': return 'bg-gray-200 text-gray-800'
      case 'Scheduled': return 'bg-yellow-100 text-yellow-800'
      case 'Deleted': return 'bg-black text-white'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 1: return 'Strongly Disagree'
      case 2: return 'Disagree'
      case 3: return 'Neutral'
      case 4: return 'Agree'
      case 5: return 'Strongly Agree'
      default: return 'Unknown'
    }
  }

  const getRatingColor = (rating: number) => {
    switch (rating) {
      case 1: return 'text-red-700'
      case 2: return 'text-red-600'
      case 3: return 'text-yellow-600'
      case 4: return 'text-green-600'
      case 5: return 'text-green-700'
      default: return 'text-gray-600'
    }
  }

  const getRatingBgColor = (rating: number) => {
    switch (rating) {
      case 1: return 'bg-red-200'
      case 2: return 'bg-red-100'
      case 3: return 'bg-yellow-100'
      case 4: return 'bg-green-100'
      case 5: return 'bg-green-200'
      default: return 'bg-gray-100'
    }
  }

  const getRatingIcon = (rating: number) => {
    switch (rating) {
      case 1: return <ThumbsDown className="h-4 w-4" />
      case 2: return <Frown      className="h-4 w-4" />
      case 3: return <Meh        className="h-4 w-4" />
      case 4: return <Smile      className="h-4 w-4" />
      case 5: return <ThumbsUp   className="h-4 w-4" />
      default: return null
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
      VERY_POSITIVE: 0,
      POSITIVE: 0,
      NEUTRAL: 0,
      NEGATIVE: 0,
      VERY_NEGATIVE: 0,
      total: 0
    }
    
    questionResponses.forEach(response => {
      if (response.sentiment && response.sentiment.length > 0) {
        // Get the first sentiment label from the scores array
        const label = response.sentiment[0].label;
        
        // Map the numeric label to sentiment categories
        let sentimentKey;
        switch(label) {
          case 1: sentimentKey = 'VERY_NEGATIVE'; break;
          case 2: sentimentKey = 'NEGATIVE'; break;
          case 3: sentimentKey = 'NEUTRAL'; break;
          case 4: sentimentKey = 'POSITIVE'; break;
          case 5: sentimentKey = 'VERY_POSITIVE'; break;
          default: return; // Skip if not a valid label
        }
        
        sentiments[sentimentKey as keyof typeof sentiments]++;
        sentiments.total++;
      }
    })
    
    return sentiments
  }

  // Get sentiment color
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'VERY_POSITIVE': return 'text-green-700'
      case 'POSITIVE'     : return 'text-green-600'
      case 'NEUTRAL'      : return 'text-yellow-600'
      case 'NEGATIVE'     : return 'text-red-600'
      case 'VERY_NEGATIVE': return 'text-red-700'
      default             : return 'text-gray-600'
    }
  }

  // Get sentiment background color
  const getSentimentBgColor = (sentiment: string) => {
    switch (sentiment) {
      case 'VERY_POSITIVE': return 'bg-green-200'
      case 'POSITIVE'     : return 'bg-green-100'
      case 'NEUTRAL'      : return 'bg-yellow-100'
      case 'NEGATIVE'     : return 'bg-red-100'
      case 'VERY_NEGATIVE': return 'bg-red-200'
      default             : return 'bg-gray-100'
    }
  }

  // Get sentiment icon
  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'VERY_POSITIVE': return <ThumbsUp className="h-4 w-4 mr-1" />
      case 'POSITIVE'     : return <Smile className="h-4 w-4 mr-1" />
      case 'NEUTRAL'      : return <Meh className="h-4 w-4 mr-1" />
      case 'NEGATIVE'     : return <Frown className="h-4 w-4 mr-1" />
      case 'VERY_NEGATIVE': return <ThumbsDown className="h-4 w-4 mr-1" />
      default             : return null
    }
  }

  const handleScheduleSurvey = async () => {
    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('surveys')
        .update({ status: 'Scheduled', updated_at: new Date().toISOString() })
        .eq('id', surveyId)
      
      if (error) {
        showToast.error("Failed to schedule survey")
        console.error('Error scheduling survey:', error)
        return
      }
      
      setSurvey(prev => prev ? { ...prev, status: 'Scheduled' } : null)
      showToast.success("Survey scheduled successfully")
      setShowScheduleDialog(false)
    } catch (error) {
      showToast.error("An unexpected error occurred")
      console.error('Error:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleUnscheduleSurvey = async () => {
    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('surveys')
        .update({ status: 'Draft', updated_at: new Date().toISOString() })
        .eq('id', surveyId)
      
      if (error) {
        showToast.error("Failed to unschedule survey")
        console.error('Error unscheduling survey:', error)
        return
      }
      
      setSurvey(prev => prev ? { ...prev, status: 'Draft' } : null)
      showToast.success("Survey unscheduled successfully")
      setShowUnscheduleDialog(false)
    } catch (error) {
      showToast.error("An unexpected error occurred")
      console.error('Error:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteSurvey = async () => {
    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('surveys')
        .update({ status: 'Deleted', updated_at: new Date().toISOString() })
        .eq('id', surveyId)
      
      if (error) {
        showToast.error("Failed to delete survey")
        console.error('Error deleting survey:', error)
        return
      }
      
      setSurvey(prev => prev ? { ...prev, status: 'Deleted' } : null)
      showToast.success("Survey deleted successfully")
      setShowDeleteDialog(false)
    } catch (error) {
      showToast.error("An unexpected error occurred")
      console.error('Error:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleExportSurvey = () => {
    if (!survey) return

    // Prepare export data
    const exportData: any[] = []
    
    // Add survey details
    exportData.push({
      Type: 'Survey Details',
      Title: survey.title,
      Description: survey.description || '',
      Status: survey.status,
      'Start Date': survey.start_date ? format(new Date(survey.start_date), "MMMM d, yyyy") : '',
      'End Date': survey.end_date ? format(new Date(survey.end_date), "MMMM d, yyyy") : '',
      'Created At': format(new Date(survey.created_at), "MMMM d, yyyy"),
      'Total Responses': responses.length
    })

    // Add empty row
    exportData.push({})

    // Add questions and responses
    questions.forEach((question, index) => {
      const questionResponses = getResponsesForQuestion(question.id)
      
      // Add question details
      exportData.push({
        Type: 'Question',
        'Question #': index + 1,
        Category: question.category,
        'Question Text': question.question,
        'Question Type': question.type,
        'Response Count': questionResponses.length
      })

      // Add responses for this question
      questionResponses.forEach((response, respIndex) => {
        const rowData: any = {
          Type: 'Response',
          'Response #': respIndex + 1,
          'User': response.user_name,
          'Response': response.response,
          'Response Date': format(new Date(response.created_at), "MMMM d, yyyy HH:mm")
        }

        // Add sentiment analysis for text questions
        if (question.type === 'text' && response.sentiment && response.sentiment.length > 0) {
          const sentiment = response.sentiment[0]
          let sentimentLabel = 'Unknown'
          
          switch(sentiment.label) {
            case 1: sentimentLabel = 'Very Negative'; break;
            case 2: sentimentLabel = 'Negative'; break;
            case 3: sentimentLabel = 'Neutral'; break;
            case 4: sentimentLabel = 'Positive'; break;
            case 5: sentimentLabel = 'Very Positive'; break;
          }
          
          rowData['Sentiment'] = sentimentLabel
          rowData['Sentiment Score'] = `${Math.round(sentiment.score * 100)}%`
        }

        exportData.push(rowData)
      })

      // Add empty row between questions
      exportData.push({})
    })

    exportToCSV([], exportData, `Survey_${survey.title}_Export`)
    showToast.success("Survey data exported successfully")
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
  const canViewResponses = survey.status === 'Active' || survey.status === 'Closed';
  const columns:[] = [];
  
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
          {survey.status === 'Draft' && (
            <>
              <Button 
                onClick={() => setShowScheduleDialog(true)}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Schedule
              </Button>
              <Button 
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </>
          )}

          {survey.status === 'Scheduled' && (
            <>
              <Button 
                onClick={() => setShowUnscheduleDialog(true)}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Unschedule
              </Button>
              <Button 
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </>
          )}

          {(survey.status === 'Active' || survey.status === 'Closed') && (
            <>
              <Button onClick={handleExportSurvey}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>              
            </>
          )}

          <Button 
            variant="outline" 
            onClick={() => router.push(`/surveys/${survey.id}/edit`)}
            disabled={survey.status === 'Active' || survey.status === 'Closed'}
            title={`You cannot edit an ${survey.status.toLowerCase()} survey`}
          >
            <PencilLine className="mr-2 h-4 w-4" />
            Edit Survey
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center -mt-2 mb-4">
              <CardTitle>Survey Details</CardTitle>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(survey.status)}`}>
                {survey.status}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-500">Description</h3>
            {survey.description && (
              <CardDescription>{survey.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
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
                <TabsList className="grid grid-cols-5 mb-4">
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
                              <CardTitle className="-my-3 text-base">{question.question}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              {!canViewResponses ? (
                                <p className="text-sm text-muted-foreground">
                                  Responses will be visible once the survey is Active or Closed.
                                </p>
                              ) : questionResponses.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No responses yet for this question.</p>
                              ) : question.type === "rating" ? (
                                // Display rating summary
                                <div className="grid grid-cols-5 gap-2">
                                  {getRatingCounts(question.id).map((count, idx) => {
                                    const rating = idx + 1
                                    const total     = questionResponses.length
                                    const percentage = total === 0 ? 0 : Math.round((count/total)*100)
                                    // const percentage = getRatingPercentage(count, questionResponses.length)

                                    return (
                                      <div key={rating} className={`rounded-lg p-2 ${getRatingBgColor(rating)}`}>
                                        <div className="flex justify-between items-center mb-1">
                                          <span className={`text-xs font-medium flex items-center gap-1 ${getRatingColor(rating)}`}>
                                            {getRatingIcon(rating)}
                                            {getRatingLabel(rating)}
                                          </span>
                                          <span className="text-xs font-bold">{percentage}%</span>
                                        </div>
                                        <Progress value={percentage} className="h-2 mb-1" />
                                        <p className="text-xs text-gray-600">
                                          {count} {count === 1 ? "response" : "responses"}
                                        </p>
                                      </div>
                                    )                                  
                                  })}
                                  <div className="text-sm text-muted-foreground mt-2">
                                    Total responses: {questionResponses.length}
                                  </div>
                                </div>
                              ) : (
                                // Display text responses with sentiment analysis and expand/collapse
                                <div className="space-y-4">
                                  {/* Sentiment analysis summary */}
                                  <div className="border-b">
                                    <div className="grid grid-cols-5 gap-2">
                                      {['VERY_NEGATIVE', 'NEGATIVE', 'NEUTRAL', 'POSITIVE', 'VERY_POSITIVE'].map(sentiment => {
                                        const sentiments = getSentimentSummary(question.id)
                                        const count = sentiments[sentiment as keyof typeof sentiments]
                                        const percentage = sentiments.total > 0 
                                          ? Math.round((count / sentiments.total) * 100) 
                                          : 0
                                        return (
                                          <div 
                                            key={sentiment} 
                                            className={`rounded-lg p-2 ${getSentimentBgColor(sentiment)}`}
                                          >
                                            <div className="flex justify-between items-center mb-1">
                                              <span className={`text-xs font-medium flex items-center gap-1 ${getSentimentColor(sentiment)}`}>
                                                {getSentimentIcon(sentiment)} {sentiment.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')}
                                              </span>
                                              <span className="text-xs font-bold">{percentage}%</span>
                                            </div>
                                            <Progress value={percentage} className="h-2" />
                                            <p className="text-xs mt-1 text-gray-600">{count} {count === 1 ? 'response' : 'responses'}</p>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                  {/* Expand/collapse for responses */}
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="w-full transition-colors mt-2"
                                    onClick={() => setExpandedResponses(prev => ({ ...prev, [question.id]: !prev[question.id] }))}
                                  >
                                    {expandedResponses[question.id] ? `Hide Responses (${questionResponses.length})` : `Show Responses (${questionResponses.length})`}
                                  </Button>
                                  {expandedResponses[question.id] && (
                                    <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                                      {questionResponses.slice(0, 10).map(response => {
                                        let sentimentLabel = 'UNKNOWN';
                                        let confidence = null;
                                        if (response.sentiment && response.sentiment.length > 0) {
                                          const label = response.sentiment[0].label;
                                          const score = response.sentiment[0].score;
                                          confidence = Math.round(score * 100);
                                          switch(label) {
                                            case 1: sentimentLabel = 'VERY_NEGATIVE'; break;
                                            case 2: sentimentLabel = 'NEGATIVE'; break;
                                            case 3: sentimentLabel = 'NEUTRAL'; break;
                                            case 4: sentimentLabel = 'POSITIVE'; break;
                                            case 5: sentimentLabel = 'VERY_POSITIVE'; break;
                                            default: sentimentLabel = 'UNKNOWN';
                                          }
                                        }
                                        return (
                                          <div key={response.id} className="border mb-2 rounded-md overflow-hidden">
                                            <div className="p-3 text-sm">{response.response || "No answer provided"}</div>
                                          </div>
                                        )
                                      })}
                                      {/* {questionResponses.length > 10 && (
                                        <div className="text-xs text-center text-muted-foreground py-2">Showing first 10 of {questionResponses.length} responses</div>
                                      )} */}
                                    </div>
                                  )}
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

      {/* Schedule Confirmation Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Survey</DialogTitle>
            <DialogDescription>
              Are you sure you want to schedule this survey? This will change the status from Draft to Scheduled.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleScheduleSurvey}
              disabled={actionLoading}
            >
              {actionLoading ? "Scheduling..." : "Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unschedule Confirmation Dialog */}
      <Dialog open={showUnscheduleDialog} onOpenChange={setShowUnscheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unschedule Survey</DialogTitle>
            <DialogDescription>
              Are you sure you want to unschedule this survey? This will change the status from Scheduled to Draft.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUnscheduleDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUnscheduleSurvey}
              disabled={actionLoading}
            >
              {actionLoading ? "Unscheduling..." : "Unschedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Survey</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this survey? This action will mark the survey as deleted and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteSurvey}
              disabled={actionLoading}
            >
              {actionLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 