
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndexationResult, UrlGroup } from "@/types";
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface SeoChartsProps {
  results: IndexationResult[];
  groups?: UrlGroup[];
  selectedGroup?: string;
}

const SeoCharts: React.FC<SeoChartsProps> = ({ results, groups, selectedGroup }) => {
  // Группировка данных по дням и поисковым системам
  const processChartData = () => {
    const dailyResults = results.reduce((acc, result) => {
      const date = format(new Date(result.date), 'dd MMM', { locale: ru });
      
      if (!acc[date]) {
        acc[date] = { date, google: 0, yandex: 0 };
      }
      
      acc[date].google += result.google ? 1 : 0;
      acc[date].yandex += result.yandex ? 1 : 0;
      
      return acc;
    }, {} as Record<string, { date: string; google: number; yandex: number }>);

    return Object.values(dailyResults);
  };

  const chartData = processChartData();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Индексация по дням (Google)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="google" fill="#3B82F6" name="Google" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Индексация по дням (Яндекс)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="yandex" fill="#EF4444" name="Яндекс" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default SeoCharts;
