"use client"
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/lib/supabase";
import { format, parseISO, startOfMonth, endOfMonth, getYear, getMonth, isSameMonth } from "date-fns";
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
    if (testLine.length > 12) { // Approximate character limit per line
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
    const prompt = `Based on the following recognition rate analytics data, provide 3-5 specific, actionable recommendations to improve employee recognition rates. Be concise and practical.

Data:
- Overall recognition rate: ${data.overallRate}%
- Year: ${data.year}
- Month filter: ${data.month}
- Department filter: ${data.department}
- Department breakdown: ${JSON.stringify(data.departmentData)}
- Chart data: ${JSON.stringify(data.chartData)}

Focus on areas with lower recognition rates and provide specific strategies to increase employee recognition and engagement.`;

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
  csvData.push(['Overall Rate (%)', 'Total Recognitions', 'Total Employees']);
  csvData.push([data.overallData.rate, data.overallData.count, data.overallData.total]);
  csvData.push([]);
  
  // Add headers
  if (filters.department === "Department") {
    // Department breakdown
    csvData.push(['Department', 'Recognition Rate (%)', 'Recognition Count', 'Total Employees']);
    data.tableData.forEach((row: any) => {
      csvData.push([row.department, row.rate, row.count, row.employees]);
    });
  } else {
    // Time series data
    csvData.push(['Period', 'Recognition Rate (%)', 'Recognition Count']);
    data.chartData.forEach((row: any) => {
      csvData.push([row.period, row.rate, row.count]);
    });
  }
  
  const csvContent = csvData.map(row => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const deptFilter = filters.department !== "Department" ? filters.department.replace(/\s+/g, '_') : 'All_Departments';
  a.download = `Recognition_Rate_Analytics_${filters.year}_${deptFilter}_${filters.month !== 'Month' ? filters.month : 'All_Months'}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};

export default function RecognitionRateAnalytics() {
  const [department, setDepartment] = useState("Department");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState("Month");
  const [departments, setDepartments] = useState<string[]>(["Department"]);
  const [years, setYears] = useState<number[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const [overallData, setOverallData] = useState<{ rate: number, count: number, total: number }>({ rate: 0, count: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  const months = ["Month", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const resetFilters = () => {
    setDepartment("Department");
    setYear(new Date().getFullYear());
    setMonth("Month");
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      // Get all years with recognition data
      const { data: recognitions } = await supabase
        .from('recognitions')
        .select('created_at')
        .order('created_at', { ascending: true });
      
      if (recognitions && recognitions.length > 0) {
        const uniqueYears = Array.from(new Set(
          recognitions.map(r => getYear(parseISO(r.created_at)))
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

        // Get recognitions for the selected year (all statuses, not just approved)
        const { data: recognitions } = await supabase
          .from('recognitions')
          .select('created_at, receiver_id')
          .gte('created_at', `${year}-01-01`)
          .lt('created_at', `${year + 1}-01-01`);
        
        const recognitionList = recognitions || [];

        // Filter recognitions by department if selected
        let filteredRecognitions = recognitionList;
        if (department !== "Department") {
          const employeeIds = employeeList.map(e => e.id);
          filteredRecognitions = recognitionList.filter(r => employeeIds.includes(r.receiver_id));
        }

        // Prepare chart data
        let currentChartData;
        if (month === "Month") {
          // Show monthly data for the year
          const monthlyData = [];
          for (let m = 0; m < 12; m++) {
            const count = filteredRecognitions.filter(r => {
              const d = parseISO(r.created_at);
              return getMonth(d) === m && getYear(d) === year;
            }).length;
            
            const rate = totalEmployees > 0 ? Number((count / totalEmployees * 100).toFixed(1)) : 0;
            
            monthlyData.push({
              period: format(new Date(year, m, 1), 'MMM'),
              rate,
              count
            });
          }
          currentChartData = monthlyData;
          setChartData(monthlyData);
        } else {
          // Show daily data for the selected month
          const monthIndex = months.indexOf(month) - 1;
          const monthDate = new Date(year, monthIndex, 1);
          const monthStart = startOfMonth(monthDate);
          const monthEnd = endOfMonth(monthDate);
          
          const dailyData = [];
          for (let day = monthStart; day <= monthEnd; day = new Date(day.getTime() + 24 * 60 * 60 * 1000)) {
            const dayStr = format(day, 'yyyy-MM-dd');
            const count = filteredRecognitions.filter(r => 
              r.created_at.startsWith(dayStr)
            ).length;
            
            const rate = totalEmployees > 0 ? Number((count / totalEmployees * 100).toFixed(1)) : 0;
            
            dailyData.push({
              period: format(day, 'MMM dd'),
              rate,
              count
            });
          }
          currentChartData = dailyData;
          setChartData(dailyData);
        }

        // Prepare table data by department
        const deptData = [];
        const allDepartments = departments.filter(d => d !== "Department");
        
        for (const dept of allDepartments) {
          const deptEmployees = employeeList.filter(e => e.department === dept);
          const deptEmployeeIds = deptEmployees.map(e => e.id);
          
          let deptRecognitions = recognitionList.filter(r => deptEmployeeIds.includes(r.receiver_id));
          
          if (month !== "Month") {
            const monthIndex = months.indexOf(month) - 1;
            deptRecognitions = deptRecognitions.filter(r => {
              const d = parseISO(r.created_at);
              return getMonth(d) === monthIndex && getYear(d) === year;
            });
          }
          
          const rate = deptEmployees.length > 0 ? Number((deptRecognitions.length / deptEmployees.length * 100).toFixed(1)) : 0;
          
          deptData.push({
            department: dept,
            rate,
            count: deptRecognitions.length,
            employees: deptEmployees.length
          });
        }
        setTableData(deptData);

        // Calculate overall data
        let overallRecognitions = filteredRecognitions;
        if (month !== "Month") {
          const monthIndex = months.indexOf(month) - 1;
          overallRecognitions = filteredRecognitions.filter(r => {
            const d = parseISO(r.created_at);
            return getMonth(d) === monthIndex && getYear(d) === year;
          });
        }
        
        const overallRate = totalEmployees > 0 ? Number((overallRecognitions.length / totalEmployees * 100).toFixed(1)) : 0;
        
        const newOverallData = {
          rate: overallRate,
          count: overallRecognitions.length,
          total: totalEmployees
        };
        setOverallData(newOverallData);

        // Get AI recommendations
        setLoadingRecommendations(true);
        const recommendations = await getAIRecommendations({
          overallRate,
          year,
          month,
          department,
          departmentData: deptData,
          chartData: currentChartData
        });
        setRecommendations(recommendations);
        setLoadingRecommendations(false);

      } catch (error) {
        console.error("Error fetching recognition data:", error);
        setLoadingRecommendations(false);
      } finally {
        setLoading(false);
      }
    };

    if (years.length > 0 && departments.length > 0) {
      fetchData();
    }
  }, [department, year, month, years, departments]);

  return (
    <div className="py-8 px-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Recognition Rate Analytics</h1>
        <Button onClick={() => exportToCSV({ chartData, tableData, overallData }, { department, year, month })}>
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
          value={month} 
          onChange={e => setMonth(e.target.value)} 
          className="border rounded px-2 py-1"
        >
          {months.map(m => <option key={m} value={m}>{m}</option>)}
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
          <CardTitle>Overall Recognition Rate</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-20">Loading...</div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{overallData.rate}%</div>
                <div className="text-sm text-gray-600">Recognition Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{overallData.count}</div>
                <div className="text-sm text-gray-600">Total Recognitions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{overallData.total}</div>
                <div className="text-sm text-gray-600">Total Employees</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Recognition Rate Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center">Loading...</div>
          ) : (
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 60, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="period" 
                    tick={<CustomXAxisTick />}
                    height={40}
                    interval={0}
                    axisLine={{ stroke: '#666' }}
                    tickLine={{ stroke: '#666' }}
                  />
                  <YAxis 
                    domain={[0, 'dataMax']} 
                    label={{ value: "Recognition Rate (%)", angle: -90, position: 'insideLeft' }} 
                  />
                  <Tooltip formatter={v => `${v}%`} />
                  <Line 
                    type="linear" 
                    dataKey="rate" 
                    name="Recognition Rate (%)" 
                    stroke="#AB47BC" 
                    strokeWidth={2} 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {tableData.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Department Recognitions</CardTitle>
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
                      <th className="px-2 py-1 text-left">Recognition Rate</th>
                      <th className="px-2 py-1 text-left">Recognition Count</th>
                      <th className="px-2 py-1 text-left">Total Employees</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map(row => (
                      <tr key={row.department}>
                        <td className="px-2 py-1">{row.department}</td>
                        <td className="px-2 py-1">{row.rate}%</td>
                        <td className="px-2 py-1">{row.count}</td>
                        <td className="px-2 py-1">{row.employees}</td>
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
            <div className="space-y-3">
              {recommendations.map((recommendation, index) => (
                <div key={index} className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                  <p className="text-sm text-gray-700">{recommendation.trim()}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 