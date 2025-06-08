"use client"
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/lib/supabase";
import { format, parseISO, startOfMonth, endOfMonth, isWeekend, eachDayOfInterval, getYear, getMonth, isSameMonth } from "date-fns";
import { RefreshCw, Download } from "lucide-react";

// Custom tick component for wrapping text
const CustomXAxisTick = (props: any) => {
  const { x, y, payload } = props;
  const text = payload.value;
  const maxWidth = 80;
  
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
    const prompt = `Analyze the attendance rate data and provide exactly 4 concise, actionable recommendations (max 8 sentences each).

Data Summary:
- Overall Attendance Rate: ${data.overallRate}%
- Total Attendances: ${data.totalAttendances}
- Maximum Possible Attendances: ${data.maxAttendances}
- Total Employees: ${data.totalEmployees}
- Year: ${data.year}
- Month Filter: ${data.month}
- Department Filter: ${data.department}

Department Breakdown:
${data.departmentData?.map((dept: any) => 
  `- ${dept.department}: Attendance Rate ${dept.rate}%, ${dept.count}/${dept.maximum} attendances, ${dept.employees} employees`
).join('\n')}

Time Trend Analysis:
${data.chartData?.map((period: any) => 
  `- ${period.tooltipPeriod || period.period}: ${period.rate}% attendance rate, ${period.count} attendances${period.maximum ? ` out of ${period.maximum} maximum` : ''}`
).join('\n')}

FORMATTING RULES:
1. Separate each recommendation with "###RECOMMENDATION###"
2. Keep each recommendation to 3-4 sentences maximum
3. Use **bold** ONLY for specific numbers, percentages, timeframes, or multi-word important actions (NOT for single words like department names)
4. If steps are needed, use: 1) Step one 2) Step two 3) Step three
5. Start each recommendation with a clear action verb
6. Do NOT use quotation marks around department names or month names
7. Write naturally without excessive capitalization

Example Format:
###RECOMMENDATION###
**Implement flexible scheduling** for departments with **attendance below 85%**. Offer: 1) Remote work options 2) Flexible start times 3) Compressed work weeks. Monitor improvement over **30 days** and adjust policies accordingly.
###RECOMMENDATION###
**Address transportation issues** causing Monday and Friday absences. Provide: 1) Transportation subsidies 2) Carpooling programs 3) Shuttle services. Target **attendance above 90%** on these critical days.

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
  csvData.push(['Overall Rate (%)', 'Total Attendances', 'Maximum Attendances']);
  csvData.push([data.overallData.rate, data.overallData.count, data.overallData.total]);
  csvData.push([]);
  
  // Add headers
  if (filters.department === "Department") {
    // Department breakdown
    csvData.push(['Department', 'Attendance Rate (%)', 'Attendance Count', 'Maximum Attendances', 'Employee Count']);
    data.tableData.forEach((row: any) => {
      csvData.push([row.department, row.rate, row.count, row.maximum, row.employees || 'N/A']);
    });
  } else {
    // Time series data
    csvData.push(['Period', 'Attendance Rate (%)', 'Attendance Count', filters.month === 'Month' ? 'Maximum Attendances' : 'Total Employees']);
    data.chartData.forEach((row: any) => {
      csvData.push([row.period, row.rate, row.count, row.maximum || row.total || 'N/A']);
    });
  }
  
  const csvContent = csvData.map(row => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const deptFilter = filters.department !== "Department" ? filters.department.replace(/\s+/g, '_') : 'All_Departments';
  a.download = `Attendance_Rate_Analytics_${filters.year}_${deptFilter}_${filters.month !== 'Month' ? filters.month : 'All_Months'}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};

export default function AttendanceRateAnalytics() {
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

  // Helper function to count workdays in a month (excluding weekends)
  function countWorkdays(start: Date, end: Date) {
    return eachDayOfInterval({ start, end }).filter(d => !isWeekend(d)).length;
  }

  const resetFilters = () => {
    setDepartment("Department");
    setYear(new Date().getFullYear());
    setMonth("Month");
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      // Get all years with attendance data
      const { data: attendances } = await supabase
        .from('attendances')
        .select('check_in')
        .order('check_in', { ascending: true });
      
      if (attendances && attendances.length > 0) {
        const uniqueYears = Array.from(new Set(
          attendances.map(a => getYear(parseISO(a.check_in)))
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

        // Get attendances for the selected year
        const { data: attendances } = await supabase
          .from('attendances')
          .select('check_in, user_id')
          .gte('check_in', `${year}-01-01`)
          .lt('check_in', `${year + 1}-01-01`);
        
        const attendanceList = attendances || [];

        // Filter attendances by department if selected
        let filteredAttendances = attendanceList;
        if (department !== "Department") {
          const employeeIds = employeeList.map(e => e.id);
          filteredAttendances = attendanceList.filter(a => employeeIds.includes(a.user_id));
        }

        // Prepare chart data
        let currentChartData;
        if (month === "Month") {
          // Show monthly data for the year
          const monthlyData = [];
          for (let m = 0; m < 12; m++) {
            const monthDate = new Date(year, m, 1);
            const monthStart = startOfMonth(monthDate);
            const monthEnd = endOfMonth(monthDate);
            const workdays = countWorkdays(monthStart, monthEnd);
            const maximum = totalEmployees * workdays;
            
            const count = filteredAttendances.filter(a => {
              const d = parseISO(a.check_in);
              return getMonth(d) === m && getYear(d) === year;
            }).length;
            
            monthlyData.push({
              period: format(monthDate, 'MMM'),
              rate: maximum > 0 ? Number((count / maximum * 100).toFixed(2)) : 0,
              count,
              maximum
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
            if (!isWeekend(day)) {
              const dayStr = format(day, 'yyyy-MM-dd');
              const count = filteredAttendances.filter(a => 
                a.check_in.startsWith(dayStr)
              ).length;
              
              dailyData.push({
                period: format(day, 'dd'),
                tooltipPeriod: format(day, 'MMM dd'),
                rate: totalEmployees > 0 ? Number((count / totalEmployees * 100).toFixed(2)) : 0,
                count
              });
            }
          }
          currentChartData = dailyData;
          setChartData(dailyData);
        }

        // Prepare table data by department
        const deptData: any[] = [];
        const allDepartments = departments.filter(d => d !== "Department");
        
        for (const dept of allDepartments) {
          const deptEmployees = employeeList.filter(e => e.department === dept);
          const deptEmployeeIds = deptEmployees.map(e => e.id);
          
          let deptAttendances = attendanceList.filter(a => deptEmployeeIds.includes(a.user_id));
          
          if (month !== "Month") {
            const monthIndex = months.indexOf(month) - 1;
            deptAttendances = deptAttendances.filter(a => {
              const d = parseISO(a.check_in);
              return getMonth(d) === monthIndex && getYear(d) === year;
            });
          }
          
          // Calculate workdays for the period
          let workdays;
          if (month === "Month") {
            workdays = 0;
            for (let m = 0; m < 12; m++) {
              const monthDate = new Date(year, m, 1);
              workdays += countWorkdays(startOfMonth(monthDate), endOfMonth(monthDate));
            }
          } else {
            const monthIndex = months.indexOf(month) - 1;
            const monthDate = new Date(year, monthIndex, 1);
            workdays = countWorkdays(startOfMonth(monthDate), endOfMonth(monthDate));
          }
          
          const maximum = deptEmployees.length * workdays;
          const rate = maximum > 0 ? Number((deptAttendances.length / maximum * 100).toFixed(2)) : 0;
          
          deptData.push({
            department: dept,
            rate,
            count: deptAttendances.length,
            maximum,
            employees: deptEmployees.length
          });
        }
        setTableData(deptData);

        // Calculate overall data
        let overallAttendances = filteredAttendances;
        if (month !== "Month") {
          const monthIndex = months.indexOf(month) - 1;
          overallAttendances = filteredAttendances.filter(a => {
            const d = parseISO(a.check_in);
            return getMonth(d) === monthIndex && getYear(d) === year;
          });
        }
        
        let totalWorkdays;
        if (month === "Month") {
          totalWorkdays = 0;
          for (let m = 0; m < 12; m++) {
            const monthDate = new Date(year, m, 1);
            totalWorkdays += countWorkdays(startOfMonth(monthDate), endOfMonth(monthDate));
          }
        } else {
          const monthIndex = months.indexOf(month) - 1;
          const monthDate = new Date(year, monthIndex, 1);
          totalWorkdays = countWorkdays(startOfMonth(monthDate), endOfMonth(monthDate));
        }
        
        const totalMaximum = totalEmployees * totalWorkdays;
        const overallRate = totalMaximum > 0 ? Number((overallAttendances.length / totalMaximum * 100).toFixed(2)) : 0;
        
        const newOverallData = {
          rate: overallRate,
          count: overallAttendances.length,
          total: totalMaximum
        };
        setOverallData(newOverallData);

        // Load AI recommendations independently (after main data is loaded)
        const loadAIRecommendations = async () => {
          try {
            setLoadingRecommendations(true);
            const recommendations = await getAIRecommendations({
              overallRate,
              totalAttendances: overallAttendances.length,
              maxAttendances: totalMaximum,
              totalEmployees,
              year,
              month,
              department,
              departmentData: deptData,
              chartData: currentChartData
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
        console.error("Error fetching attendance data:", error);
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
        <h1 className="text-2xl font-bold">Attendance Rate Analytics</h1>
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
          <CardTitle>Overall Attendance Rate</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-20">Loading...</div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{overallData.rate}%</div>
                <div className="text-sm text-gray-600">Attendance Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{overallData.count}</div>
                <div className="text-sm text-gray-600">Total Attendances</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{overallData.total}</div>
                <div className="text-sm text-gray-600">Maximum Attendances</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Attendance Rate Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center">Loading...</div>
          ) : (
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 30, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="period"
                    padding={{ left: 30, right: 30 }}
                    tick={<CustomXAxisTick />}
                    interval={0}
                    axisLine={{ stroke: '#666' }}
                    tickLine={{ stroke: '#666' }}
                    label={{ 
                      value: month === "Month" ? "Month" : format(new Date(year, months.indexOf(month) - 1), 'MMMM'),
                      position: "bottom",
                      offset: 15
                    }}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    label={{ 
                      value: "Attendance Rate (%)", 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { textAnchor: 'middle' }
                    }} 
                  />
                  <Tooltip formatter={v => `${v}%`}
                    labelFormatter={(value, entry) => {
                      const item = chartData.find(d => d.period === value);
                      return item?.tooltipPeriod || value;
                    }}  
                  />
                  <Line 
                    type="linear" 
                    dataKey="rate" 
                    name="Attendance Rate" 
                    stroke="#6A1B9A" 
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
            <CardTitle>Department Attendance</CardTitle>
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
                      <th className="px-2 py-1 text-left">Attendance Rate</th>
                      <th className="px-2 py-1 text-left">Total Attendance</th>
                      <th className="px-2 py-1 text-left">Maximum Attendances</th>
                      <th className="px-2 py-1 text-left">Total Employee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map(row => (
                      <tr key={row.department}>
                        <td className="px-2 py-1">{row.department}</td>
                        <td className="px-2 py-1">{row.rate}%</td>
                        <td className="px-2 py-1">{row.count}</td>
                        <td className="px-2 py-1">{row.maximum}</td>
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