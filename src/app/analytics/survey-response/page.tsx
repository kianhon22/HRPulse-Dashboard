"use client"
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/lib/supabase";
import { format, parseISO, getYear } from "date-fns";
import { RefreshCw, Download } from "lucide-react";

// Custom tick component for wrapping text
const CustomXAxisTick = (props: any) => {
  const { x, y, payload } = props;
  const text = payload.value;
  
  // Split text into words and create lines
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length > 12) {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  
  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((line, index) => (
        <text
          key={index}
          x={0}
          y={index * 12}
          dy={8}
          textAnchor="middle"
          fill="#666"
          fontSize="12"
        >
          {line}
        </text>
      ))}
    </g>
  );
};

// Function to get AI recommendations
const getAIRecommendations = async (data: any) => {
  try {
    const prompt = `Analyze the survey response data and provide exactly 5 concise, actionable recommendations (max 3-4 sentences each).

Data Summary:
- Overall Response Rate: ${data.overallRate}%
- Year: ${data.year}
- Department Filter: ${data.department}
- Survey Filter: ${data.survey}

FORMATTING RULES:
1. Separate each recommendation with "###RECOMMENDATION###"
2. Keep each recommendation to 3-4 sentences maximum
3. Use **bold** ONLY for specific numbers, percentages, timeframes, or multi-word important actions (NOT for single words like department names)
4. If steps are needed, use: 1) Step one 2) Step two 3) Step three
5. Start each recommendation with a clear action verb
6. Do NOT use quotation marks around department names or survey names
7. Write naturally without excessive capitalization

Example Format:
###RECOMMENDATION###
**Launch targeted campaigns** for departments with **response rates below 50%**. Implement: 1) Department head endorsements 2) Personalized email reminders 3) Team competition incentives. Target **75% participation** within **2 weeks**.
###RECOMMENDATION###
**Optimize survey timing** by avoiding Monday mornings and Friday afternoons. Schedule during: 1) Mid-week periods 2) After team meetings 3) Before lunch hours. This can boost response rates by **20-30%**.

Generate 5 specific recommendations based on the provided data:`;

    const response = await fetch('/api/ai-recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt })
    });

    const result = await response.json();
    return result.recommendations || ['Unable to generate recommendations at this time'];
  } catch (error) {
    console.error('Error getting AI recommendations:', error);
    return ['Unable to generate recommendations at this time'];
  }
};

// Function to export CSV
const exportToCSV = (data: any, filters: any) => {
  const csvData = [];
  
  // Add overall statistics first
  csvData.push(['Overall Statistics']);
  csvData.push(['Overall Rate (%)', 'Total Surveys', 'Total Responses', 'Total Employees']);
  csvData.push([data.overallData.rate, data.overallData.surveys, data.overallData.responses, data.overallData.employees]);
  csvData.push([]);
  
  // Add chart data
  if (filters.survey === "Survey") {
    // Survey chart data
    csvData.push(['Survey Title', 'Response Rate (%)', 'Responses', 'Total Employees', 'Period']);
    data.chartData.forEach((row: any) => {
      csvData.push([row.title, row.responseRate, row.responses, row.totalEmployees, row.period]);
    });
  } else {
    // Department chart data when specific survey selected
    csvData.push(['Department', 'Response Rate (%)']);
    data.chartData.forEach((row: any) => {
      csvData.push([row.department, row.responseRate]);
    });
  }
  
  // Add department breakdown
  if (data.tableData.length > 0) {
    csvData.push([]);
    csvData.push(['Department Breakdown']);
    const categoryColumns = Object.keys(data.tableData[0]).filter(key => 
      !['department', 'responseRate', 'respondersEmployees'].includes(key)
    );
    
    csvData.push(['Department', 'Response Rate (%)', 'Responders/Employees', ...categoryColumns.map(cat => `${cat} (%)`)]);
    data.tableData.forEach((row: any) => {
      csvData.push([
        row.department, 
        row.responseRate, 
        row.respondersEmployees,
        ...categoryColumns.map(cat => row[cat] || 'N/A')
      ]);
    });
  }
  
  const csvContent = csvData.map(row => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const deptFilter = filters.department !== "Department" ? filters.department.replace(/\s+/g, '_') : 'All_Departments';
  const surveyFilter = filters.survey !== "Survey" ? filters.survey.replace(/\s+/g, '_') : 'All_Surveys';
  a.download = `Survey_Response_Analytics_${filters.year}_${deptFilter}_${surveyFilter}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};

export default function SurveyResponseAnalytics() {
  const [department, setDepartment] = useState("Department");
  const [year, setYear] = useState(new Date().getFullYear());
  const [survey, setSurvey] = useState("Survey");
  const [departments, setDepartments] = useState<string[]>(["Department"]);
  const [years, setYears] = useState<number[]>([]);
  const [surveys, setSurveys] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const [overallData, setOverallData] = useState<{ rate: number, surveys: number, responses: number, employees: number }>({ rate: 0, surveys: 0, responses: 0, employees: 0 });
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  const resetFilters = () => {
    setDepartment("Department");
    setYear(new Date().getFullYear());
    setSurvey("Survey");
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      // Get all years with survey data
      const { data: surveysData } = await supabase
        .from('surveys')
        .select('start_date')
        .eq('is_template', false)
        .in('status', ['Active', 'Closed'])
        .order('start_date', { ascending: true });
      
      if (surveysData && surveysData.length > 0) {
        const uniqueYears = Array.from(new Set(
          surveysData.map(s => getYear(parseISO(s.start_date)))
        )).sort((a, b) => b - a);
        setYears(uniqueYears);
      }

      // Get all departments
      const { data: employees } = await supabase
        .from('users')
        .select('department')
        .eq('role', 'employee');
      
      if (employees) {
        const uniqueDepartments = ["Department", ...Array.from(new Set(
          employees.map(e => e.department).filter(d => d)
        )).sort()];
        setDepartments(uniqueDepartments);
      }
    };

    fetchInitialData();
  }, []);

  // Fetch surveys when year changes
  useEffect(() => {
    const fetchSurveys = async () => {
      if (year) {
        const { data: surveysData } = await supabase
          .from('surveys')
          .select('id, title, start_date, end_date')
          .eq('is_template', false)
          .in('status', ['Active', 'Closed'])
          .gte('start_date', `${year}-01-01`)
          .lt('start_date', `${year + 1}-01-01`)
          .order('start_date', { ascending: true });
        
        const surveyList = surveysData || [];
        setSurveys([{ id: 'all', title: 'Survey' }, ...surveyList]);
      }
    };

    fetchSurveys();
  }, [year]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get employees
        let employeeQuery = supabase
          .from('users')
          .select('id, department')
          .eq('role', 'employee');
        
        if (department !== "Department") {
          employeeQuery = employeeQuery.eq('department', department);
        }
        
        const { data: employees } = await employeeQuery;
        const employeeList = employees || [];
        const totalEmployees = employeeList.length;

        // Get surveys for the selected year
        const { data: allSurveys } = await supabase
          .from('surveys')
          .select('id, title, start_date, end_date')
          .eq('is_template', false)
          .in('status', ['Active', 'Closed'])
          .gte('start_date', `${year}-01-01`)
          .lt('start_date', `${year + 1}-01-01`)
          .order('start_date', { ascending: true });
        
        const surveyList = allSurveys || [];

        // Filter surveys if specific survey is selected
        const filteredSurveys = survey === "Survey" ? surveyList : 
          surveyList.filter(s => s.id === survey);

        // Prepare chart data
        let chartData = [];
        let totalResponses = 0;
        let totalUniqueResponders = 0;

        if (survey === "Survey") {
          // Show survey-based chart
          for (const surveyItem of surveyList) {
            // Get all questions for this survey
            const { data: questions } = await supabase
              .from('survey_questions')
              .select('id')
              .eq('survey_id', surveyItem.id);
            
            const questionList = questions || [];
            
            if (questionList.length > 0) {
              // Get responses for these questions
              let responseQuery = supabase
                .from('survey_responses')
                .select('user_id')
                .in('question_id', questionList.map(q => q.id));

              // Filter by department if needed
              if (department !== "Department") {
                const employeeIds = employeeList.map(e => e.id);
                responseQuery = responseQuery.in('user_id', employeeIds);
              }

              const { data: responses } = await responseQuery;
              const responseList = responses || [];

              // Count unique responders
              const uniqueResponders = new Set(responseList.map(r => r.user_id)).size;
              const currentEmployeeCount = department !== "Department" ? employeeList.length : totalEmployees;
              const responseRate = currentEmployeeCount > 0 ? Number(((uniqueResponders / currentEmployeeCount) * 100).toFixed(1)) : 0;

              chartData.push({
                title: surveyItem.title,
                responseRate,
                responses: responseList.length,
                uniqueResponders,
                totalEmployees: currentEmployeeCount,
                period: `${format(parseISO(surveyItem.start_date), 'MMM d')} - ${format(parseISO(surveyItem.end_date), 'MMM d')}`
              });

              totalResponses += responseList.length;
              totalUniqueResponders += uniqueResponders;
            }
          }
        } else {
          // Show department-based chart for specific survey
          const allDepartments = departments.filter(d => d !== "Department");
          
          for (const dept of allDepartments) {
            const deptEmployees = employeeList.filter(e => e.department === dept);
            const deptEmployeeIds = deptEmployees.map(e => e.id);
            
            if (deptEmployees.length > 0) {
              // Get questions for selected survey
              const { data: questions } = await supabase
                .from('survey_questions')
                .select('id')
                .eq('survey_id', survey);
              
              const questionList = questions || [];
              
              if (questionList.length > 0) {
                const { data: responses } = await supabase
                  .from('survey_responses')
                  .select('user_id')
                  .in('question_id', questionList.map(q => q.id))
                  .in('user_id', deptEmployeeIds);
                
                const responseList = responses || [];
                const uniqueResponders = new Set(responseList.map(r => r.user_id)).size;
                const responseRate = deptEmployees.length > 0 ? Number(((uniqueResponders / deptEmployees.length) * 100).toFixed(1)) : 0;

                chartData.push({
                  department: dept,
                  responseRate,
                  uniqueResponders,
                  totalEmployees: deptEmployees.length
                });

                totalResponses += responseList.length;
                totalUniqueResponders += uniqueResponders;
              }
            }
          }
        }

        setChartData(chartData);

        // Prepare table data by department with categories
        const deptData: any[] = [];
        const allDepartments = departments.filter(d => d !== "Department");
        
        for (const dept of allDepartments) {
          const deptEmployees = employeeList.filter(e => e.department === dept);
          const deptEmployeeIds = deptEmployees.map(e => e.id);
          
          let deptTotalResponses = 0;
          let deptUniqueResponders = new Set();
          const categoryRates: { [key: string]: { responses: number, total: number } } = {};

          for (const surveyItem of filteredSurveys) {
            const { data: questions } = await supabase
              .from('survey_questions')
              .select('id, question, category')
              .eq('survey_id', surveyItem.id);
            
            const questionList = questions || [];
            
            if (questionList.length > 0) {
              const { data: responses } = await supabase
                .from('survey_responses')
                .select('user_id, question_id')
                .in('question_id', questionList.map(q => q.id))
                .in('user_id', deptEmployeeIds);
              
              const responseList = responses || [];

              // Add to department totals
              deptTotalResponses += responseList.length;
              responseList.forEach(r => deptUniqueResponders.add(r.user_id));

              // Calculate category response rates
              for (const response of responseList) {
                const question = questionList.find(q => q.id === response.question_id);
                if (question && question.category) {
                  const category = question.category;
                  if (!categoryRates[category]) {
                    categoryRates[category] = { responses: 0, total: 0 };
                  }
                  categoryRates[category].responses += 1;
                }
              }

              // Count total possible responses per category
              for (const question of questionList) {
                if (question.category) {
                  const category = question.category;
                  if (!categoryRates[category]) {
                    categoryRates[category] = { responses: 0, total: 0 };
                  }
                  categoryRates[category].total += deptEmployees.length;
                }
              }
            }
          }
          
          const responseRate = deptEmployees.length > 0 ? 
            Number(((deptUniqueResponders.size / deptEmployees.length) * 100).toFixed(1)) : 0;
          
          // Calculate category percentages
          const categories: { [key: string]: number } = {};
          for (const [category, data] of Object.entries(categoryRates)) {
            categories[category] = data.total > 0 ? Number(((data.responses / data.total) * 100).toFixed(1)) : 0;
          }
          
          deptData.push({
            department: dept,
            responseRate: responseRate,
            respondersEmployees: `${deptUniqueResponders.size}/${deptEmployees.length}`,
            ...categories
          });
        }
        setTableData(deptData);

        // Calculate overall data
        const overallRate = totalEmployees > 0 ? Number(((totalUniqueResponders / totalEmployees) * 100).toFixed(1)) : 0;
        
        const newOverallData = {
          rate: overallRate,
          surveys: filteredSurveys.length,
          responses: totalResponses,
          employees: totalEmployees
        };
        setOverallData(newOverallData);

        // Load AI recommendations independently (after main data is loaded)
        const loadAIRecommendations = async () => {
          try {
            setLoadingRecommendations(true);
            const recommendations = await getAIRecommendations({
              overallRate,
              year,
              department,
              survey,
              departmentData: deptData,
              chartData: chartData
            });
            setRecommendations(recommendations);
          } catch (error) {
            console.error("Error getting AI recommendations:", error);
          } finally {
            setLoadingRecommendations(false);
          }
        };

        // Load recommendations in background
        loadAIRecommendations();

      } catch (error) {
        console.error("Error fetching survey response data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (years.length > 0 && departments.length > 0 && surveys.length > 0) {
      fetchData();
    }
  }, [department, year, survey, years, departments, surveys]);

  return (
    <div className="py-8 px-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Survey Response Analytics</h1>
        <Button onClick={() => exportToCSV({ chartData, tableData, overallData }, { department, year, survey })}>
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>
      
      <div className="flex gap-4 mb-4">
        <select 
          value={department} 
          onChange={e => setDepartment(e.target.value)} 
          className="border rounded px-2 py-1"
        >
          {departments.map(dep => <option key={dep} value={dep}>{dep}</option>)}
        </select>
        <select 
          value={year} 
          onChange={e => setYear(Number(e.target.value))} 
          className="border rounded px-2 py-1"
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select 
          value={survey} 
          onChange={e => setSurvey(e.target.value)} 
          className="border rounded px-2 py-1"
        >
          {surveys.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
        <Button 
          onClick={resetFilters}
          className="hover:bg-purple-700 text-white"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Overall Statistics */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Overall Survey Response Rate</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-20">Loading...</div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{overallData.rate}%</div>
                <div className="text-sm text-gray-600">Average Response Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{overallData.surveys}</div>
                <div className="text-sm text-gray-600">Total Surveys</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{overallData.responses}</div>
                <div className="text-sm text-gray-600">Total Responses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{overallData.employees}</div>
                <div className="text-sm text-gray-600">Total Employees</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{survey === "Survey" ? "Response Rates by Survey" : "Response Rates by Department"}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center">Loading...</div>
          ) : chartData.length > 0 ? (
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 30, left: 80, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey={survey === "Survey" ? "title" : "department"}
                    tick={<CustomXAxisTick />}
                    height={60}
                    interval={0}
                    axisLine={{ stroke: '#666' }}
                    tickLine={{ stroke: '#666' }}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    label={{ 
                      value: "Response Rate (%)", 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { textAnchor: 'middle' }
                    }} 
                  />
                  <Tooltip 
                    formatter={(value, name) => [`${value}%`, name]}
                    labelFormatter={(label) => {
                      if (survey === "Survey") {
                        const surveyItem = chartData.find(d => d.title === label);
                        return surveyItem ? `${label} (${surveyItem.period})` : label;
                      }
                      return label;
                    }}
                  />
                  <Bar 
                    dataKey="responseRate" 
                    name="Response Rate (%)" 
                    fill="#6A1B9A"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No survey response data available for {year}
            </div>
          )}
        </CardContent>
      </Card>

      {tableData.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Department Survey Responses</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-20">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr>
                      <th className="px-2 py-1 text-left">Department</th>
                      <th className="px-2 py-1 text-left">Response Rate</th>
                      <th className="px-2 py-1 text-left">Responders/Employees</th>
                      {/* Dynamic category columns */}
                      {tableData.length > 0 && Object.keys(tableData[0]).filter(key => 
                        !['department', 'responseRate', 'respondersEmployees'].includes(key)
                      ).map(category => (
                        <th key={category} className="px-2 py-1 text-left">{category}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map(row => (
                      <tr key={row.department}>
                        <td className="px-2 py-1">{row.department}</td>
                        <td className="px-2 py-1">{row.responseRate}%</td>
                        <td className="px-2 py-1">{row.respondersEmployees}</td>
                        {/* Dynamic category cells */}
                        {Object.keys(row).filter(key => 
                          !['department', 'responseRate', 'respondersEmployees'].includes(key)
                        ).map(category => (
                          <td key={category} className="px-2 py-1">{row[category] !== undefined ? `${row[category]}%` : 'N/A'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Actions</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingRecommendations ? (
            <div className="flex items-center justify-center h-20">Generating recommendations...</div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-3">
              {recommendations.map((recommendation, index) => (
                <div key={index} className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                  <div className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">
                      {index + 1}
                    </span>
                    <p 
                      className="text-sm text-gray-700 leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: recommendation.trim()
                          .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-purple-700">$1</strong>')
                          // .replace(/(\d+\))/g, '<span class="font-medium text-purple-600">$1</span>')
                          .replace(/\n/g, '<br>')
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 