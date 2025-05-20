"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, TrendingUp, Users, HeartHandshake, Calendar, MessageSquare, Award } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { format, parseISO, startOfMonth, endOfMonth, isSameMonth, subMonths, getYear, getMonth, isWeekend, eachDayOfInterval } from "date-fns"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { useRouter } from "next/navigation"

interface MetricData {
  title: string
  value: string
  description: string
  icon: any
  trend: string
  trendUp: boolean
  period?: string
}

const COLORS = ['#6A1B9A', '#8E24AA', '#AB47BC', '#CE93D8']

export default function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState<MetricData[]>([
    {
      title: "Engagement Score",
      value: "-",
      description: "Last survey",
      icon: HeartHandshake,
      trend: "-",
      trendUp: true,
    },
    {
      title: "Survey Response",
      value: "-",
      description: "Last survey",
      icon: MessageSquare,
      trend: "-",
      trendUp: true,
    },
    {
      title: "Attendance Rate",
      value: "-",
      description: "Last month",
      icon: Calendar,
      trend: "-",
      trendUp: true,
    },
    {
      title: "Recognition Points",
      value: "-",
      description: "Year to date",
      icon: Award,
      trend: "-",
      trendUp: true,
    },
  ])
  const [engagementChart, setEngagementChart] = useState<any[]>([])
  const [surveyResponseChart, setSurveyResponseChart] = useState<any[]>([])
  const [attendanceTrendChart, setAttendanceTrendChart] = useState<any[]>([])
  const [recognitionTrendChart, setRecognitionTrendChart] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const currentYear = getYear(new Date())
        // 1. Get all employees
        const { data: employees, error: empErr } = await supabase
          .from('users')
          .select()
          .eq('role', 'employee')
        const employeeList = employees || []
        const totalEmployees = employeeList.length

        // 2. Get all surveys for current year
        const { data: surveys, error: surveyErr } = await supabase
          .from('surveys')
          .select()
          .eq('is_template', false)
          .gte('start_date', `${currentYear}-04-08`)
          .in('status', ['Active', 'Closed'])
          .order('created_at', { ascending: true })
        const surveyList = surveys || []
        const latestSurvey = surveyList[surveyList.length - 1]
        const lastSurvey = surveyList[surveyList.length - 2]

        // 3. Get all survey questions for latest and last survey
        let latestSurveyQuestions: any[] = []
        let lastSurveyQuestions: any[] = []
        if (latestSurvey) {
          const { data: q1 } = await supabase
            .from('survey_questions')
            .select()
            .eq('survey_id', latestSurvey.id)
          latestSurveyQuestions = q1 || []
        }
        if (lastSurvey) {
          const { data: q2 } = await supabase
            .from('survey_questions')
            .select()
            .eq('survey_id', lastSurvey.id)
          lastSurveyQuestions = q2 || []
        }

        // 4. Get all answers for latest and last survey (only rating questions)
        const ratingQIdsLatest = latestSurveyQuestions.filter(q => q.type === 'rating').map(q => q.id)
        const ratingQIdsLast = lastSurveyQuestions.filter(q => q.type === 'rating').map(q => q.id)
        let latestAnswers: any[] = []
        let lastAnswers: any[] = []
        if (ratingQIdsLatest.length > 0) {
          const { data: a1 } = await supabase
            .from('survey_responses')
            .select()
            .in('question_id', ratingQIdsLatest)
          latestAnswers = a1 || []
        }
        if (ratingQIdsLast.length > 0) {
          const { data: a2 } = await supabase
            .from('survey_responses')
            .select()
            .in('question_id', ratingQIdsLast)
          lastAnswers = a2 || []
        }
        // Engagement Score Calculation
        const avgLatest = latestAnswers.length > 0 ? latestAnswers.reduce((sum, a) => sum + Number(a.response), 0) / latestAnswers.length : 0
        const avgLast = lastAnswers.length > 0 ? lastAnswers.reduce((sum, a) => sum + Number(a.response), 0) / lastAnswers.length : 0
        console.log('testttttttttttttttttt', latestAnswers)
        const engagementScore = (avgLatest * 20).toFixed(1)
        const engagementScoreLast = (avgLast * 20).toFixed(1)
        const engagementTrend = (Number(engagementScore) - Number(engagementScoreLast)).toFixed(1)

        // 5. Survey Response Calculation
        // Get all answers for latest and last survey (any type)
        let latestSurveyResponses: any[] = []
        let lastSurveyResponses: any[] = []
        if (latestSurvey) {
          const { data: r1 } = await supabase
            .from('survey_responses')
            .select()
            .eq('survey_id', latestSurvey.id)
          latestSurveyResponses = r1 || []
        }
        if (lastSurvey) {
          const { data: r2 } = await supabase
            .from('survey_responses')
            .select()
            .eq('survey_id', lastSurvey.id)
          lastSurveyResponses = r2 || []
        }
        // Unique employee responses
        const uniqueLatest = Array.from(new Set(latestSurveyResponses.map(r => r.user_id)))
        const uniqueLast = Array.from(new Set(lastSurveyResponses.map(r => r.user_id)))
        const surveyResponseRate = totalEmployees > 0 ? (uniqueLatest.length / totalEmployees * 100).toFixed(1) : '0.0'
        const surveyResponseRateLast = totalEmployees > 0 ? (uniqueLast.length / totalEmployees * 100).toFixed(1) : '0.0'
        const surveyResponseTrend = (Number(surveyResponseRate) - Number(surveyResponseRateLast)).toFixed(1)

        // 6. Attendance Rate Calculation (current month vs last month)
        const now = new Date()
        const monthStart = startOfMonth(now)
        const monthEnd = endOfMonth(now)
        const lastMonth = subMonths(now, 1)
        const lastMonthStart = startOfMonth(lastMonth)
        const lastMonthEnd = endOfMonth(lastMonth)
        // Get all attendances for current and last month
        const { data: attendances } = await supabase
          .from('attendances')
          .select()
          .gte('check_in', format(lastMonthStart, 'yyyy-MM-dd'))
          .lte('check_in', format(monthEnd, 'yyyy-MM-dd'))
        const attendanceList = attendances || []
        // Helper to count workdays in a month (excluding weekends)
        function countWorkdays(start: Date, end: Date) {
          return eachDayOfInterval({ start, end }).filter(d => !isWeekend(d)).length
        }
        const workdaysThisMonth = countWorkdays(monthStart, monthEnd)
        const workdaysLastMonth = countWorkdays(lastMonthStart, lastMonthEnd)
        // Count attendances per month
        const attendanceThisMonth = attendanceList.filter(a => {
          const d = parseISO(a.check_in)
          return isSameMonth(d, now)
        }).length
        const attendanceLastMonth = attendanceList.filter(a => {
          const d = parseISO(a.check_in)
          return isSameMonth(d, lastMonth)
        }).length
        const possibleAttendancesThisMonth = totalEmployees * workdaysThisMonth
        const possibleAttendancesLastMonth = totalEmployees * workdaysLastMonth
        const attendanceRate = possibleAttendancesThisMonth > 0 ? (attendanceThisMonth / possibleAttendancesThisMonth * 100).toFixed(1) : '0.0'
        const attendanceRateLast = possibleAttendancesLastMonth > 0 ? (attendanceLastMonth / possibleAttendancesLastMonth * 100).toFixed(1) : '0.0'
        const attendanceTrend = (Number(attendanceRate) - Number(attendanceRateLast)).toFixed(1)

        // 7. Recognition Rate Calculation (approved recognitions this month vs last month)
        // Current month recognitions
        const { data: recognitions } = await supabase
          .from('recognitions')
          .select()
          .gte('created_at', format(monthStart, 'yyyy-MM-dd'));
        const approvedRecognitions = (recognitions || []).filter(r => r.status === 'Approved');
        const recognitionRate = totalEmployees > 0 ? (approvedRecognitions.length / totalEmployees * 100).toFixed(1) : '0.0';

        // Last month recognitions
        const { data: recognitionsLastMonth } = await supabase
          .from('recognitions')
          .select()
          .gte('created_at', format(lastMonthStart, 'yyyy-MM-dd'))
          .lte('created_at', format(lastMonthEnd, 'yyyy-MM-dd'));
        const approvedRecognitionsLast = (recognitionsLastMonth || []).filter(r => r.status === 'Approved');
        const recognitionRateLast = totalEmployees > 0 ? (approvedRecognitionsLast.length / totalEmployees * 100).toFixed(1) : '0.0';
        const recognitionTrend = (Number(recognitionRate) - Number(recognitionRateLast)).toFixed(1);

        // Update metrics
        setMetrics([
          {
            title: "Engagement Score",
            value: `${engagementScore}%`,
            description: "Last survey",
            icon: HeartHandshake,
            trend: `${Number(engagementTrend) >= 0 ? '+' : ''}${engagementTrend}%`,
            trendUp: Number(engagementTrend) >= 0,
            period: latestSurvey && lastSurvey ? `${format(parseISO(latestSurvey.start_date), 'MMM d')} - ${format(parseISO(latestSurvey.end_date), 'MMM d')} (latest), ${format(parseISO(lastSurvey.start_date), 'MMM d')} - ${format(parseISO(lastSurvey.end_date), 'MMM d')} (last)` : '',
          },
          {
            title: "Survey Response",
            value: `${surveyResponseRate}%`,
            description: "Last survey",
            icon: MessageSquare,
            trend: `${Number(surveyResponseTrend) >= 0 ? '+' : ''}${surveyResponseTrend}%`,
            trendUp: Number(surveyResponseTrend) >= 0,
            period: latestSurvey && lastSurvey ? `${format(parseISO(latestSurvey.start_date), 'MMM d')} - ${format(parseISO(latestSurvey.end_date), 'MMM d')} (latest), ${format(parseISO(lastSurvey.start_date), 'MMM d')} - ${format(parseISO(lastSurvey.end_date), 'MMM d')} (last)` : '',
          },
          {
            title: "Attendance Rate",
            value: `${attendanceRate}%`,
            description: "Last month",
            icon: Calendar,
            trend: `${Number(attendanceTrend) >= 0 ? '+' : ''}${attendanceTrend}%`,
            trendUp: Number(attendanceTrend) >= 0,
          },
          {
            title: "Recognition Rate",
            value: `${recognitionRate}%`,
            description: "Last month",
            icon: Award,
            trend: `${Number(recognitionTrend) >= 0 ? '+' : ''}${recognitionTrend}%`,
            trendUp: Number(recognitionTrend) >= 0,
          },
        ])

        // --- CHARTS ---
        // Engagement Score Chart (all surveys this year)
        const engagementChartData = await Promise.all(
          surveyList.map(async (survey: any) => {
            const { data: questions } = await supabase
              .from('survey_questions')
              .select()
              .eq('survey_id', survey.id)
            const ratingQIds = (questions || []).filter(q => q.type === 'rating').map(q => q.id)
            let answers: any[] = []
            if (ratingQIds.length > 0) {
              const { data: a } = await supabase
                .from('survey_responses')
                .select()
                .in('question_id', ratingQIds)
              answers = a || []
            }
            const avg = answers.length > 0 ? answers.reduce((sum, a) => sum + Number(a.response), 0) / answers.length : 0
            return {
              period: `${format(parseISO(survey.start_date), 'MMM d')} - ${format(parseISO(survey.end_date), 'MMM d')}`,
              score: (avg * 20).toFixed(1),
            }
          })
        )
        setEngagementChart(engagementChartData)

        // Survey Response Chart (all surveys this year)
        const surveyResponseChartData = await Promise.all(
          surveyList.map(async (survey: any) => {
            const { data: answers } = await supabase
              .from('survey_responses')
              .select('user_id')
              .eq('survey_id', survey.id)
            const unique = Array.from(new Set((answers || []).map(a => a.user_id)))
            return {
              period: `${format(parseISO(survey.start_date), 'MMM d')} - ${format(parseISO(survey.end_date), 'MMM d')}`,
              responseRate: totalEmployees > 0 ? (unique.length / totalEmployees * 100).toFixed(1) : '0.0',
              count: unique.length,
            }
          })
        )
        setSurveyResponseChart(surveyResponseChartData)

        // Attendance Trend Chart (monthly, current year)
        const attendanceYearData = []
        for (let m = 0; m < 12; m++) {
          const monthDate = new Date(currentYear, m, 1)
          const monthStart = startOfMonth(monthDate)
          const monthEnd = endOfMonth(monthDate)
          const workdays = countWorkdays(monthStart, monthEnd)
          const possible = totalEmployees * workdays
          const count = (attendanceList || []).filter(a => {
            const d = parseISO(a.check_in)
            return getMonth(d) === m && getYear(d) === currentYear
          }).length
          attendanceYearData.push({
            month: format(monthDate, 'MMM'),
            attendanceRate: possible > 0 ? (count / possible * 100).toFixed(1) : '0.0',
            count,
          })
        }
        setAttendanceTrendChart(attendanceYearData)

        // Recognition Trend Chart (monthly, current year)
        const recognitionYearData = []
        for (let m = 0; m < 12; m++) {
          const monthDate = new Date(currentYear, m, 1)
          const count = (approvedRecognitions || []).filter(r => {
            const d = parseISO(r.created_at)
            return getMonth(d) === m && getYear(d) === currentYear
          }).length
          recognitionYearData.push({
            month: format(monthDate, 'MMM'),
            recognitionRate: totalEmployees > 0 ? (count / totalEmployees * 100).toFixed(1) : '0.0',
            count,
          })
        }
        setRecognitionTrendChart(recognitionYearData)
      } catch (error) {
        console.error("Error fetching analytics data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="py-8 pr-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
        <Button className="cursor-pointer">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, idx) => (
          <Card key={metric.title} className="cursor-pointer" onClick={() => {
            if (metric.title === 'Engagement Score') router.push('/analytics/engagement-score');
            else if (metric.title === 'Survey Response') router.push('/analytics/survey-response');
            else if (metric.title === 'Attendance Rate') router.push('/analytics/attendance-rate');
            else if (metric.title === 'Recognition Rate') router.push('/analytics/recognition-rate');
          }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">
                {metric.title}
              </CardTitle>
              <metric.icon className="h-5 w-5 text-[#6A1B9A]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center space-x-2">
                <p className="text-xs text-muted-foreground">
                  {metric.description}
                </p>
                <span
                  className={`text-xs font-medium ${metric.trendUp ? "text-green-600" : "text-red-600"}`}
                >
                  {metric.trend}
                </span>
              </div>
              {/* Show period for engagement and survey metrics */}
              {metric.period && (
                <div className="text-[10px] text-gray-500 mt-1">{metric.period}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HeartHandshake className="h-6 w-6 text-[#6A1B9A]" /> Engagement Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={engagementChart} margin={{ top: 5, right: 10, left: 10, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="period"
                    padding={{ left: 30, right: 30 }}
                    angle={-25}
                    textAnchor="end"
                    label={{
                      value: "Period",        // x-axis label
                      position: "bottom",
                      offset: 48,
                      style: {
                        fill: "#555"
                      }
                    }}
                  />
                  <YAxis domain={[0, 100]}
                    label={{
                      value: "Engagement Score (%)",  // y-axis label
                      angle: -90,
                      dx: -25,
                      style: {
                        fill: "#555"
                      }
                    }}
                  />
                  <Tooltip contentStyle={{ padding: 5, fontSize: 14 }} formatter={(value) => [`${value}%`, 'Engagement Score']} />
                  <Line type="linear" dataKey="score" name="Engagement Score (%)" stroke="#6A1B9A" strokeWidth={2} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-[#6A1B9A]" /> Survey Response
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={surveyResponseChart} margin={{ top: 5, right: 10, left: 10, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="period"                    
                    padding={{ left: 30, right: 30 }}
                    angle={-25}
                    textAnchor="end"
                    label={{
                      value: "Period",        // x-axis label
                      position: "bottom",
                      offset: 48,
                      style: {
                        fill: "#555"
                      }
                    }}
                  />
                  <YAxis domain={[0, 100]}
                    label={{
                      value: "Response Rate (%)",  // y-axis label
                      angle: -90,
                      dx: -25,
                      style: {
                        fill: "#555"
                      }
                    }}
                  />
                  <Tooltip contentStyle={{ padding: 5, fontSize: 14 }} formatter={(value, name, { payload }) => [`${value}% (${payload.count})`, 'Response Rate']} labelFormatter={(label) => `Period: ${label}`} />
                  <Line type="linear" dataKey="responseRate" name="Response Rate (%)" stroke="#8E24AA" strokeWidth={2} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Full width Attendance Rate chart */}
      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-[#6A1B9A]" /> Attendance Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attendanceTrendChart} margin={{ top: 5, right: 10, left: 10, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    padding={{ left: 30, right: 30 }}
                    label={{
                      value: "Month",        // x-axis label
                      position: "bottom",
                      offset: 15,
                      style: {
                        fill: "#555"
                      }
                    }}
                  />
                  <YAxis domain={[0, 100]}
                    label={{
                      value: "Attendance Rate (%)",  // y-axis label
                      angle: -90,
                      dx: -20,
                      style: {
                        fill: "#555"
                      }
                    }}
                  />
                  <Tooltip contentStyle={{ padding: 5, fontSize: 14 }} formatter={(value, name, props) => [`${value}%`, 'Attendance Rate']} labelFormatter={(label) => `Month: ${label}`} />
                  <Line type="linear" dataKey="attendanceRate" name="Attendance Rate (%)" stroke="#6A1B9A" strokeWidth={2} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Full width Recognition Rate chart */}
      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-6 w-6 text-[#6A1B9A]" /> Recognition Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={recognitionTrendChart} margin={{ top: 5, right: 10, left: 10, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    padding={{ left: 30, right: 30 }}
                    label={{
                      value: "Month",        // x-axis label
                      position: "bottom",
                      offset: 15,
                      style: {
                        fill: "#555"
                      }
                    }}
                  />
                  <YAxis domain={[0, 100]}
                    label={{
                      value: "Recognition Rate (%)",  // y-axis label
                      angle: -90,
                      dx: -20,
                      style: {
                        fill: "#555"
                      }
                    }}
                  />
                  <Tooltip contentStyle={{ padding: 5, fontSize: 14 }} formatter={(value, name, { payload }) => [`${value}% (${payload.count})`, 'Recognition Rate']} labelFormatter={(label) => `Month: ${label}`} />
                  <Line type="linear" dataKey="recognitionRate" name="Recognition Rate (%)" stroke="#AB47BC" strokeWidth={2} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 