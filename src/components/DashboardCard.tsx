
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const DashboardCard = ({ title, value, icon, trend, className }: DashboardCardProps) => {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <div className={`flex items-center text-sm mt-1 ${
            trend.isPositive ? "text-green-600" : "text-red-600"
          }`}>
            <span className="mr-1">
              {trend.isPositive ? "↑" : "↓"}
            </span>
            <span>{trend.value}%</span>
            <span className="text-gray-500 ml-1">за 7 дней</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DashboardCard;
