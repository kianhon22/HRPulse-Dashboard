"use client"
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const mockDepartments = ["All", "HR", "Engineering", "Sales"];
const mockYears = [2023, 2024];
const mockMonths = ["All", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const mockChartData = [
  { period: "Jan", score: 75 },
  { period: "Feb", score: 78 },
  { period: "Mar", score: 80 },
  { period: "Apr", score: 82 },
  { period: "May", score: 85 },
];
const mockTableData = [
  { department: "HR", overall: 82, leadership: 80, culture: 85, growth: 81 },
  { department: "Engineering", overall: 85, leadership: 83, culture: 87, growth: 84 },
  { department: "Sales", overall: 78, leadership: 75, culture: 80, growth: 79 },
];

export default function EngagementScoreAnalytics() {
  const [department, setDepartment] = useState("All");
  const [year, setYear] = useState(2024);
  const [month, setMonth] = useState("All");

  return (
    <div className="py-8 px-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Engagement Score Analytics</h1>
        <Button>Export Report</Button>
      </div>
      <div className="flex gap-4 mb-4">
        <select value={department} onChange={e => setDepartment(e.target.value)} className="border rounded px-2 py-1">
          {mockDepartments.map(dep => <option key={dep} value={dep}>{dep}</option>)}
        </select>
        <select value={year} onChange={e => setYear(Number(e.target.value))} className="border rounded px-2 py-1">
          {mockYears.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={month} onChange={e => setMonth(e.target.value)} className="border rounded px-2 py-1">
          {mockMonths.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Engagement Score Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockChartData} margin={{ top: 5, right: 30, left: 20, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" label={{ value: "Month", position: "bottom", offset: 15 }} />
                <YAxis domain={[0, 100]} label={{ value: "Score (%)", angle: -90, dx: -20 }} />
                <Tooltip formatter={v => `${v}%`} />
                <Line type="linear" dataKey="score" name="Engagement Score (%)" stroke="#6A1B9A" strokeWidth={2} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Department Engagement Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-2 py-1 text-left">Department</th>
                  <th className="px-2 py-1 text-left">Overall</th>
                  <th className="px-2 py-1 text-left">Leadership</th>
                  <th className="px-2 py-1 text-left">Culture</th>
                  <th className="px-2 py-1 text-left">Growth</th>
                </tr>
              </thead>
              <tbody>
                {mockTableData.map(row => (
                  <tr key={row.department}>
                    <td className="px-2 py-1">{row.department}</td>
                    <td className="px-2 py-1">{row.overall}%</td>
                    <td className="px-2 py-1">{row.leadership}%</td>
                    <td className="px-2 py-1">{row.culture}%</td>
                    <td className="px-2 py-1">{row.growth}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 