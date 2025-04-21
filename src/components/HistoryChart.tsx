
import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndexationHistory } from "@/types";
import { format, subDays } from "date-fns";
import { ru } from "date-fns/locale";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface HistoryChartProps {
  data: IndexationHistory;
}

const HistoryChart = ({ data }: HistoryChartProps) => {
  // Получим последние 14 дней истории
  const lastTwoWeeks = Array.from({ length: 14 }, (_, i) => {
    const date = subDays(new Date(), 13 - i);
    return format(date, "dd MMM", { locale: ru });
  });

  // Подготовим данные для графика
  const chartData = {
    labels: lastTwoWeeks,
    datasets: [
      {
        label: "Google",
        data: lastTwoWeeks.map(day => {
          const result = data.results.find(r => 
            format(new Date(r.date), "dd MMM", { locale: ru }) === day
          );
          return result ? (result.google ? 1 : 0) : null;
        }),
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.5)",
        tension: 0.2,
      },
      {
        label: "Яндекс",
        data: lastTwoWeeks.map(day => {
          const result = data.results.find(r => 
            format(new Date(r.date), "dd MMM", { locale: ru }) === day
          );
          return result ? (result.yandex ? 1 : 0) : null;
        }),
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        tension: 0.2,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 0,
        max: 1,
        ticks: {
          callback: function(value) {
            return value === 1 ? "Да" : "Нет";
          }
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.raw as number;
            return `${context.dataset.label}: ${value === 1 ? "Проиндексировано" : "Не проиндексировано"}`;
          }
        }
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="truncate">
          История индексации: {data.url}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <Line data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
};

export default HistoryChart;
