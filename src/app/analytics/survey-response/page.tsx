"use client"
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const mockDepartments = ["All", "HR", "Engineering", "Sales"];
const mockYears = [2023, 2024];
const mockMonths = ["All", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const mockChartData = [
  { period: "Jan", rate: 90 },
  { period: "Feb", rate: 92 },
  { period: "Mar", rate: 88 },
  { period: "Apr", rate: 95 },
  { period: "May", rate: 93 },
];
const mockTableData = [
  { department: "HR", rate: 95, count: 40 },
  { department: "Engineering", rate: 92, count: 60 },
  { department: "Sales", rate: 88, count: 30 },
];

export default function SurveyResponseAnalytics() {
  const [department, setDepartment] = useState("All");
  const [year, setYear] = useState(2024);
  const [month, setMonth] = useState("All");

  return (
    <div className="py-8 px-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Survey Response Analytics</h1>
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
          <CardTitle>Survey Response Rate Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockChartData} margin={{ top: 5, right: 30, left: 20, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" label={{ value: "Month", position: "bottom", offset: 15 }} />
                <YAxis domain={[0, 100]} label={{ value: "Response Rate (%)", angle: -90, dx: -20 }} />
                <Tooltip formatter={v => `${v}%`} />
                <Line type="linear" dataKey="rate" name="Response Rate (%)" stroke="#8E24AA" strokeWidth={2} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Department Survey Responses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-2 py-1 text-left">Department</th>
                  <th className="px-2 py-1 text-left">Response Rate</th>
                  <th className="px-2 py-1 text-left">Response Count</th>
                </tr>
              </thead>
              <tbody>
                {mockTableData.map(row => (
                  <tr key={row.department}>
                    <td className="px-2 py-1">{row.department}</td>
                    <td className="px-2 py-1">{row.rate}%</td>
                    <td className="px-2 py-1">{row.count}</td>
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